"use client";

import { CaseType, SpeedingData, ParkingData, AdminErrorData } from "@/types";

interface Props {
  caseType: CaseType;
  data: SpeedingData | ParkingData | AdminErrorData | { description: string } | undefined;
  onChange: (d: SpeedingData | ParkingData | AdminErrorData | { description: string }) => void;
}

export function ViolationDetailsStep({ caseType, data, onChange }: Props) {
  const d = data as Record<string, unknown> | undefined;

  const set = (key: string, val: unknown) =>
    onChange({ ...(d ?? {}), [key]: val } as SpeedingData);

  switch (caseType) {
    case "SPEEDING":
      return <SpeedingForm d={d} set={set} />;
    case "PARKING":
      return <ParkingForm d={d} set={set} />;
    case "ADMIN_ERROR":
      return <AdminErrorForm d={d} set={set} />;
    default:
      return (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Detalhes adicionais</h2>
          <p className="text-slate-500 mb-6">Descreve brevemente a situação</p>
          <textarea
            className="input min-h-[120px] resize-none"
            placeholder="Descreve os factos relevantes para a contestação..."
            value={(d?.description as string) ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>
      );
  }
}

// ─── Speeding form ─────────────────────────────────────────────────────────────

function SpeedingForm({ d, set }: { d: Record<string, unknown> | undefined; set: (k: string, v: unknown) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Detalhes do excesso de velocidade</h2>
      <p className="text-slate-500 mb-6">Informações sobre a infração alegada</p>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Velocidade registada (km/h)</label>
            <input
              type="number"
              className="input"
              placeholder="Ex: 95"
              value={(d?.allegedSpeed as number) ?? ""}
              onChange={(e) => set("allegedSpeed", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Limite legal no local (km/h)</label>
            <input
              type="number"
              className="input"
              placeholder="Ex: 80"
              value={(d?.legalLimit as number) ?? ""}
              onChange={(e) => set("legalLimit", Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="label">Tipo de equipamento de medição</label>
          <select
            className="input"
            value={(d?.measurementDevice as string) ?? ""}
            onChange={(e) => set("measurementDevice", e.target.value)}
          >
            <option value="">Seleciona o equipamento</option>
            <option value="radar fixo">Radar fixo</option>
            <option value="radar móvel">Radar móvel (SINCRO/MULTIRADAR)</option>
            <option value="LIDAR">LIDAR (pistola laser)</option>
            <option value="fotomulta">Fotomulta (câmara automática)</option>
            <option value="secção">Controlo de velocidade média (secção)</option>
            <option value="outro">Outro / Desconhecido</option>
          </select>
        </div>

        <div>
          <label className="label">
            Foi apresentado/exibido registo fotográfico ou prova?
          </label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("evidenceProvided", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.evidenceProvided === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            Existe certificado de calibração/verificação do radar?
          </label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }, { v: null, l: "Não sei" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("deviceCertified", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.deviceCertified === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            Havia sinalização visível do limite de velocidade?
          </label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }, { v: null, l: "Não sei" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("signageVisible", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.signageVisible === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Parking form ─────────────────────────────────────────────────────────────

function ParkingForm({ d, set }: { d: Record<string, unknown> | undefined; set: (k: string, v: unknown) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Detalhes do estacionamento</h2>
      <p className="text-slate-500 mb-6">Informa-nos sobre a situação de estacionamento</p>

      <div className="space-y-5">
        <div>
          <label className="label">Entidade responsável pelo estacionamento</label>
          <select
            className="input"
            value={(d?.parkingEntity as string) ?? ""}
            onChange={(e) => set("parkingEntity", e.target.value)}
          >
            <option value="">Seleciona</option>
            <option value="EMEL">EMEL (Lisboa)</option>
            <option value="SMTUC">SMTUC (Coimbra)</option>
            <option value="GNR">GNR</option>
            <option value="PSP">PSP</option>
            <option value="Municipio">Câmara Municipal</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="label">Tipo de proibição alegada (conforme a auto)</label>
          <input
            type="text"
            className="input"
            placeholder="Ex: estacionamento em segunda fila, em cima do passeio..."
            value={(d?.prohibitionType as string) ?? ""}
            onChange={(e) => set("prohibitionType", e.target.value)}
          />
        </div>

        <div>
          <label className="label">Existia sinalização da proibição no local?</label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }, { v: null, l: "Não sei" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("signagePresent", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.signagePresent === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            O talão de multa foi colocado fisicamente no veículo?
          </label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("ticketOnVehicle", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.ticketOnVehicle === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Tens cartão de estacionamento para pessoa com deficiência?</label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("disabledBadge", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.disabledBadge === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">
            Paraste por força maior (avaria, urgência médica, etc.)?
          </label>
          <div className="flex gap-3">
            {[{ v: true, l: "Sim" }, { v: false, l: "Não" }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => set("emergencyStop", v)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  d?.emergencyStop === v
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin error form ─────────────────────────────────────────────────────────

function AdminErrorForm({ d, set }: { d: Record<string, unknown> | undefined; set: (k: string, v: unknown) => void }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Tipo de erro na auto</h2>
      <p className="text-slate-500 mb-6">Seleciona o tipo de erro ou irregularidade que detetaste</p>

      <div className="space-y-4">
        {[
          { v: "WRONG_PLATE",         l: "❌ Matrícula errada", desc: "A matrícula no documento não é a do meu veículo" },
          { v: "WRONG_DATE",          l: "📅 Data/hora incorreta", desc: "A data ou hora da infração está errada" },
          { v: "WRONG_LOCATION",      l: "📍 Local incorreto", desc: "O local indicado não é onde estava o veículo" },
          { v: "MISSING_EVIDENCE",    l: "📷 Falta de prova", desc: "Não foi apresentada qualquer evidência da infração" },
          { v: "NOTIFICATION_DEFECT", l: "✉️ Problema na notificação", desc: "A notificação está incompleta ou foi recebida fora do prazo" },
          { v: "PRESCRIPTION",        l: "⏰ Prescrição", desc: "Passaram mais de 2 anos sobre a data da infração" },
          { v: "OTHER",               l: "⚠️ Outro erro", desc: "Outro tipo de irregularidade" },
        ].map(({ v, l, desc }) => (
          <button
            key={v}
            type="button"
            onClick={() => set("errorType", v)}
            className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
              d?.errorType === v
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-xl mt-0.5">{l.split(" ")[0]}</div>
            <div>
              <div className="font-semibold text-slate-900 text-sm">{l.split(" ").slice(1).join(" ")}</div>
              <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
            </div>
          </button>
        ))}

        <div>
          <label className="label">
            Descreve o erro com mais detalhe <span className="text-red-400">*</span>
          </label>
          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="Ex: A matrícula indicada no auto é AB-12-CD mas o meu veículo tem matrícula XY-34-WZ..."
            value={(d?.errorDescription as string) ?? ""}
            onChange={(e) => set("errorDescription", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
