// ─── Zod Validation Schemas — one per wizard step ────────────────────────────

import { z } from "zod";

// ─── Custom validators ─────────────────────────────────────────────────────────

const ptPlateRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}$|^[0-9]{2}[A-Z]{2}[0-9]{2}$|^[0-9]{4}[A-Z]{2}$/;

/**
 * Accepts Portuguese mobile (9XX) and geographic (2XX/3XX) numbers.
 * Optional +351 / 00351 prefix.  Spaces ignored (stripped before test).
 */
const ptPhoneRegex = /^(\+351|00351)?[239][0-9]{8}$/;

const ptNIFRegex   = /^[1-9][0-9]{8}$/;
const timeRegex    = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

/** Portuguese postal code inside an address string, e.g. 1200-001 */
const ptPostalCodeRegex = /\d{4}-\d{3}/;

function validateNIF(nif: string): boolean {
  if (!ptNIFRegex.test(nif)) return false;
  const digits   = nif.split("").map(Number);
  const sum      = digits.slice(0, 8).reduce((a, d, i) => a + d * (9 - i), 0);
  const mod      = sum % 11;
  const expected = mod < 2 ? 0 : 11 - mod;
  return digits[8] === expected;
}

function normalisePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s\-.]/g, "");
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

/** Contraordenações prescrevem em 5 anos (art. 27.º RGCO / DL 433/82) */
const MAX_FINE_AGE_YEARS = 5;

function isValidCalendarDate(d: string): boolean {
  const date = new Date(d);
  return !isNaN(date.getTime());
}

function isNotFuture(d: string): boolean {
  return new Date(d) <= new Date();
}

function isNotTooOld(d: string): boolean {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - MAX_FINE_AGE_YEARS);
  return new Date(d) >= cutoff;
}

// ─── Step 1 ────────────────────────────────────────────────────────────────────

export const step1Schema = z.object({
  fineCategory: z.enum(
    ["SPEEDING", "PARKING", "TRAFFIC_LIGHT", "MOBILE_PHONE", "SEATBELT", "ADMIN_ERROR", "OTHER"],
    { required_error: "Seleciona o tipo de multa para continuar" }
  ),
  speedingSubtype: z.string().optional(),
  parkingSubtype:  z.string().optional(),
});

export type Step1Values = z.infer<typeof step1Schema>;

// ─── Step 2 ────────────────────────────────────────────────────────────────────

/**
 * Base step-2 schema.
 * Cross-field speed validation (registered > limit, conditional required) is
 * added separately via buildStep2SchemaWithContext() so that it can receive
 * the fineCategory from step 1 without breaking the per-step validation API.
 */
export const step2Schema = z.object({

  fineReference: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .refine((v) => !v || v.length <= 50, "Máximo 50 caracteres"),

  fineDate: z
    .string({ required_error: "A data da infração é obrigatória" })
    .min(1, "A data da infração é obrigatória")
    .refine(isValidCalendarDate, "Data inválida — verifica o formato")
    .refine(isNotFuture,         "A data não pode ser no futuro")
    .refine(
      isNotTooOld,
      `Data demasiado antiga — as contraordenações prescrevem em ${MAX_FINE_AGE_YEARS} anos (art. 27.º RGCO)`
    ),

  fineTime: z
    .string({ required_error: "A hora da infração é obrigatória" })
    .min(1, "A hora da infração é obrigatória")
    .refine((t) => timeRegex.test(t), "Formato inválido — usa HH:MM (ex: 14:30)"),

  fineAuthority: z
    .string({ required_error: "Seleciona a entidade autuante" })
    .min(1, "Seleciona a entidade autuante"),

  fineLocation: z
    .string({ required_error: "O local da infração é obrigatório" })
    .min(1, "O local da infração é obrigatório")
    .transform((s) => s.trim())
    .refine((s) => s.length >= 3,   "Descreve melhor o local (mínimo 3 caracteres)")
    .refine((s) => s.length <= 200, "Máximo 200 caracteres"),

  vehiclePlate: z
    .string({ required_error: "A matrícula é obrigatória" })
    .transform(normalisePlate)
    .refine((p) => ptPlateRegex.test(p), "Matrícula inválida — formato português (ex: AB12CD ou 12AB34)"),

  speedRegistered: z.coerce
    .number()
    .positive("A velocidade deve ser um valor positivo")
    .max(300, "Velocidade improvável — verifica o valor")
    .optional(),

  speedLimit: z.coerce
    .number()
    .positive("O limite deve ser um valor positivo")
    .max(200, "Limite inválido")
    .optional(),

  fineAmount: z
    .string()
    .optional()
    .transform((v) => v?.trim())
    .refine(
      (a) => !a || /^[0-9]+([,.][0-9]{1,2})?$/.test(a),
      "Formato inválido (ex: 120 ou 120,50)"
    ),
});

export type Step2Values = z.infer<typeof step2Schema>;

/**
 * Augments step2Schema with cross-field rules that depend on context from
 * other wizard steps (fineCategory from step 1).
 *
 * Rules added:
 *  • speedRegistered and speedLimit are required when fineCategory === "SPEEDING"
 *  • speedRegistered must be > speedLimit (if both provided)
 */
function buildStep2SchemaWithContext(fineCategory?: string) {
  return step2Schema.superRefine((data, ctx) => {
    const isSpeeding = fineCategory === "SPEEDING";

    // Conditional required — speeding fields
    if (isSpeeding) {
      if (data.speedRegistered == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["speedRegistered"],
          message: "Indica a velocidade registada pelo radar",
        });
      }
      if (data.speedLimit == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["speedLimit"],
          message: "Indica o limite de velocidade no local",
        });
      }
    }

    // Cross-field: consistency check (applies whenever both values are present)
    if (data.speedRegistered != null && data.speedLimit != null) {
      if (data.speedRegistered === data.speedLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["speedRegistered"],
          message: "A velocidade registada não pode ser igual ao limite — sem excesso, sem infração",
        });
      } else if (data.speedRegistered < data.speedLimit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["speedRegistered"],
          message: "A velocidade registada é inferior ao limite — verifica os valores introduzidos",
        });
      }
    }
  });
}

// ─── Step 3 ────────────────────────────────────────────────────────────────────

export const step3Schema = z.object({
  wasDriverAtTime: z.enum(["yes", "no", "uncertain"], {
    required_error: "Indica se eras tu o/a condutor/a",
  }),
  realDriverName:         z.string().max(100).optional(),
  agreesWithFine:         z.enum(["no", "partial", "yes"], {
    required_error: "Responde se concordas ou não com a multa",
  }),
  hasEvidence:            z.enum(["yes", "no", "partial"], {
    required_error: "Indica se tens alguma prova",
  }),
  evidenceTypes:          z.array(z.string()).optional(),
  fineHasDefects:         z.enum(["yes", "no"], {
    required_error: "Indica se reparaste em erros na notificação",
  }),
  fineDefectTypes:        z.array(z.string()).optional(),
  radarCalibration:       z.enum(["yes", "no", "unknown"]).optional(),
  speedSignageVisible:    z.enum(["yes", "no", "unclear", "unknown"]).optional(),
  parkingSignageVisible:  z.enum(["yes", "no", "unclear", "unknown"]).optional(),
  parkingEmergency:           z.enum(["yes", "no"]).optional(),
  parkingEmergencyDetail:     z.string().max(500).optional(),
  fineDefectOtherDescription: z.string().max(500).optional(),
  hasSancaoAcessoria:         z.enum(["yes", "no"]).optional(),
  sancaoAcessoriaDescription: z.string().max(200).optional(),
  // EMEL / municipal operator specific
  emelMaFe:                   z.enum(["yes", "no", "unknown"]).optional(),
  emelMaFeDetail:             z.string().max(500).optional(),
  emelForaHorario:            z.enum(["yes", "no", "unknown"]).optional(),
  emelForaHorarioHora:        z.string().optional()
                               .refine((t) => !t || timeRegex.test(t), "Formato inválido — usa HH:MM"),
});

export type Step3Values = z.infer<typeof step3Schema>;

// ─── Step 4 ────────────────────────────────────────────────────────────────────

export const step4Schema = z.object({
  selectedGrounds: z
    .array(z.string())
    .min(1, "Seleciona pelo menos um fundamento legal para a contestação"),
  additionalNotes: z.string().max(1000, "Máximo 1000 caracteres").optional(),
});

export type Step4Values = z.infer<typeof step4Schema>;

// ─── Step 5 ────────────────────────────────────────────────────────────────────

export const step5Schema = z.object({
  fullName: z
    .string({ required_error: "O nome completo é obrigatório" })
    .min(5,   "Nome demasiado curto — introduz o nome completo")
    .max(100, "Máximo 100 caracteres")
    .regex(
      /^[A-Za-zÀ-ÿ\s'\-]+$/,
      "O nome não pode conter números ou caracteres especiais"
    ),

  nif: z
    .string({ required_error: "O NIF é obrigatório para identificação legal" })
    .refine(validateNIF, "NIF inválido — verifica os 9 dígitos"),

  ccNumber: z
    .string()
    .max(15, "Máximo 15 caracteres")
    .optional(),

  address: z
    .string({ required_error: "A morada é obrigatória" })
    .min(10,  "Morada demasiado curta — inclui rua, número e código postal")
    .max(300, "Máximo 300 caracteres")
    .refine(
      (a) => ptPostalCodeRegex.test(a),
      "A morada deve incluir o código postal no formato XXXX-XXX (ex: 1200-001 Lisboa)"
    ),

  email: z
    .string()
    .optional()
    .refine(
      (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e),
      "Email inválido — verifica o formato (ex: nome@dominio.pt)"
    ),

  phone: z
    .string()
    .optional()
    .transform((p) => p?.replace(/[\s\-]/g, ""))
    .refine(
      (p) => !p || ptPhoneRegex.test(p),
      "Número inválido — aceita telemóvel (9XX) e fixo (2XX/3XX) portugueses"
    ),

  consentDataProcessing: z.literal("yes", {
    errorMap: () => ({ message: "Deves autorizar o tratamento de dados para continuar" }),
  }),
});

export type Step5Values = z.infer<typeof step5Schema>;

// ─── Full form schema (all steps combined) ────────────────────────────────────

export const fullFormSchema = z.object({
  fineType:     step1Schema,
  fineDetails:  step2Schema,
  context:      step3Schema,
  legalGrounds: step4Schema,
  personalData: step5Schema,
});

export type FullFormValues = z.infer<typeof fullFormSchema>;

// ─── Per-step schema map ───────────────────────────────────────────────────────

export const stepSchemas = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
} as const;

export type StepNumber = keyof typeof stepSchemas;

// ─── Per-step context type ────────────────────────────────────────────────────

export interface ValidationContext {
  /** fineCategory from step 1, needed for conditional required in step 2 */
  fineCategory?: string;
}

// ─── Validate a single step ───────────────────────────────────────────────────

/**
 * Validates one wizard step and returns field-level error messages.
 *
 * @param step    Step number (1–5)
 * @param data    The step's form data
 * @param context Optional cross-step context (currently: fineCategory from step 1)
 *
 * @returns `{ success: true }` or `{ success: false; errors: Record<fieldPath, message> }`
 */
export function validateStep(
  step:     StepNumber,
  data:     unknown,
  context?: ValidationContext
): { success: true } | { success: false; errors: Record<string, string> } {

  // Step 2 uses a context-aware schema when fineCategory is available
  const schema =
    step === 2
      ? buildStep2SchemaWithContext(context?.fineCategory)
      : stepSchemas[step];

  const result = (schema as ReturnType<typeof buildStep2SchemaWithContext>).safeParse(data);

  if (result.success) return { success: true };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = issue.message;
  }
  return { success: false, errors };
}
