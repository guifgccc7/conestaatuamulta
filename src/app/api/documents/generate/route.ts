import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import "@/lib/env"; // BUG-003: validate required env vars at startup
import { authOptions } from "@/lib/auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { logger, AUDIT } from "@/lib/logger";
import { generatePdfBuffer } from "@/lib/pdf/generator";
import {
  buildEnhancedDocument,
  buildEnhancedDocumentWithFallback,
} from "@/lib/document/generate-final-document";
import {
  DocumentValidationError,
  UNCERTAIN_AUTHORITY_MESSAGE,
} from "@/lib/authority/document-validator";
import { createHash } from "crypto";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";
import { writeFile, mkdir } from "fs/promises";
import { WizardFormData } from "@/types";
import type { AiOutput } from "@/lib/document/types";

// ─── JSON helpers ─────────────────────────────────────────────────────────────

/**
 * Safely parse a value that may be a JSON string (String? Prisma field),
 * an already-parsed object, null, or undefined.
 * Returns the fallback if parsing fails or the value is absent.
 */
function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "object") return value as T; // already an object
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    logger.warn("documents/generate", "JSON_PARSE_FAILED", { detail: String(value).slice(0, 80) });
    return fallback;
  }
}

// ─── Request schema ───────────────────────────────────────────────────────────

const aiOutputSchema = z
  .object({
    argumentos:    z.array(z.string()).default([]),
    texto_formal:  z.string().optional(),
    caseStrength:  z.enum(["forte", "moderado", "fraco"]).optional(),
  })
  .optional()
  .nullable();

const generateSchema = z.object({
  caseId:     z.string().min(1, "ID de caso inválido."),
  aiOutput:   aiOutputSchema,
  /** User-edited document text — when present, skips template generation and uses this directly. */
  editedText: z.string().optional(),
});

// ─── POST /api/documents/generate ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // ── Rate limit: 10 document generations per hour per user ──────────────────
  const rl = rateLimit("doc-generate", userId, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    logger.warn("documents/generate", AUDIT.SECURITY.RATE_LIMIT, { userId });
    return tooManyRequests(rl);
  }

  try {
    const body              = await req.json();
    const { caseId, aiOutput, editedText } = generateSchema.parse(body);

    // ── 1. Verify case ownership ─────────────────────────────────────────────

    const caseData = await prisma.case.findFirst({ where: { id: caseId, userId } });
    if (!caseData) {
      return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
    }

    // ── 2. Reconstruct WizardFormData (needed for both preview + full gen) ─────
    //
    // violationData and contestationGrounds are stored as JSON text (String? in
    // schema.prisma).  safeJsonParse() handles both the serialised-string case
    // and the already-object case (defensive, in case the driver ever changes).

    const violationData = safeJsonParse<Record<string, string>>(
      caseData.violationData,
      {},
    );
    const contestationGrounds = safeJsonParse<WizardFormData["contestationGrounds"]>(
      caseData.contestationGrounds,
      [],
    );

    const formData: WizardFormData = {
      caseType:            caseData.caseType as WizardFormData["caseType"],
      fineNumber:          caseData.fineNumber ?? "",
      fineDate:            caseData.fineDate?.toISOString() ?? "",
      fineEntity:          caseData.fineEntity ?? "",
      fineLocation:        caseData.fineLocation ?? "",
      vehiclePlate:        caseData.vehiclePlate ?? "",
      vehicleOwnerName:    caseData.vehicleOwnerName ?? "",
      vehicleOwnerNif:     violationData.ownerNif ?? "",
      vehicleOwnerAddress: violationData.ownerAddress ?? "",
      violationData:       violationData as unknown as WizardFormData["violationData"],
      contestationGrounds: contestationGrounds,
      additionalNotes:     caseData.additionalNotes ?? "",
    };

    // ── 3. Authorisation check (subscription or paid single doc) ─────────────

    const user        = await prisma.user.findUnique({ where: { id: userId } });
    const hasActiveSub =
      user?.subscriptionStatus === "ACTIVE" ||
      user?.subscriptionStatus === "TRIALING";

    if (!hasActiveSub) {
      const paidDoc = await prisma.document.findFirst({
        where: { caseId, status: "PAID" },
      });
      if (!paidDoc) {
        // Return blurred preview text — no PDF saved, no charge yet
        const previewDoc = buildEnhancedDocument(formData, null);
        return NextResponse.json(
          {
            error:           "Pagamento necessário.",
            requiresPayment: true,
            caseId,
            data: { previewText: previewDoc.text.slice(0, 800) },
          },
          { status: 402 }
        );
      }
    }

    // ── 4. Generate document text ─────────────────────────────────────────────
    // Priority: user-edited text > AI-enhanced template > base template
    //
    // buildEnhancedDocumentWithFallback is used instead of buildEnhancedDocument
    // so that any AI-merge failure is caught server-side and the document is
    // generated without AI rather than returning a 500.  DocumentValidationError
    // still propagates (it is not an AI issue — it's a data quality gate).

    const enhancedDoc = editedText?.trim()
      ? {
          // User supplied edited text — wrap it in a GeneratedDocument shell
          text:                editedText,
          aiEnhanced:          !!(aiOutput?.texto_formal),
          aiArgumentsInjected: aiOutput?.argumentos.length ?? 0,
          generatedAt:         new Date().toISOString(),
        }
      : buildEnhancedDocumentWithFallback(formData, (aiOutput as AiOutput) ?? null);

    // Surface fallback event for debugging (never blocks the response)
    if (enhancedDoc.aiFallbackUsed) {
      logger.warn("documents/generate", "AI_FALLBACK_USED", {
        detail: enhancedDoc.aiFallbackReason,
        userId,
      });
    }

    // ── 5. Render PDF ────────────────────────────────────────────────────────

    const documentId = uuidv4();
    const pdfBuffer  = await generatePdfBuffer(enhancedDoc.text, formData, documentId);

    // ── 6. Persist to filesystem (swap for S3/R2 in production) ─────────────

    const uploadsDir = join(process.cwd(), "public", "documents", userId);
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${documentId}.pdf`;
    await writeFile(join(uploadsDir, filename), pdfBuffer);
    const pdfUrl = `/documents/${userId}/${filename}`;

    // ── 7. Hash for integrity verification ───────────────────────────────────

    const pdfHash = createHash("sha256").update(pdfBuffer).digest("hex");

    // ── 8. Upsert Document record ────────────────────────────────────────────

    const existingDoc = await prisma.document.findFirst({
      where: { caseId, status: { not: "FAILED" } },
    });

    const doc = await prisma.document.upsert({
      where: { id: existingDoc?.id ?? documentId },
      create: {
        id:         documentId,
        userId,
        caseId,
        templateId: `${caseData.caseType.toLowerCase()}-v1`,
        status:     "GENERATED",
        content:    enhancedDoc.text,
        pdfUrl,
        pdfHash,
      },
      update: {
        content: enhancedDoc.text,
        pdfUrl,
        pdfHash,
        status:  "GENERATED",
      },
    });

    // ── 9. Update case status ────────────────────────────────────────────────

    await prisma.case.update({
      where: { id: caseId },
      data:  { status: "READY" },
    });

    // ── 10. Return result with AI metadata ───────────────────────────────────

    logger.audit("documents/generate", AUDIT.DOCUMENT.GENERATED, { userId, detail: `docId:${doc.id}` });
    return NextResponse.json({
      success: true,
      data: {
        documentId:          doc.id,
        pdfUrl,
        aiEnhanced:          enhancedDoc.aiEnhanced,
        aiArgumentsInjected: enhancedDoc.aiArgumentsInjected,
        generatedAt:         enhancedDoc.generatedAt,
        previewText:         enhancedDoc.text,
        // Fallback metadata — client uses this to show the right status message
        aiFallbackUsed:      enhancedDoc.aiFallbackUsed ?? false,
        aiFallbackMessage:   enhancedDoc.aiFallbackUsed
          ? "O documento foi gerado com o modelo padrão. A melhoria por IA não " +
            "pôde ser aplicada neste momento."
          : null,
      },
    });
  } catch (err) {
    // ── Document validation blocked generation ───────────────────────────────
    if (err instanceof DocumentValidationError) {
      const { result } = err;

      // Detect whether the gate fired (confidence too low to proceed)
      const isUncertainAuthority =
        result.checks.length > 0 &&
        result.checks[0].check === "CONFIDENCE_GATE" &&
        !result.checks[0].passed;

      logger.warn("documents/generate", "VALIDATION_BLOCKED", {
        detail: `${result.summary} — ${result.errors.join(", ")}`,
        userId,
      });

      return NextResponse.json(
        {
          error:             UNCERTAIN_AUTHORITY_MESSAGE,
          validationBlocked: true,
          uncertainAuthority: isUncertainAuthority,
          checks:            result.checks,
          errors:            result.errors,
          clarification_needed: result.clarification_needed ?? null,
          // userMessage is always the canonical constant when gate fired;
          // otherwise it is the first named-check error.
          userMessage: isUncertainAuthority
            ? UNCERTAIN_AUTHORITY_MESSAGE
            : result.errors[0] ?? UNCERTAIN_AUTHORITY_MESSAGE,
        },
        { status: 422 },
      );
    }

    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }

    logger.error("documents/generate", "GENERATE_ERROR", err, { userId });
    return NextResponse.json({ error: "Erro ao gerar documento." }, { status: 500 });
  }
}
