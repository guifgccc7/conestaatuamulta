// ─── Minuta: Impugnação de Coima por Excesso de Velocidade ───────────────────
// Legal basis: Código da Estrada (CE), RGCO (DL 433/82), CRP

import { WizardFormData, SpeedingData } from "@/types";
import { formatDateLong, normalisePlate } from "@/lib/utils";
import { buildSubmissionSection } from "./shared/submission-section";
import {
  buildSancaoAcessoriaSection,
  buildSancaoAcessoriaPedidoItem,
  hasSancaoAcessoria,
} from "./shared/sancao-acessoria";
import { routeAuthority } from "@/lib/authority/authority-router";

export function generateSpeedingMinuta(data: WizardFormData): string {
  const d = data.violationData as SpeedingData;
  const plate = normalisePlate(data.vehiclePlate);
  const fineDate = data.fineDate ? formatDateLong(data.fineDate) : "[DATA DA AUTO]";

  const routing = routeAuthority(
    data.fineEntity ?? "PSP",
    "SPEEDING",
    {
      name:    data.vehicleOwnerName,
      nif:     data.vehicleOwnerNif,
      address: data.vehicleOwnerAddress,
    },
  );

  const selectedGrounds = data.contestationGrounds
    .filter((g) => g.selected)
    .map((g, i) => buildGroundParagraph(i + 1, g.id, g.label, g.legalBasis, g.freeText, d))
    .join("\n\n");

  const sancaoSection = buildSancaoAcessoriaSection(data, "III");
  const sectionIV = data.additionalNotes ? "IV" : sancaoSection ? "IV" : "III";
  const pedidoLetter = hasSancaoAcessoria(data) ? "d" : "c";

  return `${routing.document_type_label.toUpperCase()}
(${routing.legal_basis})

${routing.opening_template}

IMPUGNAÇÃO JUDICIAL

da decisão condenatória constante do Auto de Contraordenação n.º ${data.fineNumber ?? "[N.º DA AUTO]"}, datado de ${fineDate}, lavrado pela ${data.fineEntity}, que imputa ao/à arguido/a a prática da contraordenação p. e p. pelo artigo 24.º do Código da Estrada (CE), relativa a alegado excesso de velocidade no local identificado como ${data.fineLocation ?? "[LOCAL DA INFRAÇÃO]"}, com base nos seguintes

FUNDAMENTOS DE FACTO E DE DIREITO:

I — IDENTIFICAÇÃO E ENQUADRAMENTO

1. O/A arguido/a é titular/responsável pelo veículo de matrícula ${plate}, nos termos do artigo 162.º, n.º 1 do CE.

2. A velocidade máxima alegadamente registada foi de ${d.allegedSpeed ?? "???"} km/h, num local com limite fixado em ${d.legalLimit ?? "???"} km/h, o que, segundo a autoridade autuante, consubstanciaria uma infração ao disposto no artigo 24.º do CE.

3. O/A arguido/a não se conforma com tal decisão pelos fundamentos que se expõem de seguida, os quais, individualmente ou em conjunto, determinam a absolvição ou, pelo menos, a redução da sanção aplicada.

II — FUNDAMENTOS DA IMPUGNAÇÃO

${selectedGrounds || "2. O/A arguido/a contesta a infração imputada pelos fundamentos adicionais expostos em III."}

${sancaoSection}

${data.additionalNotes ? `${sectionIV} — CONSIDERAÇÕES ADICIONAIS\n\n${data.additionalNotes}` : ""}

V — PEDIDO

Nestes termos e nos demais de direito aplicáveis, requer a V. Ex.ª que se digne:

a) Julgar procedente a presente impugnação e, em consequência, absolver o/a arguido/a da contraordenação que lhe é imputada;

b) Subsidiariamente, caso assim não se entenda, determinar a redução da coima aplicada para o mínimo legal, ponderando a situação económica do/a arguido/a e a ausência de antecedentes contraordenacionais relevantes, nos termos do artigo 18.º do RGCO;
${buildSancaoAcessoriaPedidoItem(data, "c")}
${pedidoLetter}) Condenar a entidade autuante nas custas do processo.

Junta: documentação comprovatória dos fundamentos supra alegados (quando disponível).

${buildSubmissionSection("V")}

[LOCAL], ${formatDateLong(new Date().toISOString())}

O/A Arguido/A,
_______________________________
${data.vehicleOwnerName}
NIF: ${data.vehicleOwnerNif}
Morada: ${data.vehicleOwnerAddress}
`;
}

// ─── Ground paragraph builders ────────────────────────────────────────────────

function buildGroundParagraph(
  idx: number,
  id: string,
  label: string,
  legalBasis: string,
  freeText: string | undefined,
  d: SpeedingData
): string {
  const paragraphs: Record<string, string> = {
    speed_no_calibration: `${idx}. FALTA DE CERTIFICADO DE CALIBRAÇÃO/VERIFICAÇÃO DO EQUIPAMENTO DE MEDIÇÃO

Nos termos do Decreto-Lei n.º 291/90, de 20 de setembro, e da Portaria n.º 1504/2008, de 22 de dezembro, os equipamentos de medição de velocidade estão sujeitos a verificação metrológica periódica obrigatória, a efetuar pelo Instituto Português da Qualidade (IPQ/IPAC).

O auto de contraordenação não especifica o número de série, modelo, marca ou data da última verificação periódica do ${d.measurementDevice ?? "equipamento de medição"} utilizado. A ausência desta informação impede o arguido de aferir da validade e conformidade do equipamento, violando o direito ao contraditório e à ampla defesa (artigo 32.º, n.º 1 da CRP).

Refere o Tribunal da Relação do Porto, no acórdão de 14/11/2018 (proc. n.º 1028/17.7T8PNF.P1), que a falta de indicação dos dados de identificação e calibração do aparelho de medição de velocidade implica a nulidade da prova produzida por esse meio.

Assim, sem prova da calibração válida do equipamento, não pode o/a arguido/a ser condenado/a com base em tal medição (${legalBasis}).`,

    speed_no_evidence: `${idx}. FALTA DE PROVA DO EXCESSO DE VELOCIDADE

Não consta do auto qualquer elemento fotográfico, de vídeo ou de outro suporte documental que comprove a velocidade alegadamente registada de ${d.allegedSpeed ?? "???"} km/h.

A mera afirmação do agente autuante, desacompanhada de qualquer registo objectivo, é insuficiente para alicerçar uma condenação em processo de contraordenação. O princípio in dubio pro reo, consagrado no artigo 32.º, n.º 2 da Constituição da República Portuguesa (CRP), impõe que, na dúvida, se decida a favor do arguido.

Acresce que o artigo 170.º, n.º 1 do CE determina que a responsabilidade do condutor deve ser provada pela entidade fiscalizadora, não podendo a mesma presumir-se (${legalBasis}).`,

    speed_no_signage: `${idx}. AUSÊNCIA OU ILEGIBILIDADE DE SINALIZAÇÃO DO LIMITE DE VELOCIDADE

O/A arguido/a contesta que no local identificado — ${d.measurementDevice ? `zona de fiscalização com ${d.measurementDevice}` : "local da infração"} — existisse sinalização vertical ou horizontal claramente visível e legível impondo o limite de ${d.legalLimit ?? "???"} km/h.

Nos termos dos artigos 13.º, n.º 1 e 88.º do Código da Estrada, os limites de velocidade especiais devem ser sinalizados de forma inequívoca. A inexistência ou deficiência de sinalização obsta à imputação da infração ao condutor, porquanto este não tinha como conhecer o limite em vigor naquele local.

(${legalBasis})`,

    speed_margin_error: `${idx}. NÃO DEDUÇÃO DA MARGEM DE ERRO LEGAL DO EQUIPAMENTO

A Portaria n.º 1504/2008 e o Regulamento de Metrologia Legal estabelecem que, na medição de velocidades, deve ser deduzida uma margem de tolerância ao valor registado pelo equipamento antes de apurar a velocidade real do veículo.

A velocidade inscrita no auto (${d.allegedSpeed ?? "???"} km/h) corresponde ao valor bruto medido, não se verificando a dedução da margem de erro prevista na lei. Deduzida a margem aplicável ao equipamento em causa, a velocidade corrigida poderá situar-se dentro do limite legal ou num escalão de infração diferente e menos grave.

(${legalBasis})`,

    speed_wrong_category: `${idx}. CATEGORIZAÇÃO INCORRETA DA INFRAÇÃO

Mesmo admitindo, por mera hipótese académica, que ocorreu algum excesso de velocidade, o diferencial entre a velocidade alegada (${d.allegedSpeed ?? "???"} km/h) e o limite legal (${d.legalLimit ?? "???"} km/h) não justifica a categorização efectuada, a qual não corresponde ao escalão previsto no artigo 24.º, n.º 1 do CE para o suposto excesso apurado.

(${legalBasis})`,

    prescription: `${idx}. PRESCRIÇÃO DO PROCEDIMENTO CONTRAORDENACIONAL

Nos termos do artigo 27.º do RGCO, o procedimento contraordenacional extingue-se por prescrição logo que sobre a data da prática do facto tenham decorrido os prazos previstos na lei, sem que tenha sido proferida decisão condenatória com trânsito em julgado.

O prazo de prescrição para contraordenações desta natureza é de ${d.allegedSpeed && d.legalLimit && (d.allegedSpeed - d.legalLimit) > 40 ? "3 anos" : "2 anos"}, devendo contar-se desde a data da infração (${d ? freeText ?? "" : ""}).

(${legalBasis})`,

    notification_defect: `${idx}. NULIDADE/IRREGULARIDADE DA NOTIFICAÇÃO

A notificação recebida pelo/a arguido/a não cumpre os requisitos formais exigidos pelo artigo 79.º do RGCO, nomeadamente no que respeita à indicação do prazo e modo de exercício do direito de audiência prévia.

A violação dos requisitos formais de notificação determina a nulidade do ato notificatório e, consequentemente, a impossibilidade de cômputo de qualquer prazo processual em desfavor do/a arguido/a.

(${legalBasis})`,

    wrong_plate: `${idx}. IDENTIFICAÇÃO INCORRETA DA MATRÍCULA

A matrícula indicada no auto de contraordenação não corresponde à matrícula real do veículo de que o/a arguido/a é titular, conforme resulta dos documentos do veículo que ora se juntam.

Este erro material na identificação do veículo — elemento essencial do tipo contraordenacional — constitui nulidade insanável, nos termos do artigo 58.º, al. b) do RGCO, impondo a absolvição do/a arguido/a.

(${legalBasis})`,

    in_dubio: `${idx}. PRINCÍPIO IN DUBIO PRO REO

Perante a insuficiência e fragilidade da prova produzida pela entidade autuante, subsiste fundada dúvida sobre a prática da infração imputada e sobre a sua imputação ao/à arguido/a.

O princípio in dubio pro reo, corolário do princípio da presunção de inocência consagrado no artigo 32.º, n.º 2 da CRP, e reafirmado pelo artigo 50.º do RGCO, impõe que a dúvida seja sempre resolvida em favor do/a arguido/a, o que conduz necessariamente à sua absolvição.

(${legalBasis})`,

    ne_bis_in_idem: `${idx}. PRINCÍPIO NE BIS IN IDEM — DUPLA PUNIÇÃO

O/A arguido/a já foi punido/a pelos mesmos factos em procedimento anterior, pelo que a presente condenação viola o princípio ne bis in idem consagrado no artigo 29.º, n.º 5 da CRP.

(${legalBasis})`,

    estado_necessidade: `${idx}. ESTADO DE NECESSIDADE DESCULPANTE — EXCLUSÃO DA CULPA

Nos termos do artigo 35.º do Código Penal, aplicável ex vi do artigo 32.º do RGCO, age sem culpa quem praticar um facto ilícito adequado a afastar um perigo atual que ameace interesses juridicamente protegidos do agente ou de terceiro, quando lhe não seja razoavelmente exigível, segundo as circunstâncias do caso, comportamento diferente.

O estado de necessidade desculpante não exclui a ilicitude do facto, mas exclui a culpa do agente. Na ausência de culpa não pode haver responsabilidade contraordenacional, porquanto a culpa é elemento constitutivo da contraordenação nos termos do artigo 8.º do RGCO.

No caso em apreço, o/a arguido/a encontrava-se perante a seguinte situação de emergência: ${freeText ?? "situação de urgência que tornou inexigível comportamento alternativo"}. Perante tais circunstâncias, a conduta adotada foi a única razoavelmente possível, não lhe sendo exigível agir de outro modo.

Acresce que o/a arguido/a não colocou em perigo a circulação nem a segurança dos demais utentes da via pública. Verificados os pressupostos — perigo atual, inexigibilidade de comportamento diferente e ausência de perigo para a circulação e para a vida dos demais condutores —, o/a arguido/a atuou sem culpa e deve ser absolvido/a.

(${legalBasis})`,

    outro_defect: `${idx}. IRREGULARIDADE IDENTIFICADA NO AUTO OU NA NOTIFICAÇÃO

O/A arguido/a detetou a seguinte irregularidade no auto ou na notificação recebida: "${freeText ?? "irregularidade a descrever oportunamente"}".

Tal irregularidade constitui vício do auto, porquanto os elementos essenciais que o mesmo deve conter, nos termos do artigo 58.º do RGCO, encontram-se incorretos ou incompletos, invalidando o ato e determinando a absolvição do/a arguido/a.

(${legalBasis})`,

    sancao_acessoria: `${idx}. CONTESTAÇÃO DA SANÇÃO ACESSÓRIA${freeText ? ` DE ${freeText.toUpperCase()}` : ""}

Para além da coima, a autoridade autuante imputa ao/à arguido/a ${freeText ? `a sanção acessória de ${freeText}` : "uma sanção acessória"}.

O/A arguido/a impugna expressamente esta sanção, pois: (i) as sanções acessórias têm carácter excecional e exigem verificação autónoma dos seus pressupostos; (ii) os pressupostos legais não estão suficientemente demonstrados; (iii) a sua aplicação sem fundamentação adequada viola o princípio da proporcionalidade (art. 18.º, n.º 2 da CRP).

Requer-se que a sanção acessória seja declarada improcedente.

(${legalBasis})`,
  };

  const built = paragraphs[id];
  if (built) return built;

  // Fallback for unknown ground id
  return `${idx}. ${label.toUpperCase()}\n\n${freeText ?? "O/A arguido/a contesta com base no seguinte fundamento: " + label}\n\n(${legalBasis})`;
}
