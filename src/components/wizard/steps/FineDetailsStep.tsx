"use client";

import { WizardFormData } from "@/types";

const ENTITIES = [
  "GNR — Guarda Nacional Republicana",
  "PSP — Polícia de Segurança Pública",
  "ANSR — Autoridade Nacional de Segurança Rodoviária",
  "EMEL — Empresa Municipal de Mobilidade de Lisboa",
  "SMTUC — Serviços Municipalizados de Coimbra",
  "IMT — Instituto da Mobilidade e dos Transportes",
  "Câmara Municipal",
  "Outro",
];

interface Props {
  data: Partial<WizardFormData>;
  onChange: (d: Partial<WizardFormData>) => void;
}

export function FineDetailsStep({ data, onChange }: Props) {
  const set = (key: keyof WizardFormData, val: string) =>
    onChange({ [key]: val } as Partial<WizardFormData>);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Dados da multa
      </h2>
      <p className="text-slate-500 mb-6">
        Preenche com as informações que constam na notificação recebida
      </p>

      <div className="space-y-5">
        {/* Fine number */}
        <div>
          <label className="label">
            Número da auto / notificação
            <span className="text-slate-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: ANSR/2025/123456"
            value={data.fineNumber ?? ""}
            onChange={(e) => set("fineNumber", e.target.value)}
          />
        </div>

        {/* Fine date */}
        <div>
          <label className="label">
            Data da infração <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            className="input"
            value={data.fineDate ?? ""}
            onChange={(e) => set("fineDate", e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Entity */}
        <div>
          <label className="label">
            Entidade autuante <span className="text-red-400">*</span>
          </label>
          <select
            className="input"
            value={data.fineEntity ?? ""}
            onChange={(e) => set("fineEntity", e.target.value)}
          >
            <option value="">Seleciona a entidade</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="label">
            Local da infração <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: EN10, Km 15, Setúbal"
            value={data.fineLocation ?? ""}
            onChange={(e) => set("fineLocation", e.target.value)}
          />
        </div>

        {/* Plate */}
        <div>
          <label className="label">
            Matrícula do veículo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: AB-12-CD"
            value={data.vehiclePlate ?? ""}
            onChange={(e) => set("vehiclePlate", e.target.value.toUpperCase())}
          />
        </div>

        <hr className="border-slate-200" />

        <p className="text-sm font-semibold text-slate-700">
          Teus dados (titular do veículo)
        </p>

        {/* Owner name */}
        <div>
          <label className="label">
            Nome completo <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: Maria Silva Santos"
            value={data.vehicleOwnerName ?? ""}
            onChange={(e) => set("vehicleOwnerName", e.target.value)}
          />
        </div>

        {/* NIF */}
        <div>
          <label className="label">
            NIF (Número de Identificação Fiscal) <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            className="input"
            placeholder="Ex: 123456789"
            maxLength={9}
            value={data.vehicleOwnerNif ?? ""}
            onChange={(e) => set("vehicleOwnerNif", e.target.value.replace(/\D/g, ""))}
          />
          <p className="text-xs text-slate-400 mt-1">
            O NIF é necessário para identificação legal no documento.
          </p>
        </div>

        {/* Address */}
        <div>
          <label className="label">
            Morada completa <span className="text-red-400">*</span>
          </label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Ex: Rua das Flores, n.º 12, 3.º Dto, 1200-001 Lisboa"
            value={data.vehicleOwnerAddress ?? ""}
            onChange={(e) => set("vehicleOwnerAddress", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
