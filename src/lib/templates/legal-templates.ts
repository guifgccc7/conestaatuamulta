/**
 * legal-templates.ts
 *
 * Strict legal template system for Portuguese traffic-fine contestation documents.
 *
 * PURE ENGINE — no AI, no async, no external dependencies, no side effects.
 * All templates are stored as immutable string constants.
 *
 * ─── Public API ───────────────────────────────────────────────────────────────
 *
 *   getOpening(authority, userData) → string
 *   getClosing(authority, userData) → string
 *   fillTemplate(template, data)    → string   (low-level helper)
 *
 * ─── Authority codes ──────────────────────────────────────────────────────────
 *
 *   ANSR     → Autoridade Nacional de Segurança Rodoviária (fixed official address)
 *   EMEL     → Empresa Municipal de Mobilidade e Estacionamento de Lisboa
 *   SMTUC    → Serviços Municipalizados de Transportes Urbanos de Coimbra
 *   IMT      → Instituto da Mobilidade e dos Transportes
 *   PSP      → Polícia de Segurança Pública (command varies — placeholder address)
 *   GNR      → Guarda Nacional Republicana (command varies — placeholder address)
 *   CM       → Câmara Municipal (municipality varies — {{municipio}} placeholder)
 *   PM       → Polícia Municipal (via Câmara — {{municipio}} placeholder)
 *   CONCESS  → Operador de concessão de estacionamento (uncertain — placeholder)
 *   TRIBUNAL → Tribunal Judicial da Comarca (judicial appeal — Câmara + Tribunal structure)
 *   GENERIC  → Fallback for unrecognised authority
 *
 * ─── Placeholder tokens (must match PLACEHOLDERS.md exactly) ──────────────────
 *
 *   {{nome_completo}}   Full name of the arguido
 *   {{nif}}             Número de Identificação Fiscal
 *   {{morada_completa}} Full postal address of the arguido
 *   {{numero_auto}}     Auto / processo contraordenacional number
 *   {{data_auto}}       Date the fine was issued     (e.g. "15 de março de 2025")
 *   {{data_submissao}}  Date of this document        (e.g. "03 de abril de 2026")
 *   {{local_infracao}}  Location of signing / infraction
 *   {{matricula}}       Vehicle registration plate
 *   {{comarca}}         Judicial comarca             — TRIBUNAL only
 *   {{entidade_autuante}} Issuing authority full name — TRIBUNAL / GENERIC
 *   {{municipio}}       Municipality name            — CM / PM
 *
 * ─── Closing sentinels (must be preserved for validation gate) ─────────────────
 *
 *   CLOSING_ADMIN    contains → "arquivamento do processo contra-ordenacional"
 *   CLOSING_JUDICIAL contains → "recurso de impugnação judicial"
 *
 * These exact substrings are checked by document-validator.ts CHECK 4.
 * Do NOT rephrase them.
 */

// ─── Types ─────────────────────────────────────────────────────────────────────

export type AuthorityCode =
  | "ANSR"
  | "EMEL"
  | "SMTUC"
  | "IMT"
  | "PSP"
  | "GNR"
  | "CM"
  | "PM"
  | "CONCESS"
  | "TRIBUNAL"
  | "GENERIC";

/**
 * All fields that template placeholders can resolve to.
 * Optional fields are required only by specific authority templates (see JSDoc above).
 */
export interface TemplateUserData {
  // ── Arguido identification ────────────────────────────────────────────────
  nome_completo:    string;
  nif:              string;
  morada_completa:  string;

  // ── Auto / processo ───────────────────────────────────────────────────────
  numero_auto:      string;
  /** Formatted date string, e.g. "15 de março de 2025" */
  data_auto:        string;
  /** Formatted date string of document creation, e.g. "03 de abril de 2026" */
  data_submissao:   string;
  /** City used as the signing location (usually from fineLocation or ownerAddress) */
  local_infracao:   string;

  // ── Vehicle ───────────────────────────────────────────────────────────────
  matricula:        string;

  // ── Authority-specific (optional) ─────────────────────────────────────────
  /** Judicial comarca — required for TRIBUNAL templates */
  comarca?:         string;
  /** Full name of the issuing authority — required for TRIBUNAL and GENERIC */
  entidade_autuante?: string;
  /** Municipality name — required for CM and PM templates */
  municipio?:       string;
}

// ─── Opening constants ─────────────────────────────────────────────────────────

/**
 * ANSR — Autoridade Nacional de Segurança Rodoviária
 *
 * Fixed official structure. Used for all CE infractions (speeding, mobile phone,
 * seatbelt, traffic light) at the administrative stage.
 * Basis: art. 50.º RGCO (DL 433/82, de 27 de outubro).
 */
const OPENING_ANSR = `\
Exmo. Senhor Presidente da
Autoridade Nacional de Segurança Rodoviária (ANSR)
Av. Dr. Lourenço Peixinho, n.º 77
3800-159 Aveiro


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação supra identificado, vem, nos termos e para os efeitos do disposto no artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * EMEL — Empresa Municipal de Mobilidade e Estacionamento de Lisboa, E.P.E.
 *
 * Administrative defense for Lisbon parking infractions.
 * Basis: art. 50.º RGCO; DL 44/2002, de 2 de março (fiscalização estacionamento).
 */
const OPENING_EMEL = `\
Exmo. Senhor Presidente do Conselho de Administração da
EMEL — Empresa Municipal de Mobilidade e Estacionamento de Lisboa, E.P.E.
Rua Engenheiro Ferreira Dias, n.º 237
1350-025 Lisboa


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pela EMEL — Empresa Municipal de Mobilidade e Estacionamento de Lisboa, E.P.E., vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * SMTUC — Serviços Municipalizados de Transportes Urbanos de Coimbra
 *
 * Administrative defense for Coimbra urban transport infractions.
 * Basis: art. 50.º RGCO.
 */
const OPENING_SMTUC = `\
Exmo. Senhor Presidente dos
SMTUC — Serviços Municipalizados de Transportes Urbanos de Coimbra
Av. Fernão de Magalhães, n.º 239
3000-173 Coimbra


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pelos SMTUC — Serviços Municipalizados de Transportes Urbanos de Coimbra, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * IMT — Instituto da Mobilidade e dos Transportes, I.P.
 *
 * Administrative defense for transport licensing and road infractions under IMT authority.
 * Basis: art. 50.º RGCO; DL 236/2012, de 31 de outubro (orgânica IMT).
 */
const OPENING_IMT = `\
Exmo. Senhor Presidente do
IMT — Instituto da Mobilidade e dos Transportes, I.P.
Av. das Forças Armadas, n.º 40
1649-022 Lisboa


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pelo IMT — Instituto da Mobilidade e dos Transportes, I.P., vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * PSP — Polícia de Segurança Pública
 *
 * Administrative defense addressed to the competent PSP command.
 * Note: the command address varies by delegation — the arguido must verify
 * the correct address on the notification and fill the placeholder below.
 * For CE infractions (speeding, etc.), use OPENING_ANSR instead.
 * Basis: art. 50.º RGCO.
 */
const OPENING_PSP = `\
Exmo. Senhor Comandante da
Polícia de Segurança Pública (PSP)
[Comando/Divisão Policial competente — verificar endereço na notificação recebida]


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pela Polícia de Segurança Pública, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * GNR — Guarda Nacional Republicana
 *
 * Administrative defense addressed to the competent GNR command.
 * Note: the command address varies by detachment — verify the correct address
 * on the notification received.
 * For CE infractions (speeding, etc.), use OPENING_ANSR instead.
 * Basis: art. 50.º RGCO.
 */
const OPENING_GNR = `\
Exmo. Senhor Comandante da
Guarda Nacional Republicana (GNR)
[Comando/Destacamento Territorial competente — verificar endereço na notificação recebida]


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pela Guarda Nacional Republicana, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * CM — Câmara Municipal
 *
 * Administrative defense for municipal parking and urban infractions.
 * Requires: {{municipio}} — name of the municipality.
 * Basis: art. 50.º RGCO; DL 50/2022 (transferência de competências).
 */
const OPENING_CM = `\
Exmo. Senhor Presidente da
Câmara Municipal de {{municipio}}
[Serviço de Fiscalização / Contraordenações — verificar endereço na notificação recebida]


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pela Câmara Municipal de {{municipio}}, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * PM — Polícia Municipal
 *
 * Administrative defense for infractions issued by the Polícia Municipal.
 * The defense is formally addressed to the Câmara Municipal (supervisory body),
 * with the Polícia Municipal referenced as the issuing body.
 * Requires: {{municipio}} — name of the municipality.
 * Basis: art. 50.º RGCO; Lei 19/2004 (Polícia Municipal).
 */
const OPENING_PM = `\
Exmo. Senhor Presidente da
Câmara Municipal de {{municipio}}
A/c Polícia Municipal de {{municipio}}
[Verificar endereço correto na notificação recebida]


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado pela Polícia Municipal de {{municipio}}, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * CONCESS — Operador de concessão de estacionamento
 *
 * Used when the issuing entity is an uncertain parking concessionaire.
 * The arguido must verify the exact entity name and address from the notification.
 * Basis: art. 50.º RGCO; DL 44/2002.
 */
const OPENING_CONCESS = `\
Exmo. Senhor Responsável pelo Serviço de Contraordenações de
[OPERADOR DE ESTACIONAMENTO — verificar nome completo na notificação recebida]
[Endereço — verificar na notificação recebida]


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * TRIBUNAL — Tribunal Judicial da Comarca
 *
 * Judicial appeal structure (Câmara + Tribunal).
 * Used when contesting a decision from any municipal/administrative authority
 * before the Tribunal Judicial.
 *
 * Requires:
 *   {{comarca}}           — judicial comarca (e.g. "Lisboa", "Porto", "Coimbra")
 *   {{entidade_autuante}} — full name of the authority that issued the original fine
 *
 * Basis: art. 59.º RGCO (DL 433/82); DL 49/2014 (LOSJ — organização judiciária).
 */
const OPENING_TRIBUNAL = `\
Exmo. Senhor Juiz de Direito do
Tribunal Judicial da Comarca de {{comarca}}


Assunto: Impugnação Judicial — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}
         Entidade autuante: {{entidade_autuante}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, não se conformando com a decisão administrativa proferida por {{entidade_autuante}} no âmbito do processo de contraordenação n.º {{numero_auto}}, de {{data_auto}}, vem, ao abrigo do disposto no artigo 59.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, e em prazo, interpor

IMPUGNAÇÃO JUDICIAL

da referida decisão administrativa, perante este Tribunal, pelos fundamentos de facto e de direito que a seguir se expõem:`;

/**
 * GENERIC — Fallback for unrecognised authority
 *
 * Used only when authority routing returns an uncertain result that has been
 * confirmed by the user. The arguido must fill the authority name and address
 * from the notification received.
 *
 * Requires: {{entidade_autuante}} — issuing authority as shown on the notification.
 * Basis: art. 50.º RGCO.
 */
const OPENING_GENERIC = `\
Exmo. Senhor Responsável pelo Serviço de Contraordenações de
{{entidade_autuante}}
[Endereço — verificar na notificação recebida]


Assunto: Defesa Escrita — Auto de Contraordenação n.º {{numero_auto}}, de {{data_auto}}


{{nome_completo}}, contribuinte fiscal com o n.º {{nif}}, residente em {{morada_completa}}, titular do veículo com a matrícula {{matricula}}, notificado/a na qualidade de arguido/a no âmbito do processo de contraordenação n.º {{numero_auto}}, instaurado por {{entidade_autuante}}, vem, nos termos do artigo 50.º do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, apresentar a sua

DEFESA ESCRITA

pelos fundamentos de facto e de direito que a seguir se expõem:`;

// ─── Closing constants ─────────────────────────────────────────────────────────

/**
 * CLOSING_ADMIN — Administrative defense closing
 *
 * Used for document_type = "defesa_administrativa".
 *
 * ⚠ SENTINEL PRESERVED: "arquivamento do processo contra-ordenacional"
 *    This exact substring is required by document-validator.ts CHECK 4.
 *    Do not rephrase or reorder the sentinel phrase.
 *
 * Basis: art. 50.º RGCO — audiência prévia; art. 18.º RGCO — determinação da coima;
 *        art. 72.º-A RGCO — atenuação especial.
 */
export const CLOSING_ADMIN = `\
III — PEDIDO

Termos pelos quais, e pelos demais de direito que V. Exa. doutamente suprirá, requer-se que:

  a) Sejam os presentes fundamentos julgados procedentes, com a consequente absolvição do/a arguido/a de todos os factos imputados;

ou, assim não se entendendo,

  b) Seja determinado o arquivamento do processo contra-ordenacional, por não se encontrarem reunidos os pressupostos legais para a aplicação de coima ao/à arguido/a;

ou, a título meramente subsidiário,

  c) Seja a coima reduzida ao mínimo legal aplicável, atendendo ao grau de culpa, à situação económica do/a arguido/a e às demais circunstâncias atenuantes do caso concreto, ao abrigo dos artigos 18.º e 72.º-A do RGCO.

Junta-se a documentação comprovativa dos factos alegados.
Requer-se, se necessário e nos termos do artigo 50.º do RGCO, a realização de diligências probatórias complementares.

{{local_infracao}}, {{data_submissao}}

Com os melhores cumprimentos,

O/A Arguido/A,

_________________________________
{{nome_completo}}
NIF: {{nif}}
Morada: {{morada_completa}}`;

/**
 * CLOSING_JUDICIAL — Judicial appeal closing
 *
 * Used for document_type = "recurso_judicial" / "impugnacao_judicial".
 *
 * ⚠ SENTINEL PRESERVED: "recurso de impugnação judicial"
 *    This exact substring is required by document-validator.ts CHECK 4.
 *    Do not rephrase or reorder the sentinel phrase.
 *
 * Basis: art. 59.º RGCO — impugnação judicial; art. 60.º RGCO — produção de prova;
 *        art. 63.º RGCO — decisão do tribunal.
 */
export const CLOSING_JUDICIAL = `\
IV — PEDIDO

Termos pelos quais, e pelos demais de direito, requer-se a V. Exa. que seja julgado totalmente procedente o presente recurso de impugnação judicial, com a consequente anulação da decisão administrativa impugnada e absolvição do/a recorrente da contraordenação imputada, com todos os efeitos legais daí decorrentes;

ou, assim não se entendendo,

que seja a coima reduzida ao mínimo legal previsto para a contraordenação em causa, atendendo às circunstâncias do caso concreto, ao grau de culpa e à situação económica do/a recorrente, ao abrigo dos artigos 18.º e 72.º-A do RGCO.

Junta-se a documentação comprovativa dos factos alegados.
Requer-se a produção de prova, nos termos do artigo 60.º do RGCO.

{{local_infracao}}, {{data_submissao}}

Com os melhores cumprimentos,

O/A Recorrente,

_________________________________
{{nome_completo}}
NIF: {{nif}}
Morada: {{morada_completa}}`;

// ─── Dispatch maps ─────────────────────────────────────────────────────────────

/**
 * Maps each authority code to its opening template constant.
 * All entries are exhaustive — every AuthorityCode must appear here.
 */
const OPENING_MAP: Record<AuthorityCode, string> = {
  ANSR:     OPENING_ANSR,
  EMEL:     OPENING_EMEL,
  SMTUC:    OPENING_SMTUC,
  IMT:      OPENING_IMT,
  PSP:      OPENING_PSP,
  GNR:      OPENING_GNR,
  CM:       OPENING_CM,
  PM:       OPENING_PM,
  CONCESS:  OPENING_CONCESS,
  TRIBUNAL: OPENING_TRIBUNAL,
  GENERIC:  OPENING_GENERIC,
};

/**
 * Maps each authority code to the correct closing template.
 *   TRIBUNAL          → CLOSING_JUDICIAL (judicial appeal)
 *   All other codes   → CLOSING_ADMIN    (administrative defense)
 */
const CLOSING_MAP: Record<AuthorityCode, string> = {
  ANSR:     CLOSING_ADMIN,
  EMEL:     CLOSING_ADMIN,
  SMTUC:    CLOSING_ADMIN,
  IMT:      CLOSING_ADMIN,
  PSP:      CLOSING_ADMIN,
  GNR:      CLOSING_ADMIN,
  CM:       CLOSING_ADMIN,
  PM:       CLOSING_ADMIN,
  CONCESS:  CLOSING_ADMIN,
  TRIBUNAL: CLOSING_JUDICIAL,
  GENERIC:  CLOSING_ADMIN,
};

// ─── Template filler ───────────────────────────────────────────────────────────

/**
 * fillTemplate
 *
 * Replaces every `{{key}}` token in `template` with the corresponding value
 * from `data`. Tokens with no matching key are left unchanged so that
 * the caller can detect unfilled placeholders.
 *
 * Replacement is global (all occurrences of each token are replaced).
 * Matching is case-sensitive and trims no whitespace inside the braces.
 *
 * @example
 *   fillTemplate("Olá {{nome_completo}}!", { nome_completo: "Ana Silva" })
 *   // → "Olá Ana Silva!"
 */
export function fillTemplate(
  template: string,
  data: Partial<Record<string, string>>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const value = data[key.trim()];
    // Return the original token when the key has no mapping —
    // this makes unfilled placeholders visible in the output.
    return value !== undefined && value !== "" ? value : match;
  });
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * getOpening
 *
 * Returns the opening block for `authority`, with all placeholders resolved
 * from `userData`. Unfilled optional placeholders (e.g. {{comarca}} when
 * not provided) are left as-is so the caller can detect them.
 *
 * @param authority  — one of the AuthorityCode values from authority-router.ts
 * @param userData   — user and case data; see TemplateUserData
 * @returns          — fully-formed opening string ready for document assembly
 *
 * @throws never     — unknown authority codes fall back to GENERIC template
 */
export function getOpening(
  authority: AuthorityCode | string,
  userData:  TemplateUserData,
): string {
  const template = OPENING_MAP[authority as AuthorityCode] ?? OPENING_GENERIC;

  return fillTemplate(template, {
    nome_completo:    userData.nome_completo,
    nif:              userData.nif,
    morada_completa:  userData.morada_completa,
    numero_auto:      userData.numero_auto,
    data_auto:        userData.data_auto,
    matricula:        userData.matricula,
    comarca:          userData.comarca         ?? "",
    entidade_autuante: userData.entidade_autuante ?? "",
    municipio:        userData.municipio        ?? "",
  });
}

/**
 * getClosing
 *
 * Returns the closing block for `authority`, with all placeholders resolved.
 * TRIBUNAL authority produces a judicial closing; all other codes produce
 * the administrative closing.
 *
 * ⚠  The sentinel phrases required by the validation gate are preserved
 *    verbatim in CLOSING_ADMIN and CLOSING_JUDICIAL. Do not modify those
 *    constants without updating the sentinels in document-validator.ts.
 *
 * @param authority  — one of the AuthorityCode values from authority-router.ts
 * @param userData   — user and case data; see TemplateUserData
 * @returns          — fully-formed closing string ready for document assembly
 *
 * @throws never     — unknown authority codes fall back to CLOSING_ADMIN
 */
export function getClosing(
  authority: AuthorityCode | string,
  userData:  TemplateUserData,
): string {
  const template = CLOSING_MAP[authority as AuthorityCode] ?? CLOSING_ADMIN;

  return fillTemplate(template, {
    nome_completo:   userData.nome_completo,
    nif:             userData.nif,
    morada_completa: userData.morada_completa,
    local_infracao:  userData.local_infracao,
    data_submissao:  userData.data_submissao,
  });
}

// ─── Sentinel export (for tests and validation) ────────────────────────────────

/**
 * The exact sentinel substrings that the validation gate in document-validator.ts
 * checks for. Exported so tests can assert they are still present after any
 * future edits to the closing constants.
 */
export const CLOSING_SENTINELS = {
  defesa_administrativa: "arquivamento do processo contra-ordenacional",
  recurso_judicial:      "recurso de impugnação judicial",
} as const;
