"use client";

/**
 * PrePaymentDisclaimer
 *
 * Displayed immediately above the payment button in PaywallModal and Step 6.
 * Required by Lei 24/96 (consumer protection) art. 8.º:
 *   Limitation of liability clauses must be brought to the consumer's
 *   attention in a clear and conspicuous manner BEFORE the contract is formed.
 *
 * DL 24/2014 art. 4.º: pre-contractual information requirements.
 */

import { ShieldCheck } from "lucide-react";
import { PLATFORM } from "@/lib/compliance/disclaimers";

interface Props {
  /** Checkbox mode — requires explicit acknowledgement before enabling pay button */
  requireAck?:  boolean;
  acked?:       boolean;
  onAck?:       (v: boolean) => void;
  className?:   string;
}

export function PrePaymentDisclaimer({ requireAck, acked, onAck, className }: Props) {
  return (
    <div className={`text-xs text-slate-500 leading-relaxed ${className ?? ""}`}>
      {requireAck ? (
        <label className="flex items-start gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={acked ?? false}
            onChange={(e) => onAck?.(e.target.checked)}
            className="mt-0.5 flex-shrink-0 accent-brand-600 cursor-pointer"
            aria-label="Confirmar compreensão das condições do serviço"
          />
          <span className="group-hover:text-slate-700 transition-colors">
            {PLATFORM.PRE_PAYMENT}
            {" "}
            <a
              href="/legal/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              Termos e Condições
            </a>
            .
          </span>
        </label>
      ) : (
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p>{PLATFORM.PRE_PAYMENT}</p>
        </div>
      )}
    </div>
  );
}
