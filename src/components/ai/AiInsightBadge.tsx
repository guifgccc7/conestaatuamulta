"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WizardState, DefenseSuggestion } from "@/lib/wizard/logic-engine";
import { buildCaseContext } from "@/lib/ai/case-context";
import { ANALYZE_CASE_PROMPT } from "@/lib/ai/system-prompt";
import { useAiFirstUseGate, AiFirstUseGate } from "@/components/compliance/AiFirstUseGate";
import { AiGeneratedLabel } from "@/components/compliance/AiGeneratedLabel";
import { AiDisclosureBanner } from "@/components/compliance/AiDisclosureBanner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  wizardState:       WizardState;
  defenses:          DefenseSuggestion[];
  /** When provided, "Ver análise completa" opens the AI assistant panel. */
  onOpenAssistant?:  () => void;
}

type Status = "idle" | "loading" | "done" | "error";

interface ParsedInsight {
  caseStrength: "forte" | "moderado" | "fraco";
  strongPoints: string[];
  weakPoint:    string | null;
  evalSummary:  string;
}

// ─── Strength display config ───────────────────────────────────────────────────

const STRENGTH_CONFIG = {
  forte: {
    pct:       82,
    barColor:  "bg-green-500",
    textColor: "text-green-700",
    bgColor:   "bg-green-50",
    border:    "border-green-200",
    label:     "Caso bem fundamentado",
    sub:       "Os argumentos são juridicamente sólidos. Vale a pena contestar.",
  },
  moderado: {
    pct:       57,
    barColor:  "bg-amber-400",
    textColor: "text-amber-700",
    bgColor:   "bg-amber-50",
    border:    "border-amber-200",
    label:     "Fundamento razoável",
    sub:       "Há argumentos válidos. O resultado depende de fatores concretos.",
  },
  fraco: {
    pct:       28,
    barColor:  "bg-slate-400",
    textColor: "text-slate-600",
    bgColor:   "bg-slate-50",
    border:    "border-slate-200",
    label:     "Fundamentos limitados",
    sub:       "Os argumentos são difíceis de sustentar. Considera aconselhamento jurídico.",
  },
} as const;

// ─── Parser ────────────────────────────────────────────────────────────────────

function parseInsight(text: string): ParsedInsight {
  // Extract strong-points section (up to the weak-points heading)
  const strongSection = text.match(
    /Pontos fortes[\s\S]*?(?=⚠️\s*Pontos a considerar|Pontos a considerar|$)/i
  )?.[0] ?? "";

  // Extract bullets from strong section
  const strongPoints: string[] = [];
  const strongRe = /[-•]\s+(.+)/g;
  let m: RegExpExecArray | null;
  while ((m = strongRe.exec(strongSection)) !== null) {
    const line = m[1].trim().replace(/\*\*/g, "");
    if (line.length > 15 && strongPoints.length < 3) strongPoints.push(line);
  }

  // Extract first weak-point bullet
  const weakSection = text.match(
    /Pontos a considerar[\s\S]*?(?=📊\s*Avaliação|Avaliação geral|$)/i
  )?.[0] ?? "";
  const weakMatch = /[-•]\s+(.+)/.exec(weakSection);
  const weakPoint = weakMatch ? weakMatch[1].trim().replace(/\*\*/g, "") : null;

  // Extract evaluation summary (first sentence)
  const evalSection = text.match(/Avaliação geral[\s\S]*?(?=📌|Próximos passos|$)/i)?.[0] ?? "";
  const evalClean   = evalSection
    .replace(/\*\*📊?\s*Avaliação geral[:\*]*\*?\*?/i, "")
    .replace(/^[-\s]+/, "")
    .trim();
  const evalSummary = evalClean.split(/\.\s+/)[0]?.trim() ?? "";

  // Determine strength from evaluation language
  let caseStrength: ParsedInsight["caseStrength"] = "moderado";
  if (/sólidos|forte|favoráv|consistente|bem fundamentado/i.test(evalSection)) caseStrength = "forte";
  if (/fraco|insuficiente|difícil|reduzida|limitad/i.test(evalSection))       caseStrength = "fraco";

  return { caseStrength, strongPoints, weakPoint, evalSummary };
}

// ─── Confidence meter ──────────────────────────────────────────────────────────

function ConfidenceMeter({ strength }: { strength: ParsedInsight["caseStrength"] }) {
  const cfg = STRENGTH_CONFIG[strength];
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={cn("text-xs font-semibold", cfg.textColor)}>{cfg.label}</span>
        <span className={cn("text-xs font-bold tabular-nums", cfg.textColor)}>{cfg.pct}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", cfg.barColor)}
          style={{ width: `${cfg.pct}%` }}
        />
      </div>
      <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">{cfg.sub}</p>
    </div>
  );
}

// ─── Structured result card ────────────────────────────────────────────────────

function InsightResultCard({
  parsed,
  onReanalyze,
  onOpenAssistant,
  expanded,
  onToggleExpand,
}: {
  parsed:          ParsedInsight;
  onReanalyze:     () => void;
  onOpenAssistant?: () => void;
  expanded:        boolean;
  onToggleExpand:  () => void;
}) {
  const cfg = STRENGTH_CONFIG[parsed.caseStrength];

  return (
    <div className={cn("rounded-xl border overflow-hidden mb-5", cfg.border)}>
      {/* Header row */}
      <div className={cn("flex items-center justify-between px-4 py-3", cfg.bgColor)}>
        <div className="flex items-center gap-2">
          <TrendingUp className={cn("w-4 h-4", cfg.textColor)} />
          <span className={cn("text-sm font-semibold", cfg.textColor)}>Avaliação IA</span>
          <AiGeneratedLabel variant="inline" className="ml-0.5" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReanalyze}
            className={cn("text-xs font-medium hover:underline", cfg.textColor)}
            title="Reanalisar caso"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onToggleExpand}
            className={cn("p-1 rounded-md transition-colors", cfg.textColor)}
            aria-label={expanded ? "Ocultar detalhes" : "Ver detalhes"}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 py-4 bg-white space-y-4 border-t border-slate-100">

          {/* Confidence meter */}
          <ConfidenceMeter strength={parsed.caseStrength} />

          {/* Strong points */}
          {parsed.strongPoints.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700">
                  Pontos fortes ({parsed.strongPoints.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {parsed.strongPoints.map((point, i) => (
                  <div
                    key={i}
                    className="bg-green-50 border border-green-100 rounded-lg px-3 py-2"
                  >
                    <p className="text-xs text-green-800 leading-snug">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak point */}
          {parsed.weakPoint && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Ponto a reforçar</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <p className="text-xs text-amber-800 leading-snug">{parsed.weakPoint}</p>
              </div>
            </div>
          )}

          {/* Disclaimer footer */}
          <AiDisclosureBanner compact />

          {/* CTAs */}
          <div className="flex gap-2 pt-1">
            {onOpenAssistant && (
              <button
                onClick={onOpenAssistant}
                className="flex-1 flex items-center justify-center gap-1.5 border border-brand-300 text-brand-600 hover:bg-brand-50 rounded-xl py-2.5 text-xs font-semibold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Análise detalhada
              </button>
            )}
            <div className={cn(
              "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold",
              "bg-brand-600 text-white"
            )}>
              <ArrowRight className="w-3.5 h-3.5" />
              Incluída no documento
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AiInsightBadge({ wizardState, defenses, onOpenAssistant }: Props) {
  const [status,   setStatus]   = useState<Status>("idle");
  const [parsed,   setParsed]   = useState<ParsedInsight | null>(null);
  const [expanded, setExpanded] = useState(true);

  const { needsGate, guardAiAction, accept, decline } = useAiFirstUseGate();

  const selectedCount = defenses.filter((d) =>
    wizardState.legalGrounds?.selectedGrounds?.includes(d.id)
  ).length;

  const runAnalysis = async () => {
    setStatus("loading");
    setParsed(null);
    setExpanded(true);

    const context = buildCaseContext(wizardState, defenses);
    const prompt  = ANALYZE_CASE_PROMPT(context);

    let fullText = "";

    try {
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          mode:     "chat",
        }),
      });

      if (!res.ok) throw new Error("Erro no servidor");

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let   buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          const chunk = JSON.parse(data);
          if (chunk.text) fullText += chunk.text;
        }
      }

      setParsed(parseInsight(fullText));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const analyze = () => guardAiAction(runAnalysis);

  // ── Idle state ──────────────────────────────────────────────────────────────

  if (status === "idle") {
    return (
      <>
        {needsGate && <AiFirstUseGate onAccept={accept} onDecline={decline} />}

        <div className="rounded-xl border-2 border-dashed border-brand-200 bg-gradient-to-br from-brand-50 to-white px-4 py-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-brand-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-900 mb-0.5">
                Avaliação IA do teu caso
              </p>
              <p className="text-xs text-brand-600 leading-relaxed">
                {selectedCount > 0
                  ? `Tens ${selectedCount} argumento${selectedCount !== 1 ? "s" : ""} selecionado${selectedCount !== 1 ? "s" : ""}. A IA avalia a solidez, identifica pontos fracos e sugere o que reforçar.`
                  : "Seleciona os teus argumentos acima e a IA avalia a solidez do teu caso."
                }
              </p>
            </div>
          </div>

          <button
            onClick={analyze}
            disabled={selectedCount === 0}
            className={cn(
              "mt-3.5 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
              selectedCount > 0
                ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            {selectedCount > 0 ? "Avaliar solidez do caso" : "Seleciona argumentos primeiro"}
          </button>
        </div>
      </>
    );
  }

  // ── Loading state ────────────────────────────────────────────────────────────

  if (status === "loading") {
    return (
      <>
        {needsGate && <AiFirstUseGate onAccept={accept} onDecline={decline} />}
        <div className="rounded-xl border border-brand-200 bg-brand-50 mb-5 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-brand-100">
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
            <p className="text-sm font-semibold text-brand-700">A avaliar os teus argumentos...</p>
          </div>
          <div className="px-4 py-4 space-y-2.5">
            {[75, 55, 85, 40].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-brand-200 rounded-full animate-pulse"
                style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────

  if (status === "error") {
    return (
      <>
        {needsGate && <AiFirstUseGate onAccept={accept} onDecline={decline} />}
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            Não foi possível obter a análise.
          </div>
          <button onClick={analyze} className="text-xs text-red-600 font-semibold hover:underline">
            Tentar novamente
          </button>
        </div>
      </>
    );
  }

  // ── Done state — structured card ─────────────────────────────────────────────

  return (
    <>
      {needsGate && <AiFirstUseGate onAccept={accept} onDecline={decline} />}
      {parsed && (
        <InsightResultCard
          parsed={parsed}
          onReanalyze={analyze}
          onOpenAssistant={onOpenAssistant}
          expanded={expanded}
          onToggleExpand={() => setExpanded((e) => !e)}
        />
      )}
    </>
  );
}
