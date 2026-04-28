import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { PRICING } from "@/types";
import "@/lib/env"; // BUG-003: validate required env vars at startup
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logger, AUDIT } from "@/lib/logger";

const checkoutSchema = z.object({
  type:       z.enum(["SINGLE_DOC", "SUBSCRIPTION"]),
  caseId:     z.string().optional(),
  documentId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const user = session.user as { id: string; email?: string | null; name?: string | null };

  // ── Rate limit: 5 checkout sessions per hour per user ──────────────────────
  const rl = rateLimit("stripe-checkout", user.id, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    logger.warn("stripe/checkout", AUDIT.SECURITY.RATE_LIMIT, { userId: user.id });
    return tooManyRequests(rl);
  }

  try {
    const body = await req.json();
    const { type, caseId, documentId } = checkoutSchema.parse(body);

    // Email is required by Stripe for customer records and receipts.
    // OAuth providers always supply it; password accounts require it at sign-up.
    if (!user.email) {
      return NextResponse.json(
        { error: "É necessário um email válido para concluir o pagamento. Actualiza o teu perfil." },
        { status: 400 }
      );
    }

    const customerId = await getOrCreateStripeCustomer(
      user.id,
      user.email,
      user.name,
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (type === "SUBSCRIPTION") {
      const stripeSession = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [
          {
            price: process.env.STRIPE_PRICE_SUBSCRIPTION!,
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=subscription`,
        cancel_url:  `${appUrl}/dashboard?canceled=1`,
        locale:      "pt",
        metadata:    { userId: user.id, type: "SUBSCRIPTION" },
        subscription_data: {
          metadata: { userId: user.id },
          trial_period_days: 7,
        },
      });

      logger.audit("stripe/checkout", AUDIT.PAYMENT.CHECKOUT_INITIATED, { userId: user.id, detail: "SUBSCRIPTION" });
      return NextResponse.json({ success: true, url: stripeSession.url });
    }

    // SINGLE_DOC
    if (!caseId) {
      return NextResponse.json({ error: "caseId obrigatório." }, { status: 400 });
    }

    const caseRecord = await prisma.case.findFirst({
      where: { id: caseId, userId: user.id },
    });
    if (!caseRecord) {
      return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency:     "eur",
            unit_amount:  PRICING.SINGLE_DOC.amount,
            product_data: {
              name:        "Minuta de Impugnação",
              description: `Auto n.º ${caseRecord.fineNumber ?? "N/A"} — ${caseRecord.title}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=single&case_id=${caseId}`,
      cancel_url:  `${appUrl}/wizard?id=${caseId}&canceled=1`,
      locale:      "pt",
      metadata:    {
        userId: user.id,
        caseId,
        type: "SINGLE_DOC",
        ...(documentId ? { documentId } : {}),
      },
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        userId:          user.id,
        amount:          PRICING.SINGLE_DOC.amount,
        type:            "SINGLE_DOC",
        status:          "PENDING",
        stripeSessionId: stripeSession.id,
        ...(documentId ? { documentId } : {}),
      },
    });

    logger.audit("stripe/checkout", AUDIT.PAYMENT.CHECKOUT_INITIATED, { userId: user.id, detail: `SINGLE_DOC caseId:${caseId}` });
    return NextResponse.json({ success: true, url: stripeSession.url });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    logger.error("stripe/checkout", "CHECKOUT_ERROR", err, { userId: user.id });
    return NextResponse.json({ error: "Erro ao criar sessão de pagamento." }, { status: 500 });
  }
}
