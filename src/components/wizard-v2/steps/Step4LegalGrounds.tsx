"use client";

import { useState, useRef } from "react";
import { DefenseSuggestion } from "@/lib/wizard/logic-engine";
import { LegalGroundsState } from "@/lib/wizard/logic-engine";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  CheckSquare2,
  Square,
  Info,
} from "lucide-react";

interface Props {
  defenses:  DefenseSuggestion[];
  values:    LegalGroundsState;
  errors:    Record<string, string>;
  onChange:  (v: Partial<LegalGroundsState>) => void;
}

export function Step4LegalGrounds({ defenses, values, errors, onChange }: Props) {
  const selected      = values.selectedGrounds ?? [];
  const [expanded, setExpanded] = useState<string | null>(null);

  // BUG-004: debounce rapid double-clicks (500ms) and prevent deselecting
  // the last remaining argument (minimum 1 must stay selected at all times).
  const lastToggleRef = useRef<{ id: string; time: number }>({ id: "", time: 0 });

  const toggle = (id: string) => {
    // Ignore rapid double-click on the same card
    const now = Date.now();
    if (lastToggleRef.current.id === id && now - lastToggleRef.current.time < 500) return;
    lastToggleRef.current = { id, time: now };

    // Don't allow deselecting the last selected ground
    if (selected.includes(id) && selected.length === 1) return;

    const next = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange({ selectedGrounds: next });
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  const strong = defenses.filter((d) => d.strength === "strong");
  const medium = defenses.filter((d) => d.strength === "medium");
  const weak   = defenses.filter((d) => d.strength === "weak");

  const selectedCount = selected.length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">
        Os teus fundamentos de defesa
      </h2>
      <p className="text-slate-500 text-sm mb-2">
        Identificámos os seguintes argumentos jurídicos com base nas tuas respostas
      </p>

      {/* Counter bar */}
      <div className={cn(
        "flex items-center gap-2 rounded-xl px-4 py-2.5 mb-5 text-sm font-medium transition-colors",
        selectedCount === 0
          ? "bg-amber-50 border border-amber-200 text-amber-700"
          : "bg-green-50 border border-green-200 text-green-700"
      )}>
        {selectedCount === 0 ? (
          <><Info className="w-4 h-4 flex-shrink-0" /> Seleciona pelo menos um fundamento</>
        ) : (
          <><ShieldCheck className="w-4 h-4 flex-shrink-0" /> {selectedCount} fundamento{selectedCount > 1 ? "s" : ""} selecionado{selectedCount > 1 ? "s" : ""}</>
        )}
      </div>

      {errors.selectedGrounds && (
        <p className="text-xs text-red-500 mb-3" data-error>{errors.selectedGrounds}</p>
      )}

      {defenses.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Não foi possível sugerir fundamentos com as respostas fornecidas.</p>
          <p className="text-xs mt-1">Usa as notas adicionais para descrever a tua situação.</p>
        </div>
      )}

      {/* Strong defenses */}
      {strong.length > 0 && (
        <DefenseGroup
          title="Argumentos fortes"
          icon={<ShieldCheck className="w-4 h-4 text-green-600" />}
          labelColor="text-green-700"
          bgColor="bg-green-50"
          defenses={strong}
          selected={selected}
          expanded={expanded}
          onToggle={toggle}
          onExpand={toggleExpand}
        />
      )}

      {/* Medium defenses */}
      {medium.length > 0 && (
        <DefenseGroup
          title="Argumentos moderados"
          icon={<Shield className="w-4 h-4 text-brand-600" />}
          labelColor="text-brand-700"
          bgColor="bg-brand-50"
          defenses={medium}
          selected={selected}
          expanded={expanded}
          onToggle={toggle}
          onExpand={toggleExpand}
        />
      )}

      {/* Weak / support defenses */}
      {weak.length > 0 && (
        <DefenseGroup
          title="Argumentos de suporte"
          icon={<ShieldAlert className="w-4 h-4 text-slate-400" />}
          labelColor="text-slate-500"
          bgColor="bg-slate-50"
          defenses={weak}
          selected={selected}
          expanded={expanded}
          onToggle={toggle}
          onExpand={toggleExpand}
        />
      )}

      {/* Additional notes */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Informações adicionais
          <span className="text-slate-400 font-normal ml-1">(opcional)</span>
        </label>
        <textarea
          className="input min-h-[90px] resize-none text-sm"
          placeholder="Acrescenta qualquer outro facto relevante — quanto mais específico/a fores, mais forte será o teu documento..."
          value={values.additionalNotes ?? ""}
          onChange={(e) => onChange({ additionalNotes: e.target.value })}
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-slate-400 mt-1 text-right">
          {(values.additionalNotes ?? "").length}/1000
        </p>
      </div>
    </div>
  );
}

// ─── Defense group ─────────────────────────────────────────────────────────────

function DefenseGroup({
  title,
  icon,
  labelColor,
  bgColor,
  defenses,
  selected,
  expanded,
  onToggle,
  onExpand,
}: {
  title: string;
  icon: React.ReactNode;
  labelColor: string;
  bgColor: string;
  defenses: DefenseSuggestion[];
  selected: string[];
  expanded: string | null;
  onToggle: (id: string) => void;
  onExpand: (id: string) => void;
}) {
  return (
    <div className="mb-5">
      <div className={cn("flex items-center gap-2 mb-2 px-1", labelColor)}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      <div className="space-y-2">
        {defenses.map((d) => (
          <DefenseCard
            key={d.id}
            defense={d}
            isSelected={selected.includes(d.id)}
            isExpanded={expanded === d.id}
            bgColor={bgColor}
            onToggle={() => onToggle(d.id)}
            onExpand={() => onExpand(d.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Defense card ──────────────────────────────────────────────────────────────

function DefenseCard({
  defense,
  isSelected,
  isExpanded,
  bgColor,
  onToggle,
  onExpand,
}: {
  defense:    DefenseSuggestion;
  isSelected: boolean;
  isExpanded: boolean;
  bgColor:    string;
  onToggle:   () => void;
  onExpand:   () => void;
}) {
  const strengthBadge: Record<string, string> = {
    strong: "bg-green-100 text-green-700",
    medium: "bg-brand-100 text-brand-700",
    weak:   "bg-slate-100 text-slate-500",
  };

  return (
    <div className={cn(
      "rounded-xl border-2 overflow-hidden transition-all duration-150",
      isSelected ? "border-brand-400 shadow-sm" : "border-slate-200"
    )}>
      {/* Card header — tap to select */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full flex items-start gap-3 p-4 text-left transition-colors",
          isSelected ? bgColor : "bg-white hover:bg-slate-50"
        )}
      >
        {/* Checkbox */}
        <div className="flex-shrink-0 mt-0.5">
          {isSelected
            ? <CheckSquare2 className="w-5 h-5 text-brand-600" />
            : <Square className="w-5 h-5 text-slate-300" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-lg leading-none">{defense.icon}</span>
            <span className={cn(
              "font-semibold text-sm leading-snug",
              isSelected ? "text-brand-900" : "text-slate-900"
            )}>
              {defense.title}
            </span>
            {defense.recommended && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                Recomendado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", strengthBadge[defense.strength])}>
              {defense.strengthLabel}
            </span>
            <span className="text-xs text-slate-400 truncate">{defense.legalBasis}</span>
          </div>
        </div>
      </button>

      {/* Expand details */}
      <div className="border-t border-slate-100">
        <button
          type="button"
          onClick={onExpand}
          className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span>{isExpanded ? "Ocultar explicação" : "Ver explicação jurídica"}</span>
          {isExpanded
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-sm text-slate-600 leading-relaxed">{defense.summary}</p>
            <div className="flex items-center gap-1.5 text-xs text-brand-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {defense.legalBasis}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Força do argumento:</span>
              <StrengthMeter score={defense.score} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StrengthMeter({ score }: { score: number }) {
  const bars = 5;
  const filled = Math.round((score / 100) * bars);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-4 h-1.5 rounded-full",
            i < filled ? "bg-brand-500" : "bg-slate-200"
          )}
        />
      ))}
      <span className="ml-1 text-slate-400">{score}/100</span>
    </div>
  );
}
