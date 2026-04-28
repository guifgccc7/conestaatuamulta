/**
 * stripe-resilience.ts — Stripe API resilience layer
 *
 * Wraps Stripe SDK calls with:
 *   - Retry on transient API / rate-limit errors (exponential back-off)
 *   - Typed StripeResilienceError classification
 *   - User-safe pt-PT messages — no Stripe internals exposed
 *
 * Usage:
 *   const session = await withStripe(
 *     () => stripe.checkout.sessions.create({ ... }),
 *     { label: "create-checkout" }
 *   );
 *
 * Stripe's own SDK already retries network errors once by default.
 * This wrapper adds *application-level* retry with classification on top.
 */

import Stripe from "stripe";
import { logger } from "./logger";

// ─── Error classification ─────────────────────────────────────────────────────

export type StripeErrorKind =
  | "TRANSIENT"        // API down, rate limited, network error — safe to retry
  | "CARD_DECLINED"    // 402 / card errors — user must try another method
  | "INVALID_REQUEST"  // 400 — bad parameters (programming error, not user fault)
  | "AUTH_ERROR"       // 401 — API key misconfiguration
  | "PERMANENT";       // everything else

const HTTP_STATUS: Record<StripeErrorKind, number> = {
  TRANSIENT:       503,
  CARD_DECLINED:   402,
  INVALID_REQUEST: 400,
  AUTH_ERROR:      500,  // expose as 500 — don't leak key issues to client
  PERMANENT:       500,
};

const USER_MESSAGES: Record<StripeErrorKind, string> = {
  TRANSIENT:
    "O serviço de pagamento está temporariamente indisponível. " +
    "Tenta novamente em alguns segundos.",
  CARD_DECLINED:
    "O pagamento foi recusado. " +
    "Verifica os dados do cartão ou tenta com outro meio de pagamento.",
  INVALID_REQUEST:
    "Dados de pagamento inválidos. Tenta novamente ou contacta o suporte.",
  AUTH_ERROR:
    "Erro de configuração do serviço de pagamento. " +
    "Contacta o suporte: contacto@contestaatuamulta.pt",
  PERMANENT:
    "Não foi possível processar o pagamento. " +
    "Tenta novamente ou contacta o suporte.",
};

export class StripeResilienceError extends Error {
  readonly kind:        StripeErrorKind;
  readonly userMessage: string;
  readonly httpStatus:  number;
  readonly stripeCode?: string;
  readonly cause?:      unknown;

  constructor(
    kind:        StripeErrorKind,
    message:     string,
    stripeCode?: string,
    cause?:      unknown,
  ) {
    super(message);
    this.name        = "StripeResilienceError";
    this.kind        = kind;
    this.userMessage = USER_MESSAGES[kind];
    this.httpStatus  = HTTP_STATUS[kind];
    this.stripeCode  = stripeCode;
    this.cause       = cause;
  }
}

// Note: retryable error detection uses instanceof checks in withStripe() below,
// because Stripe SDK v17 uses class names for err.type, not legacy string slugs.

// ─── withStripe ───────────────────────────────────────────────────────────────

export interface WithStripeOptions {
  /** Additional attempts after first failure.  Default: 2 (= 3 total) */
  retries?:     number;
  /** Base back-off delay (ms); doubles each attempt.  Default: 1 000 */
  baseDelayMs?: number;
  /** Label for log correlation.  Default: "stripe" */
  label?:       string;
}

export async function withStripe<T>(
  operation: () => Promise<T>,
  options:   WithStripeOptions = {},
): Promise<T> {
  const { retries = 2, baseDelayMs = 1_000, label = "stripe" } = options;
  const maxAttempts = 1 + retries;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }

    try {
      return await operation();
    } catch (err) {
      if (err instanceof Stripe.errors.StripeError) {
        const { code, message } = err;
        // In Stripe SDK v17, `err.type` is the class name (e.g. "StripeCardError"),
        // not the legacy string (e.g. "card_error"). Use instanceof checks instead.

        if (err instanceof Stripe.errors.StripeConnectionError ||
            err instanceof Stripe.errors.StripeAPIError ||
            err instanceof Stripe.errors.StripeRateLimitError ||
            err instanceof Stripe.errors.StripeIdempotencyError) {
          logger.warn(label, "STRIPE_TRANSIENT", {
            detail: `type=${err.type} attempt=${attempt + 1}/${maxAttempts}`,
          });
          if (attempt < maxAttempts - 1) continue; // retry
          throw new StripeResilienceError("TRANSIENT", message, code, err);
        }

        if (err instanceof Stripe.errors.StripeCardError) {
          throw new StripeResilienceError("CARD_DECLINED", message, code, err);
        }
        if (err instanceof Stripe.errors.StripeAuthenticationError) {
          throw new StripeResilienceError("AUTH_ERROR", message, code, err);
        }
        if (err instanceof Stripe.errors.StripeInvalidRequestError) {
          throw new StripeResilienceError("INVALID_REQUEST", message, code, err);
        }

        // Catch-all for unknown stripe error types
        throw new StripeResilienceError("PERMANENT", message, code, err);
      }

      // Non-Stripe error (e.g. network at Node level) — re-throw as-is
      throw err;
    }
  }

  // Should never reach here; TypeScript needs a return path
  throw new StripeResilienceError("PERMANENT", "Unreachable — max retries exceeded");
}

// ─── Convenience: route handler mapping ──────────────────────────────────────

import { NextResponse } from "next/server";
import { AUDIT, logger as _logger } from "./logger";

/**
 * If `err` is a StripeResilienceError, return a JSON NextResponse with the
 * correct HTTP status and a user-safe message.  Returns null otherwise.
 */
export function handleStripeError(err: unknown, ctx: string): NextResponse | null {
  if (!(err instanceof StripeResilienceError)) return null;
  _logger.error(ctx, `STRIPE_${err.kind}`, err.cause, {
    detail: `code=${err.stripeCode ?? "none"} — ${err.message}`,
  });
  return NextResponse.json({ error: err.userMessage }, { status: err.httpStatus });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { AUDIT };
