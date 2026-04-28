/**
 * GET /api/user/export
 *
 * RGPD art. 20.º — Direito à portabilidade dos dados
 * Lei n.º 58/2019, art. 20.º — prazo de resposta: 30 dias
 *
 * Returns a structured JSON export of all personal data held for the
 * authenticated user, in a commonly used and machine-readable format.
 *
 * Includes:
 *   - Account information
 *   - All traffic violation cases and their data
 *   - Payment history (amounts, dates, types — no card numbers, stored by Stripe)
 *   - Document metadata (no PDF binary — available for 12 months via download link)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { prisma }                    from "@/lib/prisma";
import { logger, AUDIT }             from "@/lib/logger";

function safeJsonParse(val: string | null | undefined): unknown {
  if (!val) return null;
  try { return JSON.parse(val); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  try {
    // ── Fetch all data belonging to this user ────────────────────────────────
    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: {
        cases: {
          include: {
            documents: {
              select: {
                id:         true,
                status:     true,
                templateId: true,
                pdfUrl:     true,
                pdfHash:    true,
                createdAt:  true,
                updatedAt:  true,
                // Exclude `content` (full document text) from export for size;
                // user can download individual PDFs via pdfUrl
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          select: {
            id:                  true,
            amount:              true,
            currency:            true,
            status:              true,
            type:                true,
            stripeSessionId:     true,
            stripePaymentIntent: true,
            createdAt:           true,
            updatedAt:           true,
            // No card data — stored exclusively by Stripe (PCI-DSS)
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
    }

    // ── Build the export payload ─────────────────────────────────────────────
    const exportPayload = {
      _meta: {
        exportedAt:       new Date().toISOString(),
        exportedFor:      user.email,
        rgpdArticle:      "art. 20.º RGPD (UE) 2016/679 — Direito à portabilidade",
        lei:              "Lei n.º 58/2019 de 8 de Agosto",
        responsavel:      "Contesta a Tua Multa — contestaatuamulta.pt",
        contactoPriv:     "privacidade@contestaatuamulta.pt",
        format:           "JSON (RFC 8259)",
        retencaoDados:    "Os documentos gerados estão disponíveis durante 12 meses.",
        nota:             "Os dados de cartão de crédito/débito não são armazenados por esta plataforma. São tratados exclusivamente pela Stripe, Inc., com quem pode exercer os seus direitos em https://stripe.com/en-pt/privacy",
      },
      conta: {
        id:                    user.id,
        nome:                  user.name,
        email:                 user.email,
        emailVerificado:       user.emailVerified,
        fotografia:            user.image,
        criadaEm:              user.createdAt,
        atualizadaEm:          user.updatedAt,
        consentimentoEm:       user.consentGivenAt,
        versaoPrivacidade:     user.consentVersion,
        estadoSubscricao:      user.subscriptionStatus,
        fimPeriodoSubscricao:  user.subscriptionPeriodEnd,
        // Stripe IDs are not personal data but included for completeness
        stripeCustomerId:      user.stripeCustomerId,
      },
      contestacoes: user.cases.map((c) => ({
        id:                  c.id,
        titulo:              c.title,
        tipoCaso:            c.caseType,
        estado:              c.status,
        numeroAuto:          c.fineNumber,
        dataInfracao:        c.fineDate,
        entidadeAutuante:    c.fineEntity,
        localInfracao:       c.fineLocation,
        matriculaVeiculo:    c.vehiclePlate,
        nomeProprietario:    c.vehicleOwnerName,
        dadosInfracao:       safeJsonParse(c.violationData),
        fundamentosDefesa:   safeJsonParse(c.contestationGrounds),
        notasAdicionais:     c.additionalNotes,
        criadaEm:            c.createdAt,
        atualizadaEm:        c.updatedAt,
        documentos:          c.documents.map((d) => ({
          id:           d.id,
          estado:       d.status,
          modelo:       d.templateId,
          urlPdf:       d.pdfUrl,
          hashPdf:      d.pdfHash,
          geradoEm:     d.createdAt,
          atualizadoEm: d.updatedAt,
        })),
      })),
      pagamentos: user.payments.map((p) => ({
        id:              p.id,
        valor:           `${(p.amount / 100).toFixed(2)} ${p.currency.toUpperCase()}`,
        estado:          p.status,
        tipo:            p.type,
        sessaoStripe:    p.stripeSessionId,
        intentStripe:    p.stripePaymentIntent,
        criadoEm:        p.createdAt,
        atualizadoEm:    p.updatedAt,
      })),
    };

    logger.audit("user/export", AUDIT.USER.EXPORT, { userId });

    // ── Return as downloadable JSON file ─────────────────────────────────────
    const filename = `dados-pessoais-${userId}-${new Date().toISOString().split("T")[0]}.json`;
    const json     = JSON.stringify(exportPayload, null, 2);

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type":        "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control":       "no-store",
      },
    });
  } catch (err) {
    logger.error("user/export", "EXPORT_ERROR", err, { userId });
    return NextResponse.json(
      { error: "Erro ao exportar dados. Tenta novamente ou contacta privacidade@contestaatuamulta.pt" },
      { status: 500 }
    );
  }
}
