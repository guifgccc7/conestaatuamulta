/**
 * Structured security logger.
 *
 * Rules:
 *   1. NEVER log PII: email, name, NIF, address, phone, CC, IP beyond prefix
 *   2. Always include: timestamp, level, route/context, event
 *   3. In production → JSON (machine-readable for log aggregators)
 *   4. In development → coloured console output
 *
 * Log levels:
 *   info  — normal operations worth recording (auth success, payment, document generated)
 *   warn  — suspicious but not blocking (rate limit hit, invalid input, unusual pattern)
 *   error — operational failure (DB error, upstream API failure)
 *   audit — security-relevant events requiring a permanent trail
 */

type Level = "info" | "warn" | "error" | "audit";

interface LogEntry {
  ts:       string;
  level:    Level;
  ctx:      string;        // route or component name, e.g. "register" or "stripe/webhook"
  event:    string;        // what happened, e.g. "LOGIN_FAILURE" or "RATE_LIMIT_EXCEEDED"
  detail?:  string;        // optional extra context — MUST NOT contain PII
  userId?:  string;        // internal ID only, never email
  reqId?:   string;        // request correlation ID
}

function sanitise(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  // Truncate very long strings (prevent log injection / oversized payloads)
  return s.slice(0, 500).replace(/[\r\n]/g, "↵");
}

function emit(entry: LogEntry): void {
  if (process.env.NODE_ENV === "production") {
    // Structured JSON — pipe to stdout for log aggregator (Datadog, Logtail, etc.)
    process.stdout.write(JSON.stringify(entry) + "\n");
  } else {
    const colours: Record<Level, string> = {
      info:  "\x1b[36m",  // cyan
      warn:  "\x1b[33m",  // yellow
      error: "\x1b[31m",  // red
      audit: "\x1b[35m",  // magenta
    };
    const reset = "\x1b[0m";
    const c = colours[entry.level];
    const parts = [
      `${c}[${entry.level.toUpperCase()}]${reset}`,
      `[${entry.ctx}]`,
      entry.event,
      entry.detail ? `— ${entry.detail}` : "",
      entry.userId ? `(uid:${entry.userId.slice(0, 8)}…)` : "",
      entry.reqId  ? `[req:${entry.reqId}]`  : "",
    ].filter(Boolean);
    console.log(entry.ts, ...parts);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const logger = {
  info(ctx: string, event: string, opts?: Omit<LogEntry, "ts" | "level" | "ctx" | "event">) {
    emit({ ts: new Date().toISOString(), level: "info", ctx, event, ...opts });
  },
  warn(ctx: string, event: string, opts?: Omit<LogEntry, "ts" | "level" | "ctx" | "event">) {
    emit({ ts: new Date().toISOString(), level: "warn", ctx, event, ...opts });
  },
  error(ctx: string, event: string, err?: unknown, opts?: Omit<LogEntry, "ts" | "level" | "ctx" | "event">) {
    const detail = err instanceof Error
      ? sanitise(err.message)
      : sanitise(String(err ?? ""));
    emit({ ts: new Date().toISOString(), level: "error", ctx, event, detail, ...opts });
  },
  /** Immutable audit trail for security-relevant actions. */
  audit(ctx: string, event: string, opts?: Omit<LogEntry, "ts" | "level" | "ctx" | "event">) {
    emit({ ts: new Date().toISOString(), level: "audit", ctx, event, ...opts });
  },
};

// ─── Pre-defined audit events ─────────────────────────────────────────────────
// Use these constants everywhere to avoid typos and enable easy grepping.

export const AUDIT = {
  AUTH: {
    REGISTER_SUCCESS:   "AUTH_REGISTER_SUCCESS",
    REGISTER_DUPLICATE: "AUTH_REGISTER_DUPLICATE_EMAIL",
    LOGIN_SUCCESS:      "AUTH_LOGIN_SUCCESS",
    LOGIN_FAILURE:      "AUTH_LOGIN_FAILURE",
    LOGIN_LOCKED:       "AUTH_LOGIN_ACCOUNT_LOCKED",
    RATE_LIMIT:         "AUTH_RATE_LIMIT_EXCEEDED",
  },
  CASE: {
    CREATED:  "CASE_CREATED",
    UPDATED:  "CASE_UPDATED",
    DELETED:  "CASE_DELETED",
  },
  DOCUMENT: {
    GENERATED:  "DOCUMENT_GENERATED",
    DOWNLOADED: "DOCUMENT_DOWNLOADED",
    PAYWALL:    "DOCUMENT_PAYWALL_HIT",
  },
  PAYMENT: {
    CHECKOUT_INITIATED: "PAYMENT_CHECKOUT_INITIATED",
    COMPLETED:          "PAYMENT_COMPLETED",
    FAILED:             "PAYMENT_FAILED",
    SUBSCRIPTION_START: "PAYMENT_SUBSCRIPTION_START",
    SUBSCRIPTION_END:   "PAYMENT_SUBSCRIPTION_END",
  },
  USER: {
    EXPORT:  "USER_DATA_EXPORTED",
    DELETE:  "USER_ACCOUNT_DELETED",
  },
  SECURITY: {
    RATE_LIMIT:          "SECURITY_RATE_LIMIT_EXCEEDED",
    INVALID_WEBHOOK_SIG: "SECURITY_INVALID_WEBHOOK_SIGNATURE",
    PATH_TRAVERSAL:      "SECURITY_PATH_TRAVERSAL_BLOCKED",
    INVALID_TOKEN:       "SECURITY_INVALID_AUTH_TOKEN",
    SUSPICIOUS_INPUT:    "SECURITY_SUSPICIOUS_INPUT",
  },
} as const;
