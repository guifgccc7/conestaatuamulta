/**
 * disclaimers.ts — Single source of truth for all legal disclaimer texts.
 *
 * Every disclaimer in the platform MUST be sourced from here.
 * Never inline disclaimer text in components — import from this file.
 *
 * ─── Legal basis ──────────────────────────────────────────────────────────────
 *
 *  EOA     Lei 145/2015, art. 66.º   — advocacia reservada; plataforma não pratica
 *  L49     Lei 49/2004               — consulta jurídica reservada; plataforma não presta
 *  RGCO    DL 433/82, art. 61.º      — arguido pode apresentar defesa escrita sem mandatário
 *  AI_ACT  Reg. (UE) 2024/1689, art. 50.º — divulgação obrigatória de IA
 *  RGPD    Reg. (UE) 2016/679        — tratamento de dados pessoais
 *  LC24    Lei 24/96, arts. 8.º/18.º — defesa do consumidor; limitação de responsabilidade
 *  DL24    DL 24/2014, art. 4.º      — informação pré-contratual em contratos digitais
 *  DL446   DL 446/85, art. 8.º       — cláusulas contratuais gerais devem ser destacadas
 *
 * ─── Invariants ───────────────────────────────────────────────────────────────
 *
 *  • NEVER paraphrase a closing sentinel — import CLOSING_SENTINELS from
 *    legal-templates.ts if you need them in a UI string.
 *  • NEVER soften UNCERTAIN_AUTHORITY_MESSAGE — it is a validation contract.
 *  • All UI-facing texts use "tu/tua" register.
 *  • All document-level texts use "o utilizador / o arguido" (formal).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1 — AI ASSISTANT DISCLAIMER
//     Used in: AI panel header · every AI response · Step 4 badge · first-use gate
// ─────────────────────────────────────────────────────────────────────────────

export const AI_ASSISTANT = {

  /**
   * Persistent banner at the top of the AI panel.
   * Must always be visible; must not be dismissible.
   * Satisfies: EOA art. 66.º · AI Act art. 50.º · Lei 49/2004
   */
  PANEL_BANNER:
    "Este assistente é um sistema de inteligência artificial (IA). " +
    "As respostas que fornece são orientações gerais baseadas na lei portuguesa " +
    "e não constituem consulta jurídica personalizada, " +
    "nos termos da Lei n.º 49/2004 e do Estatuto da Ordem dos Advogados " +
    "(Lei n.º 145/2015, art. 66.º). " +
    "Para casos com coimas elevadas, perda de pontos ou risco de suspensão " +
    "de carta de condução, consulta um advogado.",

  /**
   * Short label for panel sub-heading and message footers.
   */
  SHORT_LABEL: "IA · Não vinculativo · Não substitui advogado",

  /**
   * Appended to every AI case analysis (enforced via system prompt).
   * Also used as fallback if the model omits it.
   * Satisfies: AI Act art. 50.º
   */
  RESPONSE_FOOTER:
    "⚠️ Esta análise foi gerada por inteligência artificial com base nas " +
    "informações que forneceste e no enquadramento jurídico geral. " +
    "Não constitui aconselhamento jurídico personalizado nem substitui a " +
    "consulta a um advogado inscrito na Ordem dos Advogados (OA). " +
    "Os resultados reais dependem das circunstâncias concretas do caso, " +
    "da entidade autuante e da interpretação das autoridades competentes.",

  /**
   * Shown before the user submits data to the AI for the first time.
   * Satisfies: RGPD art. 13.º · AI Act art. 50.º
   */
  DATA_PROCESSING_NOTICE:
    "Ao usar o assistente IA, os dados que forneceste (circunstâncias da multa, " +
    "dados do veículo) são enviados para processamento por um modelo de " +
    "inteligência artificial externo (Anthropic). " +
    "Não são enviados dados de identificação pessoal direta (NIF, nome, morada) " +
    "ao assistente — apenas os dados contextuais da infração. " +
    "Ao continuar, aceitas este processamento conforme a nossa Política de Privacidade.",

  /**
   * Structured list of what the AI assistant explicitly does NOT do.
   * Used in: AiFirstUseGate · FAQ · legal pages.
   * Each item is a short, plain-language statement.
   */
  WHAT_IT_DOES_NOT: [
    "Não verifica factos — analisa apenas as informações que forneces.",
    "Não garante o resultado do processo de contestação.",
    "Não substitui a consulta a um advogado para casos complexos ou de alto valor.",
    "Não acede a bases de dados de jurisprudência em tempo real.",
    "Não considera circunstâncias pessoais não comunicadas.",
    "Não tem memória entre sessões — cada conversa começa do zero.",
  ] as const,

  /**
   * Structured list of what the AI assistant DOES do.
   * Symmetric counterpart to WHAT_IT_DOES_NOT for balanced UX disclosure.
   */
  WHAT_IT_DOES: [
    "Identifica potenciais fundamentos de contestação com base nos factos fornecidos.",
    "Sugere argumentos jurídicos aplicáveis ao tipo de infração.",
    "Redige texto formal em linguagem legal portuguesa.",
    "Avalia a força relativa de cada argumento.",
    "Indica quando o caso exige aconselhamento jurídico profissional.",
  ] as const,

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2 — GENERATED DOCUMENT DISCLAIMER
//     Used in: PDF footer · document editor · post-download page · review step
// ─────────────────────────────────────────────────────────────────────────────

export const DOCUMENT = {

  /**
   * Full disclaimer injected into every generated document (before signature).
   * Satisfies: EOA art. 66.º · Lei 49/2004 · AI Act art. 50.º (when enhanced)
   *
   * @param aiEnhanced  true if AI texto_formal was used in generation
   * @param generatedAt formatted date string (e.g. "3 de abril de 2026")
   */
  FULL_TEXT: (aiEnhanced: boolean, generatedAt: string): string =>
    [
      "NOTA INFORMATIVA — GERAÇÃO AUTOMÁTICA DE DOCUMENTO",
      "",
      `Data de geração: ${generatedAt}`,
      `Plataforma: contestaatuamulta.pt`,
      "",
      "NATUREZA DO DOCUMENTO",
      "Esta minuta foi elaborada automaticamente com base nas informações " +
        "fornecidas pelo utilizador e em fundamentos jurídicos gerais aplicáveis " +
        "ao Código da Estrada (DL n.º 114/94) e ao Regime Geral das " +
        "Contraordenações e Coimas (DL n.º 433/82, RGCO). " +
        "Constitui um instrumento de apoio ao exercício do direito de defesa " +
        "do arguido em processo de contraordenação, ao abrigo do art. 61.º do RGCO, " +
        "que não exige constituição de mandatário em fase administrativa.",
      "",
      "O QUE ESTE DOCUMENTO NÃO É",
      "Este documento não constitui aconselhamento jurídico personalizado, " +
        "nos termos da Lei n.º 49/2004 e do art. 66.º do Estatuto da Ordem dos " +
        "Advogados (Lei n.º 145/2015). " +
        "Não substitui a consulta ou representação por advogado inscrito na " +
        "Ordem dos Advogados, especialmente em casos com coimas superiores a €600, " +
        "perda de pontos na carta de condução ou risco de suspensão de licença.",
      "",
      ...(aiEnhanced
        ? [
            "CONTEÚDO GERADO POR INTELIGÊNCIA ARTIFICIAL",
            "Parte do texto desta contestação foi elaborado com recurso a um " +
              "sistema de inteligência artificial. " +
              "Nos termos do Regulamento (UE) 2024/1689 (AI Act), art. 50.º, " +
              "o utilizador é expressamente informado desta circunstância. " +
              "O conteúdo gerado por IA foi submetido à revisão do utilizador " +
              "antes da inclusão no documento final.",
            "",
          ]
        : []),
      "LIMITAÇÃO DE RESPONSABILIDADE",
      "A contestaatuamulta.pt não garante o resultado do processo de contestação. " +
        "O êxito da impugnação depende exclusivamente das circunstâncias concretas " +
        "do caso, da prova disponível, da apreciação da entidade autuante e da " +
        "interpretação das autoridades competentes. " +
        "A responsabilidade da plataforma limita-se ao valor efetivamente pago " +
        "pelo serviço, nos termos do art. 18.º da Lei n.º 24/96 " +
        "e sem prejuízo dos direitos imperativos do consumidor.",
      "",
      "RECOMENDAÇÃO",
      "Recomenda-se vivamente a consulta com um advogado inscrito na Ordem dos " +
        "Advogados para casos com coimas superiores a €600, perda de pontos, " +
        "risco de suspensão de carta de condução, ou sempre que exista dúvida " +
        "sobre a adequação desta minuta ao caso concreto.",
    ].join("\n"),

  /**
   * Short inline version for UI display (Step 6, document editor footer).
   */
  SHORT:
    "Minuta de apoio ao exercício de defesa em contraordenação " +
    "(RGCO art. 61.º). Não constitui aconselhamento jurídico personalizado. " +
    "Não garante resultado.",

  /**
   * Shown immediately after download — action-oriented, not just a legal warning.
   */
  POST_DOWNLOAD:
    "Este documento é uma minuta de impugnação. " +
    "Revê o conteúdo antes de enviar e assegura que todos os dados estão corretos. " +
    "Para casos com coimas elevadas ou perda de pontos, " +
    "recomendamos consulta jurídica profissional.",

  /**
   * Checklist of what the user should verify before submitting the document.
   * Used in: SendingInstructions step · post-download modal.
   */
  REVIEW_CHECKLIST: [
    "O número do auto está correto e corresponde à notificação recebida.",
    "O nome, NIF e morada do arguido estão corretos e completos.",
    "A matrícula indicada corresponde ao teu veículo.",
    "A data e o local da infração correspondem aos indicados na notificação.",
    "Os fundamentos de contestação são os que pretendes invocar.",
    "O documento está assinado antes do envio.",
    "O envio é feito por correio registado com aviso de receção.",
    "Guardas o talão de registo postal e o aviso de receção assinado.",
  ] as const,

  /**
   * One-line AI disclosure label for PDF metadata and UI badges.
   * Satisfies: AI Act art. 50.º (machine-readable marking).
   */
  AI_GENERATED_NOTICE:
    "Este documento contém secções elaboradas com recurso a inteligência artificial " +
    "(Reg. (UE) 2024/1689 — AI Act, art. 50.º).",

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 3 — PLATFORM / SERVICE DISCLAIMER
//     Used in: homepage · wizard footer · pricing · checkout · footer
// ─────────────────────────────────────────────────────────────────────────────

export const PLATFORM = {

  /**
   * Single-line footer disclaimer.
   * Used in: site-wide footer, navbar, minimal contexts.
   */
  FOOTER_ONE_LINE:
    `Documentos de apoio ao cidadão. Não constitui aconselhamento jurídico. ` +
    `© ${new Date().getFullYear()} contestaatuamulta.pt`,

  /**
   * Full footer block for the website footer component.
   * Satisfies: EOA art. 66.º · Lei 49/2004 · RGCO art. 61.º
   * Structured as an object so the footer component can render each part.
   */
  FOOTER_FULL: {
    LEGAL_NATURE:
      "A contestaatuamulta.pt é um serviço de tecnologia jurídica (LegalTech) " +
      "que auxilia cidadãos a exercerem o seu direito constitucional de defesa " +
      "em processos de contraordenação de trânsito. " +
      "Os documentos gerados são minutas de apoio ao abrigo do art. 61.º do " +
      "Regime Geral das Contraordenações e Coimas (DL n.º 433/82), " +
      "que confere ao arguido o direito de apresentar defesa escrita sem " +
      "necessidade de constituir mandatário.",
    NOT_LEGAL_ADVICE:
      "Este serviço não constitui consulta jurídica personalizada " +
      "(Lei n.º 49/2004) nem exercício de advocacia " +
      "(Lei n.º 145/2015 — Estatuto da Ordem dos Advogados, art. 66.º). " +
      "Para casos com coimas superiores a €600, perda de pontos na carta " +
      "de condução ou risco de suspensão de licença, " +
      "recomenda-se a consulta de um advogado.",
    LIABILITY:
      "A responsabilidade da plataforma limita-se ao valor pago pelo serviço. " +
      "Não são garantidos resultados. " +
      "Os direitos imperativos do consumidor ao abrigo da Lei n.º 24/96 " +
      "são sempre salvaguardados.",
    COPYRIGHT: `© ${new Date().getFullYear()} contestaatuamulta.pt — Todos os direitos reservados.`,
    CONTACT: "contacto@contestaatuamulta.pt",
  } as const,

  /**
   * Persistent footer shown below all wizard steps.
   * Satisfies: EOA art. 66.º · Lei 49/2004
   */
  WIZARD_FOOTER:
    "Os documentos gerados são minutas de apoio ao exercício do direito de " +
    "defesa em processo de contraordenação (RGCO art. 61.º). " +
    "Não constituem aconselhamento jurídico personalizado. " +
    "Para casos complexos, consulta um advogado inscrito na Ordem dos Advogados.",

  /**
   * Shown above the payment button — legally required to be conspicuous.
   * Satisfies: Lei 24/96 art. 8.º · DL 446/85 art. 8.º · DL 24/2014 art. 4.º
   */
  PRE_PAYMENT:
    "Ao pagar, confirmas que compreendeste que: " +
    "(1) este serviço gera minutas de apoio e não constitui aconselhamento jurídico; " +
    "(2) a plataforma não garante o resultado da contestação; " +
    "(3) a responsabilidade da plataforma limita-se ao valor pago.",

  /**
   * Full nature-of-service statement for Terms of Service page.
   */
  NATURE_OF_SERVICE:
    "A plataforma contestaatuamulta.pt é um serviço de tecnologia jurídica " +
    "(LegalTech) que auxilia os cidadãos a exercerem o seu direito de defesa " +
    "em processos de contraordenação de trânsito, ao abrigo do artigo 61.º do " +
    "Decreto-Lei n.º 433/82 (RGCO), que não exige a constituição de mandatário " +
    "em fase administrativa. " +
    "O serviço gera automaticamente minutas de impugnação com base nas " +
    "informações fornecidas pelo utilizador e em fundamentos jurídicos gerais. " +
    "Não constitui consulta jurídica personalizada (Lei n.º 49/2004) nem " +
    "exercício de advocacia (Lei n.º 145/2015, art. 66.º).",

  /**
   * Complete limitation of liability clause — for Terms of Service (s.7).
   * Satisfies: Lei 24/96 art. 18.º · DL 446/85 · DL 24/2014
   */
  LIABILITY_CLAUSE:
    "7. LIMITAÇÃO DE RESPONSABILIDADE\n\n" +
    "7.1 A contestaatuamulta.pt não garante, em qualquer circunstância, " +
    "o resultado do processo de contestação. " +
    "O êxito da impugnação depende exclusivamente das circunstâncias concretas " +
    "do caso, da prova disponível, da apreciação da entidade autuante e da " +
    "interpretação das autoridades competentes.\n\n" +
    "7.2 A plataforma não garante que os documentos gerados sejam adequados " +
    "para todas as situações específicas do utilizador. " +
    "O utilizador é o único responsável pela verificação da adequação do " +
    "documento ao seu caso concreto e pela decisão de o submeter.\n\n" +
    "7.3 A responsabilidade total da contestaatuamulta.pt, por qualquer causa " +
    "e a qualquer título, não excederá o valor efetivamente pago pelo utilizador " +
    "pelo serviço em causa.\n\n" +
    "7.4 Ficam excluídos da limitação prevista em 7.3 os danos resultantes de " +
    "dolo ou negligência grosseira da plataforma, bem como os casos previstos " +
    "na legislação imperativa de defesa do consumidor (Lei n.º 24/96, art. 18.º).\n\n" +
    "7.5 A plataforma não é responsável por quaisquer decisões que o utilizador " +
    "tome com base nos documentos gerados ou nas sugestões do assistente de IA, " +
    "nomeadamente prazos processuais, estratégia de defesa ou recurso judicial.",

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 4 — TESTIMONIALS
//     Used in: homepage testimonials section
// ─────────────────────────────────────────────────────────────────────────────

export const TESTIMONIALS = {

  /**
   * Shown below the testimonials section.
   * Prevents misleading outcome claims.
   */
  SECTION_FOOTER:
    "Os testemunhos acima refletem experiências individuais. " +
    "Os resultados variam consoante as circunstâncias específicas de cada caso. " +
    "A plataforma não garante absolvição nem qualquer resultado específico.",

  /**
   * Appended to any individual testimonial that mentions a successful outcome.
   */
  OUTCOME_ASTERISK: "*Resultado individual. Os resultados variam.",

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 5 — AI ACT COMPLIANCE
//     Required by Regulamento (UE) 2024/1689, art. 50.º
// ─────────────────────────────────────────────────────────────────────────────

export const AI_ACT = {

  /**
   * Short label for AI-generated content sections.
   */
  GENERATED_LABEL: "Gerado por IA",

  /**
   * Full disclosure shown when user first activates the AI assistant.
   * Satisfies: AI Act art. 50.º · RGPD art. 13.º
   */
  FIRST_USE_DISCLOSURE:
    "Este serviço utiliza um sistema de inteligência artificial (IA) para " +
    "auxiliar na elaboração de documentos jurídicos. " +
    "Nos termos do Regulamento (UE) 2024/1689 (AI Act), art. 50.º, " +
    "és informado/a de que estás a interagir com um sistema de IA e de que " +
    "parte do conteúdo do documento pode ser gerado por IA. " +
    "Todo o conteúdo gerado é revisto por ti antes de ser incluído no documento final.",

  /**
   * Applied to the document download confirmation when AI was used.
   */
  DOCUMENT_AI_LABEL:
    "Este documento contém secções elaboradas com recurso a inteligência " +
    "artificial (Reg. (UE) 2024/1689 — AI Act, art. 50.º).",

  /**
   * Risk classification under the AI Act.
   * Document-generation tools are "limited risk" — transparency obligations only.
   */
  RISK_CLASS_NOTICE:
    "Este sistema de IA é classificado como de risco limitado ao abrigo do " +
    "Regulamento (UE) 2024/1689 (AI Act). " +
    "As obrigações de transparência aplicáveis são cumpridas através da " +
    "divulgação presente nesta plataforma.",

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 6 — GDPR / DATA PROCESSING
//     Required by Regulamento (UE) 2016/679
// ─────────────────────────────────────────────────────────────────────────────

export const GDPR = {

  /**
   * Consent checkbox in Step 5 (Personal Data).
   * Satisfies: RGPD art. 6.º(1)(a) · art. 7.º
   */
  CONSENT_LABEL:
    "Li e aceito a Política de Privacidade e os Termos e Condições. " +
    "Compreendo que os meus dados são tratados para gerar o documento de " +
    "contestação e que não são partilhados com terceiros exceto para " +
    "processamento de pagamento (Stripe) e, quando uso o assistente IA, " +
    "dados contextuais da infração (não identificação pessoal direta) " +
    "são enviados para a API de IA.",

  /**
   * Shown when user activates the AI assistant for the first time in a session.
   * Satisfies: RGPD art. 13.º
   */
  AI_DATA_NOTICE:
    "Para analisar o teu caso, o assistente de IA recebe dados contextuais " +
    "da infração (tipo de multa, local, circunstâncias). " +
    "O teu NIF, nome e morada NÃO são enviados ao modelo de IA. " +
    "Os dados são processados pela Anthropic, Inc. ao abrigo do Acordo de " +
    "Processamento de Dados da Anthropic, compatível com o RGPD.",

  /**
   * Summary of data retained after service use.
   * Satisfies: RGPD art. 5.º(1)(e) — storage limitation principle.
   */
  RETENTION_NOTICE:
    "Os teus dados pessoais são conservados pelo período estritamente " +
    "necessário à prestação do serviço e ao cumprimento de obrigações legais. " +
    "Podes solicitar a eliminação dos teus dados em qualquer momento " +
    "através de contacto@contestaatuamulta.pt, nos termos do art. 17.º do RGPD.",

  /**
   * Cookie notice — minimal, for cookie banner.
   */
  COOKIE_NOTICE:
    "Este site utiliza cookies estritamente necessários para o funcionamento " +
    "da plataforma (autenticação, sessão). " +
    "Não são utilizados cookies de rastreamento ou publicidade. " +
    "Ao continuar a navegar, aceitas a utilização destes cookies essenciais.",

} as const;

// ─────────────────────────────────────────────────────────────────────────────
// 7 — LEGAL BASIS (positive framing — why the service is legitimate)
//     Used in: FAQ · legal pages · footer · onboarding
// ─────────────────────────────────────────────────────────────────────────────

export const LEGAL_BASIS = {

  /**
   * The core legal right that makes the service possible.
   * RGCO art. 61.º: the citizen's right to self-represent in administrative
   * contraordenação proceedings without a lawyer.
   * Use this anywhere you need to positively frame the service's legitimacy.
   */
  SELF_REPRESENTATION:
    "A lei portuguesa (art. 61.º do DL n.º 433/82 — RGCO) garante ao arguido " +
    "o direito de apresentar a sua defesa por escrito em fase administrativa " +
    "sem necessidade de constituir mandatário. " +
    "Este serviço auxilia o exercício desse direito.",

  /**
   * Short badge version for trust signals.
   */
  SELF_REPRESENTATION_SHORT:
    "Direito legal ao abrigo do art. 61.º do RGCO (DL 433/82)",

  /**
   * Explains the distinction between this service and illegal legal advice.
   */
  DISTINCTION_FROM_LEGAL_ADVICE:
    "Existe uma distinção legal importante entre consulta jurídica — " +
    "prestada exclusivamente por advogados e solicitadores inscritos " +
    "(Lei n.º 49/2004) — e a elaboração de minutas de apoio para exercício " +
    "de defesa administrativa. " +
    "A contestaatuamulta.pt opera exclusivamente nesta segunda modalidade, " +
    "ao abrigo do art. 61.º do RGCO.",

} as const;
