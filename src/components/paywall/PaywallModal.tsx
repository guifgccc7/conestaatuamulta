"use client";

import { useState } from "react";
import {
  X,
  Crown,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  FileText,
  RotateCcw,
  AlertTriangle,
  Download,
  CreditCard,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING } from "@/types";
import { PrePaymentDisclaimer } from "@/components/compliance/PrePaymentDisclaimer";

// ─── Types ────────────────────────────────────────────────────────────────────

type Plan = "SINGLE_DOC" | "SUBSCRIPTION";

interface Props {
  isOpen:      boolean;
  onClose:     () => void;
  caseId:      string;
  previewText: string; // First ~300 chars of the minuta (free, clear)
  fineLabel?:  string; // e.g. "Auto 2024/0012 — Excesso de velocidade"
}

// ─── Paywall modal ────────────────────────────────────────────────────────────

export function PaywallModal({ isOpen, onClose, caseId, previewText, fineLabel }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>("SUBSCRIPTION");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          type:   selectedPlan,
          caseId: selectedPlan === "SINGLE_DOC" ? caseId : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.url) {
        throw new Error(json.error ?? "Erro ao criar sessão de pagamento.");
      }

      // Redirect to Stripe Checkout
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido. Tenta novamente.");
      setLoading(false);
    }
  };

  // Preview: first few lines clearly, rest blurred
  const previewLines = previewText.split("\n").filter(Boolean);
  const clearLines   = previewLines.slice(0, 3).join("\n");
  const blurLines    = previewLines.slice(3, 14).join("\n");

  return (
    // ─── Backdrop ────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        "relative z-10 w-full sm:max-w-xl bg-white",
        "sm:rounded-2xl shadow-2xl",
        "flex flex-col max-h-[95vh] overflow-y-auto",
        "rounded-t-2xl",
      )}>

        {/* ── Close ──────────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Document preview (always free) ─────────────────────────────── */}
        {/* UX-004: pr-12 prevents text from going under the close button on mobile */}
        <div className="relative bg-slate-50 border-b border-slate-200 px-5 pr-12 pt-5 pb-0 overflow-hidden rounded-t-2xl">
          <div className="max-w-none">
            {/* Clear preview lines */}
            <pre className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap mb-1">
              {clearLines}
            </pre>

            {/* Blurred preview lines */}
            {blurLines && (
              <pre
                className="text-xs text-slate-700 font-mono leading-relaxed whitespace-pre-wrap select-none"
                style={{ filter: "blur(4px)", userSelect: "none" }}
                aria-hidden="true"
              >
                {blurLines}
              </pre>
            )}
          </div>

          {/* Lock overlay gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent flex flex-col items-center justify-end pb-4">
            <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-3 py-2 rounded-full">
              <Lock className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-xs font-semibold text-slate-700">
                Desbloqueia para ver e descarregar o documento completo
              </span>
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="px-5 py-5">

          {/* Header — outcome-focused, not cost-focused */}
          <div className="mb-4">
            <h2 id="paywall-title" className="text-xl font-bold text-slate-900 mb-1">
              Falta um passo.
            </h2>
            <p className="text-sm text-slate-500">
              O documento está gerado. Descarrega e envia ainda hoje.
            </p>
            {fineLabel && (
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                <FileText className="w-3.5 h-3.5" />
                {fineLabel}
              </p>
            )}
          </div>

          {/* ── Value stack (positive framing — what you RECEIVE) ─────────── */}
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-5">
            <p className="text-xs font-semibold text-green-800 mb-2.5 uppercase tracking-wide">
              O que recebes agora
            </p>
            <ul className="space-y-2">
              {[
                "PDF completo com todos os argumentos legais",
                "Guia de envio por correio registado (AR)",
                "A entidade fica obrigada a responder por escrito",
                "Acesso permanente a este caso",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-xs text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Plan selector ─────────────────────────────────────────────── */}
          {/* Subscription first — anchors perception before showing single-doc */}
          <div className="space-y-3 mb-5">

            {/* Subscription — shown first for anchoring */}
            <label className={cn(
              "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all relative",
              selectedPlan === "SUBSCRIPTION"
                ? "border-amber-400 bg-amber-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}>
              {/* Badge */}
              <span className="absolute -top-2.5 left-4 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Melhor valor
              </span>
              <input
                type="radio"
                name="plan"
                value="SUBSCRIPTION"
                checked={selectedPlan === "SUBSCRIPTION"}
                onChange={() => setSelectedPlan("SUBSCRIPTION")}
                className="mt-0.5 accent-amber-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-500" />
                    Subscrição mensal
                  </span>
                  <span className="text-lg font-bold text-amber-600 flex-shrink-0">
                    {PRICING.SUBSCRIPTION.label}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {[
                    "Contestações ilimitadas",
                    "7 dias grátis — cancela quando quiseres",
                    "Ideal se tens mais de 1 multa por mês",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CheckCircle2 className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </label>

            {/* Single doc */}
            <label className={cn(
              "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
              selectedPlan === "SINGLE_DOC"
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            )}>
              <input
                type="radio"
                name="plan"
                value="SINGLE_DOC"
                checked={selectedPlan === "SINGLE_DOC"}
                onChange={() => setSelectedPlan("SINGLE_DOC")}
                className="mt-0.5 accent-brand-600"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-brand-500" />
                    Documento avulso
                  </span>
                  <span className="text-lg font-bold text-brand-600 flex-shrink-0">
                    {PRICING.SINGLE_DOC.label}
                  </span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {[
                    "PDF pronto a enviar + versão texto",
                    "Acesso permanente a este caso",
                    "Recebes por email",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </label>
          </div>

          {/* ── Pre-payment disclaimer (Lei 24/96 art. 8.º) — informational ── */}
          <PrePaymentDisclaimer className="mb-4" />

          {/* ── Error ─────────────────────────────────────────────────────── */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* ── CTA button — outcome language, no friction ─────────────────── */}
          <button
            onClick={handlePay}
            disabled={loading}
            className={cn(
              "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-base transition-all",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              selectedPlan === "SUBSCRIPTION"
                ? "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-lg shadow-amber-500/25"
                : "bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500 shadow-lg shadow-brand-600/25",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> A redirecionar para pagamento...</>
            ) : selectedPlan === "SUBSCRIPTION" ? (
              <><Zap className="w-5 h-5" /> Começar 7 dias grátis</>
            ) : (
              <><Download className="w-5 h-5" /> Descarregar a minha contestação — {PRICING.SINGLE_DOC.label}</>
            )}
          </button>

          {/* ── Trust signals ─────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4">
            {[
              { icon: ShieldCheck, text: "Pagamento seguro — Stripe" },
              { icon: RotateCcw,   text: "Reembolso em 7 dias" },
              { icon: Lock,        text: "Dados cifrados (RGPD)" },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1 text-xs text-slate-400">
                <Icon className="w-3 h-3" />
                {text}
              </span>
            ))}
          </div>

          {/* Anchor: cost comparison */}
          <p className="text-center text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
            Advogado: <span className="line-through">€150–400</span>
            &nbsp;·&nbsp;
            Aqui: <strong className="text-brand-600">{PRICING.SINGLE_DOC.label}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
