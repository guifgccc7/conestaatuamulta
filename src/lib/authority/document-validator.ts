/**
 * document-validator.ts
 *
 * Unified pre-generation validation gate.
 *
 * Runs four explicit checks before any document text is produced:
 *
 *   CHECK 1 — Authority matches case type
 *             The routing authority must agree with what the resolution engine
 *             independently computes for the same case type.
 *
 *   CHECK 2 — Document type is correct
 *             The routing document_type must match the canonical type returned
 *             by the resolution engine for this case type + stage.
 *
 *   CHECK 3 — Opening matches authority
 *             The opening_template string must contain identifying keywords
 *             for the declared authority. No generic salutations allowed.
 *
 *   CHECK 4 — Closing matches authority
 *             The closing_template must carry the sentinel phrase that
 *             corresponds to the declared document_type.
 *
 * ALL four checks run in every call.
 * ANY failure sets blocked = true.
 * If blocked, the caller MUST NOT generate the document.
 */

import {
  resolveAuthority,
  requiresClarification,
  type ResolutionInput,
  type ResolutionOutput,
  type CaseTypeInput,
  type ResolvedDocumentType,
} from "./resolution-engine";

import type { AuthorityRouting, CaseType, DocumentType } from "./authority-router";

// ─── Result types ──────────────────────────────────────────────────────────────

export type CheckName =
  | "CONFIDENCE_GATE"              // pre-flight — fires before all other checks
  | "AUTHORITY_MATCHES_CASE_TYPE"
  | "DOCUMENT_TYPE_IS_CORRECT"
  | "OPENING_MATCHES_AUTHORITY"
  | "CLOSING_MATCHES_AUTHORITY";

export interface CheckResult {
  /** Which of the four mandatory checks this is. */
  check:      CheckName;
  /** Human-readable label for UI display. */
  label:      string;
  /** Whether this check passed. */
  passed:     boolean;
  /** Populated only when passed = false. */
  error?:     string;
  /** The field that caused the failure. */
  field?:     string;
  /** Expected value (for debugging). */
  expected?:  string;
  /** Actual value found (for debugging). */
  actual?:    string;
}

export interface DocumentValidationResult {
  /** True when at least one check failed. Document MUST NOT be generated. */
  blocked:     boolean;
  /** All four checks, always populated regardless of outcome. */
  checks:      CheckResult[];
  /** Messages from failed checks only — empty when blocked = false. */
  errors:      string[];
  /** One-line summary suitable for server logging. */
  summary:     string;
  /**
   * When blocked due to uncertain authority, the question to ask the user.
   * Undefined when block reason is something else.
   */
  clarification_needed?: string;
}

// ─── Canonical uncertainty message ────────────────────────────────────────────

/**
 * The one canonical message returned whenever the system cannot determine the
 * competent authority with HIGH confidence.
 *
 * ⚠  This string is the contract between the validation layer and the UI.
 *    Do NOT paraphrase it. Any change here must be reflected in the frontend.
 *    Import this constant wherever the message must be displayed — never
 *    hard-code the string in a separate location.
 */
export const UNCERTAIN_AUTHORITY_MESSAGE =
  "Não foi possível determinar a entidade competente. Verifique os dados." as const;

// ─── Internal constants ────────────────────────────────────────────────────────

/**
 * Sentinel substrings that uniquely identify each closing template.
 * Must match the CLOSING_ADMIN / CLOSING_JUDICIAL constants in authority-router.ts.
 */
const CLOSING_SENTINELS: Record<DocumentType | ResolvedDocumentType, string> = {
  defesa_administrativa: "arquivamento do processo contra-ordenacional",
  recurso_judicial:      "recurso de impugnação judicial",
  impugnacao_judicial:   "impugnação judicial",      // used in parking-specific closings
};

/**
 * Keywords that MUST appear in opening_template for each authority code.
 * At least ONE keyword from the list must be present (case-insensitive).
 */
const OPENING_KEYWORDS: Record<string, readonly string[]> = {
  ANSR:     ["ANSR", "Autoridade Nacional de Segurança Rodoviária"],
  EMEL:     ["EMEL"],
  SMTUC:    ["SMTUC"],
  IMT:      ["IMT"],
  PSP:      ["PSP", "Polícia de Segurança Pública"],
  GNR:      ["GNR", "Guarda Nacional Republicana"],
  CM:       ["Câmara Municipal", "Camara Municipal"],
  PM:       ["Câmara Municipal", "Polícia Municipal"],
  TRIBUNAL: ["Tribunal"],
  // UNKNOWN / CONCESS have no keywords — blocked earlier by Check 1
};

/**
 * Maps routing engine authority codes to resolution engine authority codes.
 * Used by Check 1 to cross-validate the two systems.
 */
const AUTHORITY_CODE_EQUIVALENCE: Record<string, string[]> = {
  ANSR:     ["ANSR"],
  PSP:      ["PSP"],
  GNR:      ["GNR"],
  EMEL:     ["EMEL"],
  SMTUC:    ["SMTUC"],
  EMT:      ["EMT"],
  IMT:      ["IMT"],
  CM:       ["CM", "CAMARA_MUNICIPAL"],
  PM:       ["PM", "POLICIA_MUNICIPAL"],
  TRIBUNAL: ["TRIBUNAL"],
};

/**
 * Maps routing DocumentType to resolution engine ResolvedDocumentType.
 * Both use overlapping but slightly different taxonomies.
 */
const DOC_TYPE_EQUIVALENCE: Record<DocumentType, ResolvedDocumentType[]> = {
  defesa_administrativa: ["defesa_administrativa"],
  recurso_judicial:      ["recurso_judicial", "impugnacao_judicial"],
};

/**
 * Maps wizard CaseType to resolution engine CaseTypeInput.
 */
const CASE_TYPE_MAP: Partial<Record<CaseType, CaseTypeInput>> = {
  SPEEDING:      "speeding",
  PARKING:       "parking",
  MOBILE_PHONE:  "mobile_phone",
  SEATBELT:      "seatbelt",
  TRAFFIC_LIGHT: "traffic_light",
  ADMIN_ERROR:   "admin_error",
  OTHER:         "other",
};

// ─── Pre-flight confidence gate ────────────────────────────────────────────────

/**
 * checkConfidenceGate
 *
 * Runs BEFORE any of the four named checks.
 * This rule overrides all others — if it fails, no other check runs.
 *
 * Fails when EITHER:
 *   a) The resolution engine returned confidence = "low"
 *      (case_type and/or entity are ambiguous — comarca unknown, entity unclear, etc.)
 *   b) The routing layer marked isUncertain = true
 *      (entity string could not be matched to a known authority)
 *
 * On failure, returns exactly UNCERTAIN_AUTHORITY_MESSAGE.
 * No additional detail is exposed — the system must not guess.
 */
function checkConfidenceGate(
  routing:    AuthorityRouting,
  resolution: ResolutionOutput,
): CheckResult {
  const check: CheckName = "CONFIDENCE_GATE";
  const label             = "Determinação da entidade competente com segurança";

  const lowConfidence  = requiresClarification(resolution);
  const uncertainRoute = routing.isUncertain || routing.authority_code === "UNKNOWN";

  if (lowConfidence || uncertainRoute) {
    return {
      check,
      label,
      passed:   false,
      field:    "authority",
      error:    UNCERTAIN_AUTHORITY_MESSAGE,
      expected: "Entidade determinada com confiança HIGH pelo motor de resolução",
      actual:   lowConfidence
        ? `confidence=${resolution.confidence} — ${resolution.clarification_needed ?? "ver clarification_needed"}`
        : `isUncertain=${routing.isUncertain}, authority_code=${routing.authority_code}`,
    };
  }

  return { check, label, passed: true };
}

// ─── Individual check functions ────────────────────────────────────────────────

function checkAuthorityMatchesCaseType(
  routing:    AuthorityRouting,
  resolution: ResolutionOutput,
): CheckResult {
  const check: CheckName  = "AUTHORITY_MATCHES_CASE_TYPE";
  const label              = "Entidade autuante corresponde ao tipo de infração";

  // If resolution engine itself is uncertain, the routing cannot be validated
  if (requiresClarification(resolution)) {
    return {
      check, label, passed: false, field: "authority",
      expected: "Entidade determinada pelo tipo de infração",
      actual:   routing.authority,
      error:
        "O tipo de infração não permite determinar a entidade com segurança. " +
        (resolution.clarification_needed ?? "Fornece mais detalhes sobre o caso."),
    };
  }

  const equivalentCodes = AUTHORITY_CODE_EQUIVALENCE[routing.authority_code] ?? [];
  const matches = equivalentCodes.includes(resolution.authority_code);

  if (!matches) {
    return {
      check, label, passed: false, field: "authority_code",
      expected: `${resolution.authority_code} (${resolution.final_authority})`,
      actual:   `${routing.authority_code} (${routing.authority})`,
      error:
        `Inconsistência de entidade: o tipo de infração exige "${resolution.final_authority}" ` +
        `mas o documento está a ser dirigido a "${routing.authority}". ` +
        `Razão: ${resolution.reasoning}`,
    };
  }

  return { check, label, passed: true };
}

function checkDocumentTypeIsCorrect(
  routing:    AuthorityRouting,
  resolution: ResolutionOutput,
): CheckResult {
  const check: CheckName = "DOCUMENT_TYPE_IS_CORRECT";
  const label             = "Tipo de documento correto para a fase processual";

  const acceptableTypes = DOC_TYPE_EQUIVALENCE[routing.document_type] ?? [];
  const matches = acceptableTypes.includes(resolution.document_type);

  if (!matches) {
    return {
      check, label, passed: false, field: "document_type",
      expected: resolution.document_type,
      actual:   routing.document_type,
      error:
        `Tipo de documento incorreto: esperado "${resolution.document_type}" ` +
        `para este caso, mas o documento declara "${routing.document_type}". ` +
        "Um documento com tipo errado pode ser rejeitado pela entidade destinatária.",
    };
  }

  return { check, label, passed: true };
}

function checkOpeningMatchesAuthority(routing: AuthorityRouting): CheckResult {
  const check: CheckName = "OPENING_MATCHES_AUTHORITY";
  const label             = "Cabeçalho identifica corretamente a entidade destinatária";

  // Uncertain routing: no keywords to check — already blocked by Check 1
  if (routing.isUncertain || routing.authority_code === "UNKNOWN") {
    return {
      check, label, passed: false, field: "opening_template",
      error:
        "O cabeçalho não pode ser validado porque a entidade autuante é incerta. " +
        "Confirma a entidade antes de gerar o documento.",
    };
  }

  // Authority name contains a placeholder
  if (/\[/.test(routing.authority)) {
    return {
      check, label, passed: false, field: "opening_template",
      expected: "Nome completo da entidade",
      actual:   routing.authority,
      error:
        `O cabeçalho contém um marcador não preenchido: "${routing.authority}". ` +
        "Substitui pelo nome correto da entidade antes de gerar o documento.",
    };
  }

  const keywords = OPENING_KEYWORDS[routing.authority_code];

  // Authority code has no keyword requirements (e.g. CONCESS) — skip
  if (!keywords || keywords.length === 0) {
    return { check, label, passed: true };
  }

  const openingLower = routing.opening_template.toLowerCase();
  const found        = keywords.some((kw) => openingLower.includes(kw.toLowerCase()));

  if (!found) {
    return {
      check, label, passed: false, field: "opening_template",
      expected: `Um de: ${keywords.join(" / ")}`,
      actual:   routing.opening_template.slice(0, 120) + "…",
      error:
        `O cabeçalho não identifica corretamente "${routing.authority}". ` +
        `Deve conter pelo menos um de: ${keywords.join(", ")}. ` +
        "Documento bloqueado para evitar envio para entidade errada.",
    };
  }

  return { check, label, passed: true };
}

function checkClosingMatchesAuthority(routing: AuthorityRouting): CheckResult {
  const check: CheckName = "CLOSING_MATCHES_AUTHORITY";
  const label             = "Fecho do documento corresponde ao tipo de documento";

  const sentinel     = CLOSING_SENTINELS[routing.document_type];
  const closingLower = routing.closing_template.toLowerCase();

  if (!sentinel) {
    return {
      check, label, passed: false, field: "closing_template",
      error: `Tipo de documento desconhecido: "${routing.document_type}". Nenhum fecho validado.`,
    };
  }

  if (!closingLower.includes(sentinel.toLowerCase())) {
    return {
      check, label, passed: false, field: "closing_template",
      expected: `Fecho contendo: "${sentinel}"`,
      actual:   routing.closing_template.slice(-200),
      error:
        `O fecho do documento não corresponde ao tipo "${routing.document_type}". ` +
        `Esperado o marcador: "${sentinel}". ` +
        "Documento bloqueado: fecho inconsistente com o tipo de documento declarado.",
    };
  }

  return { check, label, passed: true };
}

// ─── Main validator ────────────────────────────────────────────────────────────

export interface ValidateDocumentParams {
  routing:       AuthorityRouting;
  caseType:      CaseType;
  issuingEntity: string;
  /** "administrative" (default) or "judicial" for second-phase documents. */
  stage?:        "administrative" | "judicial";
}

/**
 * validateDocument
 *
 * ── Execution model ──────────────────────────────────────────────────────────
 *
 * STEP 0 — Confidence gate (overrides all other rules)
 *   Resolves the canonical authority via the deterministic resolution engine.
 *   If confidence is NOT "high", OR if the routing layer is uncertain:
 *     → Immediately return blocked = true with UNCERTAIN_AUTHORITY_MESSAGE.
 *     → The four named checks are NEVER run.
 *     → No partial output is produced.
 *
 * STEP 1–4 — Named checks (only when gate passes)
 *   All four checks run without further short-circuiting so the caller
 *   always sees the complete picture when the authority is known.
 *
 * @throws never — errors are returned in the result, not thrown
 */
export function validateDocument({
  routing,
  caseType,
  issuingEntity,
  stage = "administrative",
}: ValidateDocumentParams): DocumentValidationResult {

  // ── STEP 0: Resolve and gate on confidence ───────────────────────────────────
  const resolutionInput: ResolutionInput = {
    case_type:      CASE_TYPE_MAP[caseType] ?? "other",
    issuing_entity: issuingEntity,
    stage,
  };
  const resolution  = resolveAuthority(resolutionInput);
  const gateResult  = checkConfidenceGate(routing, resolution);

  // ── HARD STOP — this rule overrides all others ───────────────────────────────
  if (!gateResult.passed) {
    return {
      blocked: true,
      checks:  [gateResult],
      errors:  [UNCERTAIN_AUTHORITY_MESSAGE],
      summary: `[BLOCKED] CONFIDENCE_GATE failed — document generation stopped.`,
      clarification_needed: resolution.clarification_needed,
    };
  }

  // ── STEP 1–4: Run all four named checks (no further short-circuit) ────────────
  const namedChecks: CheckResult[] = [
    checkAuthorityMatchesCaseType(routing, resolution),
    checkDocumentTypeIsCorrect(routing, resolution),
    checkOpeningMatchesAuthority(routing),
    checkClosingMatchesAuthority(routing),
  ];

  const allChecks = [gateResult, ...namedChecks];
  const failed    = namedChecks.filter((c) => !c.passed);
  const blocked   = failed.length > 0;
  const errors    = failed.map((c) => c.error!);

  const summary = blocked
    ? `[BLOCKED] ${failed.length}/4 checks failed: ${failed.map((c) => c.check).join(", ")}`
    : "[PASSED] Confidence gate + all 4 pre-generation checks passed.";

  return {
    blocked,
    checks: allChecks,
    errors,
    summary,
    clarification_needed: undefined, // gate passed — no clarification needed
  };
}

// ─── Typed error class ─────────────────────────────────────────────────────────

/**
 * Thrown by the generation pipeline when validateDocument returns blocked = true.
 * Carries the full DocumentValidationResult for structured API responses.
 */
export class DocumentValidationError extends Error {
  readonly result: DocumentValidationResult;

  constructor(result: DocumentValidationResult) {
    super(result.summary);
    this.name   = "DocumentValidationError";
    this.result = result;
  }
}

// ─── Convenience re-export for the API route ───────────────────────────────────

export { requiresClarification };
