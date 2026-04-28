"use client";

import { WizardFormData } from "@/types";
import { formatDate } from "@/lib/utils";
import { FileText, Download, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

const CASE_TYPE_LABELS: Record<string, string> = {
  SPEEDING:      "Excesso de Velocidade",
  PARKING:       "Estacionamento Proibido",
  ADMIN_ERROR:   "Erro Administrativo",
  MOBILE_PHONE:  "Uso de Telemóvel",
  SEATBELT:      "Falta de Cinto",
  TRAFFIC_LIGHT: "Semáforo Vermelho",
  OTHER:         "Outro",
};

interface Props {
  data: WizardFormData;
  onGenerate: () => Promise<void>;
  saving: boolean;
}

export function ReviewStep({ data, onGenerate, saving }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedGrounds = data.contestationGrounds.filter((g) => g.selected);

  const handleGenerate = async () => {
    if (selectedGrounds.length === 0) {
      setError("Seleciona pelo menos um fundamento legal antes de gerar o documento.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onGenerate();
    } catch {
      setError("Ocorreu um erro ao gerar o documento. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const rows: { label: string; value: string | undefined }[] = [
    { label: "Tipo de infração",   value: CASE_TYPE_LABELS[data.caseType] },
    { label: "N.º da auto",        value: data.fineNumber || "Não indicado" },
    { label: "Data da infração",   value: data.fineDate ? formatDate(data.fineDate) : "—" },
    { label: "Entidade autuante",  value: data.fineEntity || "—" },
    { label: "Local",              value: data.fineLocation || "—" },
    { label: "Matrícula",          value: data.vehiclePlate || "—" },
    { label: "Titular",            value: data.vehicleOwnerName || "—" },
    { label: "NIF",                value: data.vehicleOwnerNif || "—" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Revisão e geração do documento
      </h2>
      <p className="text-slate-500 mb-6">
        Verifica os dados antes de gerar a carta de contestação
      </p>

      {/* Summary table */}
      <div className="bg-slate-50 rounded-xl overflow-hidden mb-5">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex justify-between gap-4 px-4 py-3 text-sm ${
              i % 2 === 0 ? "bg-white" : "bg-slate-50"
            }`}
          >
            <span className="text-slate-500 font-medium flex-shrink-0">{row.label}</span>
            <span className="text-slate-900 text-right">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Selected grounds */}
      <div className="mb-6">
        <div className="text-sm font-semibold text-slate-700 mb-2">
          Fundamentos selecionados ({selectedGrounds.length})
        </div>
        {selectedGrounds.length === 0 ? (
          <div className="text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3">
            Nenhum fundamento selecionado — volta ao passo anterior
          </div>
        ) : (
          <div className="space-y-2">
            {selectedGrounds.map((g) => (
              <div key={g.id} className="flex items-start gap-2 text-sm">
                <ShieldCheck className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-800 font-medium">{g.label}</div>
                  <div className="text-xs text-slate-400">{g.legalBasis}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What's included */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2">
          <FileText className="w-4 h-4" />
          O documento irá incluir:
        </div>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• Carta de impugnação formal em Português jurídico</li>
          <li>• Todos os fundamentos legais selecionados com base legal</li>
          <li>• Identificação completa do arguido e do veículo</li>
          <li>• Pedido de absolvição ao abrigo do RGCO e Código da Estrada</li>
          <li>• PDF formatado pronto a enviar</li>
        </ul>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading || saving || selectedGrounds.length === 0}
        className="btn-primary w-full text-base py-4"
      >
        {loading || saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            A gerar documento...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Gerar e Descarregar PDF — €4,99
          </>
        )}
      </button>

      <p className="text-xs text-slate-400 text-center mt-3">
        Se tiveres subscrição ativa, o documento é gerado gratuitamente.
      </p>
    </div>
  );
}
