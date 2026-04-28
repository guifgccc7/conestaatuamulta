"use client";

/**
 * AiGeneratedLabel
 *
 * Badge applied to any text block generated or enhanced by AI.
 * Required by EU AI Act (2024/1689) art. 50.º:
 *   "providers shall ensure that AI-generated content is marked in a
 *    machine-readable format and detectable as artificially generated."
 *
 * Used in:
 *  - DocumentEditor (Section II when aiEnhanced = true)
 *  - AiInsightBadge response text
 *  - Generated PDF footer
 */

import { Sparkles } from "lucide-react";
import { AI_ACT } from "@/lib/compliance/disclaimers";
import { cn } from "@/lib/utils";

type Variant = "badge" | "inline" | "section-header";

interface Props {
  variant?:  Variant;
  /** Override the default label text */
  label?:    string;
  className?: string;
}

export function AiGeneratedLabel({
  variant   = "badge",
  label,
  className,
}: Props) {
  const text = label ?? AI_ACT.GENERATED_LABEL;

  if (variant === "inline") {
    return (
      <span
        className={cn("inline-flex items-center gap-1 text-[10px] text-brand-600 font-medium", className)}
        title="Este conteúdo foi gerado por inteligência artificial (AI Act UE 2024/1689 art. 50.º)"
      >
        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
        {text}
      </span>
    );
  }

  if (variant === "section-header") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-[10px] text-brand-700 bg-brand-50 border border-brand-200",
          "rounded-md px-2 py-1 font-medium",
          className
        )}
        role="note"
        aria-label={`Secção gerada por inteligência artificial`}
      >
        <Sparkles className="w-3 h-3" aria-hidden="true" />
        <span>
          {text}{" "}
          <span className="font-normal text-brand-500">
            (AI Act UE 2024/1689, art. 50.º)
          </span>
        </span>
      </div>
    );
  }

  // Default: badge
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5",
        "bg-brand-100 text-brand-700 rounded-full",
        "text-[9px] font-bold uppercase tracking-wide",
        className
      )}
      title="Este conteúdo foi gerado por inteligência artificial (AI Act UE 2024/1689 art. 50.º)"
    >
      <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
      IA
    </span>
  );
}
