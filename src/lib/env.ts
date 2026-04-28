/**
 * Server-side environment variable validation (BUG-003).
 *
 * Import this module in any API route or server-only lib that depends on
 * environment variables. It validates at import time so missing vars surface
 * immediately — as a startup crash in production, and a console warning in
 * development — rather than as cryptic 500 errors mid-request.
 *
 * Usage:
 *   import "@/lib/env";            // side-effect: validate only
 *   import { env } from "@/lib/env"; // typed, non-nullable accessors
 */

// ─── Required variables ────────────────────────────────────────────────────────

const REQUIRED = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_SUBSCRIPTION",
  "ANTHROPIC_API_KEY",
] as const;

type RequiredVar = (typeof REQUIRED)[number];

// ─── Validate ─────────────────────────────────────────────────────────────────

function validate() {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length === 0) return;

  const lines = missing.map((k) => `  • ${k}`).join("\n");
  const msg =
    `[env] Missing required environment variables:\n${lines}\n\n` +
    `Copy .env.example to .env.local and fill in the values.`;

  if (process.env.NODE_ENV === "production") {
    // In production, a missing variable is a deployment error — fail fast.
    throw new Error(msg);
  } else {
    // In development, warn loudly but don't crash so the dev can still
    // run the parts of the app that don't need the missing variable.
    console.warn("\x1b[33m%s\x1b[0m", msg);
  }
}

// Run immediately on import (server-side only)
if (typeof window === "undefined") {
  validate();
}

// ─── Typed exports ─────────────────────────────────────────────────────────────

/**
 * Typed, non-nullable env accessors.
 * These are safe to use after this module has been imported.
 */
export const env = {
  // Database
  DATABASE_URL:               process.env.DATABASE_URL as string,

  // Auth
  NEXTAUTH_SECRET:            process.env.NEXTAUTH_SECRET as string,
  NEXTAUTH_URL:               process.env.NEXTAUTH_URL,

  // Stripe
  STRIPE_SECRET_KEY:          process.env.STRIPE_SECRET_KEY as string,
  STRIPE_WEBHOOK_SECRET:      process.env.STRIPE_WEBHOOK_SECRET as string,
  STRIPE_PRICE_SUBSCRIPTION:  process.env.STRIPE_PRICE_SUBSCRIPTION as string,

  // AI
  ANTHROPIC_API_KEY:          process.env.ANTHROPIC_API_KEY as string,

  // App
  NEXT_PUBLIC_APP_URL:        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
