/**
 * Shared types for the AI-enhanced document generation pipeline.
 *
 * Data flow:
 *   WizardState ──► generateMinuta() ──► base text
 *   AI chat      ──► AiOutput        ──┐
 *                                      ▼
 *                              generateFinalDocument()
 *                                      │
 *                                      ▼
 *                             enhanced text ──► generatePdfBuffer()
 */

import { WizardFormData } from "@/types";

// ─── AI assistant output ──────────────────────────────────────────────────────

/**
 * Structured output returned by the AI assistant after analysing a case.
 * Both fields are optional — the function degrades gracefully if the AI
 * produces partial output or if the user skips the AI step entirely.
 */
export interface AiOutput {
  /**
   * Short argument summaries to append / inject into the "Fundamentação" section.
   * Each string should be 1–3 sentences, already in legal Portuguese.
   * Example: "A ausência de fotografias do veículo em infração constitui falta de
   * prova objectiva suficiente para sustentar a condenação..."
   */
  argumentos: string[];

  /**
   * Full AI-rewritten text for the "II — FUNDAMENTOS DA IMPUGNAÇÃO" section.
   * When present, this OVERRIDES the template-generated section entirely.
   * When absent, the template section is kept and `argumentos` are appended.
   */
  texto_formal?: string;

  /**
   * The strength label surfaced by the AI ("forte" | "moderado" | "fraco").
   * Used only for UI display in Step 6 — does NOT affect document text.
   */
  caseStrength?: "forte" | "moderado" | "fraco";
}

// ─── Document generation output ───────────────────────────────────────────────

export interface GeneratedDocument {
  /** Complete document text, ready to render to PDF. */
  text: string;

  /**
   * True if the AI's texto_formal replaced the template fundamentação section.
   * False if only argumentos were appended (or no AI output was used).
   */
  aiEnhanced: boolean;

  /**
   * Number of AI argument paragraphs that were injected.
   * 0 if texto_formal override was used or no AI output provided.
   */
  aiArgumentsInjected: number;

  /** ISO timestamp of generation — written into document footer. */
  generatedAt: string;

  /**
   * True when the AI enhancement could not be applied and the system
   * automatically fell back to the standard template.
   * Always false when aiOutput was null/undefined to begin with.
   */
  aiFallbackUsed?: boolean;

  /**
   * Human-readable reason for the fallback (for logging / UI display).
   * Only present when aiFallbackUsed === true.
   */
  aiFallbackReason?: string;
}

// ─── Input shape ──────────────────────────────────────────────────────────────

export interface GenerateDocumentInput {
  /** Raw text produced by generateMinuta() — the base template. */
  baseText: string;

  /** Structured user data — used only for placeholder injection on .txt templates. */
  userData: WizardFormData;

  /**
   * AI output to merge into the document.
   * Pass `null` or omit to generate the document without AI enhancement.
   */
  aiOutput?: AiOutput | null;
}
