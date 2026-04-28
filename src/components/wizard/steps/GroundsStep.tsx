"use client";

import { useEffect, useState } from "react";
import { CaseType, ContestationGround } from "@/types";
import { getAvailableGrounds } from "@/lib/templates/grounds";
import { cn } from "@/lib/utils";
import { CheckSquare, Square, Info } from "lucide-react";

interface Props {
  caseType: CaseType;
  grounds: ContestationGround[];
  additionalNotes: string;
  onChange: (grounds: ContestationGround[], notes: string) => void;
}

export function GroundsStep({ caseType, grounds, additionalNotes, onChange }: Props) {
  const [available, setAvailable] = useState<ContestationGround[]>([]);

  useEffect(() => {
    const base = getAvailableGrounds(caseType);
    // Merge with any previously selected grounds
    const merged = base.map((g) => {
      const prev = grounds.find((pg) => pg.id === g.id);
      return prev ? { ...g, selected: prev.selected, freeText: prev.freeText } : g;
    });
    setAvailable(merged);
  }, [caseType]);

  const toggle = (id: string) => {
    const updated = available.map((g) =>
      g.id === id ? { ...g, selected: !g.selected } : g
    );
    setAvailable(updated);
    onChange(updated, additionalNotes);
  };

  const setFreeText = (id: string, text: string) => {
    const updated = available.map((g) =>
      g.id === id ? { ...g, freeText: text } : g
    );
    setAvailable(updated);
    onChange(updated, additionalNotes);
  };

  const selectedCount = available.filter((g) => g.selected).length;

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Fundamentos da contestação
      </h2>
      <p className="text-slate-500 mb-2">
        Seleciona os fundamentos legais que se aplicam ao teu caso.
        Podes selecionar vários.
      </p>

      {selectedCount === 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-sm text-amber-700">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Seleciona pelo menos um fundamento para a contestação.
        </div>
      )}

      {selectedCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-5 text-sm text-green-700 font-medium">
          ✓ {selectedCount} fundamento{selectedCount > 1 ? "s" : ""} selecionado{selectedCount > 1 ? "s" : ""}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {available.map((g) => (
          <div key={g.id} className="border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(g.id)}
              className={cn(
                "w-full flex items-start gap-3 p-4 text-left transition-all",
                g.selected
                  ? "bg-brand-50 border-brand-400"
                  : "bg-white hover:bg-slate-50"
              )}
            >
              <div className="mt-0.5 flex-shrink-0">
                {g.selected ? (
                  <CheckSquare className="w-5 h-5 text-brand-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1">
                <div className={cn("font-medium text-sm", g.selected ? "text-brand-800" : "text-slate-800")}>
                  {g.label}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {g.legalBasis}
                </div>
              </div>
            </button>

            {g.selected && (
              <div className="px-4 pb-4 bg-brand-50 border-t border-brand-100">
                <label className="block text-xs font-medium text-brand-700 mb-1.5 mt-3">
                  Detalhe adicional (opcional)
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white resize-none min-h-[70px]"
                  placeholder="Acrescenta informação específica sobre este fundamento (opcional)..."
                  value={g.freeText ?? ""}
                  onChange={(e) => setFreeText(g.id, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional notes */}
      <div>
        <label className="label">
          Notas adicionais (opcional)
        </label>
        <textarea
          className="input min-h-[100px] resize-none"
          placeholder="Qualquer outra informação relevante que deva constar na carta de contestação..."
          value={additionalNotes}
          onChange={(e) => onChange(available, e.target.value)}
        />
      </div>
    </div>
  );
}
