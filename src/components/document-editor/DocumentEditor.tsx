"use client";

/**
 * DocumentEditor
 *
 * Renders a legal contestation document in a clean, paper-style layout.
 * Editable sections can be clicked to open an inline textarea editor.
 * AI-enhanced sections are visually flagged.
 * After the paywall gate, copy + download become available.
 *
 * Layout:
 *
 *   ┌────────────────────────────────────────────┐
 *   │ Toolbar (word count · edits · copy · PDF)  │
 *   ├────────────────────────────────────────────┤
 *   │  ┌──────────────────────────────────────┐  │
 *   │  │  [Paper canvas]                      │  │
 *   │  │    Header block                      │  │
 *   │  │    I — Identificação      [read-only]│  │
 *   │  │    II — Fundamentos       [✦ IA][edit]│  │
 *   │  │    III — Considerações    [edit]      │  │
 *   │  │    IV — Pedido            [read-only] │  │
 *   │  │    Assinatura                        │  │
 *   │  │    Nota informativa                  │  │
 *   │  └──────────────────────────────────────┘  │
 *   └────────────────────────────────────────────┘
 */

import { useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Pencil,
  Check,
  X,
  RotateCcw,
  Copy,
  Download,
  Lock,
  Info,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDocumentEditor } from "@/lib/document/use-document-editor";
import type { DocSection, SectionId } from "@/lib/document/parser";
import type { AiOutput } from "@/lib/document/types";
import { useState } from "react";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  /** Full document text (output of buildEnhancedDocument) */
  documentText:   string;
  /** AI output metadata — used to flag which sections are AI-enhanced */
  aiOutput?:      AiOutput | null;
  /** Has the user paid? Unlocks copy + download */
  isPaid:         boolean;
  /** Called when the user tries a locked action */
  onPaywall:      () => void;
  /** Called when user triggers PDF download */
  onDownload?:    () => void;
  /** Called whenever the document text changes due to editing */
  onChange?:      (text: string) => void;
  className?:     string;
}

// ─── Section heading display colours ─────────────────────────────────────────

const SECTION_COLORS: Partial<Record<SectionId, string>> = {
  header:      "text-slate-800",
  section_i:   "text-slate-700",
  section_ii:  "text-slate-900",
  section_iii: "text-slate-700",
  section_iv:  "text-slate-700",
  signature:   "text-slate-600",
  disclaimer:  "text-slate-400",
};

const SECTION_BG: Partial<Record<SectionId, string>> = {
  section_ii:  "bg-amber-50/40 border-l-2 border-amber-300",
};

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentEditor({
  documentText,
  aiOutput,
  isPaid,
  onPaywall,
  onDownload,
  onChange,
  className,
}: Props) {
  const editor = useDocumentEditor(documentText, aiOutput);

  // Propagate changes upward
  useEffect(() => {
    onChange?.(editor.currentText);
  }, [editor.currentText, onChange]);

  // Keep base text in sync when the parent refreshes the document
  const prevText = useRef(documentText);
  useEffect(() => {
    if (documentText !== prevText.current) {
      prevText.current = documentText;
      editor.setBaseText(documentText);
    }
  }, [documentText, editor]);

  // ── Copy handler ───────────────────────────────────────────────────────────

  const [copyFeedback, setCopyFeedback] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!isPaid) { onPaywall(); return; }
    try {
      await navigator.clipboard.writeText(editor.currentText);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = editor.currentText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  }, [isPaid, onPaywall, editor.currentText]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className={cn("flex flex-col gap-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100", className)}>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Toolbar
        wordCount={editor.wordCount}
        isDirty={editor.isDirty}
        editedCount={editor.editedIds.size}
        aiOutput={aiOutput}
        isPaid={isPaid}
        copyFeedback={copyFeedback}
        onCopy={handleCopy}
        onDownload={isPaid ? onDownload : onPaywall}
        onRevertAll={editor.isDirty ? editor.revertAll : undefined}
      />

      {/* ── Paper canvas ─────────────────────────────────────────────────── */}
      <div className="overflow-y-auto max-h-[70vh] bg-slate-100 p-3 sm:p-6">
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-sm">
          {/* Paper top margin decoration */}
          <div className="h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 rounded-t-sm" />

          <div className="px-8 sm:px-12 py-10 space-y-0">
            {editor.sections.map((section, idx) => (
              <SectionBlock
                key={section.id}
                section={section}
                isEditing={editor.editingId === section.id}
                isEdited={editor.editedIds.has(section.id)}
                isPaid={isPaid}
                aiOutput={aiOutput}
                onStartEdit={() => editor.startEdit(section.id)}
                onCommit={(text) => editor.commitEdit(section.id, text)}
                onCancel={() => editor.cancelEdit(section.id)}
                onRevert={() => editor.revertSection(section.id)}
                colorClass={SECTION_COLORS[section.id] ?? "text-slate-800"}
                bgClass={SECTION_BG[section.id]}
                isLast={idx === editor.sections.length - 1}
              />
            ))}
          </div>

          {/* Paper bottom */}
          <div className="h-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 rounded-b-sm" />
        </div>
      </div>

      {/* ── Edit hint bar (only shown when something is editable) ─────────── */}
      {editor.sections.some((s) => s.editable) && !editor.isDirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-t border-slate-200 text-xs text-slate-400">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          Clica em <strong className="text-slate-500 mx-0.5">Editar</strong> em qualquer secção a verde para personalizar o documento antes de descarregar.
        </div>
      )}

      {/* ── Unsaved changes bar ────────────────────────────────────────────── */}
      {editor.isDirty && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-xs">
          <div className="flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              Tens <strong>{editor.editedIds.size} secção{editor.editedIds.size !== 1 ? "ões" : ""}</strong> editada{editor.editedIds.size !== 1 ? "s" : ""}.
              As alterações são incluídas no PDF.
            </span>
          </div>
          <button
            onClick={editor.revertAll}
            className="flex-shrink-0 text-amber-600 hover:text-amber-800 font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Reverter tudo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function Toolbar({
  wordCount, isDirty, editedCount, aiOutput,
  isPaid, copyFeedback,
  onCopy, onDownload, onRevertAll,
}: {
  wordCount:    number;
  isDirty:      boolean;
  editedCount:  number;
  aiOutput?:    AiOutput | null;
  isPaid:       boolean;
  copyFeedback: boolean;
  onCopy:       () => void;
  onDownload?:  () => void;
  onRevertAll?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-slate-200 flex-wrap">
      {/* Left: meta info */}
      <div className="flex items-center gap-3 text-xs text-slate-400 flex-1 min-w-0">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {wordCount.toLocaleString("pt-PT")} palavras
        </span>

        {isDirty && (
          <span className="flex items-center gap-1 text-amber-600 font-medium">
            <Pencil className="w-3 h-3" />
            {editedCount} edit{editedCount !== 1 ? "adas" : "ada"}
          </span>
        )}

        {aiOutput && (aiOutput.argumentos.length > 0 || aiOutput.texto_formal) && (
          <span className="hidden sm:flex items-center gap-1 text-brand-600 font-medium">
            <Sparkles className="w-3 h-3" />
            Melhorado pela IA
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {onRevertAll && (
          <button
            onClick={onRevertAll}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
            title="Reverter todas as edições"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reverter</span>
          </button>
        )}

        <button
          onClick={onCopy}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
            isPaid
              ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
              : "bg-slate-50 text-slate-400 border border-slate-200"
          )}
          title={isPaid ? "Copiar texto completo" : "Desbloqueia para copiar"}
        >
          {isPaid ? <Copy className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {copyFeedback ? "Copiado!" : "Copiar"}
        </button>

        <button
          onClick={onDownload}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
            isPaid
              ? "bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
              : "bg-slate-100 text-slate-400 border border-slate-200"
          )}
          title={isPaid ? "Descarregar PDF" : "Desbloqueia para descarregar o PDF"}
        >
          {isPaid ? <Download className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {isPaid ? "PDF" : "Bloqueado"}
        </button>
      </div>
    </div>
  );
}

// ─── Section block ────────────────────────────────────────────────────────────

function SectionBlock({
  section,
  isEditing,
  isEdited,
  isPaid,
  aiOutput,
  onStartEdit,
  onCommit,
  onCancel,
  onRevert,
  colorClass,
  bgClass,
  isLast,
}: {
  section:     DocSection;
  isEditing:   boolean;
  isEdited:    boolean;
  isPaid:      boolean;
  aiOutput?:   AiOutput | null;
  onStartEdit: () => void;
  onCommit:    (text: string) => void;
  onCancel:    () => void;
  onRevert:    () => void;
  colorClass:  string;
  bgClass?:    string;
  isLast:      boolean;
}) {
  const [collapsed, setCollapsed] = useState(
    section.id === "disclaimer"
  );

  const isDisclaimer = section.id === "disclaimer";
  const isSignature  = section.id === "signature";

  return (
    <div className={cn(
      "group relative",
      !isLast && "border-b border-slate-100",
      bgClass && !isEditing && bgClass,
    )}>

      {/* ── Section heading ──────────────────────────────────────────────── */}
      {section.heading && (
        <div className={cn(
          "flex items-center justify-between gap-2 pt-6 pb-2",
          isDisclaimer && "cursor-pointer select-none"
        )}
          onClick={isDisclaimer ? () => setCollapsed((c) => !c) : undefined}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className={cn(
              "text-[11px] font-bold uppercase tracking-widest",
              colorClass,
              isDisclaimer && "text-slate-400"
            )}>
              {section.label}
            </h3>

            {/* AI badge */}
            {section.aiEnhanced && (
              <AiBadge enhanced={!!aiOutput?.texto_formal} />
            )}

            {/* Edited badge */}
            {isEdited && !isEditing && (
              <span className="text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                Editado
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Revert button */}
            {isEdited && !isEditing && (
              <button
                onClick={(e) => { e.stopPropagation(); onRevert(); }}
                className="flex items-center gap-1 px-1.5 py-1 rounded text-[10px] text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Reverter esta secção"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reverter
              </button>
            )}

            {/* Edit button — only for editable, non-editing state */}
            {section.editable && !isEditing && (
              <button
                onClick={onStartEdit}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all",
                  "opacity-0 group-hover:opacity-100 focus:opacity-100",
                  "bg-green-100 hover:bg-green-200 text-green-700",
                )}
                title={section.hint}
              >
                <Pencil className="w-2.5 h-2.5" />
                Editar
              </button>
            )}

            {/* Collapse toggle for disclaimer */}
            {isDisclaimer && (
              <button className="p-1 text-slate-300 hover:text-slate-500">
                {collapsed
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronUp className="w-3.5 h-3.5" />
                }
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Hint tooltip ─────────────────────────────────────────────────── */}
      {section.hint && section.editable && !isEditing && (
        <p className="text-[10px] text-slate-400 mb-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Info className="w-2.5 h-2.5 flex-shrink-0" />
          {section.hint}
        </p>
      )}

      {/* ── Section content ───────────────────────────────────────────────── */}
      {!collapsed && (
        isEditing
          ? <SectionEditor
              initialContent={section.content}
              onCommit={onCommit}
              onCancel={onCancel}
            />
          : <SectionContent
              section={section}
              isPaid={isPaid}
              isSignature={isSignature}
              isDisclaimer={isDisclaimer}
            />
      )}
    </div>
  );
}

// ─── Section content (read view) ──────────────────────────────────────────────

function SectionContent({
  section,
  isPaid,
  isSignature,
  isDisclaimer,
}: {
  section:     DocSection;
  isPaid:      boolean;
  isSignature: boolean;
  isDisclaimer:boolean;
}) {
  const isHeader = section.id === "header";

  if (!section.content && !isHeader) return null;

  // Header: render as a styled block, not mono text
  if (isHeader) {
    const lines = section.content.split("\n").filter(Boolean);
    return (
      <div className="pb-4 space-y-1">
        {lines.map((line, i) => (
          <p key={i} className={cn(
            "text-sm leading-relaxed",
            i === 0 && "font-bold text-base text-slate-900 uppercase tracking-wide",
            i === 1 && "text-slate-500 text-xs mt-1",
            i > 1 && "text-slate-700",
          )}>
            {line}
          </p>
        ))}
      </div>
    );
  }

  if (isSignature) {
    return (
      <div className="pb-6 pt-2 space-y-1">
        {section.content.split("\n").filter(Boolean).map((line, i) => (
          <p key={i} className="text-sm text-slate-700 leading-relaxed">
            {line}
          </p>
        ))}
        {/* Signature line */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="w-48 border-b border-slate-400 mb-1" />
          <p className="text-xs text-slate-400">Assinatura do/a Arguido/a</p>
        </div>
      </div>
    );
  }

  if (isDisclaimer) {
    return (
      <p className="text-[10px] text-slate-400 leading-relaxed pb-4 italic">
        {section.content}
      </p>
    );
  }

  // Standard legal text — paragraphs split by double newline
  const paragraphs = section.content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="pb-6 space-y-3">
      {paragraphs.map((para, i) => {
        // Ground heading: numbered paragraph starting with a digit
        const isGroundHeading = /^\d+\.\s+[A-ZÁÉÍÓÚÂÊÔÃÕ]/.test(para) &&
                                para === para.toUpperCase().trim();

        // Legal citation block: wrapped in parens
        const isCitation = para.startsWith("(") && para.endsWith(")");

        if (isGroundHeading) {
          return (
            <p key={i} className="text-xs font-bold text-slate-800 uppercase tracking-wide mt-4 first:mt-0">
              {para}
            </p>
          );
        }

        if (isCitation) {
          return (
            <div key={i} className="border-l-2 border-brand-300 pl-3 py-1 bg-brand-50/60 rounded-r-sm">
              <p className="text-[10px] text-brand-700 leading-relaxed italic">{para}</p>
            </div>
          );
        }

        // Handle numbered sub-paragraphs (e.g. "1. Texto...")
        const numberedMatch = para.match(/^(\d+\.\d*\.?\s+)/);
        if (numberedMatch) {
          return (
            <p key={i} className="text-sm text-slate-700 leading-relaxed text-justify pl-2">
              <span className="font-semibold text-slate-500 mr-1">{numberedMatch[1]}</span>
              {para.slice(numberedMatch[0].length)}
            </p>
          );
        }

        return (
          <p key={i} className="text-sm text-slate-700 leading-relaxed text-justify">
            {para}
          </p>
        );
      })}
    </div>
  );
}

// ─── Section inline editor ────────────────────────────────────────────────────

function SectionEditor({
  initialContent,
  onCommit,
  onCancel,
}: {
  initialContent: string;
  onCommit:       (text: string) => void;
  onCancel:       () => void;
}) {
  const [value, setValue]   = useState(initialContent);
  const textareaRef         = useRef<HTMLTextAreaElement>(null);
  const isDirty             = value.trim() !== initialContent.trim();

  // Auto-resize textarea
  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    resize();
    textareaRef.current?.focus();
    // Place cursor at end
    const len = textareaRef.current?.value.length ?? 0;
    textareaRef.current?.setSelectionRange(len, len);
  }, []);

  return (
    <div className="mb-4">
      {/* Editing indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-medium mb-2">
        <Pencil className="w-2.5 h-2.5" />
        A editar — as alterações são refletidas no PDF
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => { setValue(e.target.value); resize(); }}
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter to save
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            onCommit(value);
          }
          // Escape to cancel
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className={cn(
          "w-full text-sm text-slate-700 leading-relaxed",
          "border border-green-300 rounded-lg p-3",
          "focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent",
          "resize-none overflow-hidden bg-green-50/30",
          "font-[inherit] placeholder-slate-300",
          "transition-colors"
        )}
        placeholder="Escreve aqui o conteúdo desta secção..."
        spellCheck={true}
        lang="pt"
      />

      {/* Editor actions */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-slate-400">
          <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 font-mono text-[9px]">⌘↵</kbd>
          {" "}para guardar · {" "}
          <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 font-mono text-[9px]">Esc</kbd>
          {" "}para cancelar
        </p>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3 h-3" />
            Cancelar
          </button>
          <button
            onClick={() => onCommit(value)}
            disabled={!isDirty}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              isDirty
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-default"
            )}
          >
            <Check className="w-3 h-3" />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── AI badge ─────────────────────────────────────────────────────────────────

function AiBadge({ enhanced }: { enhanced: boolean }) {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setTipOpen(true)}
        onMouseLeave={() => setTipOpen(false)}
        onFocus={() => setTipOpen(true)}
        onBlur={() => setTipOpen(false)}
        className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded-full text-[9px] font-bold uppercase tracking-wide transition-colors"
        aria-label="Esta secção foi melhorada por IA"
      >
        <Sparkles className="w-2.5 h-2.5" />
        IA
      </button>

      {/* Tooltip */}
      {tipOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-10 w-52 bg-slate-900 text-white text-[10px] leading-relaxed rounded-lg px-3 py-2 shadow-xl">
          {enhanced
            ? "Esta secção foi inteiramente reescrita pelo assistente de IA em Português jurídico formal."
            : "Argumentos adicionais sugeridos pela IA foram inseridos nesta secção."
          }
          <div className="absolute -top-1 left-2 w-2 h-2 bg-slate-900 rotate-45" />
        </div>
      )}
    </div>
  );
}

