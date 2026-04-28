"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WizardFormData, CaseType } from "@/types";
import { CaseTypeStep } from "./steps/CaseTypeStep";
import { FineDetailsStep } from "./steps/FineDetailsStep";
import { ViolationDetailsStep } from "./steps/ViolationDetailsStep";
import { GroundsStep } from "./steps/GroundsStep";
import { ReviewStep } from "./steps/ReviewStep";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 1, label: "Tipo de multa" },
  { id: 2, label: "Dados da multa" },
  { id: 3, label: "Detalhes" },
  { id: 4, label: "Fundamentos" },
  { id: 5, label: "Revisão" },
];

const DEFAULT_FORM: Partial<WizardFormData> = {
  caseType:            undefined,
  fineNumber:          "",
  fineDate:            "",
  fineEntity:          "",
  fineLocation:        "",
  vehiclePlate:        "",
  vehicleOwnerName:    "",
  vehicleOwnerNif:     "",
  vehicleOwnerAddress: "",
  violationData:       { description: "" },
  contestationGrounds: [],
  additionalNotes:     "",
};

interface WizardFormProps {
  initialType?: CaseType;
  initialCaseId?: string;
}

export function WizardForm({ initialType, initialCaseId }: WizardFormProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep]         = useState<WizardStep>(initialType ? 2 : 1);
  const [caseId, setCaseId]     = useState<string | undefined>(initialCaseId);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState<Partial<WizardFormData>>({
    ...DEFAULT_FORM,
    caseType: initialType,
  });

  const updateData = useCallback(
    (partial: Partial<WizardFormData>) => {
      setFormData((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  const goNext = () => setStep((s) => Math.min(s + 1, 5) as WizardStep);
  const goPrev = () => setStep((s) => Math.max(s - 1, 1) as WizardStep);

  const saveCase = async (): Promise<string | null> => {
    if (!session) {
      router.push(`/auth/login?redirect=/wizard`);
      return null;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: caseId }),
      });
      const json = await res.json();
      if (json.success) {
        setCaseId(json.data.id);
        return json.data.id;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
    return null;
  };

  const handleGenerate = async () => {
    const id = await saveCase();
    if (!id) return;

    const res = await fetch("/api/documents/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: id }),
    });
    const json = await res.json();

    if (json.requiresPayment) {
      // Redirect to Stripe checkout for single doc
      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "SINGLE_DOC", caseId: id }),
      });
      const checkoutJson = await checkoutRes.json();
      if (checkoutJson.url) {
        window.location.href = checkoutJson.url;
      }
      return;
    }

    if (json.success) {
      router.push(`/dashboard?generated=${id}`);
    }
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-all",
                    step === s.id
                      ? "bg-brand-600 text-white ring-4 ring-brand-100"
                      : step > s.id
                      ? "bg-brand-600 text-white"
                      : "bg-slate-200 text-slate-400"
                  )}
                >
                  {step > s.id ? "✓" : s.id}
                </div>
                <span
                  className={cn(
                    "text-xs hidden sm:block text-center",
                    step >= s.id ? "text-brand-600 font-medium" : "text-slate-400"
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="card p-6 sm:p-8 mb-6">
          {step === 1 && (
            <CaseTypeStep
              value={formData.caseType}
              onChange={(type) => { updateData({ caseType: type }); goNext(); }}
            />
          )}
          {step === 2 && (
            <FineDetailsStep
              data={formData}
              onChange={updateData}
            />
          )}
          {step === 3 && formData.caseType && (
            <ViolationDetailsStep
              caseType={formData.caseType}
              data={formData.violationData}
              onChange={(v) => updateData({ violationData: v })}
            />
          )}
          {step === 4 && formData.caseType && (
            <GroundsStep
              caseType={formData.caseType}
              grounds={formData.contestationGrounds ?? []}
              additionalNotes={formData.additionalNotes ?? ""}
              onChange={(grounds, notes) =>
                updateData({ contestationGrounds: grounds, additionalNotes: notes })
              }
            />
          )}
          {step === 5 && (
            <ReviewStep
              data={formData as WizardFormData}
              onGenerate={handleGenerate}
              saving={saving}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={goPrev} className="btn-secondary flex-1">
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </button>
          )}
          {step < 5 && step !== 1 && (
            <button onClick={goNext} className="btn-primary flex-1">
              Seguinte
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Legal disclaimer */}
        <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed">
          Os documentos gerados são minutas legais de apoio. Não constituem aconselhamento jurídico personalizado. Para casos complexos, consulta um advogado.
        </p>
      </div>
    </div>
  );
}
