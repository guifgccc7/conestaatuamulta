// ─── Shared TypeScript Types ──────────────────────────────────────────────────

export type CaseType =
  | "SPEEDING"
  | "PARKING"
  | "ADMIN_ERROR"
  | "MOBILE_PHONE"
  | "SEATBELT"
  | "TRAFFIC_LIGHT"
  | "OTHER";

export type CaseStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "READY"
  | "DOWNLOADED"
  | "SUBMITTED";

export type SubscriptionStatus =
  | "FREE"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "TRIALING";

// ─── Wizard Form Data ─────────────────────────────────────────────────────────

export interface WizardFormData {
  // Step 1: Tipo de infração
  caseType: CaseType;

  // Step 2: Dados da multa
  fineNumber: string;
  fineDate: string;        // ISO date string
  fineEntity: string;      // GNR | PSP | ANSR | EMEL | Outros
  fineLocation: string;
  vehiclePlate: string;
  vehicleOwnerName: string;
  vehicleOwnerNif: string; // NIF for legal identification
  vehicleOwnerAddress: string;

  // Step 3: Detalhes específicos (conditional by caseType)
  violationData: SpeedingData | ParkingData | AdminErrorData | OtherData;

  // Step 4: Fundamentos da contestação
  contestationGrounds: ContestationGround[];
  additionalNotes: string;
}

// ─── Violation-specific data shapes ──────────────────────────────────────────

export interface SpeedingData {
  allegedSpeed: number;       // km/h registado na auto
  legalLimit: number;         // limite legal no local
  measurementDevice: string;  // radar fixo | radar móvel | LIDAR | outro
  deviceCertified: boolean | null; // calibração verificada?
  evidenceProvided: boolean;  // foi exibida evidência?
  signageVisible: boolean | null; // sinalização de limite visível?
}

export interface ParkingData {
  parkingEntity: "EMEL" | "SMTUC" | "GNR" | "PSP" | "Municipio" | "Outro";
  prohibitionType: string;    // tipo de proibição alegada
  signagePresent: boolean | null;
  disabledBadge: boolean;
  emergencyStop: boolean;
  ticketOnVehicle: boolean;   // foi colocado talão no veículo?
}

export interface AdminErrorData {
  errorType:
    | "WRONG_PLATE"
    | "WRONG_DATE"
    | "WRONG_LOCATION"
    | "MISSING_EVIDENCE"
    | "NOTIFICATION_DEFECT"
    | "PRESCRIPTION"
    | "OTHER";
  errorDescription: string;
  supportingDocuments: string[]; // file names / descriptions
}

export interface OtherData {
  description: string;
}

// ─── Legal grounds ────────────────────────────────────────────────────────────

export interface ContestationGround {
  id: string;
  label: string;
  legalBasis: string;
  selected: boolean;
  freeText?: string;
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  caseType: CaseType;
  status: CaseStatus;
  fineNumber: string | null;
  fineDate: string | null;
  fineEntity: string | null;
  createdAt: string;
  documents: { id: string; status: string; pdfUrl: string | null }[];
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export const PRICING = {
  SINGLE_DOC: {
    amount: 990,           // €9.90 em cêntimos
    label: "€9,90",
    description: "1 contestação",
  },
  SUBSCRIPTION: {
    amount: 490,           // €4.90/mês em cêntimos
    label: "€4,90/mês",
    description: "Contestações ilimitadas",
  },
} as const;
