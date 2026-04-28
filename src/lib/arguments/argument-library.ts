/**
 * argument-library.ts
 *
 * Structured legal argument library for Portuguese traffic-fine contestation.
 *
 * ─── Source documents ─────────────────────────────────────────────────────────
 *
 *   1. Impugnação Judicial — Excesso de velocidade (Teresa Damásio, pagou)
 *   2. Defesa Escrita — Sinal vermelho (Guilherme Cardoso, 2024.05.07)
 *   3. Impugnação Judicial — Estacionamento EMEL (Luísa Falcão, Tellezpizza)
 *   4. Impugnação Judicial — Estacionamento EMEL (Rita Carmo)
 *   5. Defesa Escrita — Excesso de velocidade (Martilene Santos)
 *
 * ─── Architecture ─────────────────────────────────────────────────────────────
 *
 *   Each argument is:
 *     - Grounded in at least one specific legal provision
 *     - Categorised by type (nullity > substantive > mitigating)
 *     - Rated by strength (DECISIVE → STRONG → MODERATE → SUPPLEMENTARY)
 *     - Annotated with the condition that must be true for it to apply
 *     - Stored as a text block with {{placeholders}} for personalisation
 *
 *   selectArguments(caseType, flags) returns the applicable subset,
 *   ordered strongest-first.
 *
 * ─── NO AI involvement ────────────────────────────────────────────────────────
 *
 *   All argument bodies are fixed legal text. The caller fills placeholders.
 *   No argument text is generated at runtime.
 */

import type { CaseType } from "@/lib/authority/authority-router";

// ─── Enumerations ──────────────────────────────────────────────────────────────

/**
 * Priority ordering (lower number = higher priority in output):
 *   1 NULLIDADE_PROCESSUAL  — procedural nullity → leads to archival
 *   2 FACTO_SUBSTANTIVO     — factual rebuttal of the infraction
 *   3 CULPA_AUSENTE         — absence of fault / unlawfulness
 *   4 SANCAO_ACESSORIA      — challenge to accessory sanction only
 *   5 ATENUANTE             — mitigating circumstances (subsidiary)
 */
export type ArgumentCategory =
  | "NULLIDADE_PROCESSUAL"
  | "FACTO_SUBSTANTIVO"
  | "CULPA_AUSENTE"
  | "SANCAO_ACESSORIA"
  | "ATENUANTE";

/**
 * DECISIVE   — if accepted, leads directly to full archival / acquittal
 * STRONG     — seriously undermines the charge; high success rate in courts
 * MODERATE   — valid and worth raising; outcome depends on facts
 * SUPPLEMENTARY — subsidiary; supports other arguments or reduces coima
 */
export type ArgumentStrength =
  | "DECISIVE"
  | "STRONG"
  | "MODERATE"
  | "SUPPLEMENTARY";

export type ArgumentId =
  // ── Procedural nullities ──────────────────────────────────────────────────
  | "NULLITY_NO_SUBJECTIVE_ELEMENT"
  | "NULLITY_INSUFFICIENT_LOCATION"
  | "NULLITY_NO_EVIDENCE_LISTED"
  | "NULLITY_ACCESSORY_SANCTION_INCOMPETENCE"
  // ── Substantive factual rebuttals ─────────────────────────────────────────
  | "ALIBI_IMPOSSIBLE_PRESENCE"
  | "INCORRECT_LOCATION_IN_AUTO"
  | "STOP_VS_PARKING_DISTINCTION"
  // ── Absence of culpa / unlawfulness ──────────────────────────────────────
  | "STATE_OF_NECESSITY"
  | "INSUFFICIENT_EVIDENCE_BASE"
  | "NO_TRAFFIC_DISTURBANCE"
  // ── Accessory sanction challenges ─────────────────────────────────────────
  | "ACCESSORY_SANCTION_REQUIRES_INDIVIDUAL_ASSESSMENT"
  | "ACCESSORY_SANCTION_PERSONAL_CIRCUMSTANCES"
  | "ACCESSORY_SANCTION_SUSPENSION"
  // ── Mitigating / attenuating ──────────────────────────────────────────────
  | "SPECIAL_ATTENUATION_COIMA"
  | "RESPONSIBLE_DRIVER_RECORD";

// ─── Condition flags ───────────────────────────────────────────────────────────

/**
 * Boolean flags the caller sets based on what the user has told the wizard.
 * selectArguments() uses these to filter the applicable arguments.
 *
 * Set a flag to `true` only when there is factual basis for it.
 * Never infer a flag from absence of contrary information.
 */
export interface ArgumentFlags {
  /** Auto does not state whether infraction was dolosa or negligente */
  autoOmitsSubjectiveElement?: boolean;
  /** Location in auto is vague (no street number, no km reference) */
  locationVagueInAuto?:        boolean;
  /** Auto does not list the evidence / witness names the authority relies on */
  autoLacksEvidenceList?:      boolean;
  /** Authority imposed sanção acessória de inibição de conduzir */
  accessorySanctionImposed?:   boolean;
  /** Arguido has a documented alibi proving physical impossibility */
  hasDocumentedAlibi?:         boolean;
  /** Location described in auto does not match actual location */
  locationIncorrectInAuto?:    boolean;
  /** Vehicle was stopped with hazard lights (paragem), not parked */
  wasStopNotParking?:          boolean;
  /** Medical or other emergency forced the conduct (estado de necessidade) */
  stateOfNecessity?:           boolean;
  /** Agent verbally promised not to proceed with the fine */
  agentPromisedNoFine?:        boolean;
  /** Infraction caused no disruption or danger to other road users */
  noDangerToTraffic?:          boolean;
  /** Arguido has no prior contraordenational record */
  cleanRecord?:                boolean;
  /** Accessory sanction would cause serious family / work hardship */
  accessorySanctionHardship?:  boolean;
}

// ─── Argument interface ────────────────────────────────────────────────────────

export interface LegalArgument {
  /** Unique identifier — stable across versions */
  id:          ArgumentId;
  /** Short title for UI display */
  title:       string;
  /** Legal category (determines ordering) */
  category:    ArgumentCategory;
  /** Assessed strength */
  strength:    ArgumentStrength;
  /**
   * Case types this argument applies to.
   * Empty array = applies to ALL case types.
   */
  appliesTo:   CaseType[];
  /**
   * Which flag(s) must be true for this argument to be selectable.
   * All listed flags must be true (logical AND).
   * Empty array = always applicable (no flag requirement).
   */
  requires:    (keyof ArgumentFlags)[];
  /**
   * Why this argument applies — shown to the user in the "Argumentos" mode.
   * Plain language, no legal jargon.
   */
  rationale:   string;
  /**
   * Primary legal provisions and case law supporting this argument.
   * Listed in citation order (statute → case law).
   */
  legalBasis:  string[];
  /**
   * The formal argument text block, ready to insert in the document.
   * Uses {{placeholder}} tokens from PLACEHOLDERS.md.
   * Written in formal pt-PT legal register.
   * NO AI-generated content — fixed law-firm quality text.
   */
  body:        string;
}

// ─── Arguments ─────────────────────────────────────────────────────────────────
// Ordered: NULLIDADE_PROCESSUAL → FACTO_SUBSTANTIVO → CULPA_AUSENTE
//          → SANCAO_ACESSORIA → ATENUANTE
// Within each category: DECISIVE → STRONG → MODERATE → SUPPLEMENTARY

// ══ NULLIDADE PROCESSUAL ════════════════════════════════════════════════════════

const NULLITY_NO_SUBJECTIVE_ELEMENT: LegalArgument = {
  id:       "NULLITY_NO_SUBJECTIVE_ELEMENT",
  title:    "Nulidade — Omissão do elemento subjetivo de imputação",
  category: "NULLIDADE_PROCESSUAL",
  strength: "DECISIVE",
  appliesTo: [],
  requires: ["autoOmitsSubjectiveElement"],

  rationale:
    "O auto de contraordenação não indica se a infração foi cometida a título doloso ou " +
    "negligente. Esta omissão é uma nulidade que o STJ fixou como viciando todo o " +
    "procedimento. O arguido não pode exercer a sua defesa sem saber com que título subjetivo " +
    "é acusado, e a coima pode ser reduzida a metade se a conduta for meramente negligente.",

  legalBasis: [
    "Art. 8.º, n.º 1 RGCO (DL 433/82) — só é punível o facto praticado com dolo ou negligência",
    "Art. 17.º, n.º 4 RGCO — negligência só pode ser sancionada até metade do máximo",
    "Art. 32.º, n.º 10 CRP — garantias de defesa em processo contraordenacional",
    "Art. 283.º, n.º 3 CPP ex vi art. 41.º, n.º 1 RGCO — requisitos da acusação",
    "STJ — Acórdão de Fixação de Jurisprudência n.º 1/2003, de 25 de janeiro (DR I-A n.º 21)",
    "TRL — Acórdão de 22 de março de 2011, Proc. n.º 6509",
  ],

  body: `\
DA NULIDADE DA ACUSAÇÃO POR OMISSÃO DO ELEMENTO SUBJETIVO DE IMPUTAÇÃO

O auto de contraordenação n.º {{numero_auto}}, de {{data_auto}}, não contém qualquer referência ao título subjetivo de imputação da infração — não esclarece se a conduta do/a arguido/a é imputada a título doloso ou a título negligente.

Ora, nos termos do artigo 8.º, n.º 1, do Regime Geral das Contraordenações (RGCO), aprovado pelo Decreto-Lei n.º 433/82, de 27 de outubro, «[s]ó é punível o facto praticado com dolo ou, nos casos especialmente previstos na lei, com negligência». O tipo subjetivo de imputação é, assim, um elemento estruturante e irrenunciável de qualquer tipo contraordenacional.

A relevância desta exigência é ainda reforçada pelo artigo 17.º, n.º 4, do RGCO, que determina que, «[s]e a lei, relativamente ao montante máximo, não distinguir o comportamento doloso do negligente, este só pode ser sancionado até metade daquele montante». A omissão do título subjetivo impede, pois, a correta determinação da moldura sancionatória aplicável.

O direito de audiência e defesa do/a arguido/a em processo contraordenacional, constitucionalmente garantido pelo artigo 32.º, n.º 10, da Constituição da República Portuguesa, só pode ser cabalmente exercido quando a acusação transmita todos os factos relevantes para a decisão — nomeadamente os que respeitam ao elemento subjetivo do ilícito.

Neste exato sentido se pronunciou, de forma absolutamente vinculante, o Supremo Tribunal de Justiça no Acórdão de Fixação de Jurisprudência n.º 1/2003, de 25 de janeiro de 2003, nos seguintes termos:

«Quando, em cumprimento do disposto no artigo 50.º do regime geral das contra-ordenações, o órgão instrutor optar, no termo da instrução contra-ordenacional, pela audiência escrita da Arguida, mas, na correspondente notificação, não lhe fornecer todos os elementos necessários para que este fique a conhecer a totalidade dos aspectos relevantes para a decisão, nas matérias de facto e de direito, o processo ficará doravante afectado de nulidade.»

In casu, o auto em apreço não alega um único facto, nem qualquer consideração jurídica, que permita esclarecer se a imputação contraordenacional é realizada a título doloso ou negligente. A autoridade autuante limitou-se a descrever factos objetivos, sem qualquer referência ao elemento volitivo ou ao elemento cognitivo da conduta imputada.

Esta omissão constitui nulidade da acusação, por força do artigo 283.º, n.º 3, do Código de Processo Penal, aplicável ao processo contraordenacional ex vi artigo 41.º, n.º 1, do RGCO, nulidade que desde já expressamente se argui para todos os efeitos legais, nomeadamente os previstos no artigo 122.º, n.º 1, do Código de Processo Penal, devendo o processo ser arquivado.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const NULLITY_INSUFFICIENT_LOCATION: LegalArgument = {
  id:       "NULLITY_INSUFFICIENT_LOCATION",
  title:    "Nulidade — Identificação insuficiente do local da infração",
  category: "NULLIDADE_PROCESSUAL",
  strength: "DECISIVE",
  appliesTo: [],
  requires: ["locationVagueInAuto"],

  rationale:
    "O Código da Estrada exige que o auto identifique com precisão o local onde a infração " +
    "ocorreu. Uma descrição vaga (apenas o nome de uma rua ou zona, sem número de polícia " +
    "ou quilómetro) impede o arguido de exercer o contraditório — não pode verificar a " +
    "sinalização, o limite de velocidade ou as condições do local. Esta é uma nulidade " +
    "expressamente reconhecida pelo STJ.",

  legalBasis: [
    "Art. 170.º, n.º 1 CE (DL 114/94) — elementos obrigatórios do auto de notícia",
    "Art. 32.º, n.º 10 CRP — garantias de defesa / contraditório",
    "Art. 283.º, n.º 3 CPP ex vi art. 41.º, n.º 1 RGCO",
    "STJ — Assento de Fixação de Jurisprudência n.º 1/2003, de 25 de janeiro (DR I-A n.º 21)",
  ],

  body: `\
DA NULIDADE DA ACUSAÇÃO POR INSUFICIENTE IDENTIFICAÇÃO DO LOCAL DA PRÁTICA DA INFRAÇÃO

De acordo com o artigo 170.º, n.º 1, do Código da Estrada, o auto de notícia deve mencionar «os factos que constituem a infração, o dia, a hora, o local e as circunstâncias em que foi cometida» — exigindo-se, portanto, a identificação precisa do local.

O auto de contraordenação n.º {{numero_auto}}, de {{data_auto}}, identifica o local da alegada infração de forma manifestamente insuficiente — a descrição apresentada padece de teor vago e indeterminado, não indicando o número de polícia, o quilómetro da via, nem qualquer referência georreferenciável que permita ao/à arguido/a localizar inequivocamente o ponto concreto onde a alegada infração terá ocorrido.

Esta omissão é juridicamente relevante porque:

1.º Impede o/a arguido/a de verificar, no local indicado, as condições de sinalização, os limites de velocidade vigentes, as marcas rodoviárias existentes e demais circunstâncias de facto relevantes para a sua defesa;

2.º Impossibilita o exercício do contraditório em violação do artigo 32.º, n.º 10, da Constituição da República Portuguesa, que garante ao arguido em processo contraordenacional os mesmos direitos de defesa consagrados no processo criminal.

A descrição vaga do local não satisfaz os requisitos do artigo 170.º, n.º 1, do Código da Estrada, afetando a validade do auto e de todo o processado posterior.

Neste sentido é absolutamente determinante o Assento de Fixação de Jurisprudência do Supremo Tribunal de Justiça n.º 1/2003, de 25 de janeiro de 2003, que estabelece que, se a notificação não fornecer «(todos) os elementos necessários para que o interessado fique a conhecer todos os aspectos relevantes para a decisão, nas matérias de facto e de direito, o vício será o da nulidade sanável», arguível pelo arguido na impugnação judicial, devendo «o tribunal invalidar a instrução administrativa, a partir da notificação incompleta, e também, por dela depender e a afectar, a subsequente decisão administrativa».

Nestes termos, argui-se desde já a nulidade do auto de notícia e da decisão que nele se fundamenta, com as consequências legais previstas nos artigos 120.º, n.º 2, alínea d), e 122.º, n.º 1, do Código de Processo Penal, aplicáveis ex vi artigo 41.º, n.º 1, do RGCO, devendo o processo ser arquivado.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const NULLITY_NO_EVIDENCE_LISTED: LegalArgument = {
  id:       "NULLITY_NO_EVIDENCE_LISTED",
  title:    "Nulidade — Falta de indicação dos meios de prova na acusação",
  category: "NULLIDADE_PROCESSUAL",
  strength: "STRONG",
  appliesTo: [],
  requires: ["autoLacksEvidenceList"],

  rationale:
    "O arguido tem direito a conhecer, antes de exercer a sua defesa, quais os meios de prova " +
    "que sustentam a acusação — testemunhas, registos radar, imagens de câmara, etc. " +
    "Sem isso, não pode contradizer a prova nem escolher a sua estratégia de defesa. " +
    "O CPP, aplicável subsidiariamente, exige que a acusação liste as provas sob pena de nulidade.",

  legalBasis: [
    "Art. 283.º, n.º 3, al. d), e), f) CPP ex vi art. 41.º, n.º 1 RGCO — rol de provas na acusação",
    "Art. 32.º, n.º 10 CRP — garantias de defesa em processo contraordenacional",
    "Art. 32.º, n.º 5 CRP — processo equitativo",
    "Art. 6.º CEDH — fair trial / processo equitativo",
    "Art. 14.º, n.º 3, al. a) PIDCP — direito a ser informado sobre a acusação",
    "STJ — Acórdão de Fixação de Jurisprudência n.º 1/2003, de 25 de janeiro",
  ],

  body: `\
DA NULIDADE DA ACUSAÇÃO POR FALTA DE INDICAÇÃO DOS MEIOS DE PROVA

Nos termos do artigo 283.º, n.º 3, alíneas d), e) e f), do Código de Processo Penal, aplicável ao processo contraordenacional por força do artigo 41.º, n.º 1, do RGCO, a acusação deve conter o rol de testemunhas, a indicação dos peritos ou consultores técnicos e a indicação de quaisquer outras provas em que se fundamenta a imputação.

Analisado o auto de contraordenação n.º {{numero_auto}}, de {{data_auto}}, verifica-se que o mesmo não indica, com o necessário rigor e completude, os meios de prova em que a autoridade autuante se funda para sustentar a imputação contra o/a arguido/a.

Esta omissão é gravemente lesiva dos direitos de defesa do/a arguido/a, pelos seguintes motivos:

1.º O/A arguido/a não pode avaliar a força probatória da acusação nem antecipar a estratégia probatória da autoridade, ficando impossibilitado/a de requerer prova em sentido contrário;

2.º Não é possível contraditiar prova testemunhal ou documental cuja existência e identidade se desconhece;

3.º O direito a um processo equitativo, consagrado no artigo 32.º, n.º 5, da CRP, no artigo 6.º da Convenção Europeia dos Direitos do Homem e no artigo 14.º do Pacto Internacional sobre Direitos Civis e Políticos, pressupõe o conhecimento integral dos meios de prova da acusação.

Como escreveram GOMES CANOTILHO e VITAL MOREIRA, as garantias de defesa em processo contraordenacional constituem «uma simples irradiação para esse domínio sancionatório de requisitos constitutivos do estado de direito democrático».

Consequentemente, a acusação é nula nos termos e para os efeitos do artigo 283.º, n.º 3, alíneas d), e) e f), do Código de Processo Penal, aplicável ex vi artigo 41.º, n.º 1, do RGCO — nulidade que desde já expressamente se argui, para todos os efeitos previstos no artigo 122.º, n.º 1, do CPP.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const NULLITY_ACCESSORY_SANCTION_INCOMPETENCE: LegalArgument = {
  id:       "NULLITY_ACCESSORY_SANCTION_INCOMPETENCE",
  title:    "Inconstitucionalidade — Incompetência para aplicação de inibição de conduzir",
  category: "NULLIDADE_PROCESSUAL",
  strength: "DECISIVE",
  appliesTo: ["SPEEDING", "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT", "OTHER"],
  requires: ["accessorySanctionImposed"],

  rationale:
    "A sanção acessória de inibição de conduzir tem natureza mista de pena e medida de " +
    "segurança. Enquanto medida restritiva da liberdade, só pode ser aplicada por um Tribunal " +
    "— nunca por uma autoridade administrativa como a ANSR. Qualquer norma que atribua " +
    "essa competência a uma entidade administrativa é inconstitucional (arts. 27.º, 29.º, " +
    "32.º e 202.º CRP). O Tribunal Constitucional confirmou este entendimento.",

  legalBasis: [
    "Art. 27.º, 29.º, 32.º e 202.º CRP — princípio da jurisdicionalização",
    "Art. 30.º, n.º 4 CRP — nenhuma pena envolve perda automática de direitos",
    "Art. 32.º e 41.º RGCO — aplicação subsidiária do direito penal e processual penal",
    "TC — Acórdão n.º 28/83 (DR n.º 94, II Série, 21 de abril de 1984)",
    "TC — Acórdão n.º 337/86 (DR n.º 299, I Série, 30 de dezembro de 1986)",
    "STJ — Acórdão de Fixação de Jurisprudência de 29 de abril de 1992",
    "TRC — Acórdão de 5 de novembro de 1980 (BMJ 303, 276)",
    "Prof. Germano Marques da Silva — doutrina sobre sanções acessórias",
  ],

  body: `\
DA INCONSTITUCIONALIDADE E INCOMPETÊNCIA PARA APLICAÇÃO DA SANÇÃO ACESSÓRIA DE INIBIÇÃO DE CONDUZIR

A decisão administrativa ora impugnada aplica ao/à arguido/a a sanção acessória de inibição de conduzir, nos termos do artigo 147.º do Código da Estrada. Sucede, porém, que a autoridade administrativa carece de competência para o efeito, por força de princípios constitucionais estruturantes do Estado de Direito democrático.

A sanção acessória de inibição de conduzir reveste natureza mista de pena e medida de segurança — ou, no mínimo, de medida de segurança, como tem reconhecido pacificamente a jurisprudência do Supremo Tribunal de Justiça. Enquanto medida restritiva da liberdade ambulatória, está abrangida pelo princípio da jurisdicionalização, consagrado nos artigos 27.º, 29.º, 32.º e 202.º da Constituição da República Portuguesa.

O Tribunal Constitucional tem confirmado, de forma pacífica, que é proibida a aplicação automática, por efeito direto da lei (ope legis), de sanções que se traduzam na perda de direitos civis ou profissionais — cfr. Acórdão TC n.º 202/2000 (DR II.ª Série, 11 de outubro de 2000) e Acórdão TC n.º 520/2000 (DR II.ª Série, 31 de janeiro de 2001).

Não existe diferença material ou qualitativa entre a cassação da carta de condução — cuja competência é reconhecidamente judicial — e a inibição de conduzir. Existe apenas uma diferença de grau que não pode justificar regimes distintos quanto à entidade competente para a sua aplicação.

Nas palavras do Professor Germano Marques da Silva: «condição necessária, mas não suficiente, da aplicação de uma pena acessória é a condenação numa pena principal. Para além desse requisito torna-se, porém, sempre necessário ainda que o juiz comprove, no facto, um particular conteúdo do ilícito, que justifique materialmente a aplicação em espécie da pena acessória.»

Consequentemente, a norma que atribui à autoridade administrativa competência para aplicar a sanção acessória de inibição de conduzir é materialmente inconstitucional, por violação dos artigos 27.º, 29.º, 32.º e 202.º da CRP, inconstitucionalidade que desde já expressamente se argui para todos os efeitos legais.

Requer-se, em consequência, que seja declarada nula a parte da decisão administrativa que aplica a sanção acessória de inibição de conduzir, devendo a mesma, se se entender aplicável, ser determinada por este Tribunal com plena autonomia de apreciação.`,
};

// ══ FACTO SUBSTANTIVO ═══════════════════════════════════════════════════════════

const ALIBI_IMPOSSIBLE_PRESENCE: LegalArgument = {
  id:       "ALIBI_IMPOSSIBLE_PRESENCE",
  title:    "Álibi — Impossibilidade física de presença no local",
  category: "FACTO_SUBSTANTIVO",
  strength: "DECISIVE",
  appliesTo: [],
  requires: ["hasDocumentedAlibi"],

  rationale:
    "Se o arguido estava documentadamente noutro local à hora da infração, a imputação " +
    "colapsa factualmente. A presunção de inocência (art. 32.º, n.º 2 CRP) e o princípio " +
    "in dubio pro reo implicam que, perante a impossibilidade física de presença, o processo " +
    "deve ser arquivado. É o argumento factual mais forte disponível.",

  legalBasis: [
    "Art. 32.º, n.º 2 CRP — presunção de inocência / in dubio pro reo",
    "Art. 11.º RGCO — responsabilidade pela contraordenação exige autoria",
    "Art. 340.º CPP ex vi art. 41.º RGCO — produção de prova exculpatória",
  ],

  body: `\
DA IMPOSSIBILIDADE FÍSICA DA PRÁTICA DA INFRAÇÃO IMPUTADA — ÁLIBI DOCUMENTADO

O auto de contraordenação n.º {{numero_auto}} imputa ao/à arguido/a {{nome_completo}} a prática de uma infração no dia {{data_auto}}, no local identificado no mesmo auto.

Sucede que, à data e hora da alegada prática da infração, o/a arguido/a não se encontrava no local indicado no auto — encontrava-se, comprovadamente, noutro local, tornando materialmente impossível a prática dos atos que lhe são imputados.

Este facto é suscetível de demonstração através de prova documental e testemunhal, que se junta e arrola nos termos infra indicados.

Em face do princípio constitucional da presunção de inocência, consagrado no artigo 32.º, n.º 2, da Constituição da República Portuguesa, e do correlativo princípio in dubio pro reo, a existência de prova exculpatória que contradiz os factos constantes do auto implica necessariamente a absolvição do/a arguido/a.

Não tendo a autoridade autuante reunido prova que, de forma inequívoca, permita superar a prova de álibi apresentada, a decisão condenatória carece dos pressupostos factuais indispensáveis e deve ser revogada.

Requer-se, em consequência, que sejam inquiridas as testemunhas arroladas e analisados os documentos juntos, e que, com base nos mesmos, seja o/a arguido/a absolvido/a da contraordenação imputada.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const INCORRECT_LOCATION_IN_AUTO: LegalArgument = {
  id:       "INCORRECT_LOCATION_IN_AUTO",
  title:    "Erro factual — Local incorretamente descrito no auto",
  category: "FACTO_SUBSTANTIVO",
  strength: "STRONG",
  appliesTo: [],
  requires: ["locationIncorrectInAuto"],

  rationale:
    "Se o auto descreve o local errado (número de porta diferente, rua errada), isso " +
    "constitui um erro factual que afeta a validade do auto (art. 170.º CE). O arguido " +
    "pode demonstrar que nunca esteve no local descrito, ou que o local descrito não " +
    "existe naquelas circunstâncias. Prova testemunhal reforça este argumento.",

  legalBasis: [
    "Art. 170.º, n.º 1 CE — obrigatoriedade de correta identificação do local no auto",
    "Art. 58.º RGCO — elementos obrigatórios do auto de contraordenação",
    "Art. 32.º, n.º 10 CRP — garantias de defesa / contraditório",
  ],

  body: `\
DA INCORRETA DESCRIÇÃO DO LOCAL DA ALEGADA INFRAÇÃO NO AUTO DE NOTÍCIA

O auto de contraordenação n.º {{numero_auto}}, de {{data_auto}}, contém uma descrição do local da alegada infração que não corresponde à realidade, conforme se demonstrará por prova testemunhal e, se necessário, documental.

O artigo 170.º, n.º 1, do Código da Estrada impõe que o auto de notícia mencione «o local» da infração com rigor suficiente para permitir ao arguido o exercício do contraditório. A incorreta identificação do local constitui violação deste requisito legal.

A existência de erro na descrição do local da infração:

1.º Demonstra que o agente autuante não tinha visibilidade ou certeza sobre a localização exata do veículo, o que põe em causa a fiabilidade de todo o auto;

2.º Impede o exercício do contraditório, pois o/a arguido/a não consegue verificar as condições do local efetivamente visado;

3.º Constitui um elemento que, nos termos do artigo 32.º, n.º 10, da CRP, deve ser apreciado em benefício do/a arguido/a.

Requer-se que seja dado como não provado o local da infração tal como descrito no auto, com a consequente absolvição do/a arguido/a, ou, subsidiariamente, que o auto seja declarado nulo por insuficiência descritiva do local.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const STOP_VS_PARKING_DISTINCTION: LegalArgument = {
  id:       "STOP_VS_PARKING_DISTINCTION",
  title:    "Paragem vs. estacionamento — distinção legal",
  category: "FACTO_SUBSTANTIVO",
  strength: "STRONG",
  appliesTo: ["PARKING"],
  requires: ["wasStopNotParking"],

  rationale:
    "O Código da Estrada distingue claramente 'estacionamento' de 'paragem'. Uma imobilização " +
    "de curta duração, sinalizada com quatro pisca-alertas, é legalmente uma paragem " +
    "e não um estacionamento. O auto pode ter qualificado erroneamente a conduta, " +
    "tornando a imputação juridicamente incorreta.",

  legalBasis: [
    "Art. 2.º, n.º 1, al. p) CE — definição de 'estacionamento'",
    "Art. 2.º, n.º 1, al. gg) CE — definição de 'paragem'",
    "Art. 48.º CE — regras de estacionamento e paragem",
    "Art. 170.º, n.º 1 CE — correta qualificação da conduta no auto",
  ],

  body: `\
DA INCORRETA QUALIFICAÇÃO DA CONDUTA — PARAGEM VS. ESTACIONAMENTO

O auto de contraordenação n.º {{numero_auto}}, de {{data_auto}}, classifica a conduta do/a arguido/a como «estacionamento», tipificando-a como contraordenação nos termos do Código da Estrada.

Sucede que tal qualificação é juridicamente incorreta.

O Código da Estrada distingue expressamente «estacionamento» de «paragem»:

— «Estacionamento» (art. 2.º, n.º 1, al. p) CE): «imobilização de um veículo que não constitua paragem».

— «Paragem» (art. 2.º, n.º 1, al. gg) CE): «imobilização de um veículo por tempo considerado necessário para entrada ou saída de passageiros ou para operações de carga ou descarga, desde que o condutor esteja pronto a retomar a marcha».

À data e hora em causa, o/a arguido/a imobilizou o veículo pelo tempo estritamente necessário, com os quatro piscas ativados, sinalizando inequivocamente a intenção de paragem temporária — não de estacionamento.

Esta conduta configura uma paragem legalmente sinalizada, não consubstanciando a contraordenação tipificada no auto. A qualificação jurídica constante do auto está, pois, errada.

Não estando verificados os elementos típicos do ilícito imputado, deve o/a arguido/a ser absolvido/a da contraordenação de «estacionamento», devendo o auto ser declarado inválido por incorreta qualificação da conduta.`,
};

// ══ CULPA AUSENTE ════════════════════════════════════════════════════════════════

const STATE_OF_NECESSITY: LegalArgument = {
  id:       "STATE_OF_NECESSITY",
  title:    "Estado de necessidade — exclusão da culpa",
  category: "CULPA_AUSENTE",
  strength: "STRONG",
  appliesTo: ["PARKING"],
  requires: ["stateOfNecessity"],

  rationale:
    "O RGCO exclui a punibilidade quando o arguido age em estado de necessidade " +
    "desculpante — situação em que não lhe era exigível conduta diferente. " +
    "Emergências médicas de acompanhantes, ausência de alternativas de estacionamento " +
    "e duração mínima da paragem são os elementos factuais que sustentam este argumento. " +
    "Ausência de perturbação do trânsito reforça-o.",

  legalBasis: [
    "Art. 8.º, n.º 2 RGCO — estado de necessidade desculpante",
    "Art. 35.º CP ex vi art. 32.º RGCO — estado de necessidade (direito subsidiário)",
    "Art. 18.º RGCO — determinação da coima / proporcionalidade",
    "Art. 72.º-A RGCO — atenuação especial",
  ],

  body: `\
DO ESTADO DE NECESSIDADE — EXCLUSÃO DA ILICITUDE E DA CULPA

Nos termos do artigo 8.º, n.º 2, do Regime Geral das Contraordenações, «não é punível quem atua em estado de necessidade desculpante, quando lhe não seja exigível comportamento diferente».

In casu, a conduta do/a arguido/a preenche todos os pressupostos do estado de necessidade desculpante, a saber:

1.º PERIGO ATUAL — O/A arguido/a confrontou-se com uma situação de urgência médica real e imediata, que exigia intervenção sem demora;

2.º AUSÊNCIA DE ALTERNATIVAS VIÁVEIS — Naquele momento e naquele local, não existia nenhuma alternativa de estacionamento legal que pudesse ser alcançada em tempo útil sem comprometer a assistência necessária;

3.º INEXIGIBILIDADE DE CONDUTA DIFERENTE — Perante a situação concreta, não era humanamente exigível ao/à arguido/a comportamento diverso. Um comportamento conforme ao direito teria implicado um sacrifício desproporcionado face ao bem jurídico salvaguardado;

4.º AUSÊNCIA DE PERTURBAÇÃO DO TRÂNSITO — A imobilização do veículo não perturbou a normal circulação, não causou qualquer perigo para os restantes utentes da via, nem impediu outros veículos de estacionar nos lugares delimitados para o efeito.

A atuação do/a arguido/a foi, assim, justificada pelas circunstâncias excecionais do caso concreto, encontrando-se excluída a culpa nos termos do artigo 8.º do RGCO.

Deve, em consequência, o procedimento contraordenacional ser extinto por inexistência de culpa punível, e o/a arguido/a absolvido/a de todos os factos imputados.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const INSUFFICIENT_EVIDENCE_BASE: LegalArgument = {
  id:       "INSUFFICIENT_EVIDENCE_BASE",
  title:    "Insuficiência probatória — decisão fundada exclusivamente no auto",
  category: "CULPA_AUSENTE",
  strength: "MODERATE",
  appliesTo: [],
  requires: [],

  rationale:
    "O auto de contraordenação por si só não é prova suficiente para sustentar uma " +
    "condenação quando o arguido apresenta elementos contraditórios. A presunção de " +
    "inocência e o in dubio pro reo impõem que a dúvida razoável beneficie o arguido. " +
    "Aplica-se a todos os casos onde não há registo fotográfico, radar calibrado, " +
    "ou corroboração independente.",

  legalBasis: [
    "Art. 32.º, n.º 2 CRP — presunção de inocência / in dubio pro reo",
    "Art. 32.º, n.º 8 CRP — proibição de provas obtidas com abuso de processo",
    "Art. 74.º RGCO — apreciação da prova em processo contraordenacional",
    "Art. 127.º CPP ex vi art. 41.º RGCO — livre apreciação da prova",
  ],

  body: `\
DA INSUFICIÊNCIA PROBATÓRIA PARA SUSTENTAÇÃO DA CONDENAÇÃO

A decisão administrativa que deu origem ao presente recurso fundamenta-se, de forma exclusiva, no auto de contraordenação n.º {{numero_auto}}, de {{data_auto}}, lavrado pelo agente autuante, não sendo acompanhada de qualquer outra prova independente que corrobore os factos nele descritos.

O auto de notícia constitui, nos termos da lei, um elemento de prova que goza de fé pública quanto aos factos diretamente percepcionados pelo autuante — mas não é prova bastante e inabalável quando os factos são contestados pelo arguido com elementos credíveis em sentido contrário.

Nos termos do artigo 32.º, n.º 2, da Constituição da República Portuguesa, «todo o arguido se presume inocente até ao trânsito em julgado da sentença de condenação». Este princípio, conjugado com o in dubio pro reo, impõe que, na dúvida sobre a prática da infração, o Tribunal decida em favor do arguido.

In casu, o/a arguido/a apresenta elementos que criam dúvida razoável sobre a exatidão dos factos descritos no auto. Na ausência de prova adicional e independente que permita superar essa dúvida, não estão verificados os pressupostos de facto necessários para sustentar a condenação.

Requer-se, por consequência, que sejam produzidas as diligências probatórias necessárias à descoberta da verdade material, e que, não sendo possível afastar a dúvida razoável suscitada, o/a arguido/a seja absolvido/a ao abrigo do princípio in dubio pro reo.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const NO_TRAFFIC_DISTURBANCE: LegalArgument = {
  id:       "NO_TRAFFIC_DISTURBANCE",
  title:    "Ausência de perigo ou perturbação da circulação",
  category: "CULPA_AUSENTE",
  strength: "MODERATE",
  appliesTo: ["PARKING"],
  requires: ["noDangerToTraffic"],

  rationale:
    "Muitas infrações de estacionamento pressupõem que a conduta perturbou o trânsito " +
    "ou criou perigo. Se o veículo estava imobilizado sem bloquear a circulação nem " +
    "impedir o acesso a lugares de estacionamento, o grau de ilicitude é mínimo. " +
    "Serve como argumento autónomo de atenuação e reforça o estado de necessidade.",

  legalBasis: [
    "Art. 18.º RGCO — determinação da coima; gravidade da infração e culpa",
    "Art. 72.º-A RGCO — atenuação especial da coima",
    "Art. 48.º, n.º 2 CE — circunstâncias relevantes do estacionamento",
  ],

  body: `\
DA AUSÊNCIA DE PERTURBAÇÃO DA CIRCULAÇÃO E DE PERIGO PARA OS DEMAIS UTENTES

Ainda que se entendesse — o que por mero ónus de defesa se equaciona — que a conduta do/a arguido/a configurou a infração descrita no auto, sempre se imporia reconhecer que a mesma se caracterizou por um grau de ilicitude e de culpa manifestamente reduzido.

Com efeito:

1.º A imobilização do veículo não perturbou a circulação automóvel nem condicionou o movimento dos restantes utentes da via;

2.º O veículo não impediu qualquer outro veículo de aceder aos lugares de estacionamento legalmente delimitados no local;

3.º Em momento algum foi criado qualquer perigo efetivo para a segurança rodoviária dos demais condutores, peões ou outros utentes da via pública.

Nos termos do artigo 18.º do RGCO, a coima deve ser graduada em função da «gravidade da infração, da culpa do agente, da situação económica deste e do benefício económico que este retirou da prática da contraordenação». A ausência de qualquer prejuízo concreto para o bem jurídico tutelado — segurança e fluidez da circulação — impõe a aplicação da coima no seu mínimo legal, ao abrigo do artigo 18.º do RGCO, ou a atenuação especial nos termos do artigo 72.º-A do mesmo diploma.`,
};

// ══ SANÇÃO ACESSÓRIA ══════════════════════════════════════════════════════════════

const ACCESSORY_SANCTION_REQUIRES_INDIVIDUAL_ASSESSMENT: LegalArgument = {
  id:       "ACCESSORY_SANCTION_REQUIRES_INDIVIDUAL_ASSESSMENT",
  title:    "Sanção acessória — exige apreciação casuística, não é automática",
  category: "SANCAO_ACESSORIA",
  strength: "STRONG",
  appliesTo: ["SPEEDING", "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT", "OTHER"],
  requires: ["accessorySanctionImposed"],

  rationale:
    "A lei não impõe automaticamente a inibição de conduzir. O Tribunal Constitucional " +
    "é claro: a aplicação de sanções que impliquem perda de direitos não pode ser " +
    "automática (ope legis) — exige apreciação individualizada do caso, da culpa e " +
    "das circunstâncias pessoais. A doutrina do Prof. Germano Marques da Silva reforça " +
    "que a condenação principal é condição necessária mas não suficiente.",

  legalBasis: [
    "Art. 30.º, n.º 4 CRP — nenhuma pena envolve perda automática de direitos",
    "Art. 147.º CE — faculdade, não obrigação, de aplicar inibição de conduzir",
    "Art. 140.º CE — atenuação especial da sanção acessória",
    "TC — Acórdão n.º 202/2000 (DR II.ª Série, 11 de outubro de 2000)",
    "TC — Acórdão n.º 520/2000 (DR II.ª Série, 31 de janeiro de 2001)",
    "Prof. Germano Marques da Silva — doutrina sobre sanções acessórias",
  ],

  body: `\
DA NÃO APLICAÇÃO DA SANÇÃO ACESSÓRIA DE INIBIÇÃO DE CONDUZIR — APRECIAÇÃO CASUÍSTICA OBRIGATÓRIA

Sem conceder quanto ao mais, e por mero ónus de defesa, alega o/a arguido/a que a sanção acessória de inibição de conduzir não deve ser aplicada no caso concreto.

O artigo 30.º, n.º 4, da Constituição da República Portuguesa estabelece que «nenhuma pena envolve como efeito necessário a perda de quaisquer direitos civis, profissionais ou políticos». O Tribunal Constitucional tem confirmado, de forma pacífica e reiterada, que é constitucionalmente proibida a aplicação automática (ope legis) de sanções que impliquem a perda de direitos — cfr. Acórdão TC n.º 202/2000 e Acórdão TC n.º 520/2000.

A sanção acessória não é uma consequência automática da sanção principal. Como ensina o Professor Germano Marques da Silva: «condição necessária, mas não suficiente, da aplicação de uma pena acessória é a condenação numa pena principal. Para além desse requisito torna-se, porém, sempre necessário ainda que o juiz comprove, no facto, um particular conteúdo do ilícito, que justifique materialmente a aplicação em espécie da pena acessória.»

Ora, no caso concreto, não estão presentes os pressupostos que justificam materialmente a aplicação da sanção acessória:

1.º A conduta imputada não revelou especial perigosidade na condução nem criou risco concreto para terceiros;

2.º O/A arguido/a não apresenta historial de infrações rodoviárias que indicie necessidade de prevenção especial reforçada;

3.º As finalidades preventivas da sanção — dissuasão e proteção da segurança rodoviária — ficam plenamente asseguradas pela coima principal, não se justificando o agravamento pela sanção acessória.

Requer-se, em consequência, que a sanção acessória de inibição de conduzir não seja aplicada ao/à arguido/a, por falta dos pressupostos materiais que a justificam.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const ACCESSORY_SANCTION_PERSONAL_CIRCUMSTANCES: LegalArgument = {
  id:       "ACCESSORY_SANCTION_PERSONAL_CIRCUMSTANCES",
  title:    "Sanção acessória — circunstâncias pessoais e familiares impeditivas",
  category: "SANCAO_ACESSORIA",
  strength: "MODERATE",
  appliesTo: ["SPEEDING", "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT", "OTHER"],
  requires: ["accessorySanctionImposed", "accessorySanctionHardship"],

  rationale:
    "A aplicação da inibição de conduzir deve ponderar o impacto sobre a vida familiar " +
    "e profissional do arguido. Quando a perda da carta tem consequências desproporcionadas " +
    "para o sustento da família ou para o exercício de obrigações legais, este facto " +
    "deve ser ponderado pelo Tribunal na decisão sobre se aplica e por quanto tempo.",

  legalBasis: [
    "Art. 18.º RGCO — graduação da sanção atendendo à situação económica do arguido",
    "Art. 72.º-A RGCO — atenuação especial",
    "Art. 140.º CE — atenuação especial da sanção acessória de inibição de conduzir",
    "Art. 30.º, n.º 4 CRP — proporcionalidade das sanções",
  ],

  body: `\
DAS CIRCUNSTÂNCIAS PESSOAIS E FAMILIARES QUE OBSTAM À APLICAÇÃO DA SANÇÃO ACESSÓRIA

Sem conceder, e para o caso de V. Exa. entender aplicar a sanção acessória de inibição de conduzir, alega o/a arguido/a as seguintes circunstâncias pessoais e familiares que devem ser ponderadas nos termos dos artigos 18.º e 72.º-A do RGCO e do artigo 140.º do Código da Estrada:

O/A arguido/a {{nome_completo}} é condutor/a habilitado/a, com registo de condução isento de infrações graves, pessoa de reconhecida responsabilidade cívica que pauta a sua conduta pelo escrupuloso cumprimento das normas legais.

A viatura constitui instrumento indispensável para o cumprimento das suas obrigações profissionais, familiares e civis quotidianas — sendo a mobilidade pessoal um vetor fundamental da sua vida, insuscetível de ser substituída de forma adequada pelos transportes públicos.

A aplicação da inibição de conduzir teria consequências desproporcionadas e gravosas na sua situação familiar e profissional, comprometendo obrigações de que dependem terceiros, nomeadamente membros do agregado familiar.

Sendo a sanção acessória fundamentalmente preventiva, há que averiguar se as circunstâncias do caso justificam a sua aplicação. No caso vertente, as finalidades preventivas ficam plenamente asseguradas pela condenação na coima principal, tornando desnecessária e desproporcionada a aplicação da sanção acessória.

Requer-se, a título subsidiário, que a sanção acessória não seja aplicada; caso assim não se entenda, requer-se que a mesma seja fixada no mínimo legal e decretada suspensa na sua execução.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const ACCESSORY_SANCTION_SUSPENSION: LegalArgument = {
  id:       "ACCESSORY_SANCTION_SUSPENSION",
  title:    "Sanção acessória — suspensão da execução (pedido subsidiário)",
  category: "SANCAO_ACESSORIA",
  strength: "SUPPLEMENTARY",
  appliesTo: ["SPEEDING", "MOBILE_PHONE", "SEATBELT", "TRAFFIC_LIGHT", "OTHER"],
  requires: ["accessorySanctionImposed"],

  rationale:
    "Argumento subsidiário: mesmo que o Tribunal aplique a inibição de conduzir, " +
    "pode suspender a sua execução (por analogia com a suspensão de penas no direito " +
    "penal) quando as circunstâncias pessoais o justifiquem e a simples censura do " +
    "facto realize adequadamente as finalidades punitivas.",

  legalBasis: [
    "Art. 140.º CE — atenuação especial / possibilidade de suspensão",
    "Art. 50.º CP ex vi art. 32.º RGCO — suspensão da execução por analogia",
    "Art. 72.º-A RGCO — atenuação especial da coima",
    "TC — Acórdão n.º 202/2000",
  ],

  body: `\
DA SUSPENSÃO DA EXECUÇÃO DA SANÇÃO ACESSÓRIA — PEDIDO SUBSIDIÁRIO

Caso V. Exa. entenda, no uso dos seus poderes de plena jurisdição, que existe fundamento para a aplicação da sanção acessória de inibição de conduzir — o que não se concede — requer o/a arguido/a, a título subsidiário, que a execução da mesma seja decretada suspensa.

A suspensão da execução é a solução que melhor pondera as finalidades da sanção — prevenção geral e especial — com a situação concreta do/a arguido/a, cujas condições pessoais, profissionais e familiares tornam a execução efetiva da inibição manifestamente desproporcionada.

A simples sujeição ao procedimento contraordenacional, a condenação na coima principal e a ameaça da sanção acessória realizam, de forma adequada e suficiente, as finalidades de punição e de dissuasão, sem necessidade de execução efetiva da inibição de conduzir.

Requer-se, assim, subsidiariamente, que a sanção acessória de inibição de conduzir, se decretada, seja declarada suspensa na sua execução, ao abrigo do artigo 140.º do Código da Estrada e com fundamento nas circunstâncias pessoais e familiares já invocadas.`,
};

// ══ ATENUANTE ══════════════════════════════════════════════════════════════════

const SPECIAL_ATTENUATION_COIMA: LegalArgument = {
  id:       "SPECIAL_ATTENUATION_COIMA",
  title:    "Atenuação especial da coima — pedido subsidiário",
  category: "ATENUANTE",
  strength: "SUPPLEMENTARY",
  appliesTo: [],
  requires: [],

  rationale:
    "Argumento subsidiário omnipresente. Mesmo que os restantes argumentos não procedam " +
    "na íntegra, o arguido tem sempre direito a requerer a redução da coima ao mínimo " +
    "legal com base no grau de culpa, situação económica e ausência de antecedentes. " +
    "O art. 72.º-A RGCO permite uma atenuação especial quando existem atenuantes relevantes.",

  legalBasis: [
    "Art. 18.º RGCO — critérios de determinação da coima",
    "Art. 72.º-A RGCO — atenuação especial da coima",
    "Art. 32.º, n.º 2 CRP — princípio da proporcionalidade das sanções",
  ],

  body: `\
DA ATENUAÇÃO ESPECIAL DA COIMA — PEDIDO SUBSIDIÁRIO

Para o caso de V. Exa. não acolher os fundamentos anteriores, no que não se concede, requer o/a arguido/a, a título estritamente subsidiário, que a coima seja fixada no seu mínimo legal, com fundamento nas seguintes circunstâncias:

1.º O grau de culpa é reduzido, não tendo a conduta do/a arguido/a sido praticada com especial desconsideração pelas normas de trânsito;

2.º A conduta não provocou consequências danosas concretas para terceiros nem para a segurança rodoviária em geral;

3.º O/A arguido/a não tem registo de infrações contraordenacionais anteriores de natureza rodoviária;

4.º A situação económica do/a arguido/a não lhe permite suportar sem sacrifício desproporcionado uma coima no limite máximo da moldura aplicável.

Nos termos do artigo 18.º do RGCO, a coima deve ser graduada atendendo à gravidade da infração, à culpa do agente e à sua situação económica. Nos termos do artigo 72.º-A do RGCO, quando existam circunstâncias atenuantes relevantes, a coima pode ser especialmente reduzida.

Requer-se, pois, que a coima seja fixada no mínimo legal previsto para a infração em causa, atendendo a todas as circunstâncias atenuantes enunciadas.`,
};

// ─────────────────────────────────────────────────────────────────────────────

const RESPONSIBLE_DRIVER_RECORD: LegalArgument = {
  id:       "RESPONSIBLE_DRIVER_RECORD",
  title:    "Perfil do condutor — historial responsável e ausência de antecedentes",
  category: "ATENUANTE",
  strength: "SUPPLEMENTARY",
  appliesTo: [],
  requires: ["cleanRecord"],

  rationale:
    "A ausência de antecedentes contraordenacionais e o historial de condução responsável " +
    "são circunstâncias atenuantes que, combinadas com outros argumentos, contribuem para " +
    "a redução da coima e para afastar a sanção acessória. Não serve como argumento " +
    "isolado mas reforça todos os outros.",

  legalBasis: [
    "Art. 18.º RGCO — conduta anterior e posterior à infração como critério de graduação",
    "Art. 72.º-A RGCO — atenuação especial",
    "Art. 71.º, n.º 2, al. b) CP ex vi art. 32.º RGCO — antecedentes do arguido",
  ],

  body: `\
DO PERFIL DE CONDUTA DO/A ARGUIDO/A — CIRCUNSTÂNCIA ATENUANTE

O/A arguido/a {{nome_completo}} é titular de licença de condução válida e tem pautado o exercício da condução por um comportamento irrepreensível ao longo de toda a sua vida enquanto condutor/a.

Não conta com qualquer registo de infrações rodoviárias graves nem foi anteriormente sujeito/a a procedimento contraordenacional por factos similares aos ora imputados. Esta ausência de antecedentes contraordenacionais demonstra que a eventual infração não é expressão de um padrão de comportamento infrator, mas antes um episódio isolado e atípico.

A conduta anterior e posterior à infração constitui, nos termos do artigo 18.º do RGCO, um critério relevante para a determinação da sanção aplicável. A prevenção especial inerente à sanção é, in casu, desnecessária, porquanto o/a arguido/a revela, pela sua conduta habitual, que não apresenta qualquer perigosidade específica para a segurança rodoviária.

Esta circunstância deve ser ponderada em benefício do/a arguido/a, reforçando todos os fundamentos de defesa já invocados e impondo, no mínimo, a fixação da coima no seu valor mínimo legal.`,
};

// ─── Library record ────────────────────────────────────────────────────────────

export const ARGUMENT_LIBRARY: Record<ArgumentId, LegalArgument> = {
  NULLITY_NO_SUBJECTIVE_ELEMENT,
  NULLITY_INSUFFICIENT_LOCATION,
  NULLITY_NO_EVIDENCE_LISTED,
  NULLITY_ACCESSORY_SANCTION_INCOMPETENCE,
  ALIBI_IMPOSSIBLE_PRESENCE,
  INCORRECT_LOCATION_IN_AUTO,
  STOP_VS_PARKING_DISTINCTION,
  STATE_OF_NECESSITY,
  INSUFFICIENT_EVIDENCE_BASE,
  NO_TRAFFIC_DISTURBANCE,
  ACCESSORY_SANCTION_REQUIRES_INDIVIDUAL_ASSESSMENT,
  ACCESSORY_SANCTION_PERSONAL_CIRCUMSTANCES,
  ACCESSORY_SANCTION_SUSPENSION,
  SPECIAL_ATTENUATION_COIMA,
  RESPONSIBLE_DRIVER_RECORD,
};

// ─── Category ordering ─────────────────────────────────────────────────────────

const CATEGORY_ORDER: Record<ArgumentCategory, number> = {
  NULLIDADE_PROCESSUAL: 1,
  FACTO_SUBSTANTIVO:    2,
  CULPA_AUSENTE:        3,
  SANCAO_ACESSORIA:     4,
  ATENUANTE:            5,
};

const STRENGTH_ORDER: Record<ArgumentStrength, number> = {
  DECISIVE:      1,
  STRONG:        2,
  MODERATE:      3,
  SUPPLEMENTARY: 4,
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * selectArguments
 *
 * Returns the subset of arguments from ARGUMENT_LIBRARY that:
 *   1. Apply to the given caseType (or have no caseType restriction)
 *   2. Have all required flags set to true in `flags`
 *
 * Results are sorted by:
 *   Primary:   category order (NULLIDADE_PROCESSUAL first)
 *   Secondary: strength order (DECISIVE first)
 *
 * @param caseType  — wizard CaseType (e.g. "SPEEDING", "PARKING")
 * @param flags     — boolean flags from the wizard / user input
 * @returns         — ordered array of applicable LegalArgument objects
 */
export function selectArguments(
  caseType: CaseType,
  flags:    ArgumentFlags = {},
): LegalArgument[] {
  const all = Object.values(ARGUMENT_LIBRARY);

  const applicable = all.filter((arg) => {
    // Case type filter: empty appliesTo = applies to all
    const caseTypeMatch =
      arg.appliesTo.length === 0 || arg.appliesTo.includes(caseType);

    // Flags filter: all listed flags must be truthy
    const flagsMatch = arg.requires.every((flag) => flags[flag] === true);

    return caseTypeMatch && flagsMatch;
  });

  return applicable.sort((a, b) => {
    const catDiff = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    if (catDiff !== 0) return catDiff;
    return STRENGTH_ORDER[a.strength] - STRENGTH_ORDER[b.strength];
  });
}

/**
 * getArgument
 *
 * Returns a single argument by ID, or undefined if not found.
 */
export function getArgument(id: ArgumentId): LegalArgument | undefined {
  return ARGUMENT_LIBRARY[id];
}

/**
 * fillArgument
 *
 * Replaces {{placeholder}} tokens in an argument's body with values from `data`.
 * Returns the filled body string.
 *
 * Uses the same token syntax as legal-templates.ts fillTemplate().
 */
export function fillArgument(
  argument: LegalArgument,
  data:     Partial<Record<string, string>>,
): string {
  return argument.body.replace(/\{\{([^}]+)\}\}/g, (match, key: string) => {
    const value = data[key.trim()];
    return value !== undefined && value !== "" ? value : match;
  });
}
