// ─── Smart Wizard Form Schema ─────────────────────────────────────────────────
// Data-driven form configuration. Each step, field, and option is defined here.
// The React components consume this config — no hard-coded UI logic.

import type { WizardState } from "./logic-engine";

// ─── Primitive field types ─────────────────────────────────────────────────────

export type FieldType =
  | "radio_card"      // large tap-target cards with icon + label (Step 1)
  | "radio_button"    // inline horizontal pill buttons (Yes/No/Maybe)
  | "text"            // single-line text input
  | "textarea"        // multi-line text input
  | "date"            // native date picker
  | "select"          // dropdown
  | "checkbox_group"  // multiple checkboxes
  | "number"          // numeric input
  | "phone"           // tel input with PT formatting
  | "nif"             // 9-digit NIF field with real-time validation
  | "plate"           // vehicle plate with PT format validation
  | "info_banner"     // read-only informational block (no input)
  | "defense_cards";  // rendered defense suggestion cards (Step 4)

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;           // emoji or icon name
  badge?: string;          // "Mais comum" / "Recomendado"
  revealFields?: string[]; // field IDs to show when this option is selected
}

export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "pattern" | "custom";
  value?: string | number | RegExp;
  message: string;          // pt-PT error message
  condition?: (state: WizardState) => boolean; // only validate if condition met
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  hint?: string;             // helper text shown below the field
  required?: boolean;
  options?: FieldOption[];
  validation?: ValidationRule[];
  condition?: (state: WizardState) => boolean; // show field only if true
  defaultValue?: string | boolean | string[];
  autoFill?: keyof WizardState["personalData"]; // pre-fill from user account
  maxLength?: number;
  rows?: number;             // textarea rows
}

export interface WizardStep {
  id: number;
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  fields: FormField[];
  condition?: (state: WizardState) => boolean; // skip step if false
  nextLabel?: string;        // override "Seguinte" label
  analyticsEvent?: string;   // for GA4 / Posthog tracking
}

// ─── Complete form schema ──────────────────────────────────────────────────────

export const WIZARD_SCHEMA: WizardStep[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Tipo de Multa
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id:       1,
    key:      "fine_type",
    title:    "Que tipo de multa recebeste?",
    subtitle: "Seleciona a infração indicada na notificação",
    icon:     "📋",
    analyticsEvent: "wizard_step1_fine_type",
    fields: [
      {
        id:       "fineCategory",
        type:     "radio_card",
        label:    "",
        required: true,
        options: [
          {
            value:       "SPEEDING",
            label:       "Excesso de Velocidade",
            description: "Radar, LIDAR, fotomulta ou controlo de secção",
            icon:        "🚗",
            badge:       "Mais contestada",
          },
          {
            value:       "PARKING",
            label:       "Estacionamento / Paragem",
            description: "EMEL, GNR, PSP, câmara municipal ou agente de trânsito",
            icon:        "🅿️",
          },
          {
            value:       "TRAFFIC_LIGHT",
            label:       "Semáforo Vermelho",
            description: "Infração detetada por câmara ou agente",
            icon:        "🚦",
          },
          {
            value:       "MOBILE_PHONE",
            label:       "Uso de Telemóvel",
            description: "Utilização de telemóvel durante a condução",
            icon:        "📱",
          },
          {
            value:       "SEATBELT",
            label:       "Falta de Cinto de Segurança",
            description: "Condução sem cinto ou isenção médica não reconhecida",
            icon:        "💺",
          },
          {
            value:       "ADMIN_ERROR",
            label:       "Erro na Multa",
            description: "Matrícula errada, data incorreta, falta de prova ou prescrição",
            icon:        "📋",
            badge:       "Alta taxa de sucesso",
          },
          {
            value:       "OTHER",
            label:       "Outra Infração",
            description: "Outra infração ao Código da Estrada",
            icon:        "⚠️",
          },
        ],
      },
      // Sub-type for SPEEDING — appears conditionally
      {
        id:        "speedingSubtype",
        type:      "radio_button",
        label:     "Que tipo de equipamento foi usado?",
        hint:      "Indicado na notificação ou na auto que recebeste",
        required:  false,
        condition: (s) => s.fineType.fineCategory === "SPEEDING",
        options: [
          { value: "fixed_radar",    label: "Radar fixo",          icon: "📡" },
          { value: "mobile_radar",   label: "Radar móvel",         icon: "🚔" },
          { value: "lidar",          label: "LIDAR (pistola laser)", icon: "🔫" },
          { value: "section_speed",  label: "Velocidade média",    icon: "📏" },
          { value: "photo_fine",     label: "Fotomulta",           icon: "📷" },
          { value: "unknown",        label: "Não sei",             icon: "❓" },
        ],
      },
      // Sub-type for PARKING
      {
        id:        "parkingSubtype",
        type:      "radio_button",
        label:     "Qual o tipo de infração de estacionamento?",
        required:  false,
        condition: (s) => s.fineType.fineCategory === "PARKING",
        options: [
          { value: "prohibited_zone",     label: "Zona proibida" },
          { value: "second_row",          label: "Segunda fila" },
          { value: "pavement",            label: "Em cima do passeio" },
          { value: "reserved",            label: "Lugar reservado" },
          { value: "no_parking_disc",     label: "Sem disco/dístico" },
          { value: "expired_disc",        label: "Disco expirado" },
          { value: "other_parking",       label: "Outra" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Dados da Multa
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id:       2,
    key:      "fine_details",
    title:    "Dados da multa",
    subtitle: "Preenche com as informações que constam na notificação",
    icon:     "📄",
    analyticsEvent: "wizard_step2_fine_details",
    fields: [
      {
        id:          "fineReference",
        type:        "text",
        label:       "Número da auto / referência",
        placeholder: "Ex: ANSR/2025/123456",
        hint:        "Encontras este número no canto superior da notificação",
        required:    false,
        maxLength:   50,
        validation: [
          { type: "maxLength", value: 50, message: "Máximo 50 caracteres" },
        ],
      },
      {
        id:       "fineDate",
        type:     "date",
        label:    "Data da infração",
        required: true,
        validation: [
          { type: "required", message: "A data da infração é obrigatória" },
          {
            type:    "custom",
            message: "A data não pode ser no futuro",
            value:   "not_future",
          },
        ],
      },
      {
        id:       "fineTime",
        type:     "text",
        label:    "Hora da infração",
        placeholder: "Ex: 14:30",
        hint:     "Opcional, mas útil para o documento",
        required: false,
        validation: [
          {
            type:    "pattern",
            value:   "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
            message: "Formato inválido. Usa HH:MM (ex: 14:30)",
          },
        ],
      },
      {
        id:       "fineAuthority",
        type:     "select",
        label:    "Entidade autuante",
        required: true,
        hint:     "Quem emitiu a multa",
        validation: [
          { type: "required", message: "Seleciona a entidade autuante" },
        ],
        options: [
          { value: "GNR",       label: "GNR — Guarda Nacional Republicana" },
          { value: "PSP",       label: "PSP — Polícia de Segurança Pública" },
          { value: "ANSR",      label: "ANSR — Autoridade Nacional de Segurança Rodoviária" },
          { value: "EMEL",      label: "EMEL — Empresa Municipal de Mobilidade de Lisboa" },
          { value: "SMTUC",     label: "SMTUC — Serviços Municipalizados de Coimbra" },
          { value: "STCP",      label: "STCP — Serviços de Transportes do Porto" },
          { value: "IMT",       label: "IMT — Instituto da Mobilidade e dos Transportes" },
          { value: "MUNICIPALITY", label: "Câmara Municipal" },
          { value: "OTHER",     label: "Outra entidade" },
        ],
      },
      {
        id:          "fineLocation",
        type:        "text",
        label:       "Local da infração",
        placeholder: "Ex: EN10, Km 15, Setúbal",
        hint:        "Via, rua ou localidade indicada na notificação",
        required:    true,
        maxLength:   200,
        validation: [
          { type: "required",   message: "O local da infração é obrigatório" },
          { type: "minLength",  value: 3, message: "Descreve melhor o local (mínimo 3 caracteres)" },
        ],
      },
      {
        id:          "vehiclePlate",
        type:        "plate",
        label:       "Matrícula do veículo",
        placeholder: "AB-12-CD",
        required:    true,
        validation: [
          { type: "required", message: "A matrícula é obrigatória" },
          {
            type:    "pattern",
            value:   "^[A-Z]{2}[0-9]{2}[A-Z]{2}$|^[0-9]{2}[A-Z]{2}[0-9]{2}$|^[0-9]{2}[0-9]{2}[A-Z]{2}$",
            message: "Formato de matrícula inválido (ex: AB-12-CD ou 12-AB-34)",
          },
        ],
      },
      // Speeding-specific fields
      {
        id:        "speedRegistered",
        type:      "number",
        label:     "Velocidade registada pelo radar (km/h)",
        hint:      "O valor indicado na auto ou na fotomulta",
        required:  true,
        condition: (s) => s.fineType.fineCategory === "SPEEDING",
        validation: [
          {
            type:      "required",
            message:   "Indica a velocidade registada",
            condition: (s) => s.fineType.fineCategory === "SPEEDING",
          },
          { type: "custom", value: "positive_number", message: "Valor inválido" },
        ],
      },
      {
        id:        "speedLimit",
        type:      "number",
        label:     "Limite de velocidade no local (km/h)",
        hint:      "O limite indicado na notificação",
        required:  true,
        condition: (s) => s.fineType.fineCategory === "SPEEDING",
        options: [
          { value: "30",  label: "30 km/h" },
          { value: "50",  label: "50 km/h — Localidade" },
          { value: "70",  label: "70 km/h" },
          { value: "80",  label: "80 km/h" },
          { value: "90",  label: "90 km/h" },
          { value: "100", label: "100 km/h" },
          { value: "120", label: "120 km/h — Autoestrada" },
        ],
        validation: [
          {
            type:      "required",
            message:   "Indica o limite de velocidade",
            condition: (s) => s.fineType.fineCategory === "SPEEDING",
          },
        ],
      },
      // Fine amount
      {
        id:          "fineAmount",
        type:        "text",
        label:       "Valor da coima (€)",
        placeholder: "Ex: 120",
        hint:        "Valor indicado na notificação, sem as custas",
        required:    false,
        validation: [
          {
            type:    "pattern",
            value:   "^[0-9]+(,[0-9]{2})?$",
            message: "Formato inválido. Usa apenas números (ex: 120 ou 120,50)",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Contexto / Circunstâncias
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id:       3,
    key:      "context",
    title:    "Conta-nos o que aconteceu",
    subtitle: "As tuas respostas determinam os melhores fundamentos legais",
    icon:     "💬",
    analyticsEvent: "wizard_step3_context",
    fields: [
      // ─── Quem conduzia ────────────────────────────────────────────────────
      {
        id:       "wasDriverAtTime",
        type:     "radio_button",
        label:    "Eras tu quem conduzia o veículo no momento da alegada infração?",
        required: true,
        validation: [
          { type: "required", message: "Responde a esta pergunta" },
        ],
        options: [
          { value: "yes", label: "Sim, era eu" },
          { value: "no",  label: "Não, era outra pessoa" },
          { value: "uncertain", label: "Não tenho a certeza" },
        ],
      },
      // If NOT driver → identify
      {
        id:        "realDriverName",
        type:      "text",
        label:     "Nome do condutor efetivo",
        placeholder: "Ex: João Pereira da Silva",
        hint:      "Identificar o condutor real permite transferir a responsabilidade (art. 134.º CE)",
        required:  false,
        condition: (s) => s.context.wasDriverAtTime === "no",
      },
      {
        id:        "realDriverInfo",
        type:      "info_banner",
        label:     "",
        condition: (s) => s.context.wasDriverAtTime === "no",
        hint:      "✓ Identificares o condutor real pode levar à tua absolvição imediata ao abrigo do artigo 134.º do Código da Estrada.",
      },
      // ─── Concordância ─────────────────────────────────────────────────────
      {
        id:       "agreesWithFine",
        type:     "radio_button",
        label:    "Concordas com a infração que te imputam?",
        hint:     "Responde com honestidade — afeta a solidez da contestação",
        required: true,
        validation: [
          { type: "required", message: "Responde a esta pergunta" },
        ],
        options: [
          { value: "no",      label: "Não concordo",        icon: "❌" },
          { value: "partial", label: "Concordo em parte",   icon: "⚠️" },
          { value: "yes",     label: "Sim, mas quero reduzir a coima", icon: "📉" },
        ],
      },
      // Warning if user agrees with the fine
      {
        id:        "agreementWarning",
        type:      "info_banner",
        label:     "",
        condition: (s) => s.context.agreesWithFine === "yes",
        hint:      "⚠️ Se concordas plenamente com a infração, a contestação formal tem menor probabilidade de êxito. Podes ainda pedir redução da coima ao mínimo legal ao abrigo do artigo 18.º do RGCO.",
      },
      // ─── Prova / Evidência ────────────────────────────────────────────────
      {
        id:       "hasEvidence",
        type:     "radio_button",
        label:    "Tens alguma prova ou documento que apoie a tua versão?",
        required: true,
        validation: [
          { type: "required", message: "Responde a esta pergunta" },
        ],
        options: [
          { value: "yes",     label: "Sim, tenho prova" },
          { value: "no",      label: "Não tenho prova" },
          { value: "partial", label: "Tenho alguma" },
        ],
      },
      {
        id:        "evidenceTypes",
        type:      "checkbox_group",
        label:     "Que tipo de prova tens?",
        required:  false,
        condition: (s) =>
          s.context.hasEvidence === "yes" || s.context.hasEvidence === "partial",
        options: [
          { value: "photos",          label: "📷 Fotografias do local" },
          { value: "video",           label: "🎥 Vídeo (dashcam / câmara) " },
          { value: "witness",         label: "👤 Testemunha presente" },
          { value: "gps_data",        label: "📍 Dados GPS (telemóvel / navegador)" },
          { value: "workshop_receipt",label: "🔧 Recibo de oficina (veículo em manutenção)" },
          { value: "medical",         label: "🏥 Atestado médico / urgência" },
          { value: "disability_card", label: "♿ Cartão de deficiência" },
          { value: "insurance",       label: "📋 Relatório de seguradora" },
          { value: "other",           label: "📁 Outros documentos" },
        ],
      },
      // ─── Problemas com o próprio auto ─────────────────────────────────────
      {
        id:       "fineHasDefects",
        type:     "radio_button",
        label:    "Reparaste em algum erro ou problema na notificação recebida?",
        hint:     "Irregularidades formais são frequentemente a base mais sólida de contestação",
        required: true,
        validation: [
          { type: "required", message: "Responde a esta pergunta" },
        ],
        options: [
          { value: "yes", label: "Sim, há erros" },
          { value: "no",  label: "Não reparei" },
        ],
      },
      {
        id:        "fineDefectTypes",
        type:      "checkbox_group",
        label:     "Que tipo de erro detetaste?",
        hint:      "Seleciona todos os que se aplicam",
        required:  false,
        condition: (s) => s.context.fineHasDefects === "yes",
        options: [
          { value: "wrong_plate",     label: "❌ Matrícula errada" },
          { value: "wrong_date",      label: "📅 Data ou hora incorreta" },
          { value: "wrong_location",  label: "📍 Local incorreto" },
          { value: "missing_evidence",label: "📷 Sem fotografia ou prova da infração" },
          { value: "no_agent_id",     label: "👮 Agente não identificado" },
          { value: "late_notification",label: "📬 Notificação recebida muito tarde" },
          { value: "no_hearing",      label: "📜 Não me deram direito a defesa prévia" },
          { value: "prescription",    label: "⏰ A multa pode estar prescrita (mais de 2 anos)" },
        ],
      },
      // ─── Contexto específico de velocidade ───────────────────────────────
      {
        id:        "radarCalibration",
        type:      "radio_button",
        label:     "O auto indica o certificado de calibração do radar?",
        hint:      "A verificação metrológica periódica é obrigatória por lei (Portaria 1504/2008)",
        required:  false,
        condition: (s) => s.fineType.fineCategory === "SPEEDING",
        options: [
          { value: "yes",     label: "Sim, está indicado" },
          { value: "no",      label: "Não, não está" },
          { value: "unknown", label: "Não sei" },
        ],
      },
      {
        id:        "speedSignageVisible",
        type:      "radio_button",
        label:     "Havia sinalização visível do limite de velocidade no local?",
        required:  false,
        condition: (s) => s.fineType.fineCategory === "SPEEDING",
        options: [
          { value: "yes",     label: "Sim, havia" },
          { value: "no",      label: "Não havia" },
          { value: "unclear", label: "Estava obstruída / ilegível" },
          { value: "unknown", label: "Não me recordo" },
        ],
      },
      // ─── Contexto específico de estacionamento ────────────────────────────
      {
        id:        "parkingSignageVisible",
        type:      "radio_button",
        label:     "Havia sinalização visível que proibisse o estacionamento?",
        required:  false,
        condition: (s) => s.fineType.fineCategory === "PARKING",
        options: [
          { value: "yes",     label: "Sim, havia" },
          { value: "no",      label: "Não havia" },
          { value: "unclear", label: "Estava obstruída / pouco visível" },
          { value: "unknown", label: "Não me recordo" },
        ],
      },
      {
        id:        "parkingEmergency",
        type:      "radio_button",
        label:     "Paraste por força maior (avaria, urgência médica, acidente)?",
        hint:      "O art. 49.º, n.º 2 do Código da Estrada isenta de responsabilidade nestas situações",
        required:  false,
        condition: (s) => s.fineType.fineCategory === "PARKING",
        options: [
          { value: "yes", label: "Sim" },
          { value: "no",  label: "Não" },
        ],
      },
      {
        id:        "parkingEmergencyDetail",
        type:      "textarea",
        label:     "Descreve brevemente a situação de emergência",
        placeholder: "Ex: O veículo avariou subitamente sem conseguir sair da via. Chamei assistência às 14:30.",
        required:  false,
        rows:      3,
        condition: (s) =>
          s.fineType.fineCategory === "PARKING" &&
          s.context.parkingEmergency === "yes",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Fundamentos Legais (auto-sugeridos)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id:       4,
    key:      "legal_grounds",
    title:    "Os teus fundamentos de defesa",
    subtitle: "Com base nas tuas respostas, identificámos os seguintes fundamentos jurídicos",
    icon:     "⚖️",
    analyticsEvent: "wizard_step4_legal_grounds",
    fields: [
      // This field is rendered as the scored defense cards component
      {
        id:       "selectedGrounds",
        type:     "defense_cards",
        label:    "",
        required: true,
        validation: [
          {
            type:    "custom",
            value:   "min_one_selected",
            message: "Seleciona pelo menos um fundamento para incluir na contestação",
          },
        ],
      },
      // Free text — always shown
      {
        id:          "additionalNotes",
        type:        "textarea",
        label:       "Informações adicionais (opcional)",
        placeholder: "Acrescenta qualquer outro facto relevante que deva constar na carta de contestação...",
        hint:        "Quanto mais específico/a fores, mais forte será o teu documento",
        required:    false,
        rows:        4,
        maxLength:   1000,
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 5 — Dados Pessoais
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id:       5,
    key:      "personal_data",
    title:    "Os teus dados",
    subtitle: "Necessários para identificação legal no documento",
    icon:     "👤",
    analyticsEvent: "wizard_step5_personal",
    fields: [
      {
        id:          "fullName",
        type:        "text",
        label:       "Nome completo",
        placeholder: "Maria Oliveira Santos",
        hint:        "Tal como consta no Cartão de Cidadão",
        required:    true,
        autoFill:    "fullName",
        maxLength:   100,
        validation: [
          { type: "required",  message: "O nome completo é obrigatório" },
          { type: "minLength", value: 5, message: "Nome demasiado curto" },
          {
            type:    "pattern",
            value:   "^[A-Za-zÀ-ÿ\\s'\\-]+$",
            message: "O nome não pode conter números ou caracteres especiais",
          },
        ],
      },
      {
        id:          "nif",
        type:        "nif",
        label:       "NIF (Número de Identificação Fiscal)",
        placeholder: "123456789",
        hint:        "9 dígitos — consta no cartão de cidadão e no DUA do veículo",
        required:    true,
        autoFill:    "nif",
        validation: [
          { type: "required", message: "O NIF é obrigatório para identificação legal" },
          {
            type:    "pattern",
            value:   "^[1-9][0-9]{8}$",
            message: "NIF inválido — deve ter 9 dígitos e não começar por 0",
          },
          { type: "custom", value: "valid_pt_nif", message: "NIF inválido (dígito de controlo incorreto)" },
        ],
      },
      {
        id:          "ccNumber",
        type:        "text",
        label:       "N.º do Cartão de Cidadão",
        placeholder: "12345678 9 ZZ0",
        hint:        "Opcional, mas fortalece a identificação formal no documento",
        required:    false,
        autoFill:    "ccNumber",
        maxLength:   15,
      },
      {
        id:          "address",
        type:        "textarea",
        label:       "Morada completa",
        placeholder: "Rua das Flores, n.º 12, 3.º Dto\n1200-001 Lisboa",
        hint:        "Rua, número, andar/fração, código postal e localidade",
        required:    true,
        autoFill:    "address",
        rows:        3,
        validation: [
          { type: "required",  message: "A morada é obrigatória" },
          { type: "minLength", value: 10, message: "Morada demasiado curta — inclui rua, número e código postal" },
        ],
      },
      {
        id:          "email",
        type:        "text",
        label:       "Email de contacto",
        placeholder: "maria@exemplo.pt",
        hint:        "Para enviarmos o documento e futura correspondência",
        required:    false,
        autoFill:    "email",
        validation: [
          {
            type:    "pattern",
            value:   "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
            message: "Email inválido",
          },
        ],
      },
      {
        id:          "phone",
        type:        "phone",
        label:       "Número de telemóvel",
        placeholder: "9XX XXX XXX",
        hint:        "Opcional",
        required:    false,
        autoFill:    "phone",
        validation: [
          {
            type:    "pattern",
            value:   "^(\\+351|00351)?[239][0-9]{8}$",
            message: "Número de telemóvel inválido (formato português)",
          },
        ],
      },
      // Consent
      {
        id:       "consentDataProcessing",
        type:     "radio_button",
        label:    "Autorizo o tratamento dos meus dados pessoais para geração do documento",
        hint:     "Obrigatório. Os teus dados são usados apenas para gerar o documento de contestação. Ver Política de Privacidade.",
        required: true,
        options: [
          { value: "yes", label: "Sim, autorizo" },
        ],
        validation: [
          { type: "required", message: "É necessário dar consentimento para continuar" },
          { type: "custom",   value: "must_be_yes", message: "Deves autorizar o tratamento de dados para gerar o documento" },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 6 — Revisão + Gerar
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id:       6,
    key:      "review",
    title:    "Revisão final",
    subtitle: "Confirma os dados antes de gerar a tua carta de contestação",
    icon:     "✅",
    nextLabel: "Gerar Documento",
    analyticsEvent: "wizard_step6_review",
    fields: [
      // This step is rendered entirely by the ReviewStep component
      // using the accumulated WizardState — no declarative fields needed
    ],
  },
];
