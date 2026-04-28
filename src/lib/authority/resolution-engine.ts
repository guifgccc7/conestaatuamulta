/**
 * resolution-engine.ts
 *
 * Fully deterministic authority resolution for Portuguese traffic fines.
 *
 * PRIMARY signal:   case_type  — the nature of the infraction
 * SECONDARY signal: stage      — phase of the proceedings
 * TERTIARY signal:  issuing_entity — used only to disambiguate within "other"
 *
 * Rule: issuing_entity is NEVER the sole determinant of the final authority.
 * If case_type is unambiguous, entity is ignored for routing purposes.
 *
 * Legal framework:
 *   - RGCO (DL 433/82)          — arts. 50.º, 59.º, 62.º — procedure
 *   - CE (DL 114/94 e alt.)     — road traffic infractions
 *   - DL 50/2022                — municipal competence transfer
 *   - Portaria 1504/2008        — speed-measurement devices
 */

// ─── Input types ───────────────────────────────────────────────────────────────

/** Normalised case category. */
export type CaseTypeInput =
  | "speeding"     // CE art. 24.º — excesso de velocidade
  | "parking"      // CE art. 48.º / regulamentos municipais — estacionamento
  | "mobile_phone" // CE art. 84.º — telemóvel ao volante
  | "seatbelt"     // CE art. 82.º — cinto de segurança
  | "traffic_light"// CE art. 69.º — semáforo vermelho
  | "admin_error"  // erro formal no auto — matrícula, data, local
  | "other";       // infração não classificada

/** Phase of the proceedings. */
export type StageInput = "administrative" | "judicial";

/** Raw string from user input — deliberately loose, normalised internally. */
export type IssuingEntityRaw = string;

/** Output confidence level. */
export type Confidence = "high" | "low";

/** Canonical document types produced by this engine. */
export type ResolvedDocumentType =
  | "defesa_administrativa"  // art. 50.º / 59.º RGCO — first-phase administrative
  | "impugnacao_judicial"    // art. 59.º RGCO — judicial challenge (parking / municipal)
  | "recurso_judicial";      // art. 62.º RGCO — appeal after administrative rejection

// ─── IO contracts ──────────────────────────────────────────────────────────────

export interface ResolutionInput {
  case_type:       CaseTypeInput;
  issuing_entity:  IssuingEntityRaw;
  stage:           StageInput;
}

export interface ResolutionOutput {
  /** Full name of the receiving authority. Never a guess; placeholder if unknown. */
  final_authority:   string;
  /** Canonical document type. */
  document_type:     ResolvedDocumentType;
  /** HIGH = unambiguous mapping; LOW = additional info needed. */
  confidence:        Confidence;
  /** Short internal code for programmatic use. */
  authority_code:    string;
  /** Primary legal articles that justify this routing. */
  legal_basis:       string;
  /** Human-readable explanation of the decision path taken. */
  reasoning:         string;
  /** Non-blocking advisory messages. Never empty strings. */
  warnings:          string[];
  /**
   * Only set when confidence = "low".
   * Contains the specific question needed to raise confidence to "high".
   */
  clarification_needed?: string;
}

// ─── Internal entity normaliser ────────────────────────────────────────────────

type KnownEntity =
  | "PSP" | "GNR" | "ANSR"
  | "EMEL" | "SMTUC" | "EMT"
  | "POLICIA_MUNICIPAL" | "CAMARA_MUNICIPAL"
  | "IMT" | "UNKNOWN";

/**
 * Entity recognition map for the resolution engine.
 *
 * Ordering rules:
 *   1. Specific full names before abbreviations — avoids "PSP" inside
 *      "ANSR-FAKE-PSP" shadowing the intended ANSR match.
 *   2. ANSR before PSP/GNR — ANSR is the processing authority; police forces
 *      are autuating agents. If both tokens appear, ANSR wins.
 *   3. Longer / more specific municipal names before bare abbreviations.
 *   4. Bare /\bpm\b/ is intentionally ABSENT — \bpm\b matches too broadly
 *      (e.g. "rpm", "8pm"). Use full name match only for POLICIA_MUNICIPAL.
 */
const ENTITY_MAP: Array<{ patterns: RegExp[]; key: KnownEntity }> = [
  // ── Specific authority names first (most specific) ─────────────────────────
  { patterns: [/autoridade nacional de seguran[cç]a rodovi[aá]ria/i, /\bansr\b/i],           key: "ANSR"             },
  { patterns: [/empresa municipal de mobilidade/i, /\bemel\b/i],                              key: "EMEL"             },
  { patterns: [/servi[cç]os municipalizados.*coimbra/i, /\bsmtuc\b/i],                       key: "SMTUC"            },
  { patterns: [/empresa municipal de transportes/i, /\bemt\b/i],                              key: "EMT"              },
  { patterns: [/instituto da mobilidade/i, /\bimt\b/i],                                       key: "IMT"              },
  // ── Police forces — after named authorities ────────────────────────────────
  // Full name patterns handle dotted forms: the normaliser strips dots before testing.
  { patterns: [/pol[ií]cia de seguran[cç]a p[uú]blica/i, /\bpsp\b/i],                       key: "PSP"              },
  { patterns: [/guarda nacional republicana/i, /\bgnr\b/i],                                   key: "GNR"              },
  // ── Municipal — after police ──────────────────────────────────────────────
  { patterns: [/pol[ií]cia municipal/i, /\bpm de\b/i, /\bpm do\b/i],                          key: "POLICIA_MUNICIPAL" },
  { patterns: [/c[aâ]mara municipal/i, /\bcm\b/i, /munic[ií]p(io|alidade)/i, /^municipality$/i], key: "CAMARA_MUNICIPAL" },
];

function normaliseEntity(raw: IssuingEntityRaw): KnownEntity {
  if (!raw?.trim()) return "UNKNOWN";

  // Strip dots from abbreviations before testing: G.N.R. → GNR, P.S.P. → PSP
  const dedotted = raw.trim().replace(/\b([A-ZÀ-Ú])\.(?=[A-ZÀ-Ú]\.?)/g, "$1");

  for (const { patterns, key } of ENTITY_MAP) {
    if (patterns.some((re) => re.test(dedotted))) return key;
  }
  return "UNKNOWN";
}

// ─── Case-type groups ──────────────────────────────────────────────────────────

/** CE infractions that always route to ANSR in the administrative phase. */
const CE_TRAFFIC_TYPES = new Set<CaseTypeInput>([
  "speeding", "mobile_phone", "seatbelt", "traffic_light",
]);

/** Entities that are ANSR-compatible processors for CE infractions. */
const CE_COMPATIBLE_ENTITIES = new Set<KnownEntity>(["PSP", "GNR", "ANSR"]);

// ─── Resolution tables ─────────────────────────────────────────────────────────

/**
 * Resolves CE traffic infractions.
 * Rule: ALWAYS ANSR in administrative phase.
 *       Tribunal in judicial phase.
 *       issuing_entity is logged in reasoning but never changes the outcome.
 */
function resolveCETraffic(
  caseType: CaseTypeInput,
  stage:    StageInput,
  entity:   KnownEntity,
): ResolutionOutput {
  const warnings: string[] = [];

  if (!CE_COMPATIBLE_ENTITIES.has(entity) && entity !== "UNKNOWN") {
    warnings.push(
      `A entidade autuante "${entity}" não é a processadora habitual de infrações CE. ` +
      "A resolução é determinada pelo tipo de infração, não pela entidade.",
    );
  }

  if (entity === "UNKNOWN") {
    warnings.push(
      "Entidade autuante não reconhecida. " +
      "O encaminhamento baseia-se exclusivamente no tipo de infração.",
    );
  }

  if (stage === "administrative") {
    return {
      final_authority: "Autoridade Nacional de Segurança Rodoviária (ANSR)",
      document_type:   "defesa_administrativa",
      confidence:      "high",
      authority_code:  "ANSR",
      legal_basis:     "Arts. 59.º e ss. do DL 433/82 (RGCO); art. 24.º e ss. do CE",
      reasoning:
        `Infração do Código da Estrada (${caseType}). ` +
        `Fase administrativa: a impugnação é sempre dirigida à ANSR, ` +
        `independentemente da força policial autuante (${entity}).`,
      warnings,
    };
  }

  // stage === "judicial"
  return {
    final_authority:      "Tribunal Judicial da Comarca competente",
    document_type:        "recurso_judicial",
    confidence:           "low",
    authority_code:       "TRIBUNAL",
    legal_basis:          "Art. 62.º do DL 433/82 (RGCO)",
    reasoning:
      `Infração CE (${caseType}) — fase judicial após indeferimento pela ANSR. ` +
      "O tribunal competente é o da comarca do local da infração, que não foi fornecida.",
    warnings: [
      ...warnings,
      "Fase judicial: o tribunal específico depende da comarca do local da infração. " +
      "Confirma a secção de trânsito/criminal do Tribunal Judicial competente.",
    ],
    clarification_needed:
      "Qual é o município ou comarca onde ocorreu a infração? " +
      "Necessário para identificar o tribunal competente.",
  };
}

/**
 * Resolves parking infractions.
 *
 * Administrative stage: contestation goes to the issuing entity directly.
 *   - Known entity → HIGH confidence, defesa_administrativa.
 *   - Unknown entity → LOW confidence (cannot determine recipient).
 *
 * Judicial stage (after administrative rejection): always Tribunal Judicial.
 *   → LOW confidence until comarca is known.
 */
function resolveParking(
  stage:  StageInput,
  entity: KnownEntity,
): ResolutionOutput {
  const warnings: string[] = [];

  // ── Administrative stage with known entity ──────────────────────────────────
  // The contestation is sent to the entity that issued the fine, not the tribunal.
  if (stage === "administrative") {
    // Map known entities to their authority descriptor for the resolution output
    const PARKING_ENTITY_MAP: Partial<Record<KnownEntity, { authority: string; code: string }>> = {
      EMEL:              { authority: "EMEL — Empresa Municipal de Mobilidade e Estacionamento de Lisboa, E.M., S.A.", code: "EMEL"              },
      SMTUC:             { authority: "SMTUC — Serviços Municipalizados de Transportes Urbanos de Coimbra",           code: "SMTUC"             },
      EMT:               { authority: "EMT — Empresa Municipal de Transportes",                                        code: "EMT"               },
      CAMARA_MUNICIPAL:  { authority: "Câmara Municipal competente — Serviço de Contra-Ordenações",                   code: "CAMARA_MUNICIPAL"  },
      POLICIA_MUNICIPAL: { authority: "Câmara Municipal competente — Serviço de Contra-Ordenações",                   code: "POLICIA_MUNICIPAL" },
      PSP:               { authority: "PSP — Polícia de Segurança Pública",                                            code: "PSP"               },
      GNR:               { authority: "GNR — Guarda Nacional Republicana",                                             code: "GNR"               },
      IMT:               { authority: "IMT — Instituto da Mobilidade e dos Transportes, I.P.",                         code: "IMT"               },
    };

    const cfg = PARKING_ENTITY_MAP[entity];
    if (cfg) {
      if (entity === "EMEL") {
        warnings.push(
          "Multas EMEL: é possível apresentar defesa administrativa junto da EMEL " +
          "antes de recorrer ao tribunal (art. 59.º RGCO).",
        );
      }
      return {
        final_authority: cfg.authority,
        document_type:   "defesa_administrativa",
        confidence:      "high",
        authority_code:  cfg.code,
        legal_basis:     "Arts. 59.º e ss. do DL 433/82 (RGCO)",
        reasoning:
          `Infração de estacionamento — fase administrativa. ` +
          `A impugnação é dirigida diretamente à entidade autuante: ${cfg.authority}.`,
        warnings,
      };
    }

    // Unknown entity in administrative stage — cannot determine recipient
    return {
      final_authority:      "[ENTIDADE A CONFIRMAR NA NOTIFICAÇÃO]",
      document_type:        "defesa_administrativa",
      confidence:           "low",
      authority_code:       "UNKNOWN",
      legal_basis:          "Arts. 59.º e ss. do DL 433/82 (RGCO)",
      reasoning:
        "Infração de estacionamento — entidade autuante não identificada. " +
        "Não é possível determinar o destinatário sem confirmar a notificação.",
      warnings,
      clarification_needed:
        "Qual é o nome exato da entidade autuante indicado na notificação de estacionamento?",
    };
  }

  // ── Judicial stage: always Tribunal Judicial (comarca required) ─────────────
  if (entity === "EMEL") {
    warnings.push(
      "Multas EMEL: após indeferimento pela EMEL, o recurso judicial é apresentado " +
      "no Tribunal de Pequena Instância Criminal de Lisboa.",
    );
  }

  return {
    final_authority:      "Tribunal Judicial da Comarca competente",
    document_type:        "impugnacao_judicial",
    confidence:           "low",
    authority_code:       "TRIBUNAL",
    legal_basis:          "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    reasoning:
      `Infração de estacionamento — fase judicial. ` +
      `Entidade autuante: ${entity}. ` +
      "O tribunal específico depende da comarca — confidence LOW até ser fornecida.",
    warnings,
    clarification_needed:
      "Qual é o município onde ocorreu a infração de estacionamento? " +
      "Necessário para identificar o Tribunal Judicial competente.",
  };
}

/**
 * Resolves administrative errors (wrong plate, date, location, etc.).
 * The authority follows the same path as the underlying infraction type —
 * but since we don't know the underlying type, we use entity as tiebreaker.
 */
function resolveAdminError(
  stage:  StageInput,
  entity: KnownEntity,
): ResolutionOutput {
  const warnings: string[] = [
    "Erro administrativo: o encaminhamento segue a entidade processadora do auto. " +
    "Verifica sempre o cabeçalho da notificação.",
  ];

  // PSP/GNR/ANSR admin errors → ANSR pipeline
  if (CE_COMPATIBLE_ENTITIES.has(entity)) {
    return stage === "administrative"
      ? {
          final_authority: "Autoridade Nacional de Segurança Rodoviária (ANSR)",
          document_type:   "defesa_administrativa",
          confidence:      "high",
          authority_code:  "ANSR",
          legal_basis:     "Arts. 59.º e ss. do DL 433/82 (RGCO)",
          reasoning:
            `Erro administrativo em auto lavrado pela ${entity}. ` +
            "Processadora: ANSR. Fase: administrativa.",
          warnings,
        }
      : {
          final_authority:      "Tribunal Judicial da Comarca competente",
          document_type:        "recurso_judicial",
          confidence:           "low",
          authority_code:       "TRIBUNAL",
          legal_basis:          "Art. 62.º do DL 433/82 (RGCO)",
          reasoning:
            `Erro administrativo — fase judicial. Entidade: ${entity}.`,
          warnings,
          clarification_needed: "Qual é a comarca do local da infração?",
        };
  }

  // Municipal entities → Câmara / Tribunal
  if (entity === "EMEL" || entity === "SMTUC" || entity === "EMT") {
    return {
      final_authority:      "Entidade autuante ou Tribunal Judicial",
      document_type:        stage === "administrative" ? "defesa_administrativa" : "impugnacao_judicial",
      confidence:           "low",
      authority_code:       entity,
      legal_basis:          "Arts. 59.º e ss. do DL 433/82 (RGCO)",
      reasoning:
        `Erro administrativo em auto de ${entity}. ` +
        "Fase " + stage + ". Confirmar entidade destinatária na notificação.",
      warnings,
      clarification_needed:
        "Qual é o serviço de contra-ordenações da entidade autuante? Confirmar na notificação.",
    };
  }

  // Unknown entity
  return {
    final_authority:      "[ENTIDADE A CONFIRMAR NA NOTIFICAÇÃO]",
    document_type:        "defesa_administrativa",
    confidence:           "low",
    authority_code:       "UNKNOWN",
    legal_basis:          "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    reasoning:
      "Erro administrativo com entidade não identificada. " +
      "Não é possível determinar o destinatário sem confirmar a notificação.",
    warnings: [
      ...warnings,
      "Entidade desconhecida: consulta a notificação para identificar a entidade processadora.",
    ],
    clarification_needed:
      "Qual é o nome exato da entidade autuante indicado na notificação?",
  };
}

/**
 * Resolves unclassified infractions ("other").
 * issuing_entity is used as tiebreaker but never sole determinant.
 */
function resolveOther(
  stage:  StageInput,
  entity: KnownEntity,
): ResolutionOutput {
  const warnings = [
    "Tipo de infração 'other': resolução baseada na entidade autuante como sinal secundário. " +
    "Confirmar o tipo exato de infração para máxima precisão.",
  ];

  if (CE_COMPATIBLE_ENTITIES.has(entity)) {
    return resolveCETraffic("other", stage, entity);
  }

  if (entity === "EMEL" || entity === "SMTUC" || entity === "EMT") {
    return resolveParking(stage, entity);
  }

  if (entity === "POLICIA_MUNICIPAL" || entity === "CAMARA_MUNICIPAL") {
    return {
      final_authority:      "Câmara Municipal competente ou Tribunal Judicial",
      document_type:        stage === "judicial" ? "impugnacao_judicial" : "defesa_administrativa",
      confidence:           "low",
      authority_code:       "CM",
      legal_basis:          "Arts. 59.º e ss. do DL 433/82 (RGCO); regulamento municipal aplicável",
      reasoning:
        "Infração municipal (Polícia Municipal / Câmara). " +
        "A entidade destinatária depende do regulamento aplicável e do município.",
      warnings,
      clarification_needed:
        "Qual é o regulamento municipal invocado na notificação e qual o município?",
    };
  }

  // Unknown entity + unknown case type → maximum caution
  return {
    final_authority:      "[CONFIRMAR NA NOTIFICAÇÃO]",
    document_type:        "defesa_administrativa",
    confidence:           "low",
    authority_code:       "UNKNOWN",
    legal_basis:          "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    reasoning:
      "Tipo de infração e entidade desconhecidos. " +
      "Não é possível determinar a autoridade sem mais informação.",
    warnings: [
      ...warnings,
      "Dados insuficientes para resolução determinística. Consulta a notificação recebida.",
    ],
    clarification_needed:
      "Qual é o tipo exato de infração e o nome da entidade autuante na notificação?",
  };
}

// ─── Main export ───────────────────────────────────────────────────────────────

/**
 * resolveAuthority
 *
 * Deterministic authority resolver for Portuguese traffic fines.
 * Same input always produces same output. No I/O, no external calls, no AI.
 *
 * @param input  - { case_type, issuing_entity, stage }
 * @returns      ResolutionOutput with final_authority, document_type, confidence
 *
 * @example
 * resolveAuthority({ case_type: "speeding", issuing_entity: "GNR", stage: "administrative" })
 * // → { final_authority: "ANSR", document_type: "defesa_administrativa", confidence: "high" }
 *
 * resolveAuthority({ case_type: "parking", issuing_entity: "EMEL", stage: "judicial" })
 * // → { final_authority: "Tribunal Judicial...", document_type: "impugnacao_judicial", confidence: "low" }
 */
export function resolveAuthority(input: ResolutionInput): ResolutionOutput {
  const entity = normaliseEntity(input.issuing_entity);

  // ── Rule 1: CE traffic infractions → ALWAYS ANSR (admin) ──────────────────
  if (CE_TRAFFIC_TYPES.has(input.case_type)) {
    return resolveCETraffic(input.case_type, input.stage, entity);
  }

  // ── Rule 2: Parking → ALWAYS Tribunal Judicial ────────────────────────────
  if (input.case_type === "parking") {
    return resolveParking(input.stage, entity);
  }

  // ── Rule 3: Administrative errors ─────────────────────────────────────────
  if (input.case_type === "admin_error") {
    return resolveAdminError(input.stage, entity);
  }

  // ── Rule 4: Unclassified ("other") — secondary signal only ────────────────
  return resolveOther(input.stage, entity);
}

// ─── Convenience type guard ────────────────────────────────────────────────────

/** True when output can be used directly without asking the user for more info. */
export function isHighConfidence(output: ResolutionOutput): output is ResolutionOutput & { confidence: "high" } {
  return output.confidence === "high";
}

/** True when output must NOT be used to generate a document without clarification. */
export function requiresClarification(output: ResolutionOutput): boolean {
  return output.confidence === "low" && !!output.clarification_needed;
}
