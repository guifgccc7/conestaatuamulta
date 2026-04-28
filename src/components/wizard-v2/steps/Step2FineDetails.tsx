"use client";

import { FineDetailsState } from "@/lib/wizard/logic-engine";
import { step2Schema }      from "@/lib/wizard/validation";
import { useFieldValidation } from "@/lib/wizard/useFieldValidation";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

const AUTHORITIES = [
  { value: "GNR",          label: "GNR — Guarda Nacional Republicana" },
  { value: "PSP",          label: "PSP — Polícia de Segurança Pública" },
  { value: "ANSR",         label: "ANSR — Autoridade Nacional de Segurança Rodoviária" },
  { value: "EMEL",         label: "EMEL — Mobilidade e Estacionamento de Lisboa" },
  { value: "SMTUC",        label: "SMTUC — Serviços Municipalizados de Coimbra" },
  { value: "IMT",          label: "IMT — Instituto da Mobilidade e dos Transportes" },
  { value: "MUNICIPALITY", label: "Câmara Municipal" },
  { value: "OTHER",        label: "Outra entidade" },
];

const SPEED_LIMITS = [30, 50, 70, 80, 90, 100, 120];

interface Props {
  values:       FineDetailsState;
  fineCategory?: string;
  errors:       Record<string, string>;
  onChange:     (v: Partial<FineDetailsState>) => void;
}

export function Step2FineDetails({ values, fineCategory, errors, onChange }: Props) {
  const isSpeeding = fineCategory === "SPEEDING";

  // Real-time per-field validation on blur (merges with submit-time errors)
  const { blurErrors, onFieldBlur } = useFieldValidation(step2Schema);

  // External "Next" errors take precedence over blur errors so that after a
  // failed submission attempt the user sees the full validated error set.
  const eff = { ...blurErrors, ...errors };

  const set = (key: keyof FineDetailsState, val: unknown) =>
    onChange({ [key]: val } as Partial<FineDetailsState>);

  /** Convenience: fire onFieldBlur with the current values snapshot */
  const blur = (field: string, value: unknown) =>
    onFieldBlur(field, value, values as unknown as Record<string, unknown>);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Dados da multa</h2>
      <p className="text-slate-500 text-sm mb-6">
        Preenche com as informações da notificação recebida
      </p>

      <div className="space-y-5">

        {/* Reference (optional) */}
        <Field
          label="Número da auto / referência"
          hint="Canto superior da notificação"
          optional
          error={eff.fineReference}
        >
          <input
            type="text"
            className={inputCls(eff.fineReference)}
            placeholder="Ex: ANSR/2025/123456"
            value={values.fineReference ?? ""}
            onChange={(e) => set("fineReference", e.target.value)}
            onBlur={(e)  => blur("fineReference", e.target.value)}
            maxLength={50}
          />
        </Field>

        {/* Date + Time (side by side on ≥sm) */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data da infração" required error={eff.fineDate}>
            <input
              type="date"
              className={inputCls(eff.fineDate)}
              value={values.fineDate ?? ""}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => set("fineDate", e.target.value)}
              onBlur={(e)  => blur("fineDate", e.target.value)}
            />
          </Field>
          <Field label="Hora" required error={eff.fineTime} hint="HH:MM (ex: 14:30)">
            <input
              type="text"
              className={inputCls(eff.fineTime)}
              placeholder="14:30"
              value={values.fineTime ?? ""}
              onChange={(e) => set("fineTime", e.target.value)}
              onBlur={(e)  => blur("fineTime", e.target.value)}
              maxLength={5}
            />
          </Field>
        </div>

        {/* Authority */}
        <Field label="Entidade autuante" required error={eff.fineAuthority}>
          <select
            className={inputCls(eff.fineAuthority)}
            value={values.fineAuthority ?? ""}
            onChange={(e) => set("fineAuthority", e.target.value)}
            onBlur={(e)  => blur("fineAuthority", e.target.value)}
          >
            <option value="">Seleciona a entidade</option>
            {AUTHORITIES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </Field>

        {/* Location */}
        <Field
          label="Local da infração"
          required
          hint="Via, rua ou localidade indicada na notificação"
          error={eff.fineLocation}
        >
          <input
            type="text"
            className={inputCls(eff.fineLocation)}
            placeholder="Ex: EN10, Km 15, Setúbal"
            value={values.fineLocation ?? ""}
            onChange={(e) => set("fineLocation", e.target.value)}
            onBlur={(e)  => blur("fineLocation", e.target.value)}
            maxLength={200}
          />
        </Field>

        {/* Plate */}
        <Field
          label="Matrícula do veículo"
          required
          hint="Tal como aparece no DUA — sem hífens"
          error={eff.vehiclePlate}
        >
          <input
            type="text"
            className={cn(inputCls(eff.vehiclePlate), "uppercase font-mono tracking-widest")}
            placeholder="AB-12-CD"
            value={values.vehiclePlate ?? ""}
            onChange={(e) =>
              set("vehiclePlate", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
            onBlur={(e) => blur("vehiclePlate", e.target.value)}
            maxLength={8}
          />
        </Field>

        {/* ─── Speeding-specific ─── */}
        {isSpeeding && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-4">
            <div className="flex items-center gap-2 text-amber-700 text-sm font-semibold">
              <Info className="w-4 h-4" aria-hidden="true" />
              Dados de velocidade
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Velocidade registada (km/h)"
                required
                error={eff.speedRegistered}
              >
                <input
                  type="number"
                  className={inputCls(eff.speedRegistered)}
                  placeholder="Ex: 95"
                  value={values.speedRegistered ?? ""}
                  min={1}
                  max={300}
                  onChange={(e) => set("speedRegistered", Number(e.target.value) || undefined)}
                  onBlur={(e)  => blur("speedRegistered", Number(e.target.value) || undefined)}
                />
              </Field>
              <Field
                label="Limite legal (km/h)"
                required
                error={eff.speedLimit}
              >
                <select
                  className={inputCls(eff.speedLimit)}
                  value={values.speedLimit ?? ""}
                  onChange={(e) => set("speedLimit", Number(e.target.value) || undefined)}
                  onBlur={(e)  => blur("speedLimit", Number(e.target.value) || undefined)}
                >
                  <option value="">Seleciona</option>
                  {SPEED_LIMITS.map((l) => (
                    <option key={l} value={l}>{l} km/h</option>
                  ))}
                </select>
              </Field>
            </div>

            {/* Speed delta indicator — visual cross-field feedback */}
            {values.speedRegistered && values.speedLimit && (
              <SpeedDeltaBadge
                registered={values.speedRegistered}
                limit={values.speedLimit}
              />
            )}
          </div>
        )}

        {/* Fine amount (optional) */}
        <Field
          label="Valor da coima (€)"
          optional
          hint="Valor indicado na notificação, sem custas processuais"
          error={eff.fineAmount}
        >
          <input
            type="text"
            className={inputCls(eff.fineAmount)}
            placeholder="Ex: 120 ou 120,50"
            value={values.fineAmount ?? ""}
            onChange={(e) => set("fineAmount", e.target.value)}
            onBlur={(e)  => blur("fineAmount", e.target.value)}
          />
        </Field>

      </div>
    </div>
  );
}

// ─── Speed delta badge ─────────────────────────────────────────────────────────

function SpeedDeltaBadge({ registered, limit }: { registered: number; limit: number }) {
  const excess = registered - limit;

  if (excess <= 0) return (
    <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
      <span className="w-2 h-2 rounded-full bg-amber-400" />
      Velocidade igual ou inferior ao limite — verifica os valores
    </div>
  );

  const severity =
    excess <= 20 ? { label: "Excesso ligeiro",  color: "text-amber-600", dot: "bg-amber-400" }
    : excess <= 40 ? { label: "Excesso moderado", color: "text-orange-600", dot: "bg-orange-400" }
    : { label: "Excesso elevado", color: "text-red-600",    dot: "bg-red-500"    };

  return (
    <div className={cn("flex items-center gap-2 text-xs font-medium", severity.color)}>
      <span className={cn("w-2 h-2 rounded-full", severity.dot)} />
      {severity.label} — +{excess} km/h acima do limite
    </div>
  );
}

// ─── Shared Field wrapper ──────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  optional,
  error,
  children,
}: {
  label:    string;
  hint?:    string;
  required?: boolean;
  optional?: boolean;
  error?:   string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {optional && <span className="text-slate-400 font-normal ml-1">(opcional)</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1" data-error>{error}</p>
      )}
    </div>
  );
}

function inputCls(error?: string) {
  return cn(
    "w-full px-4 py-3 border rounded-xl text-slate-900 placeholder-slate-400",
    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
    "transition-all duration-150 bg-white",
    error ? "border-red-400 bg-red-50" : "border-slate-300"
  );
}
