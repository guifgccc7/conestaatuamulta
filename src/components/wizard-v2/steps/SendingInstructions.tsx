"use client";

import { MailCheck, Printer, PenLine, PackageCheck, ShieldCheck, Info, BadgeCheck } from "lucide-react";

// ─── Step data ────────────────────────────────────────────────────────────────

const STEPS = [
  {
    icon:  Printer,
    title: "Imprime o documento",
    body:  "Imprime o PDF em papel A4. Verifica que todas as páginas ficaram legíveis.",
  },
  {
    icon:  PenLine,
    title: "Assina à mão",
    body:  "Assina no campo indicado com caneta de tinta permanente — azul ou preta.",
  },
  {
    icon:  PackageCheck,
    title: "Envia por correio registado com aviso de receção",
    body:  "Nos CTT, pede especificamente «correio registado com aviso de receção (AR)». Guarda o talão — é o teu comprovativo de envio.",
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function SendingInstructions() {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 overflow-hidden mb-5">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2.5 px-4 py-3 border-b border-sky-200 bg-sky-100/60">
        <div className="flex items-center gap-2.5">
          <MailCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-sky-800">
            Como enviar a tua contestação
          </span>
        </div>
        {/* Feature badge — reinforces perceived value */}
        <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-600 bg-white border border-sky-200 rounded-full px-2 py-0.5 flex-shrink-0">
          <BadgeCheck className="w-3 h-3" />
          Incluído no serviço
        </span>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* ── Recommended method banner ──────────────────────────────────── */}
        <div className="flex items-start gap-2 bg-sky-600 rounded-xl px-3 py-2.5">
          <ShieldCheck className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
          <p className="text-xs text-white font-medium leading-snug">
            <strong>Método recomendado: correio registado com aviso de receção (AR).</strong>{" "}
            É o único meio que garante prova legal de entrega dentro do prazo e é exigido
            em caso de impugnação judicial.
          </p>
        </div>

        {/* ── Short intro ────────────────────────────────────────────────────── */}
        <p className="text-xs text-sky-700 leading-relaxed">
          Depois de descarregares o PDF, segue estes três passos para garantir
          que a tua contestação chega à entidade dentro do prazo e de forma
          legalmente válida.
        </p>

        {/* ── Numbered steps ─────────────────────────────────────────────────── */}
        <ol className="space-y-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="flex items-start gap-3">

                {/* Step number circle */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-600 flex items-center justify-center mt-0.5">
                  <span className="text-[10px] font-bold text-white leading-none">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Icon className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                    <span className="text-xs font-semibold text-sky-900">
                      {step.title}
                    </span>
                  </div>
                  <p className="text-xs text-sky-700 leading-relaxed">
                    {step.body}
                  </p>
                </div>

              </li>
            );
          })}
        </ol>

        {/* ── Why it matters ─────────────────────────────────────────────────── */}
        <div className="rounded-lg border border-sky-200 bg-white/70 px-3 py-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-sky-800 uppercase tracking-wide">
              Porquê o aviso de receção?
            </span>
          </div>
          <ul className="space-y-1.5">
            {[
              {
                icon:  ShieldCheck,
                text:  "O aviso de receção assinado é a tua prova legal de que a contestação chegou à entidade.",
              },
              {
                icon:  ShieldCheck,
                text:  "Confirma a data de entrega — determinante se surgir alguma questão sobre o cumprimento do prazo.",
              },
            ].map(({ icon: BulletIcon, text }, i) => (
              <li key={i} className="flex items-start gap-2">
                <BulletIcon className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-sky-700 leading-snug">{text}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
