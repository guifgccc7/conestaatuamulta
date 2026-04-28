/**
 * DELETE /api/user/delete
 *
 * RGPD art. 17.º — Direito ao apagamento ("direito a ser esquecido")
 * Lei n.º 58/2019, art. 20.º — prazo de resposta: 30 dias
 *
 * Anonymisation strategy (not hard delete) to preserve referential integrity
 * with Payment records, which must be retained 7 years under Portuguese fiscal
 * law (art. 52.º CIVA / art. 35.º CIRC / DL 28/2019).
 *
 * What is removed:
 *   - name, email, password, image, emailVerified   → nulled
 *   - All Cases (and their Documents, via cascade)
 *   - All Sessions and OAuth Accounts
 *
 * What is retained (fiscal / legal obligation, art. 6.º(1)(c) RGPD):
 *   - Payment records (userId reference preserved but user is anonymised)
 *   - Anonymised User record (required for Payment FK)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { logger, AUDIT }             from "@/lib/logger";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // ── 1. Confirm user exists ───────────────────────────────────────────────
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    // ── 2. Delete Cases (cascades to Documents) ──────────────────────────────
    await prisma.case.deleteMany({ where: { userId } });

    // ── 3. Delete OAuth accounts and active sessions ─────────────────────────
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });

    // ── 4. Anonymise the User record ─────────────────────────────────────────
    // Email must remain unique — use a deterministic placeholder that cannot
    // be logged in or matched to the real user.
    const anonymisedEmail = `deleted_${userId}@rgpd.invalid`;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name:               null,
        email:              anonymisedEmail,
        emailVerified:      null,
        image:              null,
        password:           null,
        stripeCustomerId:   null,
        subscriptionId:     null,
        subscriptionStatus: "FREE",
        subscriptionPeriodEnd: null,
        consentGivenAt:     null,
        consentVersion:     null,
        deletionRequestedAt: new Date(),
        updatedAt:          new Date(),
      },
    });

    // ── 5. Log the erasure (internal audit trail, no personal data) ──────────
    logger.audit("user/delete", AUDIT.USER.DELETE, { userId });

    return NextResponse.json({
      success: true,
      message:
        "A tua conta foi anonimizada. Os dados pessoais foram eliminados. " +
        "Os registos de pagamento são retidos pelo prazo legal de 7 anos " +
        "(obrigação fiscal — art. 52.º CIVA).",
    });
  } catch (err) {
    logger.error("user/delete", "DELETE_ERROR", err, { userId });
    return NextResponse.json(
      { error: "Erro ao eliminar a conta. Tenta novamente ou contacta privacidade@contestaatuamulta.pt" },
      { status: 500 }
    );
  }
}
