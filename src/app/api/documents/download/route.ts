/**
 * GET /api/documents/download?documentId=xxx
 *
 * Serves a PDF file only after verifying:
 *   1. User is authenticated
 *   2. Document belongs to this user
 *   3. Payment is confirmed (status === "PAID") OR user has active subscription
 *
 * This prevents direct URL guessing / link sharing to bypass the paywall.
 * In production, swap the filesystem read for a signed S3/R2 URL (set a
 * short expiry, e.g. 60 s) and redirect rather than stream.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";
import { join, resolve } from "path";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId     = (session.user as { id: string }).id;
  const documentId = req.nextUrl.searchParams.get("documentId");

  if (!documentId) {
    return NextResponse.json({ error: "documentId em falta." }, { status: 400 });
  }

  // ── 1. Fetch document and verify ownership ──────────────────────────────────

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId },
    include: { case: true },
  });

  if (!doc) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  // ── 2. Verify payment authorisation ────────────────────────────────────────

  const user = await prisma.user.findUnique({ where: { id: userId } });

  const hasActiveSub =
    user?.subscriptionStatus === "ACTIVE" ||
    user?.subscriptionStatus === "TRIALING";

  const hasPaidDoc = doc.status === "PAID";

  if (!hasActiveSub && !hasPaidDoc) {
    return NextResponse.json(
      {
        error:           "Acesso negado. Pagamento necessário.",
        requiresPayment: true,
        caseId:          doc.caseId,
      },
      { status: 402 }
    );
  }

  // ── 3. Serve the PDF ────────────────────────────────────────────────────────

  if (!doc.pdfUrl) {
    return NextResponse.json(
      { error: "PDF ainda não gerado. Tenta novamente em instantes." },
      { status: 404 }
    );
  }

  try {
    // ── Path traversal guard ────────────────────────────────────────────────
    // pdfUrl is stored as "/documents/{userId}/{uuid}.pdf" (server-written).
    // Validate format before constructing the filesystem path so that a
    // crafted DB value cannot escape the public/documents directory.
    const PDF_URL_RE = /^\/documents\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\.pdf$/;
    if (!PDF_URL_RE.test(doc.pdfUrl)) {
      console.error("[DOWNLOAD] Invalid pdfUrl format for document:", documentId);
      return NextResponse.json({ error: "Ficheiro inválido." }, { status: 400 });
    }

    const relativePath  = doc.pdfUrl.slice(1); // remove leading "/"
    const filePath      = join(process.cwd(), "public", relativePath);

    // Resolve the final absolute path and confirm it stays inside public/documents
    const resolvedPath  = resolve(filePath);
    const allowedBase   = resolve(join(process.cwd(), "public", "documents"));
    if (!resolvedPath.startsWith(allowedBase + "/")) {
      console.error("[DOWNLOAD] Path traversal blocked for document:", documentId);
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const fileBuffer   = await readFile(resolvedPath);

    // Increment download counter (fire-and-forget — non-critical)
    prisma.document.update({
      where: { id: documentId },
      data:  { status: "DOWNLOADED" },
    }).catch((err) => {
      console.error("[DOWNLOAD] Failed to update status for document", documentId, err);
    });

    // Build a safe filename for Content-Disposition
    const plate    = doc.case?.vehiclePlate?.replace(/[^A-Z0-9]/gi, "") ?? "auto";
    const filename = `impugnacao_${plate}_${documentId.slice(0, 8)}.pdf`;

    return new NextResponse(fileBuffer, {
      status:  200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length":      String(fileBuffer.length),
        "Cache-Control":       "private, no-store",
        // Prevent downstream caches from serving to other users
        "Vary":                "Cookie",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Erro ao aceder ao ficheiro. Contacta o suporte." },
      { status: 500 }
    );
  }
}
