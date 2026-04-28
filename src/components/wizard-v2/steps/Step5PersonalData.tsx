"use client";

import { useEffect } from "react";
import { PersonalDataState } from "@/lib/wizard/logic-engine";
import { step5Schema }        from "@/lib/wizard/validation";
import { useFieldValidation } from "@/lib/wizard/useFieldValidation";
import { cn } from "@/lib/utils";
import { Lock, User, CheckCircle2, XCircle } from "lucide-react";
import type { Session } from "next-auth";

interface Props {
  values:      PersonalDataState;
  errors:      Record<string, string>;
  onChange:    (v: Partial<PersonalDataState>) => void;
  userSession: Session | null;
}

// ─── NIF check-digit validator (mirrors validation.ts) ────────────────────────

function isValidNIF(nif: string): boolean {
  if (!/^[1-9][0-9]{8}$/.test(nif)) return false;
  const digits   = nif.split("").map(Number);
  const sum      = digits.slice(0, 8).reduce((a, d, i) => a + d * (9 - i), 0);
  const mod      = sum % 11;
  const expected = mod < 2 ? 0 : 11 - mod;
  return digits[8] === expected;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step5PersonalData({ values, errors, onChange, userSession }: Props) {
  const set = (key: keyof PersonalDataState, val: string) =>
    onChange({ [key]: val } as Partial<PersonalDataState>);

  // Real-time per-field blur validation
  const { blurErrors, onFieldBlur } = useFieldValidation(step5Schema);

  // External "Next" errors win over blur errors
  const eff = { ...blurErrors, ...errors };

  /** Convenience wrapper for onFieldBlur */
  const blur = (field: string, value: unknown) =>
    onFieldBlur(field, value, values as unknown as Record<string, unknown>);

  // Pre-fill from session if available
  useEffect(() => {
    if (userSession?.user && !values.fullName) {
      onChange({
        fullName: userSession.user.name  ?? "",
        email:    userSession.user.email ?? "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSession]);

  // Inline NIF state (9 chars typed)
  const nifComplete = (values.nif ?? "").length === 9;
  const nifValid    = nifComplete && isValidNIF(values.nif ?? "");

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Os teus dados</h2>
      <p className="text-slate-500 text-sm mb-2">
        Necessários para identificação legal no documento de contestação
      </p>

      {/* Security note */}
      <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6 text-xs text-slate-500">
        <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
        Os teus dados são usados exclusivamente para gerar o documento. Não os partilhamos com terceiros.
      </div>

      {/* Pre-fill banner */}
      {userSession?.user && (
        <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mb-5 text-xs text-brand-600 font-medium">
          <User className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          Dados pré-preenchidos com a tua conta. Confirma e completa.
        </div>
      )}

      <div className="space-y-5">

        {/* Full name */}
        <FormField
          label="Nome completo"
          required
          hint="Tal como consta no Cartão de Cidadão"
          error={eff.fullName}
        >
          <input
            type="text"
            className={inputCls(eff.fullName)}
            placeholder="Maria Oliveira Santos"
            value={values.fullName ?? ""}
            onChange={(e) => set("fullName", e.target.value)}
            onBlur={(e)  => blur("fullName", e.target.value)}
            autoComplete="name"
            maxLength={100}
          />
        </FormField>

        {/* NIF — with live check-digit feedback */}
        <FormField
          label="NIF — Número de Identificação Fiscal"
          required
          hint="9 dígitos — consta no Cartão de Cidadão e no DUA do veículo"
          error={eff.nif}
        >
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              className={cn(
                inputCls(nifComplete && !nifValid ? "error" : eff.nif),
                "font-mono tracking-widest pr-10"
              )}
              placeholder="123 456 789"
              value={values.nif ?? ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 9);
                set("nif", val);
              }}
              onBlur={(e) => blur("nif", e.target.value.replace(/\D/g, "").slice(0, 9))}
              maxLength={9}
              aria-invalid={nifComplete && !nifValid}
            />
            {/* Live validity icon — only shown when 9 digits entered */}
            {nifComplete && (
              nifValid
                ? <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" aria-label="NIF válido" />
                : <XCircle      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500"   aria-label="NIF inválido" />
            )}
          </div>
          {/* Live feedback line (replaces hint once 9 digits are entered) */}
          {nifComplete && !eff.nif && (
            nifValid
              ? <p className="text-xs text-green-600 mt-1 font-medium">✓ NIF válido</p>
              : <p className="text-xs text-red-500 mt-1" data-error>NIF inválido — verifica os 9 dígitos</p>
          )}
        </FormField>

        {/* CC number (optional) */}
        <FormField
          label="N.º do Cartão de Cidadão"
          optional
          hint="Fortalece a identificação formal no documento"
          error={eff.ccNumber}
        >
          <input
            type="text"
            className={inputCls(eff.ccNumber)}
            placeholder="12345678 9 ZZ0"
            value={values.ccNumber ?? ""}
            onChange={(e) => set("ccNumber", e.target.value.toUpperCase())}
            onBlur={(e)  => blur("ccNumber", e.target.value.toUpperCase())}
            maxLength={15}
          />
        </FormField>

        {/* Address — postal code required */}
        <FormField
          label="Morada completa"
          required
          hint="Rua, número, andar/fração, código postal e localidade (ex: 1200-001 Lisboa)"
          error={eff.address}
        >
          <textarea
            className={cn(inputCls(eff.address), "min-h-[85px] resize-none")}
            placeholder={"Rua das Flores, n.º 12, 3.º Dto\n1200-001 Lisboa"}
            value={values.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            onBlur={(e)  => blur("address", e.target.value)}
            rows={3}
            autoComplete="street-address"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <FormField
            label="Email de contacto"
            optional
            hint="Para receber o documento"
            error={eff.email}
          >
            <input
              type="email"
              className={inputCls(eff.email)}
              placeholder="maria@exemplo.pt"
              value={values.email ?? ""}
              onChange={(e) => set("email", e.target.value)}
              onBlur={(e)  => blur("email", e.target.value)}
              autoComplete="email"
            />
          </FormField>

          {/* Phone */}
          <FormField
            label="Telemóvel / telefone"
            optional
            hint="Fixo ou telemóvel (9XX, 2XX, 3XX)"
            error={eff.phone}
          >
            <input
              type="tel"
              className={inputCls(eff.phone)}
              placeholder="9XX XXX XXX"
              value={values.phone ?? ""}
              onChange={(e) => set("phone", e.target.value.replace(/[^\d+\s\-]/g, ""))}
              onBlur={(e)  => blur("phone", e.target.value)}
              autoComplete="tel"
            />
          </FormField>
        </div>

        {/* Consent — BUG-006: native checkbox for RGPD compliance + accessibility */}
        <div
          className={cn(
            "rounded-xl border-2 p-4 transition-colors",
            values.consentDataProcessing === "yes"
              ? "border-brand-400 bg-brand-50"
              : "border-slate-200"
          )}
        >
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="consent-data-processing"
              className="mt-1 w-4 h-4 rounded accent-brand-600 cursor-pointer flex-shrink-0"
              checked={values.consentDataProcessing === "yes"}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange({ consentDataProcessing: "yes" });
                } else {
                  onChange({ consentDataProcessing: undefined });
                }
              }}
              aria-required="true"
              aria-describedby="consent-desc"
            />
            <label htmlFor="consent-data-processing" className="cursor-pointer flex-1">
              <p className="text-sm font-medium text-slate-900">
                Autorizo o tratamento dos meus dados pessoais{" "}
                <span className="text-red-400" aria-hidden="true">*</span>
              </p>
              <p id="consent-desc" className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Os dados são usados apenas para gerar o documento de contestação, ao abrigo do RGPD.
                Ver{" "}
                <a
                  href="/legal/privacidade"
                  className="text-brand-500 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Privacidade
                </a>.
              </p>
            </label>
          </div>
          {eff.consentDataProcessing && (
            <p className="text-xs text-red-500 mt-2 ml-7" data-error role="alert">
              {eff.consentDataProcessing}
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

// ─── Shared wrappers ──────────────────────────────────────────────────────────

function FormField({
  label,
  hint,
  required,
  optional,
  error,
  children,
}: {
  label:     string;
  hint?:     string;
  required?: boolean;
  optional?: boolean;
  error?:    string;
  children:  React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {optional && <span className="text-slate-400 font-normal ml-1">(opcional)</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1" data-error>{error}</p>}
    </div>
  );
}

function inputCls(error?: string) {
  return cn(
    "w-full px-4 py-3 border rounded-xl text-slate-900 placeholder-slate-400 bg-white",
    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
    "transition-all duration-150",
    error ? "border-red-400 bg-red-50" : "border-slate-300"
  );
}
