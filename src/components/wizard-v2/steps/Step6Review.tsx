"use client";

import { useState } from "react";
import {
  WizardState,
  CaseSummary,
  DefenseSuggestion,
} from "@/lib/wizard/logic-engine";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Loader2,
  Pencil,
  FileText,
  Lock,
  Crown,
  Sparkles,
  Download,
  Eye,
} from "lucide-react";
import type { AiOutput } from "@/lib/document/types";
import { PRICING }               from "@/types";
import { PaywallModal }          from "@/components/paywall/PaywallModal";
import { DocumentEditor }        from "@/components/document-editor/DocumentEditor";
import { DocumentPreview }       from "@/components/paywall/DocumentPreview";
import { SendingInstructions }   from "./SendingInstructions";
import { useSession } from "next-auth/react";
import Link from "next/link";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  state:              WizardState;
  summary:            CaseSummary;
  defenses:           DefenseSuggestion[];
  aiOutput?:          AiOutput | null;
  /** Generates (or re-generates) the document server-side. Returns preview text. */
  onGenerate:         () => Promise<{ previewText?: string; caseId?: string; documentId?: string; isPaid?: boolean } | void>;
  onEditStep:         (step: number) => void;
  saving:             boolean;
  /** Opens the AI assistant floating panel. */
  onOpenAssistant?:   () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step6Review({
  state, summary, defenses, aiOutput,
  onGenerate, onEditStep, saving, onOpenAssistant,
}: Props) {
  const { data: session } = useSession();

  // Local state for paywall + editor
  const [paywallOpen,   setPaywallOpen]   = useState(false);
  const [previewText,   setPreviewText]   = useState<string | null>(null);
  const [editedText,    setEditedText]    = useState<string | null>(null);
  const [generatedId,   setGeneratedId]   = useState<string | null>(null);
  const [localCaseId,   setLocalCaseId]   = useState<string | null>(null);
  const [isPaid,        setIsPaid]        = useState(false);
  const [genError,      setGenError]      = useState<string | null>(null);

  const selected = defenses.filter((d) =>
    state.legalGrounds.selectedGrounds?.includes(d.id)
  );

  // ── Trigger document generation + show preview ────────────────────────────

  const handlePreview = async () => {
    setGenError(null);
    const result = await onGenerate();
    if (result) {
      if (result.previewText) setPreviewText(result.previewText);
      if (result.caseId)      setLocalCaseId(result.caseId);
      if (result.documentId)  setGeneratedId(result.documentId);
      if (result.isPaid)      setIsPaid(result.isPaid);
    }
  };

  // ── Direct download (subscribers / already paid) ─────────────────────────
  // If the user edited the document, regenerate the PDF with their changes
  // before downloading.

  const handleDownload = async () => {
    if (!generatedId && !localCaseId) return;

    // If user edited the document, re-generate with edits before downloading
    const textToUse = editedText ?? previewText;
    if (editedText && editedText !== previewText && localCaseId) {
      try {
        // Re-generate with the edited text
        await fetch("/api/documents/generate", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            caseId:   localCaseId,
            aiOutput: aiOutput ?? undefined,
            // Pass the user-edited text override
            editedText: textToUse,
          }),
        });
      } catch {
        // Non-fatal — fall through and download original
      }
    }

    if (generatedId) {
      window.location.href = `/api/documents/download?documentId=${generatedId}`;
    }
  };

  // ── Strength colours ─────────────────────────────────────────────────────

  const strengthColors = {
    strong: "text-green-600 bg-green-50 border-green-200",
    medium: "text-brand-600 bg-brand-50 border-brand-200",
    weak:   "text-slate-500 bg-slate-50 border-slate-200",
  };
  const strengthLabels = {
    strong: "Defesa forte",
    medium: "Defesa moderada",
    weak:   "Defesa de suporte",
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">Revisão final</h2>
      <p className="text-slate-500 text-sm mb-6">
        Confirma os dados antes de gerar a carta de contestação
      </p>

      {/* ── AI-enhanced notice (when AI was used) ────────────────────────── */}
      {aiOutput && aiOutput.argumentos.length > 0 && (
        <AiEnhancedNotice aiOutput={aiOutput} />
      )}

      {/* ── AI upsell (when AI was NOT used) ─────────────────────────────── */}
      {!aiOutput && onOpenAssistant && (
        <AiUpsellBlock onOpenAssistant={onOpenAssistant} defenseCount={selected.length} />
      )}

      {/* ── Case strength badge ──────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl border p-4 mb-5",
        strengthColors[summary.strengthOverall]
      )}>
        <ShieldCheck className="w-6 h-6 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">{strengthLabels[summary.strengthOverall]}</p>
          <p className="text-xs opacity-80">
            {selected.length} fundamento{selected.length !== 1 ? "s" : ""} selecionado{selected.length !== 1 ? "s" : ""}
            {summary.topDefense && ` · Argumento principal: ${summary.topDefense}`}
          </p>
        </div>
      </div>

      {/* ── Summary table ────────────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        <SummarySection
          title="Dados da multa"
          onEdit={() => onEditStep(2)}
          rows={[
            { label: "Tipo de infração",  value: summary.fineTypeLabel },
            { label: "Entidade autuante", value: summary.authorityLabel },
            { label: "Data",              value: summary.dateLabel },
            { label: "Local",             value: summary.locationLabel },
            { label: "Matrícula",         value: summary.plateLabel },
            ...(state.fineDetails.fineReference
              ? [{ label: "N.º da auto", value: state.fineDetails.fineReference }]
              : []),
          ]}
        />

        <SummarySection
          title="Circunstâncias"
          onEdit={() => onEditStep(3)}
          rows={[
            { label: "Condutor", value: summary.driverLabel },
            {
              label: "Prova disponível",
              value: state.context.hasEvidence === "yes"   ? "Sim"
                   : state.context.hasEvidence === "partial" ? "Alguma"
                   : "Não",
            },
          ]}
        />

        <SummarySection
          title="Fundamentos legais"
          onEdit={() => onEditStep(4)}
          rows={selected.map((d) => ({
            label: d.icon + " " + d.strengthLabel,
            value: d.title,
          }))}
          emptyMessage="Nenhum fundamento selecionado — volta ao passo 4"
        />

        <SummarySection
          title="Dados do arguido"
          onEdit={() => onEditStep(5)}
          rows={[
            { label: "Nome",   value: state.personalData.fullName ?? "—" },
            { label: "NIF",    value: state.personalData.nif ?? "—" },
            { label: "Morada", value: state.personalData.address?.split("\n")[0] ?? "—" },
          ]}
        />
      </div>

      {/* ── What's included checklist ────────────────────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-2.5">
          <FileText className="w-4 h-4" />
          O documento vai incluir:
        </div>
        <ul className="space-y-1.5 text-xs text-slate-600">
          {[
            "Carta de impugnação formal em Português jurídico",
            `${selected.length} fundamento${selected.length !== 1 ? "s" : ""} legal${selected.length !== 1 ? "is" : ""} com base legal explícita`,
            "Identificação completa do arguido e do veículo",
            "Pedido de absolvição ou redução ao abrigo do RGCO",
            "PDF formatado e pronto a enviar ou imprimir",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Sending instructions ─────────────────────────────────────────── */}
      <SendingInstructions />

      {/* ── Document preview + CTA — always visible (BUG-001) ───────────────── */}
      {/* Auth redirect is handled inside onGenerate (SmartWizard.handleGenerate). */}
      {/* After login, localStorage draft restores the wizard state (UX-002). */}

      {previewText ? (
        /* ── Post-generate ─────────────────────────────────────────────────── */
        <div className="mb-5">

          {isPaid ? (
            /* ── Paid / subscriber: full editable document ──────────────────── */
            <>
              <DocumentEditor
                documentText={previewText}
                aiOutput={aiOutput}
                isPaid={isPaid}
                onPaywall={() => setPaywallOpen(true)}
                onDownload={handleDownload}
                onChange={setEditedText}
              />
              <button
                onClick={handlePreview}
                disabled={saving}
                className="mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors w-full text-center"
              >
                Atualizar com alterações
              </button>

              {/* Prominent download CTA below editor — always visible even when toolbar is scrolled away */}
              {generatedId && (
                <button
                  onClick={handleDownload}
                  className="btn-primary w-full py-4 text-base justify-center mt-4"
                >
                  <Download className="w-5 h-5" />
                  Descarregar PDF
                </button>
              )}
            </>
          ) : (
            /* ── Not yet paid: blurred preview + paywall CTA ────────────────── */
            <>
              <DocumentPreview
                previewText={previewText}
                isPaid={false}
                onPaywall={() => setPaywallOpen(true)}
              />

              {/* Primary paywall CTA — prominent and always visible */}
              <button
                onClick={() => setPaywallOpen(true)}
                className="btn-primary w-full py-4 text-base justify-center mt-4"
              >
                <Download className="w-5 h-5" />
                Descarregar a minha contestação completa
              </button>
              <p className="text-xs text-slate-400 text-center mt-2">
                Pré-visualização grátis · Só pagas quando quiseres descarregar
              </p>
            </>
          )}
        </div>
      ) : (
        /* ── Pre-generate CTA ──────────────────────────────────────────────── */
        <>
          {/* Subscription upsell banner */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Crown className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Subscrição — {PRICING.SUBSCRIPTION.label} · 7 dias grátis
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                    Documentos ilimitados · Análise IA incluída em cada contestação
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setLocalCaseId(null); setPaywallOpen(true); }}
                className="flex-shrink-0 text-xs bg-amber-500 hover:bg-amber-600 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                Começar grátis
              </button>
            </div>
          </div>

          {/* BUG-010: soft warning when fine reference number is missing */}
          {!state.fineDetails.fineReference && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3 text-xs text-amber-700">
              <Eye className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>
                O número da auto não foi preenchido — o documento mencionará apenas os dados da infração.{" "}
                <button
                  type="button"
                  onClick={() => onEditStep(2)}
                  className="font-semibold underline hover:no-underline"
                >
                  Adicionar agora
                </button>
              </span>
            </div>
          )}

          {genError && (
            <p className="text-xs text-red-500 text-center mb-3">{genError}</p>
          )}

          {/* Main CTA — always visible; auth check happens inside onGenerate */}
          <button
            onClick={handlePreview}
            disabled={saving || selected.length === 0}
            className="btn-primary w-full py-4 text-base justify-center"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> A preparar documento...</>
            ) : (
              <><FileText className="w-5 h-5" /> Ver a minha contestação — grátis</>
            )}
          </button>

          {selected.length === 0 && (
            <p className="text-xs text-red-500 text-center mt-2">
              Volta ao passo 4 e seleciona pelo menos um fundamento legal.
            </p>
          )}

          {/* Auth hint — informational only, not a blocker */}
          {!session ? (
            <p className="text-xs text-slate-500 text-center mt-2 leading-relaxed">
              <Lock className="w-3 h-3 inline mr-1" aria-hidden="true" />
              Precisas de{" "}
              <Link href="/auth/login?redirect=/wizard" className="text-brand-500 hover:underline font-medium">
                entrar ou criar conta
              </Link>
              {" "}para guardar e descarregar o documento.
            </p>
          ) : (
            <p className="text-xs text-slate-400 text-center mt-3 leading-relaxed">
              A pré-visualização é grátis. Só pagas quando quiseres descarregar.
            </p>
          )}
        </>
      )}

      {/* ── Download button is rendered inside the previewText block above ───── */}

      {/* ── Paywall modal ─────────────────────────────────────────────────── */}
      {localCaseId && (
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          caseId={localCaseId}
          previewText={previewText ?? ""}
          fineLabel={
            summary.fineTypeLabel +
            (state.fineDetails.fineReference ? ` — Auto ${state.fineDetails.fineReference}` : "")
          }
        />
      )}

      {/* Modal without caseId yet — subscription upsell only */}
      {!localCaseId && paywallOpen && (
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          caseId=""
          previewText={previewText ?? ""}
          fineLabel={summary.fineTypeLabel}
        />
      )}
    </div>
  );
}

// ─── Summary section ──────────────────────────────────────────────────────────

function SummarySection({
  title, rows, onEdit, emptyMessage,
}: {
  title: string;
  rows: { label: string; value: string }[];
  onEdit: () => void;
  emptyMessage?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-700 font-medium"
        >
          <Pencil className="w-3 h-3" />
          Editar
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="px-4 py-3 text-xs text-amber-600 italic">{emptyMessage}</div>
      ) : (
        rows.map((row, i) => (
          <div
            key={row.label}
            className={cn(
              "flex justify-between gap-4 px-4 py-2.5 text-sm",
              i % 2 === 0 ? "bg-white" : "bg-slate-50"
            )}
          >
            <span className="text-slate-400 flex-shrink-0 text-xs pt-0.5">{row.label}</span>
            <span className="text-slate-800 text-right text-xs font-medium">{row.value}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ─── AI enhanced notice ────────────────────────────────────────────────────────

function AiEnhancedNotice({ aiOutput }: { aiOutput: AiOutput }) {
  const strengthConfig = {
    forte:    { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-700",  label: "Forte",    pct: 82 },
    moderado: { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-700",  label: "Moderado", pct: 57 },
    fraco:    { bg: "bg-slate-50",  border: "border-slate-200",  text: "text-slate-600",  label: "Fraco",    pct: 28 },
  };
  const strength = aiOutput.caseStrength ?? "moderado";
  const cfg      = strengthConfig[strength];
  const count    = aiOutput.argumentos.length;

  return (
    <div className={cn("rounded-xl border p-4 mb-4", cfg.bg, cfg.border)}>
      <div className="flex items-center gap-2.5 mb-3">
        <Sparkles className={cn("w-4 h-4 flex-shrink-0", cfg.text)} />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", cfg.text)}>
            Documento otimizado pela IA
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {aiOutput.texto_formal
              ? "Fundamentação jurídica reescrita pelo assistente."
              : `${count} argumento${count !== 1 ? "s" : ""} adicionado${count !== 1 ? "s" : ""} ao documento.`
            }
          </p>
        </div>
        <span className={cn(
          "flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border",
          cfg.bg, cfg.border, cfg.text
        )}>
          Caso {cfg.label.toLowerCase()}
        </span>
      </div>
      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-slate-500">Solidez da contestação</span>
          <span className={cn("text-[11px] font-semibold tabular-nums", cfg.text)}>{cfg.pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full",
              strength === "forte" ? "bg-green-500" : strength === "moderado" ? "bg-amber-400" : "bg-slate-400"
            )}
            style={{ width: `${cfg.pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── AI upsell block (when AI not used) ───────────────────────────────────────

function AiUpsellBlock({
  onOpenAssistant,
  defenseCount,
}: {
  onOpenAssistant: () => void;
  defenseCount:    number;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50 to-white px-4 py-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-brand-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-brand-900 mb-1">
            Melhora o teu documento com IA
          </p>
          <ul className="space-y-1 mb-3">
            {[
              `Avalia a solidez dos ${defenseCount} argumento${defenseCount !== 1 ? "s" : ""} selecionados`,
              "Identifica pontos fracos antes de enviar",
              "Reformula em linguagem jurídica mais formal",
            ].map((item) => (
              <li key={item} className="flex items-start gap-1.5 text-xs text-brand-600">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={onOpenAssistant}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-white border border-brand-300 hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Abrir assistente IA
          </button>
        </div>
      </div>
    </div>
  );
}
