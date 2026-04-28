"use client";

/**
 * useFieldValidation
 *
 * Provides per-field real-time validation triggered on onBlur.
 * Works alongside the step-level validateStep() which runs on "Next" click.
 *
 * Pattern:
 *   const { blurErrors, onFieldBlur, clearFieldError } = useFieldValidation(schema);
 *
 *   // Merge with "Next"-click errors (external take precedence):
 *   const effectiveErrors = { ...blurErrors, ...errors };
 *
 *   // In a field:
 *   <input
 *     onBlur={() => onFieldBlur("fineLocation", values.fineLocation, values)}
 *     ...
 *   />
 *
 * When the user edits a field after a failed "Next" click, SmartWizard already
 * clears that field's error from the external errors map (updateStep() effect).
 * blurErrors then take over until the next submission attempt.
 */

import { useState, useCallback, useRef } from "react";
import type { ZodTypeAny } from "zod";

export function useFieldValidation(schema: ZodTypeAny) {
  const [blurErrors, setBlurErrors] = useState<Record<string, string>>({});

  // Track which fields the user has interacted with so we don't show errors
  // for fields they haven't visited yet (e.g. on initial render).
  const touchedRef = useRef<Set<string>>(new Set());

  /**
   * Call this in a field's onBlur handler.
   *
   * @param field      The field name (must match the Zod schema key)
   * @param value      The field's current value
   * @param allValues  The full current step values (for cross-field validation)
   */
  const onFieldBlur = useCallback(
    (field: string, value: unknown, allValues: Record<string, unknown>) => {
      touchedRef.current.add(field);

      // Run the full schema on a merge of allValues + the blurred field's
      // current value.  We only care about issues on this specific field.
      const result = schema.safeParse({ ...allValues, [field]: value });

      if (result.success) {
        // Field is now valid — remove its error (if any)
        setBlurErrors((prev) => {
          if (!(field in prev)) return prev;
          const next = { ...prev };
          delete next[field];
          return next;
        });
      } else {
        // Find the first issue that refers to this field
        const issue = result.error.issues.find(
          (i) => i.path[0] === field || i.path.join(".") === field
        );

        if (issue) {
          setBlurErrors((prev) => ({ ...prev, [field]: issue.message }));
        } else {
          // No issue for this field — clear any stale error
          setBlurErrors((prev) => {
            if (!(field in prev)) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
          });
        }
      }
    },
    [schema]
  );

  /**
   * Programmatically clear a single field error.
   * Useful when the parent clears external errors and you want blurErrors to follow.
   */
  const clearFieldError = useCallback((field: string) => {
    setBlurErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** Reset all blur errors and touched state (e.g. when navigating between steps) */
  const resetBlurErrors = useCallback(() => {
    setBlurErrors({});
    touchedRef.current.clear();
  }, []);

  return {
    blurErrors,
    onFieldBlur,
    clearFieldError,
    resetBlurErrors,
    touched: touchedRef,
  };
}
