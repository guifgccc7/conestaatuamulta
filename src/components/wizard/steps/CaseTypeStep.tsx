"use client";

import { CaseType } from "@/types";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

const CASE_OPTIONS: { type: CaseType; emoji: string; label: string; desc: string }[] = [
  {
    type:  "SPEEDING",
    emoji: "🚗",
    label: "Excesso de Velocidade",
    desc:  "Radar fixo, radar móvel, LIDAR ou fotomulta",
  },
  {
    type:  "PARKING",
    emoji: "🅿️",
    label: "Estacionamento Proibido",
    desc:  "EMEL, GNR, PSP ou Município",
  },
  {
    type:  "ADMIN_ERROR",
    emoji: "📋",
    label: "Erro Administrativo",
    desc:  "Matrícula errada, data errada, falta de prova, prescrição",
  },
  {
    type:  "MOBILE_PHONE",
    emoji: "📱",
    label: "Uso de Telemóvel",
    desc:  "Uso do telemóvel durante a condução",
  },
  {
    type:  "SEATBELT",
    emoji: "💺",
    label: "Falta de Cinto de Segurança",
    desc:  "Condução sem cinto ou isenção médica",
  },
  {
    type:  "TRAFFIC_LIGHT",
    emoji: "🚦",
    label: "Semáforo Vermelho",
    desc:  "Desrespeito de sinal luminoso vermelho",
  },
  {
    type:  "OTHER",
    emoji: "⚠️",
    label: "Outro tipo de multa",
    desc:  "Outra infração ao Código da Estrada",
  },
];

interface Props {
  value?: CaseType;
  onChange: (type: CaseType) => void;
}

export function CaseTypeStep({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Que tipo de multa queres contestar?
      </h2>
      <p className="text-slate-500 mb-6">
        Seleciona o tipo de infração indicado na notificação
      </p>

      <div className="space-y-3">
        {CASE_OPTIONS.map((opt) => (
          <button
            key={opt.type}
            onClick={() => onChange(opt.type)}
            className={cn(
              "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150",
              "hover:border-brand-400 hover:bg-brand-50",
              value === opt.type
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 bg-white"
            )}
          >
            <span className="text-3xl flex-shrink-0">{opt.emoji}</span>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">{opt.label}</div>
              <div className="text-sm text-slate-500 mt-0.5">{opt.desc}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
