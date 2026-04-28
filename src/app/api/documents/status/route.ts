/**
 * GET /api/documents/status?caseId=xxx
 *
 * Returns the payment and generation status for a case.
 * Used by the checkout success page to poll until the document is ready.
 *
 * Intentionally lightweight — no heavy processing, just a DB read.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const caseId = req.nextUrl.searchParams.get("caseId");

  if (!caseId) {
    return NextResponse.json({ error: "caseId em falta." }, { status: 400 });
  }

  const caseData = await prisma.case.findFirst({
    where:   { id: caseId, userId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        take:    1,
      },
    },
  });

  if (!caseData) {
    return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
  }

  const doc = caseData.documents[0] ?? null;

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { subscriptionStatus: true },
  });

  const hasActiveSub =
    user?.subscriptionStatus === "ACTIVE" ||
    user?.subscriptionStatus === "TRIALING";

  return NextResponse.json({
    success: true,
    data: {
      caseId,
      caseStatus:  caseData.status,
      isPaid:      hasActiveSub || doc?.status === "PAID" || doc?.status === "GENERATED",
      hasDocument: !!doc,
      documentId:  doc?.id ?? null,
      documentStatus: doc?.status ?? null,
      pdfReady:    !!(doc?.pdfUrl),
    },
  });
}
