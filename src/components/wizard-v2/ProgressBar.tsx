"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
  icon: string;
}

interface ProgressBarProps {
  steps: readonly Step[];
  currentStep: number;
  /** Highest step ever reached — allows forward navigation to visited steps (BUG-005) */
  maxCompletedStep: number;
  onStepClick: (step: number) => void;
}

export function ProgressBar({ steps, currentStep, maxCompletedStep, onStepClick }: ProgressBarProps) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div>
      {/* Step circles + labels */}
      <div className="flex items-start justify-between relative mb-2">
        {/* Background track */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0" />
        {/* Filled track */}
        <div
          className="absolute top-4 left-4 h-0.5 bg-brand-500 -z-0 transition-all duration-500"
          style={{ width: `calc(${progress}% - 2rem)` }}
        />

        {steps.map((s) => {
          const done     = currentStep > s.id;
          const active   = currentStep === s.id;
          // BUG-005: allow clicking any step the user has reached, including
          // forward navigation to previously-visited steps
          const clickable = s.id !== currentStep && s.id <= maxCompletedStep;

          return (
            <button
              key={s.id}
              onClick={() => clickable && onStepClick(s.id)}
              disabled={!clickable}
              className={cn(
                "flex flex-col items-center gap-1.5 z-10",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
              aria-label={`${clickable ? "Ir para" : "Passo"} ${s.id}: ${s.label}${active ? " (atual)" : ""}`}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                  done
                    ? "bg-brand-600 text-white"
                    : active
                    ? "bg-brand-600 text-white ring-4 ring-brand-100 scale-110"
                    : "bg-white border-2 border-slate-200 text-slate-400"
                )}
              >
                {done ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <span className="text-xs">{s.icon}</span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block transition-colors",
                  active ? "text-brand-600" : done ? "text-slate-500" : "text-slate-300"
                )}
              >
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current step title on mobile */}
      <div className="sm:hidden text-center mt-1">
        <span className="text-xs text-slate-400">
          Passo {currentStep} de {steps.length} —{" "}
          <span className="text-brand-600 font-medium">
            {steps[currentStep - 1]?.label}
          </span>
        </span>
      </div>
    </div>
  );
}
