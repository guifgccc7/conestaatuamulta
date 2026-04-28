/**
 * Next.js Edge Middleware
 *
 * Responsibilities:
 *   1. Security headers on every response (OWASP recommended set)
 *   2. IP-based rate limiting on /api/* routes (basic DDoS protection)
 *   3. Block obviously malformed requests before they reach route handlers
 *   4. Request-ID header for log correlation
 *
 * Runs in Edge Runtime — no Node.js APIs. No Prisma, no fs, no crypto.node.
 */

import { NextRequest, NextResponse } from "next/server";

// ─── Security headers ────────────────────────────────────────────────────────
// Applied to EVERY response regardless of route.

const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking (SAMEORIGIN allows dev preview iframes; tighten to DENY in prod via env check below)
  "X-Frame-Options":           process.env.NODE_ENV === "production" ? "DENY" : "SAMEORIGIN",
  // Block MIME-type sniffing
  "X-Content-Type-Options":    "nosniff",
  // Force HTTPS for 2 years (only effective over HTTPS)
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  // Control referrer information leakage
  "Referrer-Policy":           "strict-origin-when-cross-origin",
  // Disable unused browser features
  "Permissions-Policy":        "camera=(), microphone=(), geolocation=(), payment=(self)",
  // Prevent XSS (legacy browsers; CSP is the primary defence)
  "X-XSS-Protection":          "1; mode=block",
  // Disable DNS prefetch leaking visited URLs
  "X-DNS-Prefetch-Control":    "off",
  // Content-Security-Policy:
  // - 'unsafe-inline' on script-src is required by Next.js hydration and Framer Motion.
  //   Tighten with nonces in a future hardening pass.
  // - 'unsafe-eval' required by Next.js dev mode only; tightened below in prod.
  "Content-Security-Policy": [
    "default-src 'self'",
    // Next.js requires unsafe-inline for inline scripts during hydration
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",        // Tailwind inlines styles
    "img-src 'self' data: blob: https://lh3.googleusercontent.com",
    "font-src 'self'",
    "connect-src 'self' https://api.stripe.com https://js.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; "),
};

// ─── IP-level rate limiter (Edge-safe in-memory) ─────────────────────────────
// Edge Runtime global state persists across requests on the same edge node.
// For multi-region deployments replace with Upstash Redis.

interface EdgeEntry { count: number; resetAt: number; }
const edgeStore = new Map<string, EdgeEntry>();

/** General API rate limit: 120 requests / minute per IP */
const API_LIMIT  = 120;
const API_WINDOW = 60 * 1000; // 1 minute

function edgeRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = edgeStore.get(ip);

  if (!entry || now > entry.resetAt) {
    edgeStore.set(ip, { count: 1, resetAt: now + API_WINDOW });
    return true;
  }
  if (entry.count >= API_LIMIT) return false;
  entry.count++;
  return true;
}

// Periodically clean expired entries (Edge Runtime supports setInterval)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of edgeStore) {
      if (now > v.resetAt) edgeStore.delete(k);
    }
  }, 2 * 60 * 1000);
}

function getIPFromRequest(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0].trim();
    if (/^[\d.:a-fA-F]+$/.test(ip)) return ip;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri && /^[\d.:a-fA-F]+$/.test(xri.trim())) return xri.trim();
  return "unknown";
}

// ─── Block obviously malicious patterns ──────────────────────────────────────
// Cheap string check before the request hits any route handler.

const BLOCKED_PATTERNS = [
  /\.\.(\/|\\)/,          // path traversal
  /<script/i,             // XSS in URL
  /union\s+select/i,      // SQL injection probe
  /\bexec\s*\(/i,         // code injection
  /\/etc\/passwd/i,       // LFI probe
  /\/wp-admin/i,          // WordPress scan (irrelevant but shows active scanning)
  /\/\.env/i,             // env file probe
  /\/phpinfo/i,           // PHP probe
];

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const ip = getIPFromRequest(req);

  // ── 1. Block malicious URL patterns ────────────────────────────────────────
  const fullUrl = req.nextUrl.toString();
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(fullUrl)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // ── 2. IP rate limiting on API routes ──────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    if (!edgeRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({ error: "Demasiados pedidos. Tenta novamente mais tarde." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After":  "60",
          },
        }
      );
    }
  }

  // ── 3. Apply security headers + request ID to response ─────────────────────
  const res = NextResponse.next();

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(key, value);
  }

  // Request correlation ID — helps trace a request across logs
  const reqId = crypto.randomUUID();
  res.headers.set("X-Request-Id", reqId);

  return res;
}

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Apply to everything except Next.js internals and static assets.

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
