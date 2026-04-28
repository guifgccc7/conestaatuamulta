"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  WizardState,
  INITIAL_STATE,
  computeDefenses,
  computeCaseSummary,
  getStepKey,
} from "@/lib/wizard/logic-engine";
import { validateStep, StepNumber } from "@/lib/wizard/validation";
import { Step1FineType }    from "./steps/Step1FineType";
import { Step2FineDetails } from "./steps/Step2FineDetails";
import { Step3Context }     from "./steps/Step3Context";
import { Step4LegalGrounds }from "./steps/Step4LegalGrounds";
import { Step5PersonalData }from "./steps/Step5PersonalData";
import { Step6Review }      from "./steps/Step6Review";
import { ProgressBar }      from "./ProgressBar";
import { AiAssistant }     from "@/components/ai/AiAssistant";
import { AiInsightBadge }  from "@/components/ai/AiInsightBadge";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import type { AiOutput } from "@/lib/document/types";
import { WizardComplianceFooter } from "@/components/compliance/WizardComplianceFooter";

const STEP_META = [
  { id: 1, label: "Tipo",        icon: "📋" },
  { id: 2, label: "Multa",       icon: "📄" },
  { id: 3, label: "Contexto",    icon: "💬" },
  { id: 4, label: "Defesa",      icon: "⚖️" },
  { id: 5, label: "Os teus dados", icon: "👤" },
  { id: 6, label: "Gerar",       icon: "✅" },
] as const;

// ─── Draft persistence ────────────────────────────────────────────────────────

const DRAFT_KEY = "wizard_draft_v2";
const DRAFT_TTL = 24 * 60 * 60 * 1000; // 24 h

interface DraftPayload {
  state:             WizardState;
  maxCompletedStep:  number;
  savedAt:           number;
}

function loadDraft(): DraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as DraftPayload;
    if (Date.now() - payload.savedAt > DRAFT_TTL) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function saveDraft(state: WizardState, maxCompletedStep: number) {
  try {
    const payload: DraftPayload = { state, maxCompletedStep, savedAt: Date.now() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  } catch {
    // Storage quota exceeded or private browsing — silently ignore
  }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────

interface SmartWizardProps {
  initialType?: string;
  initialCaseId?: string;
}

export function SmartWizard({ initialType, initialCaseId }: SmartWizardProps) {
  const router      = useRouter();
  const { data: session } = useSession();
  const prefersReducedMotion = useReducedMotion();

  const [state,     setState]     = useState<WizardState>({
    ...INITIAL_STATE,
    fineType: initialType ? { fineCategory: initialType } : {},
    currentStep: initialType ? 2 : 1,
  });
  const [errors,    setErrors]    = useState<Record<string, string>>({});
  const [saving,    setSaving]    = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [caseId,    setCaseId]    = useState<string | undefined>(initialCaseId);
  // Track the highest step the user has ever reached so the progress bar
  // allows forward navigation to previously-visited steps (BUG-005).
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(
    initialType ? 1 : 0
  );
  // AI assistant output — set when the assistant produces structured analysis
  const [aiOutput,      setAiOutput]      = useState<AiOutput | null>(null);
  // Controlled open state for the floating AI assistant panel
  const [assistantOpen, setAssistantOpen] = useState(false);

  const defenses = useMemo(() => computeDefenses(state), [state]);
  const summary  = useMemo(() => computeCaseSummary(state), [state]);

  // Guard: prevents saveDraft from running on the very first render (before the
  // loadDraft effect has applied its setState). Without this, saveDraft fires
  // with the empty initial state and overwrites the stored draft — causing the
  // user to lose all progress after a login redirect.
  const draftReadyRef = useRef(false);

  // ── Draft: restore on mount (UX-002) ────────────────────────────────────────
  useEffect(() => {
    // URL params always win over a saved draft
    if (initialType || initialCaseId) return;
    const draft = loadDraft();
    if (!draft) return;
    setState(draft.state);
    setMaxCompletedStep(draft.maxCompletedStep);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Draft: persist on every state change ────────────────────────────────────
  useEffect(() => {
    // Skip the very first run: at this point loadDraft's setState hasn't been
    // applied yet, so state is still the empty initial value. Allow all
    // subsequent runs (including the re-render caused by loadDraft's setState).
    if (!draftReadyRef.current) {
      draftReadyRef.current = true;
      return;
    }
    // Persist at all steps including step 6 so that if the user is redirected
    // to login mid-flow, the wizard resumes exactly where they left off.
    saveDraft(state, maxCompletedStep);
  }, [state, maxCompletedStep]);

  // ─── State update helpers ──────────────────────────────────────────────────

  const updateStep = useCallback(
    <K extends keyof Omit<WizardState, "currentStep">>(
      key: K,
      partial: Partial<WizardState[K]>
    ) => {
      setState((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...partial },
      }));
      // Clear errors for updated fields
      setErrors((prev) => {
        const next = { ...prev };
        Object.keys(partial as object).forEach((k) => delete next[k]);
        return next;
      });
    },
    []
  );

  // ─── Navigation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const currentStep = state.currentStep;
    if (currentStep === 6) return true; // review step — no validation needed

    const step    = currentStep as StepNumber;
    const stepKey = getStepKey(step);
    const stepData  = state[stepKey];
    // Pass fineCategory from step 1 so step 2 can enforce conditional required
    // fields (speedRegistered / speedLimit) and cross-field speed consistency.
    const context   = { fineCategory: state.fineType?.fineCategory };
    const result    = validateStep(step, stepData, context);

    if (!result.success) {
      setErrors(result.errors);
      // Scroll to first error
      setTimeout(() => {
        document.querySelector("[data-error]")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return false;
    }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (!validate()) return;
    setDirection("forward");
    const nextStep = Math.min(state.currentStep + 1, 6);
    // Mark the destination as the new high-water mark (BUG-005)
    setMaxCompletedStep((prev) => Math.max(prev, nextStep));
    setState((prev) => ({ ...prev, currentStep: nextStep }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setDirection("back");
    setErrors({});
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1),
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToStep = (step: number) => {
    if (step === state.currentStep) return;
    // Allow navigation to any step the user has already reached (BUG-005)
    if (step > maxCompletedStep) return;
    setDirection(step < state.currentStep ? "back" : "forward");
    setErrors({});
    setState((prev) => ({ ...prev, currentStep: step }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ─── Save + generate ────────────────────────────────────────────────────────
  // Returns preview data to Step6Review so it can show the preview + paywall.
  // Does NOT redirect — the paywall modal handles Stripe navigation instead.

  const handleGenerate = async (): Promise<{
    previewText?: string;
    caseId?: string;
    documentId?: string;
    isPaid?: boolean;
  } | void> => {
    if (!session) {
      router.push(`/auth/login?redirect=/wizard`);
      return;
    }

    setSaving(true);
    try {
      // ── 1. Save / update case in DB ───────────────────────────────────────

      const saveRes = await fetch("/api/cases", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          id:                  caseId,
          caseType:            state.fineType.fineCategory,
          fineNumber:          state.fineDetails.fineReference,
          fineDate:            state.fineDetails.fineDate,
          fineEntity:          state.fineDetails.fineAuthority,
          fineLocation:        state.fineDetails.fineLocation,
          vehiclePlate:        state.fineDetails.vehiclePlate,
          vehicleOwnerName:    state.personalData.fullName,
          violationData: {
            ...state.fineDetails,
            ...state.context,
            ownerNif:     state.personalData.nif,
            ownerAddress: state.personalData.address,
          },
          contestationGrounds: defenses
            .filter((d) => state.legalGrounds.selectedGrounds?.includes(d.id))
            .map((d) => ({
              id:         d.id,
              label:      d.title,
              legalBasis: d.legalBasis,
              selected:   true,
              freeText:
                d.id === "outro_defect"
                  ? state.context.fineDefectOtherDescription
                  : d.id === "sancao_acessoria"
                    ? state.context.sancaoAcessoriaDescription
                    : d.id === "emel_ma_fe"
                      ? state.context.emelMaFeDetail
                      : d.id === "emel_fora_horario"
                        ? state.context.emelForaHorarioHora
                        : undefined,
            })),
          additionalNotes: state.legalGrounds.additionalNotes,
        }),
      });

      const saveJson = await saveRes.json();
      if (!saveJson.success) throw new Error(saveJson.error);
      const id = saveJson.data.id as string;
      setCaseId(id);

      // ── 2. Try to generate document ───────────────────────────────────────

      const genRes  = await fetch("/api/documents/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ caseId: id, aiOutput: aiOutput ?? undefined }),
      });
      const genJson = await genRes.json();

      // ── 3a. Subscriber — document generated ───────────────────────────────

      if (genJson.success) {
        clearDraft(); // Clear saved draft — user has their document (UX-002)
        return {
          previewText: genJson.data.previewText,
          caseId:      id,
          documentId:  genJson.data.documentId,
          isPaid:      true,
        };
      }

      // ── 3b. Payment required — return preview only (paywall handles rest) ─

      if (genJson.requiresPayment) {
        // We still have the base text from the API response
        return {
          previewText: genJson.data?.previewText ?? undefined,
          caseId:      id,
          documentId:  undefined,
          isPaid:      false,
        };
      }

      throw new Error(genJson.error ?? "Erro ao gerar documento.");
    } catch (err) {
      console.error(err);
      setErrors({ _global: "Ocorreu um erro. Tenta novamente." });
    } finally {
      setSaving(false);
    }
  };

  // ─── Step meta ─────────────────────────────────────────────────────────────

  const step    = state.currentStep;
  const isFirst = step === 1;
  const isLast  = step === 6;

  // BUG-008: disable animations when user has requested reduced motion
  const variants = prefersReducedMotion
    ? {
        enter:  { x: 0, opacity: 1 },
        center: { x: 0, opacity: 1 },
        exit:   { x: 0, opacity: 1 },
      }
    : {
        enter:   (dir: string) => ({ x: dir === "forward" ? 40 : -40, opacity: 0 }),
        center:  { x: 0, opacity: 1 },
        exit:    (dir: string) => ({ x: dir === "forward" ? -40 : 40, opacity: 0 }),
      };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">

        {/* ─── Progress bar ───────────────────────────────────────── */}
        {/* UX-003: announce step changes to screen readers */}
        <span aria-live="polite" className="sr-only">
          Passo {step} de {STEP_META.length}: {STEP_META[step - 1]?.label}
        </span>
        <ProgressBar
          steps={STEP_META}
          currentStep={step}
          maxCompletedStep={maxCompletedStep}
          onStepClick={goToStep}
        />

        {/* ─── Step content (animated) ────────────────────────────── */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div className="card p-6 sm:p-8 mt-6">

              {/* Global error */}
              {errors._global && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors._global}
                </div>
              )}

              {step === 1 && (
                <Step1FineType
                  values={state.fineType}
                  errors={errors}
                  onChange={(v) => updateStep("fineType", v)}
                  onAutoAdvance={goNext}
                />
              )}
              {step === 2 && (
                <Step2FineDetails
                  values={state.fineDetails}
                  fineCategory={state.fineType.fineCategory}
                  errors={errors}
                  onChange={(v) => updateStep("fineDetails", v)}
                />
              )}
              {step === 3 && (
                <Step3Context
                  values={state.context}
                  fineCategory={state.fineType.fineCategory}
                  fineAuthority={state.fineDetails.fineAuthority}
                  errors={errors}
                  onChange={(v) => updateStep("context", v)}
                />
              )}
              {step === 4 && (
                <>
                  <AiInsightBadge
                    wizardState={state}
                    defenses={defenses}
                    onOpenAssistant={() => setAssistantOpen(true)}
                  />
                  <Step4LegalGrounds
                    defenses={defenses}
                    values={state.legalGrounds}
                    errors={errors}
                    onChange={(v) => updateStep("legalGrounds", v)}
                  />
                </>
              )}
              {step === 5 && (
                <Step5PersonalData
                  values={state.personalData}
                  errors={errors}
                  onChange={(v) => updateStep("personalData", v)}
                  userSession={session}
                />
              )}
                      {step === 6 && (
                <Step6Review
                  state={state}
                  summary={summary}
                  defenses={defenses}
                  aiOutput={aiOutput}
                  onGenerate={handleGenerate}
                  onEditStep={goToStep}
                  saving={saving}
                  onOpenAssistant={() => setAssistantOpen(true)}
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ─── Navigation buttons ──────────────────────────────────── */}
        {step !== 6 && (
          <div className="flex gap-3 mt-4">
            {!isFirst && (
              <button
                onClick={goPrev}
                className="btn-secondary flex-shrink-0"
                aria-label="Passo anterior"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
            )}

            {/* Auto-advance on Step 1 means no next button there */}
            {step !== 1 && !isLast && (
              <button
                onClick={goNext}
                className="btn-primary flex-1 justify-center"
              >
                Seguinte
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ─── Legal compliance footer ─────────────────────────────── */}
        <WizardComplianceFooter />
      </div>

      {/* ─── Floating AI assistant (step 3+) ────────────────────────── */}
      <AiAssistant
        wizardState={state}
        defenses={defenses}
        currentStep={step}
        onAiOutput={setAiOutput}
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
      />
    </div>
  );
}
