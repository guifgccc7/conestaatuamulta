"use client";

/**
 * WizardComplianceFooter
 *
 * Persistent footer shown below every wizard step.
 * Explicitly states the legal basis for self-representation (RGCO art. 61.º)
 * to avoid any implication that users are doing something irregular by
 * contesting without a lawyer.
 *
 * Also satisfies EOA art. 66.º by making clear this is not legal advice.
 */

import { Scale, ExternalLink } from "lucide-react";
import { PLATFORM } from "@/lib/compliance/disclaimers";
import Link from "next/link";

export function WizardComplianceFooter() {
  return (
    <footer
      className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed px-2 space-y-1"
      role="contentinfo"
      aria-label="Informação legal"
    >
      <div className="flex items-center justify-center gap-1.5">
        <Scale className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <p>{PLATFORM.WIZARD_FOOTER}</p>
      </div>
      <p>
        Direito de auto-representação ao abrigo do{" "}
        <strong className="text-slate-500">art. 61.º do RGCO (DL 433/82)</strong>.
        {" "}
        <Link
          href="/legal/termos"
          className="underline underline-offset-2 hover:text-slate-600 transition-colors"
        >
          Termos
        </Link>
        {" · "}
        <Link
          href="/legal/privacidade"
          className="underline underline-offset-2 hover:text-slate-600 transition-colors"
        >
          Privacidade
        </Link>
      </p>
    </footer>
  );
}
