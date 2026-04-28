"use client";

import { ContextState } from "@/lib/wizard/logic-engine";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface Props {
  values: ContextState;
  fineCategory?: string;
  fineAuthority?: string;
  errors: Record<string, string>;
  onChange: (v: Partial<ContextState>) => void;
}

export function Step3Context({ values, fineCategory, fineAuthority, errors, onChange }: Props) {
  const set = (key: keyof ContextState, val: unknown) =>
    onChange({ [key]: val } as Partial<ContextState>);

  const toggleCheckbox = (key: keyof ContextState, val: string) => {
    const arr = (values[key] as string[] | undefined) ?? [];
    const next = arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
    onChange({ [key]: next } as Partial<ContextState>);
  };

  const isSpeeding  = fineCategory === "SPEEDING";
  const isParking   = fineCategory === "PARKING";
  const isMunicipal = ["EMEL", "SMTUC", "MUNICIPALITY"].includes(fineAuthority ?? "");

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Conta-nos o que aconteceu</h2>
      <p className="text-slate-500 text-sm mb-6">
        As tuas respostas determinam os melhores fundamentos legais para a contestação
      </p>

      <div className="space-y-7">

        {/* ─── 1. Who was driving ─────────────────────────────────────────── */}
        <QuestionBlock
          number="1"
          question="Eras tu quem conduzia o veículo no momento da infração?"
          error={errors.wasDriverAtTime}
        >
          <PillGroup
            options={[
              { value: "yes",       label: "Sim, era eu" },
              { value: "no",        label: "Não, era outra pessoa" },
              { value: "uncertain", label: "Não tenho a certeza" },
            ]}
            value={values.wasDriverAtTime}
            onChange={(v) => set("wasDriverAtTime", v)}
          />

          {/* If not driver → name input */}
          {values.wasDriverAtTime === "no" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>Identificar o condutor real pode levar à tua absolvição imediata ao abrigo do <strong>art. 134.º do Código da Estrada</strong>.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome do condutor efetivo <span className="text-slate-400">(opcional, mas recomendado)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: João Pereira da Silva"
                  value={values.realDriverName ?? ""}
                  onChange={(e) => set("realDriverName", e.target.value)}
                />
              </div>
            </div>
          )}
        </QuestionBlock>

        {/* ─── 2. Do you agree ───────────────────────────────────────────── */}
        <QuestionBlock
          number="2"
          question="Concordas com a infração que te imputam?"
          hint="Responde com honestidade — afeta a solidez da contestação"
          error={errors.agreesWithFine}
        >
          <PillGroup
            options={[
              { value: "no",      label: "❌ Não concordo" },
              { value: "partial", label: "⚠️ Concordo em parte" },
              { value: "yes",     label: "📉 Sim, quero só reduzir a coima" },
            ]}
            value={values.agreesWithFine}
            onChange={(v) => set("agreesWithFine", v)}
          />

          {values.agreesWithFine === "yes" && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>Se concordas plenamente, a contestação formal tem menor probabilidade de êxito. Ainda podes pedir redução ao mínimo legal ao abrigo do <strong>art. 18.º do RGCO</strong>.</p>
            </div>
          )}
        </QuestionBlock>

        {/* ─── 3. Evidence ───────────────────────────────────────────────── */}
        <QuestionBlock
          number="3"
          question="Tens alguma prova que apoie a tua versão?"
          error={errors.hasEvidence}
        >
          <PillGroup
            options={[
              { value: "yes",     label: "Sim, tenho" },
              { value: "partial", label: "Tenho alguma" },
              { value: "no",      label: "Não tenho" },
            ]}
            value={values.hasEvidence}
            onChange={(v) => set("hasEvidence", v)}
          />

          {(values.hasEvidence === "yes" || values.hasEvidence === "partial") && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Que tipo de prova?</p>
              <CheckboxGrid
                options={[
                  { value: "photos",           label: "📷 Fotografias do local" },
                  { value: "video",            label: "🎥 Vídeo (dashcam / câmara)" },
                  { value: "witness",          label: "👤 Testemunha presente" },
                  { value: "gps_data",         label: "📍 Dados GPS / navegador" },
                  { value: "workshop_receipt", label: "🔧 Recibo de oficina" },
                  { value: "medical",          label: "🏥 Atestado médico / urgência" },
                  { value: "disability_card",  label: "♿ Cartão de deficiência" },
                  { value: "other",            label: "📁 Outros documentos" },
                ]}
                selected={values.evidenceTypes ?? []}
                onChange={(v) => toggleCheckbox("evidenceTypes", v)}
              />
            </div>
          )}
        </QuestionBlock>

        {/* ─── 4. Fine defects ───────────────────────────────────────────── */}
        <QuestionBlock
          number="4"
          question="Reparaste em algum erro ou problema na notificação recebida?"
          hint="Irregularidades formais são frequentemente a base mais sólida de contestação"
          error={errors.fineHasDefects}
        >
          <PillGroup
            options={[
              { value: "yes", label: "✅ Sim, detetei erros" },
              { value: "no",  label: "Não reparei" },
            ]}
            value={values.fineHasDefects}
            onChange={(v) => set("fineHasDefects", v)}
          />

          {values.fineHasDefects === "yes" && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Que tipo de erro?</p>
              <CheckboxGrid
                options={[
                  { value: "wrong_plate",       label: "❌ Matrícula errada" },
                  { value: "wrong_date",         label: "📅 Data ou hora incorreta" },
                  { value: "wrong_location",     label: "📍 Local incorreto" },
                  { value: "missing_evidence",   label: "📷 Sem fotografia ou prova" },
                  { value: "no_agent_id",        label: "👮 Agente não identificado" },
                  { value: "late_notification",  label: "📬 Notificação muito tardia" },
                  { value: "no_hearing",         label: "📜 Sem direito a defesa prévia" },
                  { value: "prescription",       label: "⏰ Multa possivelmente prescrita" },
                  { value: "outro",              label: "🔧 Outro (descrever)" },
                ]}
                selected={values.fineDefectTypes ?? []}
                onChange={(v) => toggleCheckbox("fineDefectTypes", v)}
              />
              {values.fineDefectTypes?.includes("outro") && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Descreve o erro ou irregularidade detetada
                  </label>
                  <textarea
                    className="input min-h-[80px] resize-none text-sm"
                    placeholder="Ex: O número do processo está incorreto / A norma invocada não corresponde à infração descrita..."
                    value={values.fineDefectOtherDescription ?? ""}
                    onChange={(e) => set("fineDefectOtherDescription", e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {(values.fineDefectOtherDescription ?? "").length}/500
                  </p>
                </div>
              )}
            </div>
          )}
        </QuestionBlock>

        {/* ─── 5. Sanção acessória ───────────────────────────────────────── */}
        <QuestionBlock
          number="5"
          question="Existe uma sanção acessória associada a esta coima?"
          hint="Ex: inibição de conduzir, apreensão da carta — se não for expressamente contestada, pode ser aplicada mesmo que a coima seja anulada"
        >
          <PillGroup
            options={[
              { value: "yes", label: "✅ Sim, existe" },
              { value: "no",  label: "Não existe" },
            ]}
            value={values.hasSancaoAcessoria}
            onChange={(v) => set("hasSancaoAcessoria", v)}
          />

          {values.hasSancaoAcessoria === "yes" && (
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  É <strong>essencial</strong> contestar expressamente a sanção acessória. Se a
                  impugnação não a mencionar, pode ser aplicada mesmo que a coima seja anulada.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Qual é a sanção acessória?{" "}
                  <span className="text-slate-400">(opcional, mas recomendado)</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Inibição de conduzir por 60 dias / Apreensão da carta de condução"
                  value={values.sancaoAcessoriaDescription ?? ""}
                  onChange={(e) => set("sancaoAcessoriaDescription", e.target.value)}
                />
              </div>
            </div>
          )}
        </QuestionBlock>

        {/* ─── Speeding-specific ─────────────────────────────────────────── */}
        {isSpeeding && (
          <div className="rounded-xl border border-slate-200 p-4 space-y-5 bg-slate-50">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wide">
              <span>🚗</span> Perguntas sobre o radar
            </div>

            <QuestionBlock
              number="5"
              question="O auto indica o certificado de calibração do radar?"
              hint="A verificação metrológica é obrigatória por lei (Portaria 1504/2008)"
            >
              <PillGroup
                options={[
                  { value: "yes",     label: "Sim" },
                  { value: "no",      label: "Não indica" },
                  { value: "unknown", label: "Não sei" },
                ]}
                value={values.radarCalibration}
                onChange={(v) => set("radarCalibration", v)}
                size="sm"
              />
              {(values.radarCalibration === "no" || values.radarCalibration === "unknown") && (
                <p className="text-xs text-green-600 mt-2 font-medium">
                  ✓ Bom fundamento de defesa — a ausência de calibração pode invalida a medição.
                </p>
              )}
            </QuestionBlock>

            <QuestionBlock
              number="6"
              question="Havia sinalização visível do limite de velocidade?"
            >
              <PillGroup
                options={[
                  { value: "yes",     label: "Sim" },
                  { value: "no",      label: "Não havia" },
                  { value: "unclear", label: "Estava obstruída" },
                  { value: "unknown", label: "Não me recordo" },
                ]}
                value={values.speedSignageVisible}
                onChange={(v) => set("speedSignageVisible", v)}
                size="sm"
              />
            </QuestionBlock>
          </div>
        )}

        {/* ─── Parking-specific ──────────────────────────────────────────── */}
        {isParking && (
          <div className="rounded-xl border border-slate-200 p-4 space-y-5 bg-slate-50">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold uppercase tracking-wide">
              <span>🅿️</span> Perguntas sobre o estacionamento
            </div>

            <QuestionBlock
              number="5"
              question="Havia sinalização visível que proibisse o estacionamento?"
            >
              <PillGroup
                options={[
                  { value: "yes",     label: "Sim" },
                  { value: "no",      label: "Não havia" },
                  { value: "unclear", label: "Estava obstruída" },
                  { value: "unknown", label: "Não me recordo" },
                ]}
                value={values.parkingSignageVisible}
                onChange={(v) => set("parkingSignageVisible", v)}
                size="sm"
              />
            </QuestionBlock>

            <QuestionBlock
              number="6"
              question="Paraste por emergência (avaria, urgência médica, acidente)?"
              hint="Art. 49.º, n.º 2 CE isenta de responsabilidade nestas situações"
            >
              <PillGroup
                options={[
                  { value: "yes", label: "Sim" },
                  { value: "no",  label: "Não" },
                ]}
                value={values.parkingEmergency}
                onChange={(v) => set("parkingEmergency", v)}
                size="sm"
              />

              {values.parkingEmergency === "yes" && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Descreve brevemente a situação
                  </label>
                  <textarea
                    className="input min-h-[70px] resize-none text-sm"
                    placeholder="Ex: O veículo avariou subitamente. Chamei assistência às 14:30."
                    value={values.parkingEmergencyDetail ?? ""}
                    onChange={(e) => set("parkingEmergencyDetail", e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {(values.parkingEmergencyDetail ?? "").length}/500
                  </p>
                </div>
              )}
            </QuestionBlock>
          </div>
        )}

        {/* ─── EMEL / municipal operator specific ────────────────────────── */}
        {isMunicipal && isParking && (
          <div className="rounded-xl border border-orange-200 p-4 space-y-5 bg-orange-50">
            <div className="flex items-center gap-2 text-orange-700 text-xs font-semibold uppercase tracking-wide">
              <span>🏛️</span> Perguntas específicas — operador municipal
            </div>

            <QuestionBlock
              number="7"
              question="Tens razões para suspeitar de má-fé ou atuação abusiva do agente autuante?"
              hint="Ex: autuação seletiva, ignorar infrações idênticas, pressão comercial"
              error={errors.emelMaFe}
            >
              <PillGroup
                options={[
                  { value: "yes",     label: "Sim" },
                  { value: "no",      label: "Não" },
                  { value: "unknown", label: "Não sei" },
                ]}
                value={values.emelMaFe}
                onChange={(v) => set("emelMaFe", v)}
                size="sm"
              />
              {(values.emelMaFe === "yes" || values.emelMaFe === "unknown") && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Descreve o comportamento que consideraste irregular{" "}
                    <span className="text-slate-400">(opcional)</span>
                  </label>
                  <textarea
                    className="input min-h-[70px] resize-none text-sm"
                    placeholder="Ex: O agente autuou apenas o meu veículo ignorando outros em situação idêntica..."
                    value={values.emelMaFeDetail ?? ""}
                    onChange={(e) => set("emelMaFeDetail", e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">
                    {(values.emelMaFeDetail ?? "").length}/500
                  </p>
                </div>
              )}
            </QuestionBlock>

            <QuestionBlock
              number="8"
              question="O auto foi emitido fora do horário de funcionamento do operador?"
              hint="A EMEL e operadores municipais só podem autuar dentro do horário contratualizado — fora desse horário a autuação é nula"
              error={errors.emelForaHorario}
            >
              <PillGroup
                options={[
                  { value: "yes",     label: "Sim" },
                  { value: "no",      label: "Não" },
                  { value: "unknown", label: "Não sei" },
                ]}
                value={values.emelForaHorario}
                onChange={(v) => set("emelForaHorario", v)}
                size="sm"
              />
              {values.emelForaHorario === "yes" && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Hora da autuação indicada no auto{" "}
                    <span className="text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ex: 07:15 ou 22:45"
                    value={values.emelForaHorarioHora ?? ""}
                    onChange={(e) => set("emelForaHorarioHora", e.target.value)}
                    maxLength={5}
                  />
                  {errors.emelForaHorarioHora && (
                    <p className="text-xs text-red-500 mt-1" data-error>{errors.emelForaHorarioHora}</p>
                  )}
                </div>
              )}
            </QuestionBlock>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function QuestionBlock({
  number,
  question,
  hint,
  error,
  children,
}: {
  number: string;
  question: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
          {number}
        </div>
        <div>
          <p className="font-medium text-slate-900 text-sm leading-snug">{question}</p>
          {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="ml-9">
        {children}
        {error && <p className="text-xs text-red-500 mt-1" data-error>{error}</p>}
      </div>
    </div>
  );
}

function PillGroup({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-xl border-2 font-medium transition-all duration-150",
            size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
            value === opt.value
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 text-slate-600 hover:border-brand-300 hover:bg-slate-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onChange,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all",
              checked
                ? "border-brand-400 bg-brand-50 text-brand-800"
                : "border-slate-200 text-slate-600 hover:border-slate-300"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
              checked ? "border-brand-500 bg-brand-500" : "border-slate-300"
            )}>
              {checked && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="font-medium">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
