/**
 * withAiFallback — Generic AI call wrapper with timeout, retry, and fallback
 *
 * Usage:
 *
 *   const { result, usedFallback, fallbackReason } = await withAiFallback(
 *     (signal) => callAnthropicApi(signal),   // throws AiError or any Error
 *     ()       => generateBaseTemplate(),     // synchronous or async fallback
 *     { timeoutMs: 30_000, retries: 1 },
 *   );
 *
 *   if (usedFallback) {
 *     console.warn("AI unavailable:", fallbackReason);
 *   }
 *
 * Guarantee:
 *   - The function NEVER rejects.
 *   - If the AI call fails for any reason, the fallback is invoked.
 *   - If the fallback also throws, that exception propagates (unexpected).
 */

import { AiError, type AiErrorKind, RETRYABLE_KINDS } from "./errors";
import { logger } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WithAiFallbackOptions {
  /** Milliseconds before the AI call is forcibly aborted.  Default: 30 000 */
  timeoutMs?: number;
  /**
   * How many times to retry on transient errors (RATE_LIMIT, SERVICE_UNAVAILABLE,
   * NETWORK_ERROR, TIMEOUT) before giving up and invoking the fallback.
   * Default: 1  (one retry = two total attempts)
   */
  retries?: number;
  /**
   * Base delay between retries (ms).  Doubles on each retry (exponential back-off).
   * Default: 1 500
   */
  retryDelayMs?: number;
  /** Label used in console.warn to identify the call site.  Default: "AI call" */
  label?: string;
}

export interface AiFallbackResult<T> {
  result:          T;
  usedFallback:    boolean;
  fallbackReason?: AiErrorKind;
  /** Total number of attempts made (1 = succeeded first try) */
  attemptsDone:    number;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export async function withAiFallback<T>(
  aiCall:   (signal: AbortSignal) => Promise<T>,
  fallback: () => T | Promise<T>,
  options:  WithAiFallbackOptions = {},
): Promise<AiFallbackResult<T>> {
  const {
    timeoutMs    = 30_000,
    retries      = 1,
    retryDelayMs = 1_500,
    label        = "AI call",
  } = options;

  let lastError: AiError | undefined;
  let attemptsDone = 0;
  const maxAttempts = 1 + retries;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Exponential back-off after the first attempt
    if (attempt > 0 && retryDelayMs > 0) {
      await sleep(retryDelayMs * 2 ** (attempt - 1));
    }

    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await aiCall(controller.signal);
      clearTimeout(timer);
      attemptsDone = attempt + 1;
      return { result, usedFallback: false, attemptsDone };
    } catch (err) {
      clearTimeout(timer);
      attemptsDone = attempt + 1;

      const classified = AiError.fromUnknown(err);
      lastError = classified;

      // Log at warning level — not an error (we have a fallback)
      logger.warn("ai/fallback", `AI_ATTEMPT_FAILED`, {
        detail: `[${label}] attempt=${attempt + 1}/${maxAttempts} kind=${classified.kind} msg=${classified.message.slice(0, 120)}`,
      });

      // Only retry transient errors
      if (!RETRYABLE_KINDS.has(classified.kind)) break;
      // Don't retry if this was the last attempt
      if (attempt === maxAttempts - 1) break;
    }
  }

  // All attempts exhausted — invoke fallback
  logger.warn("ai/fallback", "AI_ALL_ATTEMPTS_FAILED_USING_FALLBACK", {
    detail: `[${label}] attempts=${attemptsDone} kind=${lastError?.kind ?? "UNKNOWN"}`,
  });

  const fallbackResult = await fallback();
  return {
    result:         fallbackResult,
    usedFallback:   true,
    fallbackReason: lastError?.kind ?? "UNKNOWN",
    attemptsDone,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Race a promise against a timeout.
 * Throws `AiError("TIMEOUT", ...)` if the deadline is reached first.
 *
 * Useful for wrapping calls that don't natively accept an AbortSignal.
 */
export async function withTimeout<T>(
  promise:   Promise<T>,
  timeoutMs: number,
  label = "operation",
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new AiError("TIMEOUT", `${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}
