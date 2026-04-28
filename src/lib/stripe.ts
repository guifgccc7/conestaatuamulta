import Stripe from "stripe";
import { withStripe } from "./stripe-resilience";
import { withDb }     from "./db";
import { logger }     from "./logger";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion:  "2025-02-24.acacia",
  typescript:  true,
  // Stripe SDK's own retry: handles network-level errors before our layer
  maxNetworkRetries: 2,
  timeout: 10_000,
});

/**
 * Get existing Stripe customer ID, or create one and persist it.
 *
 * Resilience: both the Stripe create call and the DB update are wrapped in
 * their respective retry layers.  If the DB update fails after the Stripe
 * customer is created we log the orphaned Stripe ID so it can be reconciled
 * manually — we do not roll back with Stripe (no API for that).
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email:  string,
  name?:  string | null,
): Promise<string> {
  const { prisma } = await import("@/lib/prisma");

  // ── 1. Check DB for existing ID ───────────────────────────────────────────
  const user = await withDb(
    () => prisma.user.findUnique({ where: { id: userId } }),
    { label: "stripe/get-customer" },
  );

  if (user?.stripeCustomerId) return user.stripeCustomerId;

  // ── 2. Create in Stripe ───────────────────────────────────────────────────
  const customer = await withStripe(
    () => stripe.customers.create({
      email,
      name:     name ?? undefined,
      metadata: { userId },
    }),
    { label: "stripe/create-customer", retries: 2 },
  );

  // ── 3. Persist ID back to DB ──────────────────────────────────────────────
  try {
    await withDb(
      () => prisma.user.update({
        where: { id: userId },
        data:  { stripeCustomerId: customer.id },
      }),
      { label: "stripe/persist-customer-id" },
    );
  } catch (dbErr) {
    // Stripe customer exists but we couldn't persist the ID.
    // Log the orphan for manual reconciliation — do not fail the request.
    logger.error("stripe/get-or-create-customer", "DB_PERSIST_FAILED_AFTER_STRIPE_CREATE", dbErr, {
      userId,
      detail: `Stripe customerId=${customer.id} was created but not saved to DB`,
    });
    // Still return the Stripe ID so the current checkout can proceed.
  }

  return customer.id;
}
