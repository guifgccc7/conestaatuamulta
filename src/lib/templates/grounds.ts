// ─── Available contestation grounds per case type ────────────────────────────
// Each ground has a legal basis reference and a pre-written paragraph
// that gets injected into the minuta.

import { CaseType, ContestationGround } from "@/types";

export function getAvailableGrounds(caseType: CaseType): ContestationGround[] {
  const common: ContestationGround[] = [
    {
      id: "prescription",
      label: "Prescrição do procedimento contraordenacional",
      legalBasis: "Art. 27.º e 28.º do RGCO (DL 433/82)",
      selected: false,
      freeText: "",
    },
    {
      id: "notification_defect",
      label: "Nulidade/irregularidade da notificação",
      legalBasis: "Art. 70.º e 79.º do RGCO",
      selected: false,
      freeText: "",
    },
    {
      id: "wrong_plate",
      label: "Identificação incorreta da matrícula do veículo",
      legalBasis: "Art. 169.º do Código da Estrada; Art. 58.º do RGCO",
      selected: false,
      freeText: "",
    },
    {
      id: "ne_bis_in_idem",
      label: "Dupla punição pelo mesmo facto (ne bis in idem)",
      legalBasis: "Art. 29.º, n.º 5 da CRP; Art. 3.º do RGCO",
      selected: false,
      freeText: "",
    },
    {
      id: "in_dubio",
      label: "Princípio in dubio pro reo — ausência de prova",
      legalBasis: "Art. 32.º, n.º 2 da CRP; Art. 50.º do RGCO",
      selected: false,
      freeText: "",
    },
  ];

  const byType: Record<CaseType, ContestationGround[]> = {
    SPEEDING: [
      {
        id: "speed_no_calibration",
        label: "Falta de certificado de calibração/verificação do radar",
        legalBasis:
          "Art. 5.º do DL 291/90; Portaria 1504/2008; Portaria 963/2022 (IPAC)",
        selected: false,
        freeText: "",
      },
      {
        id: "speed_no_evidence",
        label: "Falta de registo fotográfico ou prova do excesso de velocidade",
        legalBasis: "Art. 170.º e 172.º do Código da Estrada; Art. 116.º do CE",
        selected: false,
        freeText: "",
      },
      {
        id: "speed_no_signage",
        label: "Ausência ou ilegibilidade de sinalização do limite de velocidade",
        legalBasis: "Art. 13.º e 88.º do Código da Estrada",
        selected: false,
        freeText: "",
      },
      {
        id: "speed_margin_error",
        label: "Não dedução da margem de erro do equipamento de medição",
        legalBasis:
          "Portaria 1504/2008; Regulamento de Metrologia Legal (DL 291/90)",
        selected: false,
        freeText: "",
      },
      {
        id: "speed_wrong_category",
        label: "Incorreta categorização da infração (limite errado aplicado)",
        legalBasis: "Art. 24.º do Código da Estrada",
        selected: false,
        freeText: "",
      },
    ],
    PARKING: [
      {
        id: "parking_no_signage",
        label: "Ausência ou deficiente sinalização da proibição de estacionamento",
        legalBasis: "Art. 48.º do Código da Estrada; Art. 59.º do CE",
        selected: false,
        freeText: "",
      },
      {
        id: "parking_force_majeure",
        label: "Paragem de emergência/força maior (avaria, mal-estar, etc.)",
        legalBasis: "Art. 49.º, n.º 2 do Código da Estrada",
        selected: false,
        freeText: "",
      },
      {
        id: "parking_disabled_badge",
        label: "Detentor de cartão de estacionamento para pessoas com deficiência",
        legalBasis: "DL 307/2003 de 10 de dezembro; Art. 118.º do CE",
        selected: false,
        freeText: "",
      },
      {
        id: "parking_ticket_missing",
        label: "Talão de estacionamento não colocado no veículo (irregularidade processual)",
        legalBasis: "Art. 169.º, n.º 1, al. f) do Código da Estrada",
        selected: false,
        freeText: "",
      },
      {
        id: "parking_emel_competence",
        label: "Incompetência territorial ou material do agente autuante",
        legalBasis: "Art. 48.º do RGCO; DL 44/2002",
        selected: false,
        freeText: "",
      },
    ],
    ADMIN_ERROR: [
      {
        id: "admin_wrong_date",
        label: "Data ou hora da infração indicada incorretamente na auto",
        legalBasis: "Art. 58.º, al. c) do RGCO",
        selected: false,
        freeText: "",
      },
      {
        id: "admin_wrong_location",
        label: "Local da infração indicado incorretamente ou de forma imprecisa",
        legalBasis: "Art. 58.º, al. d) do RGCO",
        selected: false,
        freeText: "",
      },
      {
        id: "admin_no_identification",
        label: "Falta de identificação do agente autuante",
        legalBasis: "Art. 58.º, al. a) do RGCO",
        selected: false,
        freeText: "",
      },
      {
        id: "admin_notification_late",
        label: "Notificação fora do prazo legal",
        legalBasis: "Art. 70.º do RGCO — prazo máximo de 5 anos",
        selected: false,
        freeText: "",
      },
    ],
    MOBILE_PHONE: [
      {
        id: "mobile_no_evidence",
        label: "Falta de prova do uso do telemóvel (sem fotografia ou testemunha)",
        legalBasis: "Art. 84.º do Código da Estrada; Art. 50.º do RGCO",
        selected: false,
        freeText: "",
      },
      {
        id: "mobile_hands_free",
        label: "Dispositivo utilizado em modo mãos-livres/kit automóvel",
        legalBasis: "Art. 84.º, n.º 2 do Código da Estrada",
        selected: false,
        freeText: "",
      },
    ],
    SEATBELT: [
      {
        id: "seatbelt_medical",
        label: "Isenção médica de uso de cinto de segurança",
        legalBasis: "Art. 82.º, n.º 3 do Código da Estrada; Portaria 788/83",
        selected: false,
        freeText: "",
      },
      {
        id: "seatbelt_no_evidence",
        label: "Falta de prova da ausência do cinto",
        legalBasis: "Art. 82.º do Código da Estrada; Art. 50.º do RGCO",
        selected: false,
        freeText: "",
      },
    ],
    TRAFFIC_LIGHT: [
      {
        id: "tlight_malfunction",
        label: "Avaria ou mau funcionamento do semáforo",
        legalBasis: "Art. 69.º do Código da Estrada",
        selected: false,
        freeText: "",
      },
      {
        id: "tlight_no_evidence",
        label: "Ausência de prova (sem registo fotográfico/vídeo)",
        legalBasis: "Art. 50.º do RGCO; Art. 32.º, n.º 2 CRP",
        selected: false,
        freeText: "",
      },
    ],
    OTHER: [],
  };

  return [...(byType[caseType] ?? []), ...common];
}
