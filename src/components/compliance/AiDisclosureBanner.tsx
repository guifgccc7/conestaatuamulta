"use client";

/**
 * AiDisclosureBanner
 *
 * Persistent banner shown at the top of the AI assistant panel.
 * Required by:
 *  - EU AI Act (2024/1689) art. 50.º — transparency for AI systems
 *  - EOA (Lei 145/2015) art. 66.º — cannot imply legal advice status
 *
 * Design: always visible, not dismissible, minimal height to not obstruct the chat.
 */

import { AlertTriangle, ExternalLink } from "lucide-react";
import { AI_ASSISTANT } from "@/lib/compliance/disclaimers";

interface Props {
  /** Compact single-line variant for use inside message bubbles */
  compact?: boolean;
}

export function AiDisclosureBanner({ compact = false }: Props) {
  if (compact) {
    return (
      <p className="text-[10px] text-amber-600 leading-relaxed italic mt-2 pt-2 border-t border-amber-100">
        {AI_ASSISTANT.RESPONSE_FOOTER}
      </p>
    );
  }

  return (
    <div
      className="flex items-start gap-2.5 bg-amber-50 border-b border-amber-200 px-4 py-3 flex-shrink-0"
      role="note"
      aria-label="Aviso importante sobre o assistente de IA"
    >
      <AlertTriangle
        className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-xs text-amber-800 leading-relaxed">
          {AI_ASSISTANT.PANEL_BANNER}
        </p>
        <a
          href="/legal/privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 mt-1 underline-offset-2 hover:underline"
        >
          Política de privacidade e dados de IA
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
}
