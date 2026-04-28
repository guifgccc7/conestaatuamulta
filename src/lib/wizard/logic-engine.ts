// ─── Wizard Logic Engine ──────────────────────────────────────────────────────
// Computes available defenses, step visibility, and field conditions
// based on the accumulated wizard state.

// ─── State shape ──────────────────────────────────────────────────────────────

export interface FineTypeState {
  fineCategory?: string;
  speedingSubtype?: string;
  parkingSubtype?: string;
}

export interface FineDetailsState {
  fineReference?: string;
  fineDate?: string;
  fineTime?: string;
  fineAuthority?: string;
  fineLocation?: string;
  vehiclePlate?: string;
  speedRegistered?: number;
  speedLimit?: number;
  fineAmount?: string;
}

export interface ContextState {
  wasDriverAtTime?: "yes" | "no" | "uncertain";
  realDriverName?: string;
  agreesWithFine?: "no" | "partial" | "yes";
  hasEvidence?: "yes" | "no" | "partial";
  evidenceTypes?: string[];
  fineHasDefects?: "yes" | "no";
  fineDefectTypes?: string[];
  radarCalibration?: "yes" | "no" | "unknown";
  speedSignageVisible?: "yes" | "no" | "unclear" | "unknown";
  parkingSignageVisible?: "yes" | "no" | "unclear" | "unknown";
  parkingEmergency?: "yes" | "no";
  parkingEmergencyDetail?: string;
  // Outro error
  fineDefectOtherDescription?: string;
  // Sanção acessória
  hasSancaoAcessoria?: "yes" | "no";
  sancaoAcessoriaDescription?: string;
  // EMEL / municipal operator specific
  emelMaFe?: "yes" | "no" | "unknown";
  emelMaFeDetail?: string;
  emelForaHorario?: "yes" | "no" | "unknown";
  emelForaHorarioHora?: string;
}

export interface PersonalDataState {
  fullName?: string;
  nif?: string;
  ccNumber?: string;
  address?: string;
  email?: string;
  phone?: string;
  consentDataProcessing?: "yes";
}

export interface LegalGroundsState {
  selectedGrounds?: string[];   // IDs of selected defenses
  additionalNotes?: string;
}

export interface WizardState {
  currentStep: number;
  fineType:     FineTypeState;
  fineDetails:  FineDetailsState;
  context:      ContextState;
  legalGrounds: LegalGroundsState;
  personalData: PersonalDataState;
}

export const INITIAL_STATE: WizardState = {
  currentStep:  1,
  fineType:     {},
  fineDetails:  {},
  context:      {},
  legalGrounds: { selectedGrounds: [] },
  personalData: {},
};

// ─── Defense suggestion ────────────────────────────────────────────────────────

export type DefenseStrength = "strong" | "medium" | "weak";

export interface DefenseSuggestion {
  id:          string;
  title:       string;
  summary:     string;          // 1–2 sentence explanation for non-lawyers
  legalBasis:  string;          // cite: "Art. XX.º CE / RGCO"
  strength:    DefenseStrength;
  strengthLabel: string;        // pt-PT label
  score:       number;          // 0–100, used for sorting
  tags:        string[];        // ["SPEEDING", "ALL"] — for filtering
  recommended: boolean;         // pre-selected for the user
  icon:        string;
}

// ─── Defense scoring engine ────────────────────────────────────────────────────
// Each defense is a pure function of WizardState → {applicable: boolean, score: number}

type DefenseRule = {
  id:          string;
  title:       string;
  summary:     string;
  legalBasis:  string;
  icon:        string;
  tags:        string[];
  evaluate:    (s: WizardState) => { applicable: boolean; score: number; recommended?: boolean };
};

const DEFENSE_RULES: DefenseRule[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // UNIVERSAL DEFENSES (applicable to any fine type)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id:         "prescription",
    title:      "Prescrição do procedimento",
    summary:    "Se passaram mais de 2 anos desde a infração sem decisão condenatória transitada, o processo extingue-se por prescrição.",
    legalBasis: "Art. 27.º e 28.º do RGCO (DL 433/82)",
    icon:       "⏰",
    tags:       ["ALL"],
    evaluate: (s) => {
      if (!s.fineDetails.fineDate) return { applicable: false, score: 0 };
      const infDate = new Date(s.fineDetails.fineDate);
      const ageYears = (Date.now() - infDate.getTime()) / (365.25 * 24 * 3600 * 1000);
      const isPrescribed = s.context.fineDefectTypes?.includes("prescription");
      if (isPrescribed || ageYears >= 1.8) {
        return { applicable: true, score: ageYears >= 2 ? 95 : 60, recommended: ageYears >= 2 };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "in_dubio",
    title:      "Falta de prova — in dubio pro reo",
    summary:    "Sem fotografia, registo ou outra prova objetiva, a dúvida resolve-se sempre a favor do arguido. A auto por si só não é prova suficiente.",
    legalBasis: "Art. 32.º, n.º 2 CRP; Art. 50.º RGCO",
    icon:       "🔍",
    tags:       ["ALL"],
    evaluate: (s) => {
      const noEvidence = s.context.fineDefectTypes?.includes("missing_evidence");
      const theyHaveNoProof = s.context.hasEvidence === "no";
      if (noEvidence) return { applicable: true, score: 88, recommended: true };
      if (theyHaveNoProof) return { applicable: true, score: 70, recommended: true };
      return { applicable: true, score: 45, recommended: false };
    },
  },
  {
    id:         "notification_defect",
    title:      "Nulidade da notificação",
    summary:    "A notificação deve conter prazo de defesa, identificação da infração e forma de exercer o direito de audição. Se faltar algum destes elementos, é nula.",
    legalBasis: "Art. 70.º e 79.º do RGCO",
    icon:       "✉️",
    tags:       ["ALL"],
    evaluate: (s) => {
      const defects = s.context.fineDefectTypes ?? [];
      if (defects.includes("late_notification") || defects.includes("no_hearing")) {
        return { applicable: true, score: 85, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "no_prior_hearing",
    title:      "Violação do direito de audição prévia",
    summary:    "É ilegal aplicar uma coima sem dar ao arguido a oportunidade de se defender primeiro. A omissão deste direito é causa de nulidade do processo.",
    legalBasis: "Art. 50.º do RGCO; Art. 32.º, n.º 10 CRP; Acórdão TC 245/2009",
    icon:       "📜",
    tags:       ["ALL"],
    evaluate: (s) => {
      if (s.context.fineDefectTypes?.includes("no_hearing")) {
        return { applicable: true, score: 92, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "wrong_driver",
    title:      "Não era o/a condutor/a — identificação de terceiro",
    summary:    "Se identificares a pessoa que realmente conduzia, a responsabilidade é transferida para ela. Enquanto titular do veículo, podes ser absolvido/a.",
    legalBasis: "Art. 134.º, n.º 1 do Código da Estrada; Art. 7.º RGCO",
    icon:       "👤",
    tags:       ["ALL"],
    evaluate: (s) => {
      if (s.context.wasDriverAtTime === "no") {
        const identified = !!s.context.realDriverName;
        return { applicable: true, score: identified ? 90 : 65, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "ne_bis_in_idem",
    title:      "Ne bis in idem — dupla punição",
    summary:    "Ninguém pode ser punido duas vezes pelo mesmo facto. Se já foste condenado/a por esta infração noutro processo, este deve ser arquivado.",
    legalBasis: "Art. 29.º, n.º 5 da CRP",
    icon:       "⚖️",
    tags:       ["ALL"],
    evaluate: (s) => {
      // Only suggest if there are defect concerns
      return { applicable: false, score: 0 }; // manual trigger only
    },
  },
  {
    id:         "auto_formal_defect",
    title:      "Nulidade do auto — elementos obrigatórios em falta",
    summary:    "O auto deve conter, obrigatoriamente, a descrição dos factos, a norma violada, data, local e identificação do agente. Qualquer omissão pode invalida-lo.",
    legalBasis: "Art. 58.º do RGCO",
    icon:       "📋",
    tags:       ["ALL"],
    evaluate: (s) => {
      const defects = s.context.fineDefectTypes ?? [];
      const hasFormalDefect =
        defects.includes("no_agent_id") ||
        defects.includes("wrong_date")  ||
        defects.includes("wrong_location") ||
        defects.includes("outro");
      if (s.fineType.fineCategory === "ADMIN_ERROR" || hasFormalDefect) {
        return { applicable: true, score: 88, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "wrong_plate",
    title:      "Identificação incorreta do veículo — matrícula errada",
    summary:    "Se a matrícula inscrita no auto não é a do teu veículo, o auto é nulo. Este é um dos vícios mais fáceis de provar e com maior taxa de êxito.",
    legalBasis: "Art. 58.º, al. b) do RGCO; Art. 169.º CE",
    icon:       "❌",
    tags:       ["ALL"],
    evaluate: (s) => {
      if (s.context.fineDefectTypes?.includes("wrong_plate")) {
        return { applicable: true, score: 95, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "reduce_fine",
    title:      "Pedido de redução da coima ao mínimo legal",
    summary:    "Mesmo sem absolvição, podes pedir a redução da coima para o mínimo legal com base na tua situação económica e ausência de antecedentes.",
    legalBasis: "Art. 18.º e 72.º-A do RGCO",
    icon:       "📉",
    tags:       ["ALL"],
    evaluate: (s) => {
      // Always applicable as fallback
      return { applicable: true, score: 35, recommended: s.context.agreesWithFine === "yes" };
    },
  },
  {
    id:         "outro_defect",
    title:      "Irregularidade identificada pelo arguido",
    summary:    "O/A arguido/a detetou uma irregularidade específica no auto ou na notificação que não se enquadra nas categorias predefinidas mas que pode ser determinante para a nulidade do processo.",
    legalBasis: "Art. 58.º do RGCO",
    icon:       "🔧",
    tags:       ["ALL"],
    evaluate: (s) => {
      if (s.context.fineDefectTypes?.includes("outro")) {
        const hasDesc = !!s.context.fineDefectOtherDescription?.trim();
        return { applicable: true, score: hasDesc ? 78 : 55, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "sancao_acessoria",
    title:      "Contestação da sanção acessória",
    summary:    "A sanção acessória (inibição de conduzir, apreensão de carta, etc.) deve ser expressamente impugnada. Se não for contestada, pode ser aplicada mesmo que a coima seja reduzida ou anulada.",
    legalBasis: "Arts. 21.º e 22.º do RGCO; Arts. 148.º e 69.º do CE",
    icon:       "🚫",
    tags:       ["ALL"],
    evaluate: (s) => {
      if (s.context.hasSancaoAcessoria === "yes") {
        return { applicable: true, score: 92, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPEEDING — specific defenses
  // ─────────────────────────────────────────────────────────────────────────
  {
    id:         "radar_no_calibration",
    title:      "Radar sem verificação metrológica válida",
    summary:    "A lei obriga a que o radar tenha certificado de verificação periódica válido. Sem este certificado, a medição não tem valor probatório.",
    legalBasis: "DL 291/90; Portaria 1504/2008; Acórdão TRP 14/11/2018",
    icon:       "📡",
    tags:       ["SPEEDING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "SPEEDING") return { applicable: false, score: 0 };
      if (s.context.radarCalibration === "no") return { applicable: true, score: 90, recommended: true };
      if (s.context.radarCalibration === "unknown") return { applicable: true, score: 65, recommended: true };
      return { applicable: true, score: 45, recommended: false }; // always worth checking
    },
  },
  {
    id:         "no_speed_signage",
    title:      "Ausência ou ilegibilidade de sinalização do limite",
    summary:    "Se não havia sinalização visível do limite de velocidade, a infração não pode ser imputada ao condutor — que não tinha como saber o limite em vigor.",
    legalBasis: "Art. 13.º e 88.º CE; RST DL 22-A/98",
    icon:       "🚫",
    tags:       ["SPEEDING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "SPEEDING") return { applicable: false, score: 0 };
      if (s.context.speedSignageVisible === "no") return { applicable: true, score: 80, recommended: true };
      if (s.context.speedSignageVisible === "unclear") return { applicable: true, score: 65, recommended: true };
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "error_margin",
    title:      "Não dedução da margem de erro do equipamento",
    summary:    "A portaria metrológica obriga a deduzir uma margem de erro ao valor medido. Se não foi deduzida, a velocidade real pode estar dentro do limite legal.",
    legalBasis: "Portaria 1504/2008; DL 291/90; Regulamento de Metrologia Legal",
    icon:       "📏",
    tags:       ["SPEEDING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "SPEEDING") return { applicable: false, score: 0 };
      const registered = s.fineDetails.speedRegistered ?? 0;
      const limit      = s.fineDetails.speedLimit ?? 0;
      const excess     = registered - limit;
      // Most valuable when excess is small (within typical error margins: 3km/h or 3%)
      if (excess > 0 && excess <= 5) return { applicable: true, score: 85, recommended: true };
      if (excess > 5 && excess <= 10) return { applicable: true, score: 65, recommended: true };
      return { applicable: true, score: 40, recommended: false };
    },
  },
  {
    id:         "wrong_speed_category",
    title:      "Categorização incorreta do excesso de velocidade",
    summary:    "O excesso registado coloca-te num escalão de coima menor do que o aplicado. A coima está inflacionada por erro de categorização.",
    legalBasis: "Art. 24.º, n.º 1 do Código da Estrada (tabela de escalões)",
    icon:       "📊",
    tags:       ["SPEEDING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "SPEEDING") return { applicable: false, score: 0 };

      const registered = s.fineDetails.speedRegistered;
      const limit      = s.fineDetails.speedLimit;

      // Cannot evaluate without both data points
      if (!registered || !limit) return { applicable: false, score: 0 };

      const excess = registered - limit;

      // No actual excess — bracket misclassification argument doesn't exist
      if (excess <= 0) return { applicable: false, score: 0 };

      // CE Art. 24 n.º 1 bracket boundaries for excess speed (km/h):
      //   ≤ 20 km/h  → escalão 1 (lighter)
      //   21–40 km/h → escalão 2
      //   41–60 km/h → escalão 3
      //   > 60 km/h  → escalão 4 (heaviest — includes suspension)
      // The defense is strongest when the excess is ≤ 3 km/h above a threshold
      // (measurement tolerance ±3 km/h or ±3%, whichever is higher per
      //  Portaria 1504/2008 and DL 291/90).
      const BRACKET_THRESHOLDS = [20, 40, 60] as const;
      const TOLERANCE_KMH = 3; // minimum instrument tolerance (Portaria 1504/2008)

      for (const threshold of BRACKET_THRESHOLDS) {
        if (excess > threshold && excess <= threshold + TOLERANCE_KMH) {
          // Within measurement tolerance of the bracket boundary —
          // arguing for the lower bracket is strong and realistic.
          return { applicable: true, score: 80, recommended: true };
        }
      }

      // Excess is well within the lowest bracket — measurement error could still
      // matter but the bracket argument is much weaker.
      if (excess <= 20) {
        return { applicable: true, score: 40, recommended: false };
      }

      // Large excess — bracket misclassification extremely unlikely
      return { applicable: false, score: 0 };
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // PARKING — specific defenses
  // ─────────────────────────────────────────────────────────────────────────
  {
    id:         "no_parking_signage",
    title:      "Ausência ou deficiência de sinalização de proibição",
    summary:    "A proibição de estacionar exige sinalização clara e legalmente conforme. Sem ela, o condutor não tem como saber que o estacionamento era proibido.",
    legalBasis: "Art. 48.º CE; RST DL 22-A/98; Portaria 1538/2004",
    icon:       "🚫",
    tags:       ["PARKING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "PARKING") return { applicable: false, score: 0 };
      if (s.context.parkingSignageVisible === "no") return { applicable: true, score: 82, recommended: true };
      if (s.context.parkingSignageVisible === "unclear") return { applicable: true, score: 68, recommended: true };
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "force_majeure",
    title:      "Paragem de emergência / força maior",
    summary:    "A lei isenta de responsabilidade quando a paragem é imposta por circunstâncias alheias à vontade do condutor: avaria, urgência médica, acidente.",
    legalBasis: "Art. 49.º, n.º 2 do Código da Estrada",
    icon:       "🆘",
    tags:       ["PARKING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "PARKING") return { applicable: false, score: 0 };
      const hasMedical  = s.context.evidenceTypes?.includes("medical");
      const hasWorkshop = s.context.evidenceTypes?.includes("workshop_receipt");
      if (s.context.parkingEmergency === "yes") {
        return {
          applicable: true,
          score:      hasMedical || hasWorkshop ? 88 : 70,
          recommended: true,
        };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "estado_necessidade",
    title:      "Estado de necessidade desculpante",
    summary:    "Quem atua em estado de necessidade desculpante age sem culpa, quando lhe não seja exigível comportamento diferente — desde que não tenha colocado em perigo a circulação e a vida dos demais condutores. A ausência de culpa exclui a responsabilidade contraordenacional.",
    legalBasis: "Art. 35.º do Código Penal (ex vi art. 32.º RGCO); Art. 49.º, n.º 2 CE",
    icon:       "🚨",
    tags:       ["PARKING", "ALL"],
    evaluate: (s) => {
      const hasMedical  = s.context.evidenceTypes?.includes("medical");
      const hasWorkshop = s.context.evidenceTypes?.includes("workshop_receipt");
      const isEmergency = s.context.parkingEmergency === "yes";
      // Applicable for any fine type when there's an emergency situation
      if (isEmergency) {
        return {
          applicable:  true,
          score:       hasMedical || hasWorkshop ? 90 : 75,
          recommended: true,
        };
      }
      // Also suggest if evidence includes medical/workshop even without explicit emergency flag
      if (hasMedical || hasWorkshop) {
        return { applicable: true, score: 65, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "disability_badge",
    title:      "Cartão de estacionamento para pessoas com deficiência",
    summary:    "O titular de cartão europeu de estacionamento para deficientes tem direito a estacionar em determinados locais, estando o veículo isento de algumas restrições.",
    legalBasis: "DL 307/2003, de 10/12; Art. 117.º e 118.º CE",
    icon:       "♿",
    tags:       ["PARKING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "PARKING") return { applicable: false, score: 0 };
      if (s.context.evidenceTypes?.includes("disability_card")) {
        return { applicable: true, score: 92, recommended: true };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "parking_authority_incompetence",
    title:      "Incompetência territorial da entidade autuante",
    summary:    "A EMEL e outras empresas municipais só podem fiscalizar dentro da sua área de concessão. Uma autuação fora dessa área é nula por incompetência.",
    legalBasis: "DL 44/2002, de 2/03; Art. 133.º CPA",
    icon:       "🗺️",
    tags:       ["PARKING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "PARKING") return { applicable: false, score: 0 };
      if (s.fineDetails.fineAuthority === "EMEL") {
        return { applicable: true, score: 55, recommended: false };
      }
      return { applicable: false, score: 0 };
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // EMEL / MUNICIPAL OPERATOR — specific defenses
  // ─────────────────────────────────────────────────────────────────────────
  {
    id:         "emel_ma_fe",
    title:      "Má-fé ou abuso de poder da entidade autuante",
    summary:    "Quando o agente autuante age de forma arbitrária, seletiva ou com o objetivo de maximizar receita em vez de cumprir a lei, a autuação pode ser anulada por desvio de poder e violação dos princípios da boa-fé e da prossecução do interesse público.",
    legalBasis: "Arts. 266.º, n.º 2 e 268.º CRP; Arts. 10.º, 69.º e 161.º CPA (desvio de poder)",
    icon:       "⚠️",
    tags:       ["PARKING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "PARKING") return { applicable: false, score: 0 };
      const isMunicipal = ["EMEL", "SMTUC", "MUNICIPALITY"].includes(s.fineDetails.fineAuthority ?? "");
      if (!isMunicipal) return { applicable: false, score: 0 };
      if (s.context.emelMaFe === "yes") {
        const hasDetail = !!s.context.emelMaFeDetail?.trim();
        return { applicable: true, score: hasDetail ? 75 : 55, recommended: true };
      }
      if (s.context.emelMaFe === "unknown") {
        return { applicable: true, score: 40, recommended: false };
      }
      return { applicable: false, score: 0 };
    },
  },
  {
    id:         "emel_fora_horario",
    title:      "Autuação fora do horário de fiscalização permitido",
    summary:    "A EMEL e operadores municipais só podem autuar dentro do horário contratualizado com a câmara municipal. Uma autuação antes ou depois desse horário é nula.",
    legalBasis: "Contrato de concessão EMEL/CML; DL 44/2002; Art. 133.º CPA",
    icon:       "🕐",
    tags:       ["PARKING"],
    evaluate: (s) => {
      if (s.fineType.fineCategory !== "PARKING") return { applicable: false, score: 0 };
      const isMunicipal = ["EMEL", "SMTUC", "MUNICIPALITY"].includes(s.fineDetails.fineAuthority ?? "");
      if (!isMunicipal) return { applicable: false, score: 0 };
      if (s.context.emelForaHorario === "yes") {
        return { applicable: true, score: 85, recommended: true };
      }
      if (s.context.emelForaHorario === "unknown") {
        return { applicable: true, score: 50, recommended: false };
      }
      return { applicable: false, score: 0 };
    },
  },
];

// ─── Public API ────────────────────────────────────────────────────────────────

export function computeDefenses(state: WizardState): DefenseSuggestion[] {
  const results: DefenseSuggestion[] = [];

  for (const rule of DEFENSE_RULES) {
    const { applicable, score, recommended } = rule.evaluate(state);
    if (!applicable) continue;

    const strength: DefenseStrength =
      score >= 80 ? "strong" : score >= 55 ? "medium" : "weak";

    const strengthLabel: Record<DefenseStrength, string> = {
      strong: "Argumento forte",
      medium: "Argumento moderado",
      weak:   "Argumento de suporte",
    };

    results.push({
      id:           rule.id,
      title:        rule.title,
      summary:      rule.summary,
      legalBasis:   rule.legalBasis,
      strength,
      strengthLabel: strengthLabel[strength],
      score,
      tags:         rule.tags,
      recommended:  recommended ?? false,
      icon:         rule.icon,
    });
  }

  // Sort: recommended first, then by score desc
  return results.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return b.score - a.score;
  });
}

/** Returns the step numbers that should be visible given current state */
export function getVisibleSteps(state: WizardState): number[] {
  // All 6 steps are always shown in this wizard
  return [1, 2, 3, 4, 5, 6];
}

/** Returns the step key for a given step number */
export function getStepKey(step: number): keyof Omit<WizardState, "currentStep"> {
  const map: Record<number, keyof Omit<WizardState, "currentStep">> = {
    1: "fineType",
    2: "fineDetails",
    3: "context",
    4: "legalGrounds",
    5: "personalData",
    6: "personalData", // review uses personalData as last step's data key
  };
  return map[step] ?? "fineType";
}

/** Compute a human-readable summary of the case for the Review step */
export interface CaseSummary {
  fineTypeLabel:  string;
  dateLabel:      string;
  authorityLabel: string;
  locationLabel:  string;
  plateLabel:     string;
  driverLabel:    string;
  defenseCount:   number;
  topDefense:     string | null;
  strengthOverall: DefenseStrength;
}

export function computeCaseSummary(state: WizardState): CaseSummary {
  const CATEGORY_LABELS: Record<string, string> = {
    SPEEDING:      "Excesso de Velocidade",
    PARKING:       "Estacionamento Proibido",
    TRAFFIC_LIGHT: "Semáforo Vermelho",
    MOBILE_PHONE:  "Uso de Telemóvel",
    SEATBELT:      "Falta de Cinto",
    ADMIN_ERROR:   "Erro Administrativo",
    OTHER:         "Outra Infração",
  };

  const defenses = computeDefenses(state);
  const selected = defenses.filter(
    (d) => state.legalGrounds.selectedGrounds?.includes(d.id)
  );
  const topDefense = selected.length > 0
    ? selected.sort((a, b) => b.score - a.score)[0].title
    : null;

  const strongCount  = selected.filter((d) => d.strength === "strong").length;
  const strengthOverall: DefenseStrength =
    strongCount >= 2 ? "strong" : strongCount >= 1 ? "medium" : "weak";

  return {
    fineTypeLabel:   CATEGORY_LABELS[state.fineType.fineCategory ?? ""] ?? "—",
    dateLabel:       state.fineDetails.fineDate
                       ? new Date(state.fineDetails.fineDate).toLocaleDateString("pt-PT")
                       : "—",
    authorityLabel:  state.fineDetails.fineAuthority ?? "—",
    locationLabel:   state.fineDetails.fineLocation ?? "—",
    plateLabel:      state.fineDetails.vehiclePlate ?? "—",
    driverLabel:     state.context.wasDriverAtTime === "no"
                       ? `Não (condutor: ${state.context.realDriverName ?? "identificar"})`
                       : "Sim",
    defenseCount:    selected.length,
    topDefense,
    strengthOverall,
  };
}

/** Validate a single field value against its validation rules */
export function validateField(
  fieldId: string,
  value: unknown,
  state: WizardState
): string | null {
  // NIF check-digit validation
  if (fieldId === "nif" && typeof value === "string") {
    return validateNIF(value) ? null : "NIF inválido (dígito de controlo incorreto)";
  }
  return null; // other validation handled by Zod in validation.ts
}

function validateNIF(nif: string): boolean {
  if (!/^[1-9][0-9]{8}$/.test(nif)) return false;
  const digits = nif.split("").map(Number);
  const check  = digits[8];
  const sum    = digits
    .slice(0, 8)
    .reduce((acc, d, i) => acc + d * (9 - i), 0);
  const mod    = sum % 11;
  const expected = mod < 2 ? 0 : 11 - mod;
  return check === expected;
}
