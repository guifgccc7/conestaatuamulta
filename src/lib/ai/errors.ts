/**
 * AI Error classification system
 *
 * Classifies every possible failure from the Anthropic SDK into a typed kind,
 * maps each kind to a user-facing pt-PT message, and flags which errors are
 * transient (retryable) vs. permanent.
 *
 * Usage:
 *   try { await anthropic.messages.stream(...) }
 *   catch (err) { throw AiError.fromUnknown(err); }
 */

// ─── Error kinds ──────────────────────────────────────────────────────────────

export type AiErrorKind =
  | "TIMEOUT"               // request exceeded time budget
  | "RATE_LIMIT"            // 429 — too many requests
  | "SERVICE_UNAVAILABLE"   // 529 / 503 — Anthropic overloaded or down
  | "INVALID_RESPONSE"      // API responded but content is unusable
  | "AUTHENTICATION_ERROR"  // 401 — bad API key (misconfiguration)
  | "CONTEXT_LENGTH"        // prompt too long for the model
  | "NETWORK_ERROR"         // fetch-level failure (DNS, TLS, connection reset)
  | "UNKNOWN";              // anything else

// ─── Retryability map ────────────────────────────────────────────────────────

/** Transient errors that are safe to retry with exponential back-off */
export const RETRYABLE_KINDS = new Set<AiErrorKind>([
  "RATE_LIMIT",
  "SERVICE_UNAVAILABLE",
  "NETWORK_ERROR",
  "TIMEOUT",
]);

// ─── User-facing messages (pt-PT) ────────────────────────────────────────────

export const AI_USER_MESSAGES: Record<AiErrorKind, string> = {
  TIMEOUT:
    "O assistente de IA demorou demasiado a responder. O documento foi gerado " +
    "com o modelo padrão.",

  RATE_LIMIT:
    "O assistente está muito solicitado neste momento. O documento foi gerado " +
    "com o modelo padrão. Podes tentar a análise de IA mais tarde.",

  SERVICE_UNAVAILABLE:
    "O serviço de IA está temporariamente indisponível. O documento foi gerado " +
    "com o modelo padrão, sem alteração ao conteúdo.",

  INVALID_RESPONSE:
    "A resposta do assistente de IA não pôde ser utilizada. O documento foi " +
    "gerado com o modelo padrão.",

  AUTHENTICATION_ERROR:
    "Erro de configuração do serviço. O documento foi gerado com o modelo " +
    "padrão. Contacta o suporte: contacto@contestaatuamulta.pt",

  CONTEXT_LENGTH:
    "O caso é demasiado extenso para análise automática. O documento foi " +
    "gerado com o modelo padrão.",

  NETWORK_ERROR:
    "Não foi possível contactar o assistente de IA. Verifica a tua ligação à " +
    "Internet. O documento foi gerado com o modelo padrão.",

  UNKNOWN:
    "Ocorreu um erro inesperado no assistente de IA. O documento foi gerado " +
    "com o modelo padrão.",
};

/** Shorter variant for inline display inside the chat panel */
export const AI_CHAT_MESSAGES: Record<AiErrorKind, string> = {
  TIMEOUT:
    "O assistente demorou demasiado a responder. Tenta novamente ou gera o " +
    "documento sem melhoria de IA.",

  RATE_LIMIT:
    "O assistente está muito solicitado. Aguarda um momento e tenta novamente.",

  SERVICE_UNAVAILABLE:
    "O assistente está temporariamente indisponível. Podes continuar sem a " +
    "análise de IA — o teu documento será gerado com o modelo padrão.",

  INVALID_RESPONSE:
    "A resposta do assistente foi inválida. Tenta de novo ou continua sem IA.",

  AUTHENTICATION_ERROR:
    "Erro de configuração do serviço. Contacta o suporte: " +
    "contacto@contestaatuamulta.pt",

  CONTEXT_LENGTH:
    "O texto é demasiado extenso para este modo. Tenta um resumo mais curto.",

  NETWORK_ERROR:
    "Sem ligação ao assistente. Verifica a tua Internet e tenta novamente.",

  UNKNOWN:
    "Erro inesperado ao contactar o assistente. Tenta novamente ou continua " +
    "sem a análise de IA.",
};

// ─── AiError class ────────────────────────────────────────────────────────────

export class AiError extends Error {
  readonly kind:         AiErrorKind;
  readonly retryable:    boolean;
  /** Human-readable pt-PT message safe to show to the user */
  readonly userMessage:  string;
  /** Compact message for inline chat display */
  readonly chatMessage:  string;
  /** Original error that caused this (for server-side logging) */
  readonly cause?:       unknown;

  constructor(kind: AiErrorKind, message: string, cause?: unknown) {
    super(message);
    this.name        = "AiError";
    this.kind        = kind;
    this.retryable   = RETRYABLE_KINDS.has(kind);
    this.userMessage = AI_USER_MESSAGES[kind];
    this.chatMessage = AI_CHAT_MESSAGES[kind];
    this.cause       = cause;
  }

  // ─── Classification factory ─────────────────────────────────────────────────

  /**
   * Classify any thrown value (Anthropic SDK error, fetch error, timeout, etc.)
   * into a typed `AiError`.  Safe to call from both server and client contexts.
   */
  static fromUnknown(err: unknown): AiError {
    if (err instanceof AiError) return err;

    // AbortError from AbortController.abort() → timeout
    if (err instanceof Error && err.name === "AbortError") {
      return new AiError("TIMEOUT", "Request aborted due to timeout", err);
    }

    const msg  = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    const code = (err as { status?: number })?.status;

    // HTTP status codes (Anthropic SDK surfaces these as .status)
    if (code === 401 || code === 403) {
      return new AiError("AUTHENTICATION_ERROR", `HTTP ${code}`, err);
    }
    if (code === 429) {
      return new AiError("RATE_LIMIT", "Rate limited (429)", err);
    }
    if (code === 529 || code === 503 || code === 502 || code === 504) {
      return new AiError("SERVICE_UNAVAILABLE", `HTTP ${code}`, err);
    }
    if (code === 400 && (msg.includes("max_tokens") || msg.includes("context"))) {
      return new AiError("CONTEXT_LENGTH", "Context length exceeded", err);
    }

    // Message-based heuristics
    if (msg.includes("timeout") || msg.includes("timed out")) {
      return new AiError("TIMEOUT", msg, err);
    }
    if (msg.includes("rate") && msg.includes("limit")) {
      return new AiError("RATE_LIMIT", msg, err);
    }
    if (msg.includes("overloaded") || msg.includes("unavailable") || msg.includes("capacity")) {
      return new AiError("SERVICE_UNAVAILABLE", msg, err);
    }
    if (
      msg.includes("fetch failed") ||
      msg.includes("econnreset") ||
      msg.includes("enotfound") ||
      msg.includes("network") ||
      msg.includes("socket")
    ) {
      return new AiError("NETWORK_ERROR", msg, err);
    }
    if (msg.includes("api_key") || msg.includes("authentication") || msg.includes("unauthorized")) {
      return new AiError("AUTHENTICATION_ERROR", msg, err);
    }
    if (msg.includes("context_length") || msg.includes("too many tokens") || msg.includes("too long")) {
      return new AiError("CONTEXT_LENGTH", msg, err);
    }

    return new AiError("UNKNOWN", err instanceof Error ? err.message : String(err), err);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** True for errors the caller should never retry (misconfiguration, etc.) */
export function isPermanentError(kind: AiErrorKind): boolean {
  return !RETRYABLE_KINDS.has(kind);
}
