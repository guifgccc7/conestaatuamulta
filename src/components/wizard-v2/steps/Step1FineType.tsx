"use client";

import { cn } from "@/lib/utils";
import { FineTypeState } from "@/lib/wizard/logic-engine";
import { ChevronRight } from "lucide-react";

const FINE_OPTIONS = [
  {
    value:       "SPEEDING",
    label:       "Excesso de Velocidade",
    description: "Radar, LIDAR, fotomulta ou controlo de secção",
    icon:        "🚗",
    badge:       "Mais contestada",
    badgeColor:  "bg-brand-100 text-brand-700",
  },
  {
    value:       "PARKING",
    label:       "Estacionamento / Paragem",
    description: "EMEL, GNR, PSP, câmara municipal ou agente de trânsito",
    icon:        "🅿️",
    badge:       null,
    badgeColor:  "",
  },
  {
    value:       "ADMIN_ERROR",
    label:       "Erro na Multa",
    description: "Matrícula errada, data incorreta, falta de prova, prescrição",
    icon:        "📋",
    badge:       "Alta taxa de sucesso",
    badgeColor:  "bg-green-100 text-green-700",
  },
  {
    value:       "TRAFFIC_LIGHT",
    label:       "Semáforo Vermelho",
    description: "Infração detetada por câmara ou agente",
    icon:        "🚦",
    badge:       null,
    badgeColor:  "",
  },
  {
    value:       "MOBILE_PHONE",
    label:       "Uso de Telemóvel",
    description: "Utilização de telemóvel durante a condução",
    icon:        "📱",
    badge:       null,
    badgeColor:  "",
  },
  {
    value:       "SEATBELT",
    label:       "Falta de Cinto de Segurança",
    description: "Sem cinto ou isenção médica não reconhecida",
    icon:        "💺",
    badge:       null,
    badgeColor:  "",
  },
  {
    value:       "OTHER",
    label:       "Outra Infração",
    description: "Outra infração ao Código da Estrada",
    icon:        "⚠️",
    badge:       null,
    badgeColor:  "",
  },
] as const;

const SPEEDING_SUBTYPES = [
  { value: "fixed_radar",   label: "Radar fixo",           icon: "📡" },
  { value: "mobile_radar",  label: "Radar móvel",          icon: "🚔" },
  { value: "lidar",         label: "LIDAR (pistola laser)", icon: "🔫" },
  { value: "section_speed", label: "Velocidade média",     icon: "📏" },
  { value: "photo_fine",    label: "Fotomulta",            icon: "📷" },
  { value: "unknown",       label: "Não sei",              icon: "❓" },
];

const PARKING_SUBTYPES = [
  { value: "prohibited_zone", label: "Zona proibida" },
  { value: "second_row",      label: "Segunda fila" },
  { value: "pavement",        label: "Cima do passeio" },
  { value: "reserved",        label: "Lugar reservado" },
  { value: "no_disc",         label: "Sem disco/dístico" },
  { value: "expired_disc",    label: "Disco expirado" },
  { value: "other_parking",   label: "Outra" },
];

interface Props {
  values: FineTypeState;
  errors: Record<string, string>;
  onChange: (v: Partial<FineTypeState>) => void;
  onAutoAdvance: () => void;
}

export function Step1FineType({ values, errors, onChange, onAutoAdvance }: Props) {
  const handleSelect = (value: string) => {
    onChange({ fineCategory: value });
    // Auto-advance unless we need a sub-type — show sub-type inline instead
    if (value !== "SPEEDING" && value !== "PARKING") {
      // Small delay so user sees selection flash
      setTimeout(onAutoAdvance, 160);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">
        Que tipo de multa recebeste?
      </h2>
      <p className="text-slate-500 text-sm mb-6">
        Seleciona a infração indicada na notificação
      </p>

      {errors.fineCategory && (
        <p className="text-red-500 text-sm mb-3" data-error>{errors.fineCategory}</p>
      )}

      <div className="space-y-2.5">
        {FINE_OPTIONS.map((opt) => {
          const selected = values.fineCategory === opt.value;
          return (
            <div key={opt.value}>
              <button
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 group",
                  selected
                    ? "border-brand-500 bg-brand-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50"
                )}
              >
                <span className="text-3xl flex-shrink-0 leading-none">{opt.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "font-semibold text-sm sm:text-base",
                      selected ? "text-brand-800" : "text-slate-900"
                    )}>
                      {opt.label}
                    </span>
                    {opt.badge && (
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", opt.badgeColor)}>
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  selected ? "text-brand-500" : "text-slate-200 group-hover:text-slate-400"
                )} />
              </button>

              {/* Speeding sub-type — inline reveal */}
              {selected && opt.value === "SPEEDING" && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-brand-200 pb-1">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Que equipamento foi usado? <span className="text-slate-400">(opcional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SPEEDING_SUBTYPES.map((sub) => (
                      <button
                        key={sub.value}
                        type="button"
                        onClick={() => { onChange({ speedingSubtype: sub.value }); setTimeout(onAutoAdvance, 160); }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                          values.speedingSubtype === sub.value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-600 hover:border-brand-300"
                        )}
                      >
                        <span>{sub.icon}</span> {sub.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTimeout(onAutoAdvance, 100)}
                    className="mt-3 text-xs text-brand-600 hover:underline font-medium"
                  >
                    Continuar sem especificar →
                  </button>
                </div>
              )}

              {/* Parking sub-type — inline reveal */}
              {selected && opt.value === "PARKING" && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-brand-200 pb-1">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    Qual o tipo de infração? <span className="text-slate-400">(opcional)</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {PARKING_SUBTYPES.map((sub) => (
                      <button
                        key={sub.value}
                        type="button"
                        onClick={() => { onChange({ parkingSubtype: sub.value }); setTimeout(onAutoAdvance, 160); }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                          values.parkingSubtype === sub.value
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-slate-200 text-slate-600 hover:border-brand-300"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setTimeout(onAutoAdvance, 100)}
                    className="mt-3 text-xs text-brand-600 hover:underline font-medium"
                  >
                    Continuar sem especificar →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
