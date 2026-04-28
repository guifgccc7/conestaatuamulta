/**
 * validate-routing.ts
 *
 * Strict pre-generation gate. Runs BEFORE generateMinuta() produces any text.
 * If any check fails the document is blocked — no partial output is produced.
 *
 * Checks (in order):
 *  1. No uncertain authority        — isUncertain must be false
 *  2. No placeholder in authority   — authority must not contain [ ]
 *  3. Opening contains authority    — opening_template must name the authority
 *  4. Closing matches document type — closing keywords must align with doc type
 *  5. CE case → ANSR-compatible     — speeding/mobile/seatbelt/traffic_light
 *                                     can only go to ANSR, PSP or GNR
 *  6. Document type is valid        — only known values accepted
 */

import type { AuthorityRouting, CaseType, DocumentType } from "./authority-router";

// ─── Error codes ───────────────────────────────────────────────────────────────

export type ValidationErrorCode =
  | "UNCERTAIN_AUTHORITY"          // isUncertain = true
  | "PLACEHOLDER_AUTHORITY"        // authority contains [ ]
  | "OPENING_AUTHORITY_MISMATCH"   // opening_template does not name the authority
  | "CLOSING_TYPE_MISMATCH"        // closing_template does not match document_type
  | "CE_WRONG_AUTHORITY"           // CE infraction not routed to ANSR-compatible entity
  | "INVALID_DOCUMENT_TYPE"        // document_type is not a recognised value
  | "MISSING_AUTHORITY_CODE";      // authority_code is empty or UNKNOWN on a known case

export interface ValidationError {
  code:    ValidationErrorCode;
  message: string;
  field?:  string;
}

export interface ValidationResult {
  valid:    boolean;
  errors:   ValidationError[];
}

// ─── Sentinel strings in closings ─────────────────────────────────────────────
// These substrings uniquely identify each closing template.

const CLOSING_ADMIN_SENTINEL   = "arquivamento do processo contra-ordenacional";
const CLOSING_JUDICIAL_SENTINEL = "recurso de impugnação judicial";

// ─── CE case types ─────────────────────────────────────────────────────────────

const CE_CASE_TYPES = new Set<CaseType>([
  "SPEEDING", "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT",
]);

const CE_VALID_AUTHORITY_CODES = new Set(["ANSR", "PSP", "GNR"]);

const KNOWN_DOCUMENT_TYPES = new Set<DocumentType>([
  "defesa_administrativa",
  "recurso_judicial",
]);

// ─── Authority keyword map ─────────────────────────────────────────────────────
// Each code → list of strings that MUST appear in the opening_template.

const AUTHORITY_KEYWORDS: Record<string, string[]> = {
  ANSR:     ["ANSR", "Autoridade Nacional de Segurança Rodoviária"],
  EMEL:     ["EMEL"],
  SMTUC:    ["SMTUC"],
  IMT:      ["IMT"],
  PSP:      ["PSP", "Polícia de Segurança Pública"],
  GNR:      ["GNR", "Guarda Nacional Republicana"],
  CM:       ["Câmara Municipal", "Camara Municipal"],
  PM:       ["Câmara Municipal", "Polícia Municipal", "Camara Municipal"],
  CONCESS:  [],  // uncertain by design — validated by Rule 1 instead
  TRIBUNAL: ["Tribunal"],
  UNKNOWN:  [],  // always blocked by Rule 1
};

// ─── Validator ─────────────────────────────────────────────────────────────────

export function validateRouting(
  routing:  AuthorityRouting,
  caseType: CaseType,
): ValidationResult {
  const errors: ValidationError[] = [];

  // ── Rule 1: Uncertain authority — block immediately ────────────────────────
  if (routing.isUncertain) {
    errors.push({
      code:    "UNCERTAIN_AUTHORITY",
      field:   "authority",
      message:
        "A entidade autuante não foi identificada com segurança. " +
        "Não é possível gerar o documento sem confirmar o destinatário correto. " +
        (routing.clarificationQuestion ?? "Verifica a notificação recebida."),
    });
    // No point running further checks on an uncertain routing
    return { valid: false, errors };
  }

  // ── Rule 2: No placeholder brackets in the authority name ─────────────────
  if (/\[/.test(routing.authority)) {
    errors.push({
      code:    "PLACEHOLDER_AUTHORITY",
      field:   "authority",
      message:
        `A entidade autuante contém um marcador não preenchido: "${routing.authority}". ` +
        "Substitui pelo nome correto da entidade antes de gerar o documento.",
    });
  }

  // ── Rule 3: Opening template must contain authority identifier ─────────────
  const requiredKeywords = AUTHORITY_KEYWORDS[routing.authority_code] ?? [];
  if (requiredKeywords.length > 0) {
    const openingLower = routing.opening_template.toLowerCase();
    const found = requiredKeywords.some((kw) =>
      openingLower.includes(kw.toLowerCase())
    );
    if (!found) {
      errors.push({
        code:    "OPENING_AUTHORITY_MISMATCH",
        field:   "opening_template",
        message:
          `O cabeçalho do documento não identifica corretamente a entidade "${routing.authority}". ` +
          `Esperado um de: ${requiredKeywords.join(" / ")}. ` +
          "O documento não pode ser gerado com um cabeçalho inconsistente.",
      });
    }
  }

  // ── Rule 4: Closing must match document type ───────────────────────────────
  if (!KNOWN_DOCUMENT_TYPES.has(routing.document_type)) {
    errors.push({
      code:    "INVALID_DOCUMENT_TYPE",
      field:   "document_type",
      message: `Tipo de documento desconhecido: "${routing.document_type}".`,
    });
  } else {
    const closingLower = routing.closing_template.toLowerCase();

    if (
      routing.document_type === "defesa_administrativa" &&
      !closingLower.includes(CLOSING_ADMIN_SENTINEL.toLowerCase())
    ) {
      errors.push({
        code:    "CLOSING_TYPE_MISMATCH",
        field:   "closing_template",
        message:
          "O fecho do documento não corresponde a uma impugnação administrativa. " +
          "Tipo declarado: defesa_administrativa. " +
          "Verifica se foi usado o fecho correto (CLOSING_ADMIN).",
      });
    }

    if (
      routing.document_type === "recurso_judicial" &&
      !closingLower.includes(CLOSING_JUDICIAL_SENTINEL.toLowerCase())
    ) {
      errors.push({
        code:    "CLOSING_TYPE_MISMATCH",
        field:   "closing_template",
        message:
          "O fecho do documento não corresponde a um recurso de impugnação judicial. " +
          "Tipo declarado: recurso_judicial. " +
          "Verifica se foi usado o fecho correto (CLOSING_JUDICIAL).",
      });
    }
  }

  // ── Rule 5: CE infractions → ANSR-compatible authority ────────────────────
  if (CE_CASE_TYPES.has(caseType) && !CE_VALID_AUTHORITY_CODES.has(routing.authority_code)) {
    errors.push({
      code:    "CE_WRONG_AUTHORITY",
      field:   "authority_code",
      message:
        `Infrações do Código da Estrada (tipo: ${caseType}) devem ser dirigidas à ANSR, ` +
        `PSP ou GNR — não a "${routing.authority}" (código: ${routing.authority_code}). ` +
        "A geração foi bloqueada para evitar o envio para uma entidade incompetente.",
    });
  }

  // ── Rule 6: UNKNOWN authority_code on a known case ────────────────────────
  if (routing.authority_code === "UNKNOWN") {
    // Already caught by Rule 1 (isUncertain), but guard here too for safety
    errors.push({
      code:    "MISSING_AUTHORITY_CODE",
      field:   "authority_code",
      message:
        "A entidade autuante não foi reconhecida (código UNKNOWN). " +
        "Não é seguro gerar um documento sem saber a quem é dirigido.",
    });
  }

  return { valid: errors.length === 0, errors };
}

// ─── Typed error class ─────────────────────────────────────────────────────────

/**
 * Thrown by buildEnhancedDocument when validateRouting returns valid = false.
 * Carry the full ValidationResult so the API route can return structured errors.
 */
export class RoutingValidationError extends Error {
  readonly result: ValidationResult;

  constructor(result: ValidationResult) {
    const summary = result.errors.map((e) => e.message).join(" | ");
    super(`[RoutingValidationError] ${summary}`);
    this.name   = "RoutingValidationError";
    this.result = result;
  }
}
