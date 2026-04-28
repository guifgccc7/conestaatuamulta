"use client";

/**
 * AiFirstUseGate
 *
 * One-time modal shown before the AI assistant processes case data for the
 * first time in a session.
 *
 * Required by:
 *  - RGPD art. 13.º — users must be informed of processing before it happens
 *  - AI Act (2024/1689) art. 50.º — disclose AI system at first interaction
 *  - EOA art. 66.º — ensure no impression of legal advice is given
 *
 * Consent is stored in sessionStorage (not localStorage — does not persist
 * across sessions, requiring acknowledgement per visit, which is safer
 * legally than a permanent "never show again" cookie).
 */

import { useState, useEffect } from "react";
import { Sparkles, Shield, X } from "lucide-react";
import { AI_ACT, GDPR, AI_ASSISTANT } from "@/lib/compliance/disclaimers";

const SESSION_KEY = "ai_disclosure_acknowledged";

interface Props {
  /** Called when user accepts — triggers the actual AI action */
  onAccept: () => void;
  /** Called when user declines */
  onDecline?: () => void;
}

export function useAiFirstUseGate() {
  const [needsGate, setNeedsGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Check if already acknowledged this session
  const isAcknowledged = () =>
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(SESSION_KEY) === "1";

  const markAcknowledged = () => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  };

  /**
   * Call this before any AI action.
   * If not yet acknowledged, shows the gate and queues the action.
   * If already acknowledged, calls the action immediately.
   */
  const guardAiAction = (action: () => void) => {
    if (isAcknowledged()) {
      action();
    } else {
      setPendingAction(() => action);
      setNeedsGate(true);
    }
  };

  const accept = () => {
    markAcknowledged();
    setNeedsGate(false);
    pendingAction?.();
    setPendingAction(null);
  };

  const decline = () => {
    setNeedsGate(false);
    setPendingAction(null);
  };

  return { needsGate, guardAiAction, accept, decline };
}

// ─── Modal component ──────────────────────────────────────────────────────────

export function AiFirstUseGate({ onAccept, onDecline }: Props) {
  const [checked, setChecked] = useState(false);

  // Trap focus when open
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => { prev?.focus(); };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-gate-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <h2 id="ai-gate-title" className="font-semibold text-slate-900 text-sm">
              Assistente de IA — Informação obrigatória
            </h2>
            <p className="text-xs text-slate-500">AI Act (UE) 2024/1689, art. 50.º</p>
          </div>
          {onDecline && (
            <button
              onClick={onDecline}
              className="ml-auto p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* AI Act disclosure */}
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1.5">
              Estás a interagir com um sistema de IA
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              {AI_ACT.FIRST_USE_DISCLOSURE}
            </p>
          </div>

          {/* Data processing */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 mb-1.5">
              <Shield className="w-3.5 h-3.5" />
              Dados enviados ao assistente de IA
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              {GDPR.AI_DATA_NOTICE}
            </p>
          </div>

          {/* Legal advisory disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800 leading-relaxed">
              {AI_ASSISTANT.PANEL_BANNER}
            </p>
          </div>

          {/* Consent checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 flex-shrink-0 accent-brand-600 cursor-pointer"
              aria-required="true"
              id="ai-gate-consent"
            />
            <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors leading-relaxed">
              Compreendi que estou a interagir com um sistema de IA e que as respostas não
              constituem aconselhamento jurídico personalizado.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          {onDecline && (
            <button
              onClick={onDecline}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors font-medium"
            >
              Cancelar
            </button>
          )}
          <button
            onClick={onAccept}
            disabled={!checked}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              checked
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
            aria-disabled={!checked}
          >
            Continuar para o assistente
          </button>
        </div>
      </div>
    </div>
  );
}
