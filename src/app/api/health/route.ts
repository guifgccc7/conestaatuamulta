/**
 * GET /api/health
 *
 * System health check endpoint for uptime monitors and load balancers.
 *
 * Returns 200 when all systems are healthy.
 * Returns 503 when any critical dependency is degraded.
 *
 * Response shape:
 * {
 *   status:  "ok" | "degraded",
 *   version: string,
 *   checks: {
 *     database: "ok" | "error",
 *     stripe:   "ok" | "error",
 *   },
 *   uptime:  number,   // process uptime in seconds
 *   ts:      string,   // ISO timestamp
 * }
 *
 * This endpoint is intentionally unauthenticated (monitoring services need it).
 * It exposes NO sensitive data — only binary ok/error status per service.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

// Timeout per individual check (ms)
const CHECK_TIMEOUT_MS = 3_000;

// App version from package.json via env (set in next.config.js → env block,
// or falls back to "unknown")
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkDatabase(): Promise<"ok" | "error"> {
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DB health check timeout")), CHECK_TIMEOUT_MS)
      ),
    ]);
    return "ok";
  } catch (err) {
    logger.warn("health", "DB_HEALTH_CHECK_FAILED", {
      detail: err instanceof Error ? err.message.slice(0, 120) : "unknown",
    });
    return "error";
  }
}

async function checkStripe(): Promise<"ok" | "error"> {
  try {
    await Promise.race([
      // Cheapest read-only Stripe API call
      stripe.balance.retrieve(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Stripe health check timeout")), CHECK_TIMEOUT_MS)
      ),
    ]);
    return "ok";
  } catch (err) {
    logger.warn("health", "STRIPE_HEALTH_CHECK_FAILED", {
      detail: err instanceof Error ? err.message.slice(0, 120) : "unknown",
    });
    return "error";
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic"; // never cache health checks

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const [database, stripe] = await Promise.all([
    checkDatabase(),
    checkStripe(),
  ]);

  const allOk  = database === "ok" && stripe === "ok";
  const status = allOk ? "ok" : "degraded";

  const body = {
    status,
    version: APP_VERSION,
    checks: { database, stripe },
    uptime: Math.floor(process.uptime()),
    ts:     new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: {
      // Prevent caching by proxies or CDNs
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma":        "no-cache",
    },
  });
}
