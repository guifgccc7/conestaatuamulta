/**
 * db.ts — Database resilience layer
 *
 * Wraps Prisma operations with:
 *   - Retry on transient connection errors (pool exhaustion, network blip)
 *   - Typed DbError classification (TRANSIENT / NOT_FOUND / CONFLICT / PERMANENT)
 *   - User-safe pt-PT messages that never expose raw SQL/Prisma internals
 *   - Exponential back-off: 250 ms → 500 ms → 1 000 ms
 *
 * Usage:
 *   const user = await withDb(
 *     () => prisma.user.findUnique({ where: { id } }),
 *     { label: "user-lookup" }
 *   );
 *
 * In a route handler, catch DbError and map:
 *   catch (err) {
 *     if (err instanceof DbError) return NextResponse.json(
 *       { error: err.userMessage }, { status: err.httpStatus }
 *     );
 *   }
 */

import { Prisma } from "@prisma/client";
import { logger } from "./logger";

// ─── Error kinds ──────────────────────────────────────────────────────────────

export type DbErrorKind = "TRANSIENT" | "NOT_FOUND" | "CONFLICT" | "PERMANENT";

const HTTP_STATUS: Record<DbErrorKind, number> = {
  TRANSIENT:  503,
  NOT_FOUND:  404,
  CONFLICT:   409,
  PERMANENT:  500,
};

const USER_MESSAGES: Record<DbErrorKind, string> = {
  TRANSIENT:
    "O servidor está temporariamente sobrecarregado. " +
    "Tenta novamente em alguns segundos.",
  NOT_FOUND:
    "O recurso solicitado não foi encontrado.",
  CONFLICT:
    "Esta operação não pôde ser concluída — dados já existentes.",
  PERMANENT:
    "Erro interno do servidor. " +
    "Contacta o suporte se o problema persistir: contacto@contestaatuamulta.pt",
};

export class DbError extends Error {
  readonly kind:        DbErrorKind;
  readonly userMessage: string;
  readonly httpStatus:  number;
  readonly cause?:      unknown;

  constructor(kind: DbErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name        = "DbError";
    this.kind        = kind;
    this.userMessage = USER_MESSAGES[kind];
    this.httpStatus  = HTTP_STATUS[kind];
    this.cause       = cause;
  }
}

// ─── Transient Prisma error codes (safe to retry) ─────────────────────────────
// Reference: https://www.prisma.io/docs/orm/reference/error-reference

const RETRYABLE_CODES = new Set([
  "P1001", // Can't reach database server — connection refused
  "P1002", // Database server timeout
  "P1008", // Operations timed out
  "P1017", // Server closed connection
  "P2024", // Connection pool timeout — timed out fetching a connection
]);

// ─── withDb ───────────────────────────────────────────────────────────────────

export interface WithDbOptions {
  /** How many *additional* attempts after the first.  Default: 2 (= 3 total) */
  retries?: number;
  /**
   * Base delay for exponential back-off (ms).
   * Delays: baseMs, baseMs×2, baseMs×4, …
   * Default: 250
   */
  baseDelayMs?: number;
  /** Label for log correlation.  Default: "db" */
  label?: string;
}

/**
 * Execute a Prisma operation with retry logic and typed error classification.
 *
 * - Transient errors are retried up to `retries` times with exponential back-off.
 * - Permanent errors (constraint violations, not-found) throw immediately.
 * - All Prisma-specific details are stripped from the thrown DbError.
 */
export async function withDb<T>(
  operation:  () => Promise<T>,
  options:    WithDbOptions = {},
): Promise<T> {
  const { retries = 2, baseDelayMs = 250, label = "db" } = options;
  const maxAttempts = 1 + retries;
  let   lastErr: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }

    try {
      return await operation();
    } catch (err) {
      lastErr = err;

      // ── Known Prisma request errors ─────────────────────────────────────────
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const { code } = err;

        if (RETRYABLE_CODES.has(code)) {
          logger.warn(label, "DB_TRANSIENT", {
            detail: `code=${code} attempt=${attempt + 1}/${maxAttempts}`,
          });
          if (attempt < maxAttempts - 1) continue; // retry
          throw new DbError("TRANSIENT", `Prisma ${code} — max retries exceeded`, err);
        }

        // P2025: record not found (findUniqueOrThrow etc.)
        if (code === "P2025") {
          throw new DbError("NOT_FOUND", `Record not found (${code})`, err);
        }

        // P2002: unique constraint violation
        if (code === "P2002") {
          throw new DbError("CONFLICT", `Unique constraint failed (${code})`, err);
        }

        // Any other known error → permanent
        throw new DbError("PERMANENT", `Prisma ${code}`, err);
      }

      // ── Initialization errors (can't connect at all) ─────────────────────────
      if (
        err instanceof Prisma.PrismaClientInitializationError ||
        err instanceof Prisma.PrismaClientUnknownRequestError
      ) {
        logger.warn(label, "DB_INIT_ERROR", {
          detail: `attempt=${attempt + 1}/${maxAttempts}`,
        });
        if (attempt < maxAttempts - 1) continue; // retry
        throw new DbError("TRANSIENT", "Database unavailable", err);
      }

      // ── Validation errors — never retry ─────────────────────────────────────
      if (err instanceof Prisma.PrismaClientValidationError) {
        throw new DbError("PERMANENT", "Prisma validation error", err);
      }

      // ── Unknown error — don't retry ─────────────────────────────────────────
      break;
    }
  }

  // If we broke out of the loop without throwing a DbError, re-throw the raw error
  throw lastErr;
}

// ─── Convenience: handle DbError in route handlers ───────────────────────────

import { NextResponse } from "next/server";

/**
 * If `err` is a DbError, return a JSON NextResponse with the appropriate
 * HTTP status and user-safe message.
 *
 * Returns `null` if `err` is not a DbError (caller should handle it).
 *
 * @example
 * catch (err) {
 *   const dbResponse = handleDbError(err, "cases");
 *   if (dbResponse) return dbResponse;
 *   // handle non-DB errors
 * }
 */
export function handleDbError(err: unknown, ctx: string): NextResponse | null {
  if (!(err instanceof DbError)) return null;
  logger.error(ctx, `DB_${err.kind}`, err.cause, { detail: err.message });
  return NextResponse.json({ error: err.userMessage }, { status: err.httpStatus });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
