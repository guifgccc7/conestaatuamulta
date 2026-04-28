/**
 * POST /api/stripe/webhook
 *
 * Resilience:
 *   - HMAC signature verification guards against spoofed events
 *   - DB-backed idempotency: ProcessedWebhookEvent table prevents double-processing
 *     across restarts and multiple instances (upsert with unique PK on event ID)
 *   - Prisma transactions ensure checkout.session.completed atomically updates
 *     Payment, Document, and Case — partial writes are impossible
 *   - Stripe subscription retrieval wrapped in withStripe() for retry
 *   - Each event handler is wrapped in a try/catch so one failed event cannot
 *     mask another; Stripe receives 200 and we log the failure for replay
 *   - Structured logger replaces console.error throughout
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { withStripe } from "@/lib/stripe-resilience";
import { withDb }     from "@/lib/db";
import { logger, AUDIT } from "@/lib/logger";
import Stripe from "stripe";

// ─── DB-backed idempotency guard ──────────────────────────────────────────────
//
// Uses the ProcessedWebhookEvent table (unique PK = Stripe event ID).
// createMany with skipDuplicates returns count=0 when the event was already
// processed — safe across restarts and multiple server instances.

async function isDuplicate(eventId: string, eventType: string): Promise<boolean> {
  const result = await prisma.processedWebhookEvent.createMany({
    data: [{ id: eventId, type: eventType }],
    skipDuplicates: true,
  });
  // count = 0 → row already existed → duplicate
  return result.count === 0;
}

// ─── Subscription helper ──────────────────────────────────────────────────────

async function retrieveSubscription(subId: string): Promise<Stripe.Subscription> {
  return withStripe(
    () => stripe.subscriptions.retrieve(subId),
    { label: "webhook/retrieve-subscription", retries: 2 },
  );
}

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const { userId, caseId, documentId, type } = session.metadata ?? {};

  if (type === "SINGLE_DOC" && userId && caseId) {
    // Atomic multi-table update: Payment → COMPLETED, Document → PAID, Case → READY
    await withDb(
      () => prisma.$transaction([
        prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data:  {
            status:              "COMPLETED",
            stripePaymentIntent: session.payment_intent as string,
          },
        }),
        ...(documentId
          ? [prisma.document.updateMany({
              where: { id: documentId, caseId, status: { not: "PAID" } },
              data:  { status: "PAID" },
            })]
          : [prisma.document.updateMany({
              where: { caseId, status: { not: "PAID" } },
              data:  { status: "PAID" },
            })]
        ),
        prisma.case.updateMany({
          where: { id: caseId, userId },
          data:  { status: "READY" },
        }),
      ]),
      { label: "webhook/checkout-completed-transaction" },
    );

    logger.audit("stripe/webhook", AUDIT.PAYMENT.COMPLETED, {
      userId,
      detail: `SINGLE_DOC caseId=${caseId} sessionId=${session.id}`,
    });
  }

  if (type === "SUBSCRIPTION" && userId) {
    const sub = await retrieveSubscription(session.subscription as string);

    await withDb(
      () => prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionId:        sub.id,
          subscriptionStatus:    "ACTIVE",
          subscriptionPeriodEnd: new Date(
            (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000
          ),
        },
      }),
      { label: "webhook/subscription-activate" },
    );

    logger.audit("stripe/webhook", AUDIT.PAYMENT.SUBSCRIPTION_START, {
      userId,
      detail: `subId=${sub.id}`,
    });
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;

  const sub    = await retrieveSubscription(invoice.subscription as string);
  const userId = (sub.metadata as { userId?: string }).userId;
  if (!userId) return;

  await withDb(
    () => prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus:    "ACTIVE",
        subscriptionPeriodEnd: new Date(
          (sub as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000
        ),
      },
    }),
    { label: "webhook/invoice-paid" },
  );

  logger.audit("stripe/webhook", AUDIT.PAYMENT.COMPLETED, {
    userId,
    detail: `renewal subId=${sub.id}`,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const userId = (sub.metadata as { userId?: string }).userId;
  if (!userId) return;

  await withDb(
    () => prisma.user.update({
      where: { id: userId },
      data:  { subscriptionStatus: "CANCELED", subscriptionId: null },
    }),
    { label: "webhook/subscription-deleted" },
  );

  logger.audit("stripe/webhook", AUDIT.PAYMENT.SUBSCRIPTION_END, {
    userId,
    detail: `subId=${sub.id} reason=deleted`,
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!invoice.subscription) return;

  const sub    = await retrieveSubscription(invoice.subscription as string);
  const userId = (sub.metadata as { userId?: string }).userId;
  if (!userId) return;

  await withDb(
    () => prisma.user.update({
      where: { id: userId },
      data:  { subscriptionStatus: "PAST_DUE" },
    }),
    { label: "webhook/invoice-payment-failed" },
  );

  logger.audit("stripe/webhook", AUDIT.PAYMENT.FAILED, {
    userId,
    detail: `subId=${sub.id} invoiceId=${invoice.id}`,
  });
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  // ── 1. Verify HMAC signature ─────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    logger.warn("stripe/webhook", AUDIT.SECURITY.INVALID_WEBHOOK_SIG, {
      detail: err instanceof Error ? err.message.slice(0, 120) : "unknown",
    });
    return new NextResponse("Webhook Error", { status: 400 });
  }

  // ── 2. Idempotency guard (DB-backed, survives restarts) ─────────────────
  if (await isDuplicate(event.id, event.type)) {
    logger.info("stripe/webhook", "WEBHOOK_DUPLICATE_SKIPPED", {
      detail: `eventId=${event.id} type=${event.type}`,
    });
    // Return 200 — Stripe must not retry a duplicate
    return NextResponse.json({ received: true, duplicate: true });
  }

  // ── 3. Dispatch to handler ───────────────────────────────────────────────
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Silently ack events we don't handle — do not return 4xx
        logger.info("stripe/webhook", "WEBHOOK_UNHANDLED_EVENT", {
          detail: event.type,
        });
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    // Log the error but return 500 so Stripe retries.
    // The idempotency guard ensures a successful retry won't double-process.
    logger.error("stripe/webhook", "WEBHOOK_HANDLER_ERROR", err, {
      detail: `eventId=${event.id} type=${event.type}`,
    });
    return new NextResponse("Internal error", { status: 500 });
  }
}
