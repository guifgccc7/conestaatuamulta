"use client";

/**
 * DocumentDisclaimerCard
 *
 * Structured compliance card shown to users before and after document generation.
 * Rendered in three contexts:
 *
 *   "review"    — Step 6 review panel, before paying / generating
 *   "download"  — Immediately after PDF download
 *   "editor"    — Document editor footer
 *
 * Legal basis satisfied:
 *   EOA (Lei 145/2015) art. 66.º  — must not imply legal advice
 *   Lei 49/2004                   — consulta jurídica is reserved
 *   RGCO (DL 433/82) art. 61.º   — positive right to self-represent
 *   AI Act (UE 2024/1689) art. 50.º — when AI content is present
 *   Lei 24/96 art. 8.º            — limitation clause must be conspicuous
 *   DL 446/85 art. 8.º            — must highlight general contract clauses
 *
 * Design principles:
 *   • Amber / warning palette — legally required to be noticed
 *   • Never hidden behind a toggle or "see more" in the review context
 *   • Sectioned into readable chunks (What is / What is not / Checklist)
 *   • AI section conditionally shown when aiEnhanced = true
 */

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldOff,
  Scale,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { DOCUMENT, AI_ASSISTANT, LEGAL_BASIS } from "@/lib/compliance/disclaimers";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

export type DisclaimerContext = "review" | "download" | "editor";

interface Props {
  context:      DisclaimerContext;
  /** Set to true when the document was generated with AI enhancement */
  aiEnhanced?:  boolean;
  /** Optional extra className on the root element */
  className?:   string;
}

// ─── Internal sub-components ──────────────────────────────────────────────────

function SectionRow({
  icon,
  title,
  children,
  accent = "amber",
}: {
  icon:     React.ReactNode;
  title:    string;
  children: React.ReactNode;
  accent?:  "amber" | "blue" | "green" | "red";
}) {
  const accentMap = {
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    blue:  "text-blue-700  bg-blue-50  border-blue-200",
    green: "text-green-700 bg-green-50 border-green-200",
    red:   "text-red-700   bg-red-50   border-red-200",
  };

  return (
    <div className={cn("rounded-xl border p-4", accentMap[accent])}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="flex-shrink-0">{icon}</span>
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentDisclaimerCard({
  context,
  aiEnhanced = false,
  className,
}: Props) {
  // In "review" context the card is always expanded (legally required to be seen).
  // In "editor" / "download" contexts the user can collapse after reading.
  const alwaysOpen = context === "review";
  const [open, setOpen] = useState(alwaysOpen);

  // ── "editor" variant: compact inline footer ──────────────────────────────
  if (context === "editor") {
    return (
      <div
        className={cn(
          "border border-slate-200 rounded-xl bg-slate-50 text-slate-600",
          className,
        )}
        role="note"
        aria-label="Aviso sobre a natureza do documento"
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Scale className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
            Aviso legal — natureza do documento
          </span>
          {open
            ? <ChevronUp  className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {open && (
          <div className="px-4 pb-4 text-xs leading-relaxed space-y-2 border-t border-slate-200 pt-3">
            <p>{DOCUMENT.SHORT}</p>
            {aiEnhanced && (
              <p className="flex items-start gap-1.5 text-brand-700">
                <Sparkles className="w-3 h-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {DOCUMENT.AI_GENERATED_NOTICE}
              </p>
            )}
            <p>
              <a
                href="/legal/termos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline"
              >
                Termos e condições
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── "download" variant: post-download action card ─────────────────────────
  if (context === "download") {
    return (
      <div
        className={cn(
          "border border-amber-200 rounded-2xl bg-amber-50 overflow-hidden",
          className,
        )}
        role="note"
        aria-label="Informação importante sobre o documento"
      >
        {/* Header — always visible */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
          aria-expanded={open}
        >
          <span className="flex items-center gap-2.5 font-semibold text-amber-800 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            Lê antes de enviar
          </span>
          {open
            ? <ChevronUp  className="w-4 h-4 text-amber-500" />
            : <ChevronDown className="w-4 h-4 text-amber-500" />}
        </button>

        {open && (
          <div className="border-t border-amber-200 px-5 pb-5 pt-4 space-y-4">

            {/* Post-download note */}
            <p className="text-sm text-amber-800 leading-relaxed">
              {DOCUMENT.POST_DOWNLOAD}
            </p>

            {/* Checklist */}
            <div>
              <p className="text-xs font-semibold text-amber-900 mb-2.5 uppercase tracking-wide">
                Verifica antes de enviar
              </p>
              <ul className="space-y-2">
                {DOCUMENT.REVIEW_CHECKLIST.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <CheckCircle2
                      className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 mt-0.5"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Not legal advice — compact */}
            <p className="text-xs text-amber-700 leading-relaxed border-t border-amber-200 pt-3">
              {DOCUMENT.SHORT}
            </p>

          </div>
        )}
      </div>
    );
  }

  // ── "review" variant: full card, always expanded, required before paying ──
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm",
        className,
      )}
      role="note"
      aria-label="Declaração de natureza do serviço"
    >
      {/* Header — non-interactive in review mode */}
      <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border-b border-amber-100">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 text-sm">
            Natureza do serviço
          </h3>
          <p className="text-xs text-amber-600">
            Lê com atenção antes de gerar e pagar o documento
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* What it IS */}
        <SectionRow
          icon={<Scale       className="w-4 h-4" aria-hidden="true" />}
          title="O que este serviço é"
          accent="green"
        >
          <p className="mb-2">{LEGAL_BASIS.SELF_REPRESENTATION}</p>
          <p className="text-xs opacity-80">{LEGAL_BASIS.DISTINCTION_FROM_LEGAL_ADVICE}</p>
        </SectionRow>

        {/* What it is NOT */}
        <SectionRow
          icon={<ShieldOff   className="w-4 h-4" aria-hidden="true" />}
          title="O que este serviço não é"
          accent="amber"
        >
          <ul className="space-y-1.5">
            {[
              "Não é consulta jurídica personalizada (Lei n.º 49/2004).",
              "Não é exercício de advocacia (EOA, art. 66.º).",
              "Não garante o resultado da contestação.",
              "Não substitui advogado em casos complexos ou de alto valor.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionRow>

        {/* Limitation of liability — legally required to be conspicuous */}
        <SectionRow
          icon={<AlertTriangle className="w-4 h-4" aria-hidden="true" />}
          title="Limitação de responsabilidade"
          accent="red"
        >
          <p>
            A plataforma não garante qualquer resultado. A responsabilidade
            limita-se ao valor pago pelo serviço, sem prejuízo dos direitos
            imperativos do consumidor ao abrigo da Lei n.º 24/96.
          </p>
          <p className="mt-2 text-xs opacity-75">
            Para casos com coimas superiores a €600, perda de pontos ou risco
            de suspensão de carta de condução, recomenda-se vivamente a
            consulta de um advogado.
          </p>
        </SectionRow>

        {/* AI section — conditional */}
        {aiEnhanced && (
          <SectionRow
            icon={<Sparkles    className="w-4 h-4" aria-hidden="true" />}
            title="Conteúdo gerado por IA"
            accent="blue"
          >
            <p>{DOCUMENT.AI_GENERATED_NOTICE}</p>
            <p className="mt-2 text-xs opacity-75">
              {AI_ASSISTANT.RESPONSE_FOOTER}
            </p>
          </SectionRow>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-3 pt-1 text-xs">
          <a
            href="/legal/termos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
          >
            Termos e condições
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="/legal/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
          >
            Política de privacidade
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a
            href="/legal/aviso-legal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 underline-offset-2 hover:underline"
          >
            Aviso legal
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
