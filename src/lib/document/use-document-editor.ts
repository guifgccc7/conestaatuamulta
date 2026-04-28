/**
 * useDocumentEditor — state manager for the inline document editor.
 *
 * Responsibilities:
 *  - Parse raw document text into DocSection[]
 *  - Track which section is currently being edited
 *  - Buffer edits per section (Map<sectionId, editedContent>)
 *  - Detect which sections are AI-enhanced (via AiOutput metadata)
 *  - Reconstruct the full document text whenever the parent needs it
 *  - Expose undo (revert section to original) + reset (revert all)
 */

import { useState, useCallback, useMemo } from "react";
import {
  parseDocument,
  serialiseDocument,
  countWords,
  type DocSection,
  type SectionId,
} from "./parser";
import type { AiOutput } from "./types";

// ─── Edits map ────────────────────────────────────────────────────────────────

/** key = section id, value = current edited content string */
type EditsMap = Map<SectionId, string>;

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseDocumentEditor {
  /** Parsed sections with AI flags set, edits applied */
  sections:        DocSection[];
  /** Section id currently open in the editor (null = none) */
  editingId:       SectionId | null;
  /** Start editing a section */
  startEdit:       (id: SectionId) => void;
  /** Commit the edited text for a section */
  commitEdit:      (id: SectionId, text: string) => void;
  /** Discard edits for a section */
  cancelEdit:      (id: SectionId) => void;
  /** Revert a single section to its original content */
  revertSection:   (id: SectionId) => void;
  /** Revert all sections */
  revertAll:       () => void;
  /** Whether any section has unsaved edits */
  isDirty:         boolean;
  /** Set of section ids with user edits */
  editedIds:       Set<SectionId>;
  /** Full document text (original + edits merged) */
  currentText:     string;
  /** Word count of currentText */
  wordCount:       number;
  /** Update the base document text (e.g. after AI re-analysis) */
  setBaseText:     (text: string) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDocumentEditor(
  initialText: string,
  aiOutput?: AiOutput | null
): UseDocumentEditor {
  const [baseText,   setBaseTextState] = useState(initialText);
  const [edits,      setEdits]         = useState<EditsMap>(new Map());
  const [editingId,  setEditingId]     = useState<SectionId | null>(null);

  // ── Parse base sections ──────────────────────────────────────────────────

  const baseSections = useMemo(() => parseDocument(baseText), [baseText]);

  // ── Determine which sections are AI-enhanced ─────────────────────────────

  const aiEnhancedIds = useMemo((): Set<SectionId> => {
    const ids = new Set<SectionId>();
    if (!aiOutput) return ids;
    if (aiOutput.texto_formal?.trim()) {
      // texto_formal replaced section_ii entirely
      ids.add("section_ii");
    } else if (aiOutput.argumentos.length > 0) {
      // argumentos were appended to section_ii
      ids.add("section_ii");
    }
    return ids;
  }, [aiOutput]);

  // ── Merge edits into sections ────────────────────────────────────────────

  const sections = useMemo((): DocSection[] =>
    baseSections.map((s) => ({
      ...s,
      content:    edits.has(s.id) ? edits.get(s.id)! : s.content,
      aiEnhanced: aiEnhancedIds.has(s.id),
    })),
    [baseSections, edits, aiEnhancedIds]
  );

  // ── Current document text (edits merged) ─────────────────────────────────

  const currentText = useMemo(
    () => serialiseDocument(sections),
    [sections]
  );

  const wordCount = useMemo(() => countWords(currentText), [currentText]);

  // ── Edit state ids ───────────────────────────────────────────────────────

  const editedIds = useMemo(
    (): Set<SectionId> => new Set(edits.keys()),
    [edits]
  );

  const isDirty = editedIds.size > 0;

  // ── Actions ──────────────────────────────────────────────────────────────

  const startEdit = useCallback((id: SectionId) => {
    setEditingId(id);
  }, []);

  const commitEdit = useCallback((id: SectionId, text: string) => {
    setEdits((prev) => {
      const next = new Map(prev);
      // Check if text equals original — if so, remove the edit entry
      const original = baseSections.find((s) => s.id === id)?.content ?? "";
      if (text.trim() === original.trim()) {
        next.delete(id);
      } else {
        next.set(id, text);
      }
      return next;
    });
    setEditingId(null);
  }, [baseSections]);

  const cancelEdit = useCallback((id: SectionId) => {
    setEditingId((prev) => prev === id ? null : prev);
  }, []);

  const revertSection = useCallback((id: SectionId) => {
    setEdits((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
    setEditingId(null);
  }, []);

  const revertAll = useCallback(() => {
    setEdits(new Map());
    setEditingId(null);
  }, []);

  const setBaseText = useCallback((text: string) => {
    setBaseTextState(text);
    setEdits(new Map()); // reset all edits when base changes
    setEditingId(null);
  }, []);

  return {
    sections,
    editingId,
    startEdit,
    commitEdit,
    cancelEdit,
    revertSection,
    revertAll,
    isDirty,
    editedIds,
    currentText,
    wordCount,
    setBaseText,
  };
}
