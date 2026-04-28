/**
 * generator.tsx — Professional legal document PDF renderer
 *
 * Typography:
 *   Times-Roman 11 pt / Times-Bold / Times-Italic   (built-in PDF standard fonts —
 *   no network calls, zero registration overhead, works in every PDF viewer)
 *
 * Layout — A4 (595 × 842 pt):
 *   Left   85 pt  (3.0 cm) — wider left creates visual weight & margin for notes
 *   Right  70 pt  (2.5 cm)
 *   Top    72 pt  (2.54 cm)
 *   Bottom 60 pt  (2.1 cm)
 *
 * Section pipeline:
 *   raw content string
 *     └─► parseDocument()             → DocSection[]
 *           ├─► renderOpeningSection() → header block (recipient + doc title)
 *           ├─► renderBodySection()    → sections I – IV
 *           ├─► renderSignatureSection()
 *           └─► renderDisclaimerSection()
 *
 * Paragraph detection (within sections):
 *   Roman numeral heading   → centered bold heading + hairline rule
 *   Numbered ground title   → "1. TITLE IN CAPS" → Times-Bold, no indent
 *   Body paragraph          → justified, 26 pt first-line indent
 *   First para after heading → justified, no indent
 *   Lettered list  a) b) c) → hanging indent left-aligned
 *   Legal citation (…)      → Times-Italic, 10 pt, inset
 *   "Junta:" note           → Times-Italic, 10 pt
 *   Date / location line    → flush right
 *   Separator ---           → hairline rule
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { WizardFormData } from "@/types";
import { formatDateLong } from "@/lib/utils";
import { parseDocument, type DocSection } from "@/lib/document/parser";

// ─────────────────────────────────────────────────────────────────────────────
// STYLE SHEET
// All measurements in pt.  A4 = 595.28 × 841.89 pt.
// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({

  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    fontFamily:    "Times-Roman",
    fontSize:      11,
    lineHeight:    1.6,
    color:         "#000000",
    paddingTop:    72,
    paddingBottom: 60,
    paddingLeft:   85,
    paddingRight:  70,
  },

  // ── Fixed footer (page number, all pages) ────────────────────────────────
  footer: {
    position:  "absolute",
    bottom:    26,
    left:      0,
    right:     0,
    textAlign: "center",
    fontSize:  9,
    color:     "#999999",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OPENING / HEADER SECTION
  // ─────────────────────────────────────────────────────────────────────────

  // Thin rule that anchors the opening block to the top of the page
  openingTopRule: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    marginBottom:      22,
  },

  // "IMPUGNAÇÃO JUDICIAL" / "DEFESA ADMINISTRATIVA"
  docTypeLabel: {
    fontFamily:    "Times-Bold",
    fontSize:      13,
    textAlign:     "center",
    letterSpacing: 0.6,
    marginBottom:  5,
  },

  // "(Art. 170.º, n.º 1, do CE e arts. 59.º e 72.º-A do RGCO)"
  legalBasisLine: {
    fontFamily:   "Times-Italic",
    fontSize:     9.5,
    textAlign:    "center",
    color:        "#444444",
    marginBottom: 26,
  },

  // Recipient address block — flush left, like a formal letter
  recipientBlock: {
    marginBottom: 26,
  },
  recipientLine: {
    marginBottom: 2,
    lineHeight:   1.35,
  },

  // "IMPUGNAÇÃO JUDICIAL" sub-title line (after recipient)
  openingSubTitle: {
    fontFamily:    "Times-Bold",
    fontSize:      11.5,
    textAlign:     "center",
    letterSpacing: 0.3,
    marginTop:     18,
    marginBottom:  10,
  },

  // "FUNDAMENTOS DE FACTO E DE DIREITO:" bridge line
  openingBridge: {
    fontFamily:    "Times-Bold",
    fontSize:      11,
    textAlign:     "center",
    letterSpacing: 0.2,
    marginTop:     12,
    marginBottom:  8,
  },

  // Introductory paragraph ("da decisão condenatória constante do Auto…")
  openingIntro: {
    textAlign:    "justify",
    marginBottom: 8,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SECTION HEADINGS  (I —, II —, III —, IV —, V —)
  // ─────────────────────────────────────────────────────────────────────────

  sectionHeadingWrap: {
    marginTop:    22,
    marginBottom: 12,
  },

  sectionHeading: {
    fontFamily:    "Times-Bold",
    fontSize:      11,
    textAlign:     "center",
    letterSpacing: 0.4,
  },

  // Short decorative hairline centred beneath each section heading
  sectionHairline: {
    borderBottomWidth: 0.4,
    borderBottomColor: "#666666",
    marginTop:         5,
    width:             72,
    alignSelf:         "center",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // BODY PARAGRAPHS
  // ─────────────────────────────────────────────────────────────────────────

  // Standard paragraph — justified, 26 pt first-line indent
  para: {
    textAlign:    "justify",
    marginBottom: 8,
    textIndent:   26,
  },

  // First paragraph after a section heading — no indent (typographic convention)
  paraFirst: {
    textAlign:    "justify",
    marginBottom: 8,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // NUMBERED GROUNDS  (1. TITLE IN CAPS  /  body text)
  // ─────────────────────────────────────────────────────────────────────────

  groundWrap: {
    marginTop: 10,
  },

  // "1. FALTA DE CERTIFICADO DE CALIBRAÇÃO…"
  groundTitle: {
    fontFamily:   "Times-Bold",
    fontSize:     11,
    marginBottom: 5,
    lineHeight:   1.4,
  },

  // Body text directly after the ground title
  groundBody: {
    textAlign:    "justify",
    marginBottom: 8,
    lineHeight:   1.6,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SPECIAL PARAGRAPH TYPES
  // ─────────────────────────────────────────────────────────────────────────

  // Lettered list: "a) Julgar procedente…"
  listAlpha: {
    textAlign:    "justify",
    marginBottom: 6,
    marginLeft:   22,
  },

  // Legal citation in parentheses: "(Art. 32.º, n.º 2, da CRP)"
  citation: {
    fontFamily:   "Times-Italic",
    fontSize:     10,
    color:        "#333333",
    marginBottom: 6,
    marginLeft:   24,
    textAlign:    "justify",
  },

  // "Junta: documentação comprovatória…"
  note: {
    fontFamily:   "Times-Italic",
    fontSize:     10,
    color:        "#333333",
    marginTop:    6,
    marginBottom: 6,
  },

  // Horizontal separator ("---" in source)
  separator: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#bbbbbb",
    marginTop:         14,
    marginBottom:      12,
  },

  // Date / location line — flush right
  dateLine: {
    textAlign:    "right",
    marginTop:    20,
    marginBottom: 4,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SIGNATURE BLOCK
  // ─────────────────────────────────────────────────────────────────────────

  signatureWrap: {
    marginTop: 6,
  },

  // "O/A Arguido/A,"
  signatureGreeting: {
    marginBottom: 4,
  },

  // Signature underline
  signatureLine: {
    marginTop:      28,
    marginBottom:   5,
    borderTopWidth: 0.5,
    borderTopColor: "#555555",
    width:          180,
  },

  signatureName: {
    fontFamily:   "Times-Bold",
    marginBottom: 2,
  },

  signatureDetail: {
    fontSize:     10,
    marginBottom: 2,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DISCLAIMER  (small print — Nota Informativa)
  // ─────────────────────────────────────────────────────────────────────────

  disclaimerWrap: {
    marginTop:  18,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#cccccc",
  },

  disclaimerText: {
    fontSize:     8.5,
    color:        "#666666",
    lineHeight:   1.4,
    marginBottom: 3,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// PARAGRAPH TYPE DETECTION
// ─────────────────────────────────────────────────────────────────────────────

const RE_ROMAN_HEADING   = /^(I{1,3}V?|IV|VI{0,3}|IX|X)\s*[—–-]\s+/;
const RE_GROUND_NUM      = /^(\d+)\.\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇÜ])/;
const RE_LIST_ALPHA      = /^[a-f]\)\s/;
const RE_CITATION_PARENS = /^\([\s\S]*\)$/;
const RE_SEPARATOR       = /^-{3,}$/;
const RE_JUNTA           = /^Junta:/i;
const RE_DATE_LOCAL      = /^\[LOCAL\]|^[A-Za-zÀ-ÿ\s]+,\s+\d{1,2}\s+de\s+/;
const RE_SIG_UNDERSCORE  = /^_{5,}/;
const RE_SIG_GREETING    = /^O\/A Arguido\/A,?$/i;
const RE_NIF_LINE        = /^NIF:/i;
const RE_MORADA_LINE     = /^Morada:/i;

/** True if a string is substantially ALL-CAPS (tolerate digits, punctuation). */
function isAllCaps(s: string): boolean {
  const letters = s.replace(/[^a-záéíóúâêôãõçüà-ÿA-ZÁÉÍÓÚÂÊÔÃÕÇÜ]/g, "");
  return letters.length > 0 && letters === letters.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAGRAPH RENDERER
// Classifies a single \n\n-delimited block and returns the right element.
// ─────────────────────────────────────────────────────────────────────────────

function renderParagraph(
  rawBlock: string,
  key:      string | number,
  isFirst:  boolean = false,
): React.ReactElement | null {
  const t = rawBlock.trim();
  if (!t) return null;

  // ── Separator line ─────────────────────────────────────────────────────────
  if (RE_SEPARATOR.test(t)) {
    return <View key={key} style={S.separator} />;
  }

  // ── Legal citation in parentheses ──────────────────────────────────────────
  if (RE_CITATION_PARENS.test(t)) {
    return <Text key={key} style={S.citation}>{t}</Text>;
  }

  // ── Lettered list item: "a) ...", "b) ..." ─────────────────────────────────
  if (RE_LIST_ALPHA.test(t)) {
    return <Text key={key} style={S.listAlpha}>{t}</Text>;
  }

  // ── "Junta: ..." note ──────────────────────────────────────────────────────
  if (RE_JUNTA.test(t)) {
    return <Text key={key} style={S.note}>{t}</Text>;
  }

  // ── Date / location line ───────────────────────────────────────────────────
  if (RE_DATE_LOCAL.test(t)) {
    return <Text key={key} style={S.dateLine}>{t}</Text>;
  }

  // ── Roman numeral heading (V — FORMA DE ENVIO, etc.) ─────────────────────
  // Only matches headings not already captured by parseDocument as named sections.
  if (RE_ROMAN_HEADING.test(t) && t.length < 90) {
    return (
      <View key={key} style={S.sectionHeadingWrap}>
        <Text style={S.sectionHeading}>{t}</Text>
        <View style={S.sectionHairline} />
      </View>
    );
  }

  // ── Numbered ground: "1. TITLE IN CAPS" ───────────────────────────────────
  // The title and body may arrive as:
  //   a) A single block with "\n" separating title from body
  //   b) Just the title line (body comes as subsequent blocks)
  if (RE_GROUND_NUM.test(t)) {
    const firstNL  = t.indexOf("\n");
    const titleLine = firstNL !== -1 ? t.slice(0, firstNL).trim() : t;
    const remainder = firstNL !== -1 ? t.slice(firstNL + 1).trim()  : "";

    const bareTitle = titleLine.replace(/^\d+\.\s+/, "").replace(/\(.*?\)/g, "").trim();

    if (isAllCaps(bareTitle) && bareTitle.length > 4) {
      return (
        <View key={key} style={S.groundWrap}>
          <Text style={S.groundTitle}>{titleLine}</Text>
          {remainder
            ? remainder.split("\n\n").map((bp, bi) => (
                <Text key={bi} style={S.groundBody}>{bp.trim()}</Text>
              ))
            : null}
        </View>
      );
    }
  }

  // ── Default: body paragraph ────────────────────────────────────────────────
  return (
    <Text key={key} style={isFirst ? S.paraFirst : S.para}>
      {t}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OPENING / HEADER SECTION RENDERER
//
// The "header" DocSection contains everything from the document start to the
// first roman-numeral section heading.  Its content is roughly:
//
//   IMPUGNAÇÃO JUDICIAL                ← doc type label (all-caps, line 1)
//   (Art. 170.º do CE…)               ← legal basis (in parens, line 2)
//
//   Exmo./Exma. Sr./Sra. Diretor(a)…  ← recipient address (multi-line block)
//
//   IMPUGNAÇÃO JUDICIAL                ← sub-title (all-caps, single-line block)
//
//   da decisão condenatória…           ← intro text
//
//   FUNDAMENTOS DE FACTO E DE DIREITO: ← bridge heading (all-caps)
//
// ─────────────────────────────────────────────────────────────────────────────

function renderOpeningSection(section: DocSection): React.ReactElement {
  const blocks  = section.content.split("\n\n").map((b) => b.trim()).filter(Boolean);
  const elems:   React.ReactElement[] = [];

  let i = 0;

  // ── Block 0: doc type label [+ legal basis on next line] ──────────────────
  if (i < blocks.length) {
    const lines = blocks[i].split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length >= 1 && isAllCaps(lines[0]) && lines[0].length > 4) {
      elems.push(<View  key="top-rule"  style={S.openingTopRule} />);
      elems.push(<Text  key="doc-type"  style={S.docTypeLabel}>{lines[0]}</Text>);

      // Legal basis may be on the same block (line 1) or in next block
      if (lines.length >= 2 && lines[1].startsWith("(")) {
        elems.push(<Text key="legal-basis-inline" style={S.legalBasisLine}>{lines[1]}</Text>);
      } else if (i + 1 < blocks.length && blocks[i + 1].startsWith("(") && blocks[i + 1].endsWith(")")) {
        elems.push(<Text key="legal-basis-next" style={S.legalBasisLine}>{blocks[i + 1]}</Text>);
        i++; // consume the next block
      }
      i++;
    }
  }

  // ── Remaining blocks ───────────────────────────────────────────────────────
  while (i < blocks.length) {
    const block = blocks[i];
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

    // All-caps single line → sub-title or bridge heading
    if (lines.length === 1 && isAllCaps(block) && block.length > 4 && !block.startsWith("(")) {
      if (/FUNDAMENTOS/i.test(block)) {
        elems.push(<Text key={`bridge-${i}`} style={S.openingBridge}>{block}</Text>);
      } else {
        elems.push(<Text key={`subtitle-${i}`} style={S.openingSubTitle}>{block}</Text>);
      }
      i++;
      continue;
    }

    // Multi-line block whose first line is a typical salutation / authority name
    // → render as recipient address block
    const firstLine = lines[0] ?? "";
    const looksLikeRecipient =
      lines.length > 1 &&
      (
        firstLine.includes("Exmo")    ||
        firstLine.includes("Exmo.")   ||
        firstLine.includes("Sr./Sra") ||
        firstLine.includes("ANSR")    ||
        firstLine.includes("EMEL")    ||
        firstLine.includes("SMTUC")   ||
        firstLine.includes("Câmara")  ||
        firstLine.includes("Tribunal")||
        firstLine.includes("PSP")     ||
        firstLine.includes("GNR")     ||
        firstLine.includes("IMT")     ||
        firstLine.endsWith(",")
      );

    if (looksLikeRecipient) {
      elems.push(
        <View key={`rec-${i}`} style={S.recipientBlock}>
          {lines.map((line, li) => (
            <Text key={li} style={S.recipientLine}>{line}</Text>
          ))}
        </View>,
      );
      i++;
      continue;
    }

    // Everything else: introductory text
    elems.push(<Text key={`intro-${i}`} style={S.openingIntro}>{block}</Text>);
    i++;
  }

  return <View key="opening">{elems}</View>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BODY SECTION RENDERER  (sections I – IV, submission section V)
// ─────────────────────────────────────────────────────────────────────────────

function renderBodySection(section: DocSection): React.ReactElement {
  const blocks       = section.content.split("\n\n").map((b) => b.trim()).filter(Boolean);
  const headingLabel = section.heading.trim();

  return (
    <View key={section.id}>
      {/* Section heading */}
      {headingLabel && (
        <View style={S.sectionHeadingWrap}>
          <Text style={S.sectionHeading}>{headingLabel}</Text>
          <View style={S.sectionHairline} />
        </View>
      )}

      {/* Section body */}
      {blocks.map((b, bi) => renderParagraph(b, bi, bi === 0))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE SECTION RENDERER
// ─────────────────────────────────────────────────────────────────────────────

function renderSignatureSection(section: DocSection): React.ReactElement {
  // Merge heading + content, then flatten to individual lines
  const fullText = [section.heading, section.content].filter(Boolean).join("\n");
  const allLines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <View key="signature" style={S.signatureWrap}>
      {allLines.map((line, i) => {
        if (RE_SIG_GREETING.test(line)) {
          return <Text key={i} style={S.signatureGreeting}>{line}</Text>;
        }
        if (RE_SIG_UNDERSCORE.test(line)) {
          return <View key={i} style={S.signatureLine} />;
        }
        if (RE_DATE_LOCAL.test(line)) {
          return <Text key={i} style={S.dateLine}>{line}</Text>;
        }
        if (RE_NIF_LINE.test(line) || RE_MORADA_LINE.test(line)) {
          return <Text key={i} style={S.signatureDetail}>{line}</Text>;
        }
        // Name line (everything else after the underscore)
        return <Text key={i} style={S.signatureName}>{line}</Text>;
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCLAIMER SECTION RENDERER  (Nota Informativa — small print)
// ─────────────────────────────────────────────────────────────────────────────

function renderDisclaimerSection(section: DocSection): React.ReactElement {
  const fullText = [section.heading, section.content].filter(Boolean).join("\n\n");
  const blocks   = fullText.split("\n\n").map((b) => b.trim()).filter(Boolean);

  return (
    <View key="disclaimer" style={S.disclaimerWrap}>
      {blocks.map((b, bi) => (
        <Text key={bi} style={S.disclaimerText}>{b}</Text>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

interface PdfDocumentProps {
  content:    string;
  data:       WizardFormData;
  documentId: string;
}

export function MinutaPdfDocument({ content, data, documentId }: PdfDocumentProps) {
  const sections = parseDocument(content);

  return (
    <Document
      title={`Impugnação — ${data.vehiclePlate} — ${data.fineNumber ?? "Auto"}`}
      author={data.vehicleOwnerName}
      subject="Impugnação de Coima — contestaatuamulta.pt"
      creator="contestaatuamulta.pt"
      producer="contestaatuamulta.pt"
    >
      <Page size="A4" style={S.page}>

        {/* Fixed footer: page number, hidden on single-page documents */}
        <Text
          style={S.footer}
          render={({ pageNumber, totalPages }) =>
            totalPages > 1 ? `${pageNumber} / ${totalPages}` : ""
          }
          fixed
        />

        {/* Render each section with its specific treatment */}
        {sections.map((section) => {
          switch (section.id) {
            case "header":
              return renderOpeningSection(section);

            case "signature":
              return renderSignatureSection(section);

            case "disclaimer":
              return renderDisclaimerSection(section);

            // section_i, section_ii, section_iii, section_iv, unknown
            default:
              return renderBodySection(section);
          }
        })}

      </Page>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePdfBuffer(
  content:    string,
  data:       WizardFormData,
  documentId: string,
): Promise<Buffer> {
  const element = React.createElement(
    MinutaPdfDocument,
    { content, data, documentId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  const buffer = await renderToBuffer(element);
  return Buffer.from(buffer);
}
