"use client";

import { useState } from "react";
import { Lock, Copy, Download, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  /** Full document text — only first N chars shown clearly */
  previewText:  string;
  /** Number of characters to show without blur (default 400) */
  clearChars?:  number;
  /** Whether the user has paid — unlocks copy + download */
  isPaid:       boolean;
  /** Called when user tries a locked action */
  onPaywall:    () => void;
  /** Called when user clicks download (only when isPaid) */
  onDownload?:  () => void;
  className?:   string;
}

/** Lines clearly shown before the blur curtain drops. */
const CLEAR_LINES = 5;

export function DocumentPreview({
  previewText,
  isPaid,
  onPaywall,
  onDownload,
  className,
}: Props) {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const lines = previewText.split("\n");
  const clearSection = lines.slice(0, CLEAR_LINES).join("\n");
  const blurSection  = lines.slice(CLEAR_LINES, CLEAR_LINES + 20).join("\n");

  /** Intercepts clipboard copy on the locked section. */
  const handleLockedCopy = (e: React.ClipboardEvent) => {
    if (!isPaid) {
      e.preventDefault();
      onPaywall();
    }
  };

  const handleCopyButton = async () => {
    if (!isPaid) { onPaywall(); return; }

    try {
      await navigator.clipboard.writeText(previewText);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard
      const ta = document.createElement("textarea");
      ta.value = previewText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  return (
    <div className={cn("rounded-xl border border-slate-200 overflow-hidden bg-white", className)}>

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Eye className="w-3.5 h-3.5" />
          <span className="font-medium">
            {isPaid ? "Documento completo" : "Pré-visualização"}
          </span>
          {!isPaid && (
            <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
              Bloqueado
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy button */}
          <button
            onClick={handleCopyButton}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              isPaid
                ? "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                : "bg-white border border-slate-200 text-slate-400 cursor-pointer"
            )}
            title={isPaid ? "Copiar texto" : "Desbloquear para copiar"}
          >
            {isPaid
              ? <Copy className="w-3 h-3" />
              : <Lock className="w-3 h-3" />
            }
            {copyFeedback ? "Copiado!" : "Copiar"}
          </button>

          {/* Download button */}
          <button
            onClick={isPaid ? onDownload : onPaywall}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
              isPaid
                ? "bg-brand-600 hover:bg-brand-700 text-white"
                : "bg-slate-100 border border-slate-200 text-slate-400 cursor-pointer"
            )}
            title={isPaid ? "Descarregar PDF" : "Desbloquear para descarregar"}
          >
            {isPaid
              ? <Download className="w-3 h-3" />
              : <Lock className="w-3 h-3" />
            }
            {isPaid ? "Descarregar PDF" : "PDF bloqueado"}
          </button>
        </div>
      </div>

      {/* ── Document text ─────────────────────────────────────────────────────── */}
      <div className="relative font-mono text-xs leading-relaxed bg-white">

        {/* Clear section */}
        <pre className="px-5 pt-4 pb-2 text-slate-700 whitespace-pre-wrap break-words">
          {clearSection}
        </pre>

        {/* Blurred section */}
        {blurSection && (
          <div className="relative">
            <pre
              className="px-5 pb-4 text-slate-700 whitespace-pre-wrap break-words"
              onCopy={handleLockedCopy}
              style={{
                filter:     isPaid ? "none" : "blur(5px)",
                userSelect: isPaid ? "auto" : "none",
                transition: "filter 0.4s ease",
              }}
            >
              {blurSection}
            </pre>

            {/* Gradient + unlock CTA — only when locked */}
            {!isPaid && (
              <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-white via-white/70 to-transparent pb-6 px-4">
                <button
                  onClick={onPaywall}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descarregar a minha contestação completa
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Pré-visualização grátis · Só pagas para descarregar
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
