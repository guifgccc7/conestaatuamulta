// ─── Shared: Sanção Acessória section builder ─────────────────────────────────
// Used by all template generators to inject an explicit contestation of any
// accessory sanction (inibição de conduzir, apreensão de carta, etc.).
// If the sanção_acessoria ground is not selected, all helpers return "".

import { WizardFormData } from "@/types";

/** True when the user selected the sancao_acessoria defense ground. */
export function hasSancaoAcessoria(data: WizardFormData): boolean {
  return data.contestationGrounds.some(
    (g) => g.id === "sancao_acessoria" && g.selected,
  );
}

/** Returns a human-readable description of the accessory sanction. */
function getSancaoDesc(data: WizardFormData): string {
  const ground = data.contestationGrounds.find(
    (g) => g.id === "sancao_acessoria" && g.selected,
  );
  return ground?.freeText?.trim()
    ? `sanção acessória de ${ground.freeText.trim()}`
    : "sanção acessória";
}

/**
 * Returns a full section block contesting the accessory sanction,
 * or an empty string if no accessory sanction was reported.
 *
 * @param data      - assembled WizardFormData
 * @param sectionNum - e.g. "III" or "IV"
 */
export function buildSancaoAcessoriaSection(
  data: WizardFormData,
  sectionNum: string,
): string {
  if (!hasSancaoAcessoria(data)) return "";

  const desc = getSancaoDesc(data);

  return `${sectionNum} — CONTESTAÇÃO DA SANÇÃO ACESSÓRIA

Para além da coima principal, a notificação imputa ao/à arguido/a a ${desc}.

O/A arguido/a impugna expressamente esta sanção acessória com fundamento em:

a) As sanções acessórias revestem carácter excecional e exigem verificação autónoma e rigorosa dos respetivos pressupostos, com respeito pelo princípio da proporcionalidade (art. 18.º, n.º 2 da CRP);

b) Os pressupostos legais que justificariam a aplicação da sanção acessória não estão suficientemente demonstrados no auto, não podendo os mesmos presumir-se em desfavor do/a arguido/a;

c) A aplicação cumulativa de coima e sanção acessória, sem verificação rigorosa dos pressupostos e sem fundamentação bastante, viola os princípios da necessidade, adequação e proporcionalidade das sanções (art. 18.º do RGCO e art. 18.º, n.º 2 da CRP).

Requer-se, assim, que a ${desc} seja expressamente apreciada e declarada improcedente, sendo o/a arguido/a absolvido/a também quanto a esta sanção.

(Arts. 21.º e 22.º do RGCO; Arts. 148.º e 69.º do CE, quando aplicável)`;
}

/**
 * Returns a PEDIDO line item for the accessory sanction, or "".
 * Include after the main absolvição request and before the costs item.
 *
 * @param data   - assembled WizardFormData
 * @param letter - e.g. "c" or "d"
 */
export function buildSancaoAcessoriaPedidoItem(
  data: WizardFormData,
  letter: string,
): string {
  if (!hasSancaoAcessoria(data)) return "";
  const desc = getSancaoDesc(data);
  return `\n${letter}) Declarar não aplicável a ${desc} imputada ao/à arguido/a, por falta de fundamento legal bastante e/ou violação do princípio da proporcionalidade (arts. 21.º e 22.º do RGCO; art. 18.º, n.º 2 da CRP);\n`;
}
