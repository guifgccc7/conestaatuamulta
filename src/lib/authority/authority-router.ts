/**
 * authority-router.ts
 *
 * Maps (issuing_entity × case_type) → correct authority, document type,
 * opening salutation and closing paragraph for a Portuguese traffic-fine
 * contestation document.
 *
 * Legal framework:
 *   - RGCO (DL 433/82, art. 59.º ss.) — impugnação judicial
 *   - CE (DL 114/94 e alt.) — infrações rodoviárias
 *   - DL 50/2022 — transferência de competências para municípios
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type CaseType =
  | "SPEEDING"
  | "PARKING"
  | "ADMIN_ERROR"
  | "MOBILE_PHONE"
  | "SEATBELT"
  | "TRAFFIC_LIGHT"
  | "OTHER";

/** Fase do processo em que o documento é produzido. */
export type DocumentType =
  | "defesa_administrativa"   // Audiência prévia / impugnação adm. (art. 50.º / 59.º RGCO)
  | "recurso_judicial";       // Recurso para tribunal (art. 62.º RGCO)

export interface AuthorityRouting {
  /** Nome completo da entidade que recebe o documento. */
  authority: string;
  /** Código curto da entidade (para referência interna). */
  authority_code: string;
  /** Tipo de documento jurídico a produzir. */
  document_type: DocumentType;
  /** Rótulo legível do tipo de documento. */
  document_type_label: string;
  /** Base legal principal invocada no cabeçalho. */
  legal_basis: string;
  /** Parágrafo de abertura completo, pronto a inserir no documento. */
  opening_template: string;
  /** Parágrafo de encerramento completo, pronto a inserir no documento. */
  closing_template: string;
  /** Indicação de endereço de envio. */
  address_hint: string;
  /** Prazo legal em dias úteis a partir da notificação. */
  deadline_days: number;
  /** Notas adicionais ou avisos relevantes. */
  notes?: string;
  /**
   * true quando a entidade autuante não foi reconhecida de forma inequívoca.
   * O documento gerado contém marcadores [PREENCHER] em vez de nomes inventados.
   * A UI deve pedir confirmação ao utilizador antes de prosseguir.
   */
  isUncertain: boolean;
  /**
   * Quando isUncertain = true, pergunta a mostrar ao utilizador para obter
   * a informação em falta. Nunca é preenchida com uma suposição.
   */
  clarificationQuestion?: string;
}

// ─── Normalisation helpers ─────────────────────────────────────────────────────

/** Conjunto de palavras-chave que identificam cada entidade. */
const ENTITY_PATTERNS: Array<{ codes: string[]; key: EntityKey }> = [
  // ── Ordered by specificity: longer / more specific matches first ────────────
  // This prevents "PSP" inside "ANSR-FAKE-PSP" from shadowing ANSR when ANSR
  // also appears. Entries with full-name codes are placed before abbreviations
  // so a full-name match wins over a partial abbreviation hit.
  { codes: ["ansr", "autoridade nacional de segurança rodoviaria", "autoridade nacional de seguranca rodoviaria"], key: "ANSR" },
  { codes: ["emel", "empresa municipal de mobilidade"],                                      key: "EMEL"    },
  { codes: ["smtuc", "serviços municipalizados de transportes urbanos de coimbra",
            "servicos municipalizados de transportes urbanos de coimbra"],                   key: "SMTUC"   },
  { codes: ["empark", "eme park"],                                                           key: "EMPARK"  },
  { codes: ["emt", "empresa municipal de transportes"],                                      key: "EMT"     },
  { codes: ["imt", "instituto da mobilidade"],                                               key: "IMT"     },
  { codes: ["smas", "serviços municipalizados de agua e saneamento",
            "servicos municipalizados de agua e saneamento"],                                key: "SMAS"    },
  { codes: ["acc", "autoestradas", "via verde"],                                             key: "CONCESS" },
  // ── Police forces — after specific entities to avoid false positives ────────
  { codes: ["policia de seguranca publica", "policia seguranca publica",
            "psp"],                                                                          key: "PSP"     },
  { codes: ["guarda nacional republicana", "gnr"],                                           key: "GNR"     },
  // ── Municipal — after police to avoid "pm" matching before Polícia Municipal ─
  { codes: ["policia municipal", "pm de", "pm do"],                                         key: "PM"      },
  { codes: ["camara municipal", "cm de", "cm do", "municipio", "municipalidade",
            "municipality", "\bcm\b"],                                                        key: "CM"      },
];

type EntityKey = "PSP" | "GNR" | "ANSR" | "EMEL" | "SMTUC" | "EMPARK" | "EMT" | "IMT" | "PM" | "CM" | "SMAS" | "CONCESS" | "UNKNOWN";

/**
 * Normalises a raw entity string to a known EntityKey.
 *
 * Steps:
 *   1. Strip leading/trailing whitespace
 *   2. Remove dots from abbreviations (G.N.R. → GNR, P.S.P. → PSP)
 *   3. Lowercase
 *   4. NFD-normalise and strip combining diacritics (ç → c, ã → a, etc.)
 *      — applied to BOTH the input AND each code pattern, so accented codes
 *        match normalised input correctly (fixes E08)
 *   5. First-match wins (ENTITY_PATTERNS is ordered by specificity)
 */
function normaliseEntity(raw: string): EntityKey {
  if (!raw?.trim()) return "UNKNOWN";

  // Step 1 + 2: trim and collapse dotted abbreviations (G.N.R. → GNR)
  const collapsed = raw.trim().replace(/\b([A-ZÀ-Ú])\.(?=[A-ZÀ-Ú]\.?)/g, "$1");

  // Step 3 + 4: lowercase + strip diacritics from input
  const stripped = (input: string) =>
    input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lower = stripped(collapsed);

  for (const { codes, key } of ENTITY_PATTERNS) {
    // Also strip diacritics from each code pattern before comparing (fixes E08)
    if (codes.some((c) => lower.includes(stripped(c)))) return key;
  }
  return "UNKNOWN";
}

/** Infrações do Código da Estrada que passam sempre pela ANSR. */
const CE_CASE_TYPES = new Set<CaseType>([
  "SPEEDING", "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT",
]);

// ─── Opening templates ─────────────────────────────────────────────────────────

/**
 * Guards required fields in the opening paragraph.
 * If a field is empty or whitespace-only, a visible sentinel is inserted
 * so the document never contains a silent gap like "n.º , residente em".
 * The validator's CHECK 3 (opening keywords) will catch any remaining issues.
 */
function requireField(value: string, sentinel: string): string {
  return value?.trim() ? value.trim() : `[${sentinel} — PREENCHER]`;
}

function buildOpening(
  authority: string,
  salutation: string,
  name: string,
  nif: string,
  address: string,
): string {
  const safeName    = requireField(name,    "NOME COMPLETO");
  const safeNif     = requireField(nif,     "NIF");
  const safeAddress = requireField(address, "MORADA COMPLETA");

  return `${salutation},

${safeName.toUpperCase()}, contribuinte fiscal n.º ${safeNif}, residente em ${safeAddress} (doravante "arguido/a"), vem, nos termos e para os efeitos do disposto nos artigos 59.º e seguintes do Decreto-Lei n.º 433/82, de 27 de outubro (Regime Geral das Contra-Ordenações e Coimas — RGCO), apresentar perante ${authority} a presente`;
}

// ─── Closing templates ─────────────────────────────────────────────────────────

const CLOSING_ADMIN = `Nestes termos e nos mais de direito aplicáveis, requer-se a V. Ex.ª que:

a) Julgue a presente impugnação procedente, determinando o arquivamento do processo contra-ordenacional e a absolvição do/a arguido/a da prática da contra-ordenação imputada; ou, subsidiariamente,

b) Reduza a coima aplicada ao mínimo legal previsto para o tipo de infração em causa, atendendo às circunstâncias concretas do caso e à ausência de antecedentes contra-ordenacionais do/a arguido/a.

Termos em que se requer deferimento.

[LOCAL], [DATA]

Com os melhores cumprimentos,

_______________________________
[NOME COMPLETO]
NIF: [NIF]`;

const CLOSING_JUDICIAL = `Nestes termos e nos mais de direito aplicáveis, requer-se ao Meritíssimo Juiz que:

a) Julgue o presente recurso de impugnação judicial procedente, por provado, e, em consequência, absolva o/a recorrente da contra-ordenação que lhe é imputada; ou, subsidiariamente,

b) Reduza a coima ao mínimo legalmente previsto, por não se encontrarem preenchidos todos os pressupostos de facto e de direito exigidos para a aplicação da sanção máxima.

Requer ainda, se necessário, a realização de audiência de discussão e julgamento ao abrigo do artigo 63.º do RGCO.

Valor da causa: [VALOR DA COIMA] euros.

[LOCAL], [DATA]

Com os melhores cumprimentos,

_______________________________
[NOME COMPLETO]
NIF: [NIF]`;

// ─── Routing table ─────────────────────────────────────────────────────────────

/**
 * Devolve a configuração de encaminhamento para a entidade e tipo de caso dados.
 * Nunca lança excepção — em caso de dúvida usa o fallback seguro.
 */
export function routeAuthority(
  issuingEntity: string,
  caseType: CaseType,
  /** Dados do arguido para preencher o parágrafo de abertura. */
  args: { name: string; nif: string; address: string },
): AuthorityRouting {
  const entity = normaliseEntity(issuingEntity);
  const isCE   = CE_CASE_TYPES.has(caseType);

  // ── PSP — Polícia de Segurança Pública ──────────────────────────────────────
  if (entity === "PSP") {
    if (isCE) {
      // CE infractions are processed by ANSR regardless of the autuating police
      return ansr(args, "A infração foi registada pela PSP. O processo é gerido pela ANSR.");
    }
    if (caseType === "PARKING") {
      return pspParking(args, issuingEntity);
    }
    return ansr(args);
  }

  // ── GNR — Guarda Nacional Republicana ──────────────────────────────────────
  if (entity === "GNR") {
    if (isCE || caseType === "ADMIN_ERROR") {
      return ansr(args, "A infração foi registada pela GNR. O processo é gerido pela ANSR.");
    }
    if (caseType === "PARKING") {
      return gnrParking(args, issuingEntity);
    }
    return ansr(args);
  }

  // ── ANSR diretamente ────────────────────────────────────────────────────────
  if (entity === "ANSR") {
    return ansr(args);
  }

  // ── EMEL — estacionamento em Lisboa ────────────────────────────────────────
  if (entity === "EMEL") {
    return emel(args);
  }

  // ── SMTUC — estacionamento em Coimbra ──────────────────────────────────────
  if (entity === "SMTUC") {
    return smtuc(args);
  }

  // ── IMT — Instituto da Mobilidade e dos Transportes ────────────────────────
  if (entity === "IMT") {
    return imt(args);
  }

  // ── Polícia Municipal ───────────────────────────────────────────────────────
  if (entity === "PM") {
    if (isCE) {
      return ansr(args, "A infração foi registada pela Polícia Municipal. Se a infração for do CE, o processo pode ser gerido pela ANSR.");
    }
    return policiaMunicipal(args, issuingEntity);
  }

  // ── Câmara Municipal / serviços municipais ──────────────────────────────────
  if (entity === "CM" || entity === "SMAS") {
    return camaraMunicipal(args, issuingEntity);
  }

  // ── Operadores de concessão / portagens ─────────────────────────────────────
  if (entity === "EMPARK" || entity === "CONCESS") {
    return operadorConcessao(args, issuingEntity);
  }

  // ── Fallback seguro ─────────────────────────────────────────────────────────
  return fallback(args, issuingEntity);
}

// ─── Authority builders ────────────────────────────────────────────────────────

function ansr(
  args: { name: string; nif: string; address: string },
  notes?: string,
): AuthorityRouting {
  const authority = "Autoridade Nacional de Segurança Rodoviária (ANSR)";
  const salutation = "Exmo. Sr. Presidente da Autoridade Nacional de Segurança Rodoviária";
  return {
    authority,
    authority_code: "ANSR",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação Judicial de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO); art. 24.º e ss. do CE",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "ANSR — Av. Barbosa du Bocage, 74, 1069-054 Lisboa\n" +
      "Aceita também contestação por email: ansr@ansr.pt",
    deadline_days: 15,
    isUncertain: false,
    notes,
  };
}

function emel(args: { name: string; nif: string; address: string }): AuthorityRouting {
  const authority = "EMEL — Empresa Municipal de Mobilidade e Estacionamento de Lisboa, E.M., S.A.";
  const salutation = "Exmo. Sr. Diretor do Serviço de Contra-Ordenações da EMEL";
  return {
    authority,
    authority_code: "EMEL",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima de Estacionamento (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO); Regulamento de Estacionamento de Lisboa",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "EMEL, S.A. — Rua Camilo Castelo Branco, 45, 1050-044 Lisboa\n" +
      "Portal digital: www.emel.pt/contestacao",
    deadline_days: 15,
    isUncertain: false,
    notes:
      "Após indeferimento pela EMEL, o processo é remetido ao Tribunal de Pequena Instância Criminal de Lisboa para recurso judicial.",
  };
}

function smtuc(args: { name: string; nif: string; address: string }): AuthorityRouting {
  const authority = "SMTUC — Serviços Municipalizados de Transportes Urbanos de Coimbra";
  const salutation = "Exmo. Sr. Presidente do Conselho de Administração dos SMTUC";
  return {
    authority,
    authority_code: "SMTUC",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima de Estacionamento (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint: "SMTUC — Rua da Sofia, 217-219, 3000-395 Coimbra",
    deadline_days: 15,
    isUncertain: false,
  };
}

function imt(args: { name: string; nif: string; address: string }): AuthorityRouting {
  const authority = "IMT — Instituto da Mobilidade e dos Transportes, I.P.";
  const salutation = "Exmo. Sr. Presidente do Conselho Diretivo do IMT, I.P.";
  return {
    authority,
    authority_code: "IMT",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint: "IMT, I.P. — Rua de S. Julião, 131, 1149-030 Lisboa",
    deadline_days: 15,
    isUncertain: false,
  };
}

function pspParking(
  args: { name: string; nif: string; address: string },
  rawEntity: string,
): AuthorityRouting {
  // Use the verified PSP name, never a guessed subdivision
  const authority = "PSP — Polícia de Segurança Pública";
  const salutation = "Exmo. Sr. Comandante da PSP";
  return {
    authority,
    authority_code: "PSP",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO); CE",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "Dirigir ao Comando da PSP da área da infração.\n" +
      "Confirmar a esquadra/comando exato na notificação recebida.",
    deadline_days: 15,
    isUncertain: false,
  };
}

function gnrParking(
  args: { name: string; nif: string; address: string },
  rawEntity: string,
): AuthorityRouting {
  const authority = "GNR — Guarda Nacional Republicana";
  const salutation = "Exmo. Sr. Comandante da GNR";
  return {
    authority,
    authority_code: "GNR",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO); CE",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "Dirigir ao Comando Territorial da GNR da área da infração.\n" +
      "Confirmar o posto/comando exato na notificação recebida.",
    deadline_days: 15,
    isUncertain: false,
  };
}

function policiaMunicipal(
  args: { name: string; nif: string; address: string },
  rawEntity: string,
): AuthorityRouting {
  // We know it's a Polícia Municipal but not which Câmara — use safe neutral salutation
  const authority = "Câmara Municipal competente — Serviço de Contra-Ordenações";
  const salutation = "Exmo. Sr. Presidente da Câmara Municipal";
  return {
    authority,
    authority_code: "PM",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO); Regulamento Municipal aplicável",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "Dirigir à Câmara Municipal indicada na notificação (serviço de contra-ordenações).\n" +
      "⚠️ Confirmar morada e destinatário exactos na notificação antes de enviar.",
    deadline_days: 15,
    isUncertain: true,
    clarificationQuestion:
      "Qual é o município (cidade) onde ocorreu a infração? " +
      "Isso permite identificar a Câmara Municipal destinatária correta.",
    notes:
      "A Polícia Municipal actua em nome da Câmara Municipal. " +
      "Confirma o nome exato da entidade na notificação antes de enviar o documento.",
  };
}

function camaraMunicipal(
  args: { name: string; nif: string; address: string },
  rawEntity: string,
): AuthorityRouting {
  // "MUNICIPALITY" is the wizard dropdown canonical value — we know it is a Câmara Municipal
  // (type is certain), though the specific câmara may not be named.
  const isWizardValue = rawEntity.trim().toUpperCase() === "MUNICIPALITY";
  // User typed the full municipality name (e.g. "Câmara Municipal de Lisboa")
  const isNamedEntity = /câmara municipal|camara municipal/i.test(rawEntity);

  const authority  = isNamedEntity ? rawEntity : "Câmara Municipal competente — Serviço de Contra-Ordenações";
  const salutation = isNamedEntity
    ? `Exmo. Sr. Presidente da ${rawEntity}`
    : "Exmo. Sr. Presidente da Câmara Municipal";

  // isUncertain = true only when we have no basis to identify the entity type at all.
  // Both wizard-value and explicit named entity are certain enough to proceed.
  const isUncertain = !isWizardValue && !isNamedEntity;

  return {
    authority,
    authority_code: "CM",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO); Regulamento Municipal aplicável",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "Confirmar morada e serviço de contra-ordenações na notificação recebida.\n" +
      (isWizardValue
        ? "⚠️ Preencha o nome completo da Câmara Municipal destinatária antes de enviar."
        : ""),
    deadline_days: 15,
    isUncertain,
    clarificationQuestion: isUncertain
      ? "Qual é o nome completo da Câmara Municipal ou entidade autuante indicada na notificação?"
      : undefined,
    notes: isWizardValue
      ? "Verifique o nome exato e morada da Câmara Municipal na notificação antes de enviar."
      : undefined,
  };
}

function operadorConcessao(
  args: { name: string; nif: string; address: string },
  rawEntity: string,
): AuthorityRouting {
  // Use neutral language — do not guess the operator's legal name
  const authority  = "[ENTIDADE AUTUANTE — confirmar na notificação]";
  const salutation = "Ao Serviço de Contra-Ordenações da entidade autuante";
  return {
    authority,
    authority_code: "CONCESS",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint: "Confirmar entidade e morada exatos na notificação recebida.",
    deadline_days: 15,
    isUncertain: true,
    clarificationQuestion:
      "Qual é o nome exato da entidade autuante indicado na notificação? " +
      "(Ex.: Ascendi, Brisa, Lusoponte, IMT, Via Verde…)",
    notes:
      "Para infrações de portagem, verificar se a entidade autuante é o IMT ou o operador da concessão. " +
      "Confirmar na notificação recebida antes de enviar.",
  };
}

/**
 * Fallback seguro — usado quando a entidade não é reconhecida.
 * NUNCA echa o nome em bruto como autoridade.
 * NUNCA inventa um nome de autoridade.
 * Usa marcadores [PREENCHER] no documento gerado.
 */
function fallback(
  args: { name: string; nif: string; address: string },
  rawEntity: string,
): AuthorityRouting {
  // Use a completely neutral salutation — no guessing allowed
  const authority  = "[ENTIDADE AUTUANTE — verificar na notificação]";
  const salutation = "Ao Serviço de Contra-Ordenações";

  return {
    authority,
    authority_code: "UNKNOWN",
    document_type: "defesa_administrativa",
    document_type_label: "Impugnação de Coima (art. 59.º RGCO)",
    legal_basis: "Arts. 59.º e ss. do DL 433/82 (RGCO)",
    opening_template: buildOpening(authority, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_ADMIN,
    address_hint:
      "⚠️ Entidade não identificada. Verifica a notificação e preenche o destinatário " +
      "correto antes de enviar o documento.",
    deadline_days: 15,
    isUncertain: true,
    clarificationQuestion:
      "Qual é o nome exato da entidade autuante que consta na notificação que recebeste? " +
      "(Ex.: PSP, GNR, ANSR, EMEL, Câmara Municipal de…, Polícia Municipal de…)",
    notes:
      "⚠️ A entidade autuante não foi identificada automaticamente. " +
      "O documento contém o marcador [ENTIDADE AUTUANTE] que deve ser substituído " +
      "pelo nome correto antes de enviar.",
  };
}

// ─── Judicial appeal variant ───────────────────────────────────────────────────

/**
 * Quando a impugnação administrativa é indeferida, gera o encaminhamento
 * para o tribunal competente.
 */
export function routeJudicialAppeal(
  routing: AuthorityRouting,
  args: { name: string; nif: string; address: string },
  comarca: string = "[COMARCA]",
): AuthorityRouting {
  const court = `Tribunal Judicial da Comarca de ${comarca}`;
  const salutation = `Exmo. Sr. Juiz do ${court}`;
  const comarcaIsKnown = comarca !== "[COMARCA]";
  return {
    ...routing,
    authority: court,
    authority_code: "TRIBUNAL",
    document_type: "recurso_judicial",
    document_type_label: "Recurso de Impugnação Judicial (art. 62.º RGCO)",
    legal_basis: "Arts. 62.º e ss. do DL 433/82 (RGCO); CRP art. 32.º",
    opening_template: buildOpening(court, salutation, args.name, args.nif, args.address),
    closing_template: CLOSING_JUDICIAL,
    address_hint: `Tribunal Judicial da Comarca de ${comarca}. Confirmar secção competente.`,
    deadline_days: 20,
    isUncertain: !comarcaIsKnown,
    clarificationQuestion: !comarcaIsKnown
      ? "Qual é a comarca (distrito judicial) do local onde ocorreu a infração?"
      : undefined,
    notes:
      "O recurso judicial é apresentado no tribunal competente após indeferimento da " +
      "impugnação administrativa. Prazo: 20 dias a partir da notificação do indeferimento " +
      "(art. 62.º, n.º 1 RGCO).",
  };
}
