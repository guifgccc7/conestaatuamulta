"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronDown,
  RotateCcw,
  FileEdit,
  Crown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Scale,
  WifiOff,
} from "lucide-react";
import type { WizardState, DefenseSuggestion } from "@/lib/wizard/logic-engine";
import { buildCaseContext } from "@/lib/ai/case-context";
import { ANALYZE_CASE_PROMPT, SUGGEST_ARGUMENTS_PROMPT } from "@/lib/ai/system-prompt";
import type { AiOutput } from "@/lib/document/types";
import type { AiErrorKind } from "@/lib/ai/errors";
import { AiDisclosureBanner } from "@/components/compliance/AiDisclosureBanner";
import { AiFirstUseGate, useAiFirstUseGate } from "@/components/compliance/AiFirstUseGate";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id:          string;
  role:        "user" | "assistant";
  content:     string;
  loading?:    boolean;
  isAnalysis?: boolean;
  /** Set when the message represents a classified AI error */
  errorKind?:  AiErrorKind;
  /** True when the error is transient and worth retrying */
  retryable?:  boolean;
}

/** Client-side timeout for the SSE stream (ms). Must be < maxDuration on the route. */
const CLIENT_STREAM_TIMEOUT_MS = 40_000;

type AssistantMode = "chat" | "suggest" | "detailed" | "rewrite";

interface Props {
  wizardState:   WizardState;
  defenses:      DefenseSuggestion[];
  currentStep:   number;
  /** Called whenever the assistant produces a structured case analysis. */
  onAiOutput?:   (output: AiOutput) => void;
  /** Controlled open state. When provided the component is fully controlled. */
  open?:         boolean;
  onOpenChange?: (v: boolean) => void;
}

// ─── Quick-action chips ────────────────────────────────────────────────────────

const QUICK_ACTIONS_ANALYSIS = [
  {
    label:    "Analisa o meu caso",
    sublabel: "Pontos fortes, fracos e probabilidade",
    icon:     "⚖️",
    action:   "analyze",
    primary:  true,
  },
  {
    label:    "Quais são os meus prazos?",
    sublabel: "A partir de quando conta o prazo",
    icon:     "📅",
    action:   "deadlines",
    primary:  false,
  },
  {
    label:    "Como enviar a contestação?",
    sublabel: "Correio registado e documentos",
    icon:     "📬",
    action:   "submit",
    primary:  false,
  },
];

const QUICK_ACTIONS_SUGGEST = [
  {
    label:    "Sugerir os melhores argumentos",
    sublabel: "Texto formal pronto a copiar para a carta",
    icon:     "📋",
    action:   "suggest",
    primary:  true,
  },
  {
    label:    "Há nulidades processuais?",
    sublabel: "Erros formais que podem anular o auto",
    icon:     "🔍",
    action:   "nullities",
    primary:  false,
  },
  {
    label:    "Qual a probabilidade de êxito?",
    sublabel: "Tendência com base na jurisprudência",
    icon:     "📊",
    action:   "probability",
    primary:  false,
  },
];

const QUICK_PROMPTS: Record<string, string> = {
  analyze:     "", // built dynamically
  suggest:     "", // built dynamically
  deadlines:   "Quais são os prazos para contestar uma multa de trânsito em Portugal? A partir de quando conta o prazo e como se calcula?",
  submit:      "Como e onde devo enviar a carta de contestação? Devo enviá-la por correio registado? Preciso de guardar o talão?",
  nullities:   "Com base nos dados do meu caso, existem nulidades processuais — erros formais no auto ou na notificação — que possam fundamentar a contestação? Cita os artigos aplicáveis.",
  probability: "Com base nos fundamentos disponíveis para o meu caso, qual é a tendência geral de êxito numa contestação deste tipo? Usa linguagem cautelosa e cita jurisprudência relevante se possível.",
};

// ─── Detailed analysis prompt ─────────────────────────────────────────────────

const DETAILED_ANALYZE_PROMPT = (context: string) => `
${ANALYZE_CASE_PROMPT(context)}

Nesta análise DETALHADA, para além da estrutura habitual, inclui também:

**📈 Probabilidade de êxito estimada**
Indica uma tendência geral (forte / moderada / limitada) com explicação específica de 1-2 frases
baseada na jurisprudência e nos fundamentos apresentados. Usa sempre linguagem cautelosa.

**🔍 Análise de cada argumento selecionado**
Para cada fundamento identificado, avalia:
- Solidez jurídica (forte / moderado / fraco)
- Base legal específica
- O que pode enfraquecer este argumento

**💡 Estratégia recomendada**
Ordem de apresentação dos argumentos e sugestão de prova documental a juntar.
`.trim();

// ─── Markdown-lite renderer ────────────────────────────────────────────────────

function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**") && !line.slice(2, -2).includes("**")) {
          return <p key={i} className="font-semibold text-slate-800 mt-3 first:mt-0">{line.slice(2, -2)}</p>;
        }
        if (line.trim() === "---") {
          return <hr key={i} className="border-slate-200 my-2" />;
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <p key={i} className="pl-3 text-slate-700">
              {renderInline(line.slice(2))}
            </p>
          );
        }
        if (line.startsWith("*⚠️") || line.startsWith("*Esta")) {
          return (
            <p key={i} className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              {line.replace(/^\*/, "").replace(/\*$/, "")}
            </p>
          );
        }
        if (line.trim()) {
          return <p key={i} className="text-slate-700">{renderInline(line)}</p>;
        }
        return null;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>
      : part
  );
}

// ─── AI output extractor ───────────────────────────────────────────────────────

function extractAiOutput(text: string): AiOutput | null {
  if (!text.includes("Pontos fortes") && !text.includes("fortes da tua")) return null;

  const argumentos: string[] = [];
  const bulletRe = /[-•]\s+(.+)/g;
  const strongSection = text.match(
    /Pontos fortes[\s\S]*?(?=⚠️|Pontos a considerar|Avaliação|$)/i
  )?.[0] ?? "";

  let m: RegExpExecArray | null;
  while ((m = bulletRe.exec(strongSection)) !== null) {
    const line = m[1].trim();
    if (line.length > 20) argumentos.push(line);
  }

  const evalSection = text.match(/Avaliação geral[\s\S]*?(?=📌|Próximos|$)/i)?.[0] ?? "";
  let caseStrength: AiOutput["caseStrength"] = "moderado";
  if (/sólidos|forte|favoráv|consistente/i.test(evalSection)) caseStrength = "forte";
  if (/fraco|insuficiente|difícil|reduzida/i.test(evalSection)) caseStrength = "fraco";

  return argumentos.length > 0 ? { argumentos, caseStrength } : null;
}

// ─── Upgrade nudge (shown after analysis completes) ────────────────────────────

function AnalysisUpgradeNudge({
  aiOutput,
  onClose,
}: {
  aiOutput: AiOutput;
  onClose: () => void;
}) {
  const count = aiOutput.argumentos.length;
  if (count === 0) return null;

  const strengthConfig = {
    forte:    { color: "text-green-700", bg: "bg-green-50 border-green-200", label: "forte" },
    moderado: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", label: "moderado" },
    fraco:    { color: "text-slate-600", bg: "bg-slate-50 border-slate-200", label: "fraco" },
  };
  const cfg = strengthConfig[aiOutput.caseStrength ?? "moderado"];

  return (
    <div className={cn("mx-4 mb-3 rounded-xl border p-3.5", cfg.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className={cn("w-4 h-4 flex-shrink-0 mt-0.5", cfg.color)} />
          <div>
            <p className={cn("text-sm font-semibold", cfg.color)}>
              Análise guardada · caso {cfg.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {count} argumento{count !== 1 ? "s" : ""} IA adicionado{count !== 1 ? "s" : ""} ao teu documento.
              Descarrega o PDF para veres a versão completa.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-white/60 text-slate-400 flex-shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function AiAssistant({ wizardState, defenses, currentStep, onAiOutput, open: openProp, onOpenChange }: Props) {
  // Controlled-with-fallback pattern: works both standalone and externally controlled
  const [openInternal,  setOpenInternal]  = useState(false);
  const open    = openProp    ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [mode,         setMode]         = useState<AssistantMode>("chat");
  const [latestOutput, setLatestOutput] = useState<AiOutput | null>(null);
  const [showNudge,    setShowNudge]    = useState(false);
  const aiGate = useAiFirstUseGate();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // ─── Send message ────────────────────────────────────────────────────────────

  const send = useCallback(async (
    overrideContent?: string,
    overrideMode?: AssistantMode,
    isAnalysis = false,
  ) => {
    const content    = (overrideContent ?? input).trim();
    const activeMode = overrideMode ?? mode;
    if (!content || loading) return;

    setInput("");
    const userMsg: Message = { id: crypto.randomUUID(), role: "user",      content };
    const asstMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "", loading: true, isAnalysis };

    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setLoading(true);
    setShowNudge(false);

    const history  = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
    let   fullText = "";

    // Client-side AbortController — kills the stream if we exceed the budget
    const abortCtrl = new AbortController();
    const deadline  = setTimeout(() => abortCtrl.abort(), CLIENT_STREAM_TIMEOUT_MS);

    const apiMode = activeMode === "detailed" ? "chat" : activeMode;

    try {
      const res = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history, mode: apiMode }),
        signal:  abortCtrl.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Erro no servidor (${res.status})`);
      }

      const reader = res.body!.getReader();
      const dec    = new TextDecoder();
      let   buffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") break outer;

          let parsed: Record<string, unknown>;
          try {
            parsed = JSON.parse(raw);
          } catch {
            continue; // malformed chunk — skip
          }

          if (parsed.text && typeof parsed.text === "string") {
            fullText += parsed.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsg.id
                  ? { ...m, content: m.content + parsed.text, loading: false }
                  : m
              )
            );
          }

          // ── Structured error chunk from server ────────────────────────────
          // The API route sends { error, kind, retryable } when the Anthropic
          // call fails.  Previously this was silently ignored — now we surface it.
          if (parsed.error && typeof parsed.error === "string") {
            const kind      = (parsed.kind as AiErrorKind | undefined) ?? "UNKNOWN";
            const retryable = parsed.retryable === true;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === asstMsg.id
                  ? {
                      ...m,
                      content:   parsed.error as string,
                      loading:   false,
                      errorKind: kind,
                      retryable,
                    }
                  : m
              )
            );
            break outer; // stop reading — there will be no more content chunks
          }
        }
      }

      // Extract structured output after analysis and surface upgrade nudge
      if (isAnalysis && fullText) {
        const extracted = extractAiOutput(fullText);
        if (extracted) {
          setLatestOutput(extracted);
          setShowNudge(true);
          onAiOutput?.(extracted);
        }
      }
    } catch (err) {
      // Network-level errors (AbortError, DNS, etc.)
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const msg = isTimeout
        ? "O assistente demorou demasiado a responder. Tenta novamente ou continua sem a análise de IA."
        : err instanceof Error
          ? err.message
          : "Erro desconhecido.";

      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstMsg.id
            ? {
                ...m,
                content:   msg,
                loading:   false,
                errorKind: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
                retryable: true,
              }
            : m
        )
      );
    } finally {
      clearTimeout(deadline);
      setLoading(false);
    }
  }, [input, loading, messages, mode, onAiOutput]);

  // ─── Quick actions ────────────────────────────────────────────────────────────

  const handleQuickAction = (action: string) => {
    const doAction = () => {
      const context = buildCaseContext(wizardState, defenses);
      if (action === "analyze") {
        const prompt = mode === "detailed"
          ? DETAILED_ANALYZE_PROMPT(context)
          : ANALYZE_CASE_PROMPT(context);
        send(prompt, mode, /* isAnalysis */ true);
      } else if (action === "suggest") {
        send(SUGGEST_ARGUMENTS_PROMPT(context), "suggest", /* isAnalysis */ true);
      } else {
        send(QUICK_PROMPTS[action], "chat", false);
      }
    };
    aiGate.guardAiAction(doAction);
  };

  const clear = () => {
    setMessages([]);
    setShowNudge(false);
    setLatestOutput(null);
  };

  const hasCase = !!wizardState.fineType.fineCategory;

  if (currentStep < 3) return null;

  // ─── Mode config ─────────────────────────────────────────────────────────────

  const modeConfig: Record<AssistantMode, { label: string; icon: React.ReactNode; description: string; accent: string }> = {
    chat: {
      label:       "Análise",
      icon:        <Sparkles className="w-3 h-3" />,
      description: "Analiso o teu caso e identifico os melhores fundamentos de defesa.",
      accent:      "brand",
    },
    suggest: {
      label:       "Argumentos",
      icon:        <Scale className="w-3 h-3" />,
      description: "Sugiro os 2 a 5 melhores argumentos jurídicos para o teu caso, com texto formal pronto a copiar para a carta.",
      accent:      "violet",
    },
    detailed: {
      label:       "Detalhada",
      icon:        <Crown className="w-3 h-3" />,
      description: "Análise profunda com probabilidade de êxito, avaliação de cada argumento e estratégia recomendada.",
      accent:      "amber",
    },
    rewrite: {
      label:       "Reformular",
      icon:        <FileEdit className="w-3 h-3" />,
      description: "Cola aqui o teu argumento e reformulo-o em linguagem jurídica formal.",
      accent:      "slate",
    },
  };

  return (
    <>
      {/* AI first-use gate */}
      {aiGate.needsGate && (
        <AiFirstUseGate onAccept={aiGate.accept} onDecline={aiGate.decline} />
      )}

      {/* ─── Floating trigger button ──────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-4 sm:right-6 z-40",
          "flex items-center gap-2",
          "bg-brand-600 hover:bg-brand-700 text-white",
          "px-4 py-3 rounded-2xl shadow-lg hover:shadow-xl",
          "transition-all duration-200 text-sm font-semibold",
          open && "opacity-0 pointer-events-none"
        )}
        aria-label="Abrir assistente IA"
      >
        <Sparkles className="w-4 h-4" />
        Assistente IA
      </button>

      {/* ─── Panel ────────────────────────────────────────────────────────── */}
      <div className={cn(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end",
        "transition-all duration-300",
        open ? "pointer-events-auto" : "pointer-events-none opacity-0"
      )}>
        {/* Backdrop (mobile) */}
        <div className="absolute inset-0 bg-black/30 sm:hidden" onClick={() => setOpen(false)} />

        {/* Panel */}
        <div className={cn(
          "relative w-full sm:w-[420px] sm:h-[calc(100vh-2rem)] sm:mr-4",
          "bg-white sm:rounded-2xl shadow-2xl border border-slate-200",
          "flex flex-col",
          "h-[88vh] sm:h-[calc(100vh-2rem)]",
          "transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-0"
        )}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Assistente de Redação</p>
                <p className="text-xs text-slate-400">Apoio à contestação · IA · Não vinculativo</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clear}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Limpar conversa"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Compliance banner */}
          <AiDisclosureBanner />

          {/* Mode switcher */}
          <div className="flex gap-1 px-3 pt-3 pb-2 flex-shrink-0 overflow-x-auto">
            {(["chat", "suggest", "detailed", "rewrite"] as AssistantMode[]).map((m) => {
              const active = mode === m;
              const activeClass =
                m === "suggest"  ? "bg-violet-100 text-violet-700" :
                m === "detailed" ? "bg-amber-100 text-amber-700"   :
                m === "rewrite"  ? "bg-slate-200 text-slate-700"   :
                                   "bg-brand-100 text-brand-700";
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    active ? activeClass : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {modeConfig[m].icon}
                  {modeConfig[m].label}
                  {m === "detailed" && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-200 text-amber-800 uppercase tracking-wide">
                      Pro
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upgrade nudge (post-analysis) */}
          {showNudge && latestOutput && (
            <AnalysisUpgradeNudge aiOutput={latestOutput} onClose={() => setShowNudge(false)} />
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center pt-2 pb-1">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-2.5",
                    mode === "suggest" ? "bg-violet-50" : "bg-brand-50"
                  )}>
                    {mode === "detailed" ? <Crown    className="w-6 h-6 text-amber-500"  />
                   : mode === "suggest"  ? <Scale    className="w-6 h-6 text-violet-500" />
                   : mode === "rewrite"  ? <FileEdit className="w-6 h-6 text-slate-500"  />
                   :                       <Sparkles className="w-6 h-6 text-brand-500"  />}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">
                    {mode === "detailed" ? "Análise jurídica detalhada"
                     : mode === "suggest" ? "Argumentos jurídicos para o teu caso"
                     : mode === "rewrite" ? "Reformulação de texto"
                     : "Como posso ajudar?"}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed px-4 max-w-xs mx-auto">
                    {modeConfig[mode].description}
                  </p>
                </div>

                {/* Value props — only for analysis modes */}
                {mode !== "rewrite" && (
                  <div className="grid grid-cols-3 gap-2">
                    {(mode === "suggest" ? [
                      {
                        icon:  <Scale className="w-4 h-4 text-violet-500" />,
                        label: "2–5 argumentos",
                        sub:   "Priorizados por solidez",
                      },
                      {
                        icon:  <FileEdit className="w-4 h-4 text-brand-500" />,
                        label: "Texto formal",
                        sub:   "Pronto a copiar",
                      },
                      {
                        icon:  <TrendingUp className="w-4 h-4 text-green-500" />,
                        label: "Base legal",
                        sub:   "Artigos citados",
                      },
                    ] : [
                      {
                        icon:  <TrendingUp className="w-4 h-4 text-brand-500" />,
                        label: "Avaliação de solidez",
                        sub:   "Forte / moderado / fraco",
                      },
                      {
                        icon:  <AlertCircle className="w-4 h-4 text-amber-500" />,
                        label: "Pontos fracos",
                        sub:   "O que pode falhar",
                      },
                      {
                        icon:  <ArrowRight className="w-4 h-4 text-green-500" />,
                        label: "Próximos passos",
                        sub:   "O que fazer agora",
                      },
                    ]).map((vp) => (
                      <div
                        key={vp.label}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center"
                      >
                        <div className="flex justify-center mb-1.5">{vp.icon}</div>
                        <p className="text-[11px] font-semibold text-slate-700 leading-tight">{vp.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{vp.sub}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick action chips */}
                {mode !== "rewrite" && (() => {
                  const actions = mode === "suggest" ? QUICK_ACTIONS_SUGGEST : QUICK_ACTIONS_ANALYSIS;
                  const primaryAction = mode === "suggest" ? "suggest" : "analyze";
                  const primaryColor  = mode === "suggest"
                    ? { border: "border-violet-400", bg: "bg-violet-50 hover:bg-violet-100", text: "text-violet-800", arrow: "text-violet-400" }
                    : { border: "border-brand-400",  bg: "bg-brand-50 hover:bg-brand-100",   text: "text-brand-800",  arrow: "text-brand-400" };
                  return (
                    <div className="space-y-2">
                      {actions.map((qa) => {
                        const isPrimary = qa.primary && qa.action === primaryAction && hasCase;
                        const isDisabled = qa.action === primaryAction && !hasCase;
                        return (
                          <button
                            key={qa.action}
                            onClick={() => handleQuickAction(qa.action)}
                            disabled={isDisabled}
                            className={cn(
                              "w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all",
                              isPrimary
                                ? `${primaryColor.border} ${primaryColor.bg}`
                                : isDisabled
                                  ? "border-slate-100 text-slate-300 cursor-not-allowed"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                          >
                            <span className="text-lg">{qa.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-medium leading-tight",
                                isPrimary ? primaryColor.text : "text-slate-700"
                              )}>
                                {qa.label}
                              </p>
                              {qa.sublabel && (
                                <p className="text-xs text-slate-400 mt-0.5">{qa.sublabel}</p>
                              )}
                            </div>
                            {isPrimary && (
                              <ArrowRight className={cn("w-4 h-4 flex-shrink-0", primaryColor.arrow)} />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-brand-600 text-white text-sm"
                    : msg.errorKind
                      ? "bg-amber-50 border border-amber-200"
                      : "bg-slate-50 border border-slate-200"
                )}>
                  {msg.role === "user" ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : msg.loading ? (
                    <div className="flex items-center gap-2 text-slate-400 py-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="text-xs">
                        {mode === "detailed" ? "A fazer análise detalhada..."
                       : mode === "suggest"  ? "A identificar os melhores argumentos..."
                       : "A analisar..."}
                      </span>
                    </div>
                  ) : msg.errorKind ? (
                    /* ── Error message bubble ── */
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2 text-amber-700">
                        {msg.errorKind === "NETWORK_ERROR" || msg.errorKind === "TIMEOUT"
                          ? <WifiOff  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        }
                        <p className="text-xs leading-relaxed">{msg.content}</p>
                      </div>
                      {msg.retryable && (
                        <button
                          type="button"
                          onClick={() => {
                            const last = [...messages].reverse().find((m) => m.role === "user");
                            if (last) send(last.content, undefined, last.isAnalysis);
                          }}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium underline-offset-2 hover:underline"
                        >
                          Tentar novamente
                        </button>
                      )}
                      <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                        Podes continuar sem a análise de IA — o documento será gerado com o modelo padrão.
                      </p>
                    </div>
                  ) : (
                    <>
                      <RenderMarkdown text={msg.content} />
                      {msg.isAnalysis && (
                        <AiDisclosureBanner compact />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex-shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const doSend = () => send(undefined, undefined, false);
                    aiGate.guardAiAction(doSend);
                  }
                }}
                placeholder={
                  mode === "rewrite"  ? "Cola o texto a reformular..."
                : mode === "detailed" ? "Faz uma pergunta ou pede a análise detalhada..."
                : mode === "suggest"  ? "Faz uma pergunta sobre os argumentos jurídicos..."
                :                      "Faz uma pergunta sobre o teu caso..."
                }
                rows={2}
                className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm
                           focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                           placeholder-slate-400 bg-white"
                disabled={loading}
              />
              <button
                onClick={() => {
                  const doSend = () => send(undefined, undefined, false);
                  aiGate.guardAiAction(doSend);
                }}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-10 h-10 bg-brand-600 hover:bg-brand-700
                           disabled:opacity-40 disabled:cursor-not-allowed
                           rounded-xl flex items-center justify-center transition-colors"
                aria-label="Enviar mensagem"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />
                }
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2 leading-relaxed">
              Sistema de IA (AI Act UE 2024/1689) · Não vinculativo · Não substitui advogado
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
