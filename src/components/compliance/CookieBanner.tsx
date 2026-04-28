"use client";

/**
 * CookieBanner — RGPD / ePrivacy compliance notice
 *
 * Legal basis:
 *   • Lei n.º 41/2004, art. 4.º-A — cookies estritamente necessários estão isentos
 *     de consentimento prévio, mas requerem informação ao utilizador.
 *   • RGPD art. 13.º — dever de transparência na recolha de dados.
 *   • Orientações CNPD (2022) — banner informativo obrigatório mesmo para cookies técnicos.
 *
 * This platform uses ONLY essential/functional cookies (NextAuth session tokens).
 * No analytics, advertising, or tracking cookies are used.
 * Therefore, only an informational notice (not a consent request) is required.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie } from "lucide-react";

const STORAGE_KEY = "cookie_notice_acknowledged_v1";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  // Only show once per browser — check localStorage after mount (SSR safe)
  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // Private browsing or storage disabled — show the banner
      setVisible(true);
    }
  }, []);

  const acknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Aviso sobre cookies"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl p-4 sm:p-5 pointer-events-auto">
        <div className="flex items-start gap-3">
          <Cookie className="w-5 h-5 text-brand-500 flex-shrink-0 mt-0.5" aria-hidden="true" />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 mb-1">
              Utilizamos apenas cookies essenciais
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Esta plataforma usa exclusivamente cookies técnicos necessários para autenticação
              e segurança (tokens de sessão NextAuth). Não usamos cookies de rastreio, publicidade
              ou análise de comportamento.
              Saber mais:{" "}
              <Link
                href="/legal/privacidade#cookies"
                className="text-brand-500 hover:underline font-medium"
                onClick={acknowledge}
              >
                Política de Privacidade — secção 8
              </Link>
              .
            </p>
          </div>

          <button
            onClick={acknowledge}
            aria-label="Fechar aviso de cookies"
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
          <Link
            href="/legal/privacidade#cookies"
            className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
            onClick={acknowledge}
          >
            Saber mais
          </Link>
          <button
            onClick={acknowledge}
            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Compreendi
          </button>
        </div>
      </div>
    </div>
  );
}
