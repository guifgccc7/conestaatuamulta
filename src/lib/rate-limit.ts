/**
 * In-memory sliding-window rate limiter.
 *
 * Single-process only — adequate for MVP/single-instance deployments.
 * For multi-instance production: replace the store with Upstash Redis
 * (@upstash/ratelimit) and swap `inMemoryStore` for the Redis client.
 *
 * Usage:
 *   const result = rateLimit("register", getIP(req), { limit: 5, windowMs: 60_000 });
 *   if (!result.allowed) return tooManyRequests(result);
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed:    boolean;
  remaining:  number;
  resetAt:    number; // epoch ms
  limit:      number;
}

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  limit:    number;
  /** Window size in milliseconds */
  windowMs: number;
}

// ─── In-memory store ──────────────────────────────────────────────────────────

interface Entry {
  count:   number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Clean up expired entries every 5 minutes to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export function rateLimit(
  bucket:  string,
  subject: string,
  options: RateLimitOptions,
): RateLimitResult {
  const key = `${bucket}:${subject}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: options.limit - 1, resetAt, limit: options.limit };
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit: options.limit };
  }

  entry.count++;
  return {
    allowed:   true,
    remaining: options.limit - entry.count,
    resetAt:   entry.resetAt,
    limit:     options.limit,
  };
}

// ─── Failed-login / brute-force store ────────────────────────────────────────

interface LockEntry {
  failures: number;
  lockedUntil: number | null;
}

const loginStore = new Map<string, LockEntry>();

const MAX_FAILURES   = 5;
const LOCKOUT_MS     = 15 * 60 * 1000; // 15 minutes
const FAILURE_TTL_MS = 60 * 60 * 1000; // failures reset after 1 hour

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of loginStore) {
      // Remove entries that are no longer locked and failures are old
      const unlocked = !entry.lockedUntil || now > entry.lockedUntil;
      if (unlocked && entry.failures === 0) loginStore.delete(key);
    }
  }, 10 * 60 * 1000);
}

export function checkLoginAllowed(identifier: string): boolean {
  const entry = loginStore.get(identifier);
  if (!entry) return true;
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) return false;
  // Lock expired — reset
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    loginStore.delete(identifier);
  }
  return true;
}

export function recordLoginFailure(identifier: string): { locked: boolean; attemptsLeft: number } {
  const now   = Date.now();
  const entry = loginStore.get(identifier) ?? { failures: 0, lockedUntil: null };

  entry.failures++;

  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_MS;
    loginStore.set(identifier, entry);
    return { locked: true, attemptsLeft: 0 };
  }

  loginStore.set(identifier, entry);
  return { locked: false, attemptsLeft: MAX_FAILURES - entry.failures };
}

export function recordLoginSuccess(identifier: string): void {
  loginStore.delete(identifier);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract IP from standard proxy headers. Never trust blindly — validate format. */
export function getIP(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0].trim();
    // Basic sanity check — prevent header injection
    if (/^[\d.:a-fA-F]+$/.test(ip)) return ip;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri && /^[\d.:a-fA-F]+$/.test(xri.trim())) return xri.trim();
  return "unknown";
}

/**
 * Returns a 429 response with standard rate-limit headers.
 * RFC 6585 + IETF draft-ietf-httpapi-ratelimit-headers
 */
export function tooManyRequests(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000);
  return NextResponse.json(
    { error: "Demasiados pedidos. Tenta novamente mais tarde." },
    {
      status: 429,
      headers: {
        "Retry-After":          String(retryAfterSec),
        "X-RateLimit-Limit":    String(result.limit),
        "X-RateLimit-Remaining":"0",
        "X-RateLimit-Reset":    String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}

/**
 * Attaches rate-limit headers to any response (for allowed requests).
 * Call this on the successful response to expose quota to clients.
 */
export function withRateLimitHeaders(res: NextResponse, result: RateLimitResult): NextResponse {
  res.headers.set("X-RateLimit-Limit",     String(result.limit));
  res.headers.set("X-RateLimit-Remaining", String(result.remaining));
  res.headers.set("X-RateLimit-Reset",     String(Math.ceil(result.resetAt / 1000)));
  return res;
}
