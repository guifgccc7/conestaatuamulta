/**
 * generateFinalDocument — AI-enhanced legal document assembler
 *
 * Takes a base template string (from generateMinuta) + user data + optional
 * AI output and produces a single, cohesive legal document string ready for
 * PDF rendering.
 *
 * Merge strategy:
 *
 *   1. Start with base text produced by generateMinuta()
 *   2. If aiOutput.texto_formal exists  → replace "II — FUNDAMENTOS" section entirely
 *   3. Else if aiOutput.argumentos > 0  → append after existing grounds, before Pedido
 *   4. Always inject the mandatory disclaimer before the signature block
 *
 * Fallback guarantee:
 *   If the AI content fails any sanity check or if the merge operation throws,
 *   the function transparently falls back to the standard template (aiOutput=null).
 *   The caller is informed via `aiFallbackUsed` on the returned GeneratedDocument.
 *
 * Both steps are pure string operations — no DOM, no I/O.
 */

import { generateMinuta } from "@/lib/templates";
import { formatDateLong  } from "@/lib/utils";
import { logger }          from "@/lib/logger";
import type { WizardFormData } from "@/types";
import type { AiOutput, GenerateDocumentInput, GeneratedDocument } from "./types";
import { DOCUMENT } from "@/lib/compliance/disclaimers";
import { routeAuthority }          from "@/lib/authority/authority-router";
import { validateDocument, DocumentValidationError } from "@/lib/authority/document-validator";

// ─── Section anchors ─────────────────────────────────────────────────────────
// Must match the headings produced by templates/*.ts generators.

const RE_SECTION_II   = /II\s*[—–-]\s*FUNDAMENTOS DA IMPUGNA[ÇC][ÃA]O/i;
const RE_SECTION_III  = /III\s*[—–-]\s*CONSIDERA[ÇC][ÕO]ES ADICIONAIS/i;
const RE_SECTION_IV   = /IV\s*[—–-]\s*PEDIDO/i;
const RE_SIGNATURE    = /O\/A Arguido\/A,/i;

// ─── Disclaimer ───────────────────────────────────────────────────────────────
// Sourced from /lib/compliance/disclaimers.ts — single source of truth.

function buildDisclaimer(aiEnhanced: boolean, generatedAt: string): string {
  return [
    "",
    "---",
    "",
    DOCUMENT.FULL_TEXT(aiEnhanced, formatDateLong(generatedAt)),
    "",
    "contestaatuamulta.pt — contacto@contestaatuamulta.pt",
  ].join("\n");
}

// ─── Ground counter ───────────────────────────────────────────────────────────

/**
 * Count top-level numbered ground paragraphs already present in a text block.
 * Used to continue the numbering sequence when appending AI arguments.
 * Matches lines like "1. FALTA DE ...", "2. AUSÊNCIA ...", etc.
 */
function countGrounds(block: string): number {
  const matches = block.match(/^\d+\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕ]/gm);
  return matches?.length ?? 0;
}

// ─── AI argument block ────────────────────────────────────────────────────────

/**
 * Build a formatted block for AI-generated arguments.
 * Each argument gets a sub-number (e.g. 4.1, 4.2) under a parent heading.
 */
function buildAiArgumentBlock(argumentos: string[], parentIdx: number): string {
  const lines: string[] = [
    "",
    `${parentIdx}. FUNDAMENTOS COMPLEMENTARES — ANÁLISE JURÍDICA ADICIONAL`,
    "",
  ];

  argumentos.forEach((arg, i) => {
    const clean = arg.trimEnd().replace(/\.?$/, ".");
    lines.push(`${parentIdx}.${i + 1} ${clean}`);
    lines.push("");
  });

  return lines.join("\n");
}

// ─── Section replacement ──────────────────────────────────────────────────────

/**
 * Replace everything between the "II — FUNDAMENTOS" header and the next major
 * section heading (III or IV) with textoFormal.
 * Preserves the header line itself and everything that follows.
 */
function replaceFundamentosSection(text: string, textoFormal: string): string {
  const secIIMatch = RE_SECTION_II.exec(text);
  if (!secIIMatch) return text + "\n\n" + textoFormal;

  const headerEnd   = secIIMatch.index + secIIMatch[0].length;
  const afterHeader = text.slice(headerEnd);

  const nextMatch   = RE_SECTION_III.exec(afterHeader) ?? RE_SECTION_IV.exec(afterHeader);
  const nextStart   = nextMatch ? headerEnd + nextMatch.index : text.length;

  return (
    text.slice(0, headerEnd) +
    "\n\n" +
    textoFormal.trim() +
    "\n\n" +
    text.slice(nextStart)
  );
}

// ─── Section append ───────────────────────────────────────────────────────────

/**
 * Inject AI argument block immediately before Section III or IV,
 * continuing the existing grounds numbering.
 */
function appendArgumentos(text: string, argumentos: string[]): string {
  if (!argumentos.length) return text;

  const secIIMatch = RE_SECTION_II.exec(text);
  if (!secIIMatch) return text;

  const headerEnd   = secIIMatch.index + secIIMatch[0].length;
  const afterHeader = text.slice(headerEnd);

  const nextMatch   = RE_SECTION_III.exec(afterHeader) ?? RE_SECTION_IV.exec(afterHeader);
  const nextStart   = nextMatch ? headerEnd + nextMatch.index : text.length;

  // Count grounds already in the Fundamentação body
  const fundBody    = text.slice(headerEnd, nextStart);
  const existing    = countGrounds(fundBody);

  const aiBlock     = buildAiArgumentBlock(argumentos, existing + 1);

  return text.slice(0, nextStart) + aiBlock + text.slice(nextStart);
}

// ─── Disclaimer injection ─────────────────────────────────────────────────────

function injectDisclaimer(text: string, aiEnhanced: boolean, generatedAt: string): string {
  const disclaimer = buildDisclaimer(aiEnhanced, generatedAt);
  const sigMatch   = RE_SIGNATURE.exec(text);

  return sigMatch
    ? text.slice(0, sigMatch.index) + disclaimer + "\n\n" + text.slice(sigMatch.index)
    : text + "\n\n" + disclaimer;
}

// ─── AI output validation ─────────────────────────────────────────────────────

/**
 * Minimum quality bar for AI output before we attempt to merge it.
 *
 * Rejects output that is structurally unusable so that the merge functions
 * never receive garbage input.  Returns a string describing the problem, or
 * null if the output is acceptable.
 */
function validateAiOutput(output: AiOutput): string | null {
  // texto_formal must be a non-trivial string if present
  if (output.texto_formal !== undefined) {
    const tf = output.texto_formal.trim();
    if (tf.length === 0) {
      return "texto_formal is empty after trim";
    }
    if (tf.length < 50) {
      return `texto_formal is suspiciously short (${tf.length} chars)`;
    }
    // Must contain at least some Portuguese legal vocabulary
    if (!/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(tf)) {
      return "texto_formal contains no Portuguese diacritic characters — likely garbled";
    }
  }

  // argumentos must be non-empty strings
  if (output.argumentos.length > 0) {
    const blanks = output.argumentos.filter((a) => !a.trim());
    if (blanks.length === output.argumentos.length) {
      return "all argumentos are blank";
    }
    // Reject implausibly short arguments (likely parsing artefacts)
    const tooShort = output.argumentos.filter((a) => a.trim().length < 15);
    if (tooShort.length === output.argumentos.length) {
      return "all argumentos are too short to be legal arguments";
    }
  }

  return null; // OK
}

/**
 * Strip any content that could break the document structure or PDF rendering.
 * Returns a cleaned copy — never mutates the original.
 */
function sanitiseAiOutput(output: AiOutput): AiOutput {
  return {
    caseStrength: output.caseStrength,

    texto_formal: output.texto_formal
      // Remove any accidental section headings the model might have emitted
      ?.replace(/^(I{1,3}V?|IV|VI{0,3}|X)\s*[—–-]/gim, "")
      // Collapse runs of 4+ blank lines
      .replace(/\n{4,}/g, "\n\n\n")
      .trim(),

    argumentos: output.argumentos
      .map((a) => a.trim())
      .filter((a) => a.length >= 15),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateFinalDocument
 *
 * Pure function. Returns a GeneratedDocument with:
 *   - text:                 complete document string ready for PDF
 *   - aiEnhanced:           true if texto_formal was used as override
 *   - aiArgumentsInjected:  count of argumentos appended (0 if override mode)
 *   - generatedAt:          ISO timestamp
 *   - aiFallbackUsed:       true if AI content was rejected and base template used
 *   - aiFallbackReason:     reason string when aiFallbackUsed is true
 */
export function generateFinalDocument({
  baseText,
  aiOutput,
}: GenerateDocumentInput): GeneratedDocument {
  const generatedAt    = new Date().toISOString();
  let   text           = baseText;
  let   aiEnhanced     = false;
  let   aiArgsInjected = 0;
  let   aiFallbackUsed = false;
  let   aiFallbackReason: string | undefined;

  // ── Apply AI enhancements ──────────────────────────────────────────────────

  if (aiOutput) {
    // 1. Validate content quality before attempting any merge
    const validationError = validateAiOutput(aiOutput);
    if (validationError) {
      logger.warn("generate-final-document", "AI_OUTPUT_VALIDATION_FAILED", { detail: validationError });
      aiFallbackUsed   = true;
      aiFallbackReason = `Validation: ${validationError}`;
    } else {
      // 2. Sanitise to prevent structure-breaking content
      const clean = sanitiseAiOutput(aiOutput);

      // 3. Attempt merge — any thrown error triggers fallback
      try {
        if (clean.texto_formal?.trim()) {
          // Override: replace Fundamentação section with AI-written text
          text       = replaceFundamentosSection(text, clean.texto_formal);
          aiEnhanced = true;
        } else if (clean.argumentos.length > 0) {
          // Append: inject numbered AI argument paragraphs
          text           = appendArgumentos(text, clean.argumentos);
          aiArgsInjected = clean.argumentos.length;
        } else {
          // Nothing to merge after sanitisation
          aiFallbackUsed   = true;
          aiFallbackReason = "No usable content after sanitisation";
        }
      } catch (mergeErr) {
        // Merge failed — recover to the original base text
        logger.error("generate-final-document", "AI_MERGE_FAILED_REVERTING", mergeErr);
        text             = baseText;
        aiEnhanced       = false;
        aiArgsInjected   = 0;
        aiFallbackUsed   = true;
        aiFallbackReason = mergeErr instanceof Error ? mergeErr.message : "Merge error";
      }
    }
  }

  // ── Inject disclaimer ─────────────────────────────────────────────────────

  text = injectDisclaimer(text, aiEnhanced, generatedAt);

  return {
    text,
    aiEnhanced,
    aiArgumentsInjected: aiArgsInjected,
    generatedAt,
    ...(aiFallbackUsed ? { aiFallbackUsed, aiFallbackReason } : {}),
  };
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

/**
 * One-shot helper for the API route.
 * Runs generateMinuta() + generateFinalDocument() in a single call.
 *
 * Throws `DocumentValidationError` when the authority/case checks fail —
 * that is intentional and must propagate to the route handler.
 *
 * @example
 * const doc = buildEnhancedDocument(formData, aiOutput);
 * const pdf = await generatePdfBuffer(doc.text, formData, documentId);
 */
export function buildEnhancedDocument(
  formData: WizardFormData,
  aiOutput?: AiOutput | null
): GeneratedDocument {
  // ── Pre-generation validation gate ────────────────────────────────────────
  // Resolve routing, then run all 4 named checks via validateDocument().
  // Any failure throws DocumentValidationError — no text is ever produced.

  const routing = routeAuthority(
    formData.fineEntity ?? "",
    formData.caseType   as Parameters<typeof routeAuthority>[1],
    {
      name:    formData.vehicleOwnerName,
      nif:     formData.vehicleOwnerNif,
      address: formData.vehicleOwnerAddress,
    },
  );

  const validation = validateDocument({
    routing,
    caseType:      formData.caseType as Parameters<typeof routeAuthority>[1],
    issuingEntity: formData.fineEntity ?? "",
    stage:         "administrative",
  });

  if (validation.blocked) {
    throw new DocumentValidationError(validation);
  }

  // ── All checks passed — generate document ─────────────────────────────────

  return generateFinalDocument({
    baseText: generateMinuta(formData),
    userData: formData,
    aiOutput,
  });
}

/**
 * Fault-tolerant variant of buildEnhancedDocument for the API route.
 *
 * Behaves identically to `buildEnhancedDocument` EXCEPT that if the AI
 * enhancement causes any failure (after the validation gate passes), it
 * automatically retries with `aiOutput = null` and marks the document with
 * `aiFallbackUsed = true`.
 *
 * `DocumentValidationError` always propagates — it is not an AI failure,
 * it is a data quality gate.
 *
 * @example
 * const doc = await buildEnhancedDocumentWithFallback(formData, aiOutput);
 * if (doc.aiFallbackUsed) {
 *   // inform user — document is still valid, just without AI
 * }
 */
export function buildEnhancedDocumentWithFallback(
  formData: WizardFormData,
  aiOutput?: AiOutput | null,
): GeneratedDocument {
  try {
    return buildEnhancedDocument(formData, aiOutput);
  } catch (err) {
    // DocumentValidationError is intentional — propagate it
    if (err instanceof DocumentValidationError) throw err;

    // Anything else is unexpected; log and retry without AI
    logger.error("build-enhanced-document", "UNEXPECTED_ERROR_RETRYING_WITHOUT_AI", err);

    const baseDoc = buildEnhancedDocument(formData, null);
    return {
      ...baseDoc,
      aiFallbackUsed:   true,
      aiFallbackReason: err instanceof Error ? err.message : String(err),
    };
  }
}
