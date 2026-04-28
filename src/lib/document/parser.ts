/**
 * Document parser — splits a legal contestation text into structured sections
 * so the editor can render, annotate, and allow per-section editing.
 *
 * The section headings are anchored to what the template generators produce.
 * Unknown blocks between headings are captured as a catch-all "header" section.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SectionId =
  | "header"
  | "section_i"
  | "section_ii"
  | "section_iii"
  | "section_iv"
  | "signature"
  | "disclaimer"
  | "unknown";

export interface DocSection {
  id:           SectionId;
  /** Raw heading text, e.g. "II — FUNDAMENTOS DA IMPUGNAÇÃO" */
  heading:      string;
  /** Body text (everything after the heading until the next heading) */
  content:      string;
  /** Display label for the UI */
  label:        string;
  /** Whether this section can be inline-edited */
  editable:     boolean;
  /**
   * Whether the content was AI-generated/enhanced.
   * Set by the caller based on AiOutput metadata.
   */
  aiEnhanced:   boolean;
  /** Hint shown in the editor toolbar for this section */
  hint?:        string;
}

// ─── Section definitions ──────────────────────────────────────────────────────

const SECTION_DEFS: Array<{
  id:       SectionId;
  pattern:  RegExp;
  label:    string;
  editable: boolean;
  hint?:    string;
}> = [
  {
    id:       "section_i",
    pattern:  /^I\s*[—–-]\s*IDENTIFICA[ÇC][ÃA]O\s+E\s+ENQUADRAMENTO/im,
    label:    "I — Identificação e enquadramento",
    editable: false,
    hint:     "Esta secção é preenchida automaticamente com os teus dados.",
  },
  {
    id:       "section_ii",
    pattern:  /^II\s*[—–-]\s*FUNDAMENTOS DA IMPUGNA[ÇC][ÃA]O/im,
    label:    "II — Fundamentos da impugnação",
    editable: true,
    hint:     "Podes editar os argumentos jurídicos. As alterações são refletidas no PDF final.",
  },
  {
    id:       "section_iii",
    pattern:  /^III\s*[—–-]\s*CONSIDERA[ÇC][ÕO]ES ADICIONAIS/im,
    label:    "III — Considerações adicionais",
    editable: true,
    hint:     "Adiciona informação extra que consideres relevante para o teu caso.",
  },
  {
    id:       "section_iv",
    pattern:  /^IV\s*[—–-]\s*PEDIDO/im,
    label:    "IV — Pedido",
    editable: false,
    hint:     "Formulação legal padrão — não editável para garantir validade jurídica.",
  },
  {
    id:       "signature",
    pattern:  /^O\/A Arguido\/A,/im,
    label:    "Assinatura",
    editable: false,
  },
  {
    id:       "disclaimer",
    pattern:  /^NOTA INFORMATIVA\s*[—–-]\s*GERA[ÇC][ÃA]O AUTOM[ÀA]TICA/im,
    label:    "Nota informativa",
    editable: false,
  },
];

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseDocument(text: string): DocSection[] {
  const sections: DocSection[] = [];

  // Find all section start positions
  const hits: Array<{ defIdx: number; matchIdx: number; heading: string }> = [];

  for (let d = 0; d < SECTION_DEFS.length; d++) {
    const def   = SECTION_DEFS[d];
    const match = def.pattern.exec(text);
    if (match) {
      hits.push({ defIdx: d, matchIdx: match.index, heading: match[0].trim() });
    }
  }

  // Sort by position in document
  hits.sort((a, b) => a.matchIdx - b.matchIdx);

  // Capture everything before the first section as the "header" block
  if (hits.length > 0 && hits[0].matchIdx > 0) {
    sections.push({
      id:         "header",
      heading:    "",
      content:    text.slice(0, hits[0].matchIdx).trim(),
      label:      "Cabeçalho e destinatário",
      editable:   false,
      aiEnhanced: false,
      hint:       "Identifica a entidade autuante e o tipo de impugnação.",
    });
  }

  // Slice each section's content from its start to the next section's start
  for (let i = 0; i < hits.length; i++) {
    const hit      = hits[i];
    const def      = SECTION_DEFS[hit.defIdx];
    const start    = hit.matchIdx;
    const end      = i + 1 < hits.length ? hits[i + 1].matchIdx : text.length;
    const raw      = text.slice(start, end).trim();

    // Separate heading line from body
    const nlIdx   = raw.indexOf("\n");
    const heading = nlIdx !== -1 ? raw.slice(0, nlIdx).trim() : raw;
    const content = nlIdx !== -1 ? raw.slice(nlIdx + 1).trim() : "";

    sections.push({
      id:         def.id,
      heading,
      content,
      label:      def.label,
      editable:   def.editable,
      aiEnhanced: false, // set by caller
      hint:       def.hint,
    });
  }

  // If no sections were found, return the whole document as a single editable block
  if (sections.length === 0) {
    sections.push({
      id:         "unknown",
      heading:    "",
      content:    text.trim(),
      label:      "Documento",
      editable:   true,
      aiEnhanced: false,
    });
  }

  return sections;
}

// ─── Serialiser ───────────────────────────────────────────────────────────────

/**
 * Reconstruct a flat document string from (potentially edited) sections.
 * Preserves original heading text; replaces body with edited content where changed.
 */
export function serialiseDocument(sections: DocSection[]): string {
  return sections
    .map((s) => {
      if (s.id === "header") return s.content;
      if (!s.heading)        return s.content;
      return s.heading + (s.content ? "\n\n" + s.content : "");
    })
    .join("\n\n");
}

// ─── Word / character counters ────────────────────────────────────────────────

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function countChars(text: string): number {
  return text.length;
}
