// ─── Minuta: Impugnação de Coima por Estacionamento Proibido ─────────────────

import { WizardFormData, ParkingData } from "@/types";
import { formatDateLong, normalisePlate } from "@/lib/utils";
import { buildSubmissionSection } from "./shared/submission-section";
import {
  buildSancaoAcessoriaSection,
  buildSancaoAcessoriaPedidoItem,
  hasSancaoAcessoria,
} from "./shared/sancao-acessoria";
import { routeAuthority } from "@/lib/authority/authority-router";

export function generateParkingMinuta(data: WizardFormData): string {
  const d = data.violationData as ParkingData;
  const plate = normalisePlate(data.vehiclePlate);
  const fineDate = data.fineDate ? formatDateLong(data.fineDate) : "[DATA DA AUTO]";

  // Use the specific parking entity when available (EMEL, SMTUC, etc.)
  const entityForRouting =
    d.parkingEntity && d.parkingEntity !== "OTHER"
      ? d.parkingEntity
      : (data.fineEntity ?? "Câmara Municipal");

  const routing = routeAuthority(
    entityForRouting,
    "PARKING",
    {
      name:    data.vehicleOwnerName,
      nif:     data.vehicleOwnerNif,
      address: data.vehicleOwnerAddress,
    },
  );

  const entityLine = routing.authority ?? entityForRouting;

  const selectedGrounds = data.contestationGrounds
    .filter((g) => g.selected)
    .map((g, i) => buildParkingGround(i + 1, g.id, g.label, g.legalBasis, g.freeText, d))
    .join("\n\n");

  const sancaoSection = buildSancaoAcessoriaSection(data, "III");
  const pedidoLetter = hasSancaoAcessoria(data) ? "d" : "c";

  return `${routing.document_type_label.toUpperCase()}
(${routing.legal_basis})

${routing.opening_template}

IMPUGNAÇÃO JUDICIAL

da decisão condenatória lavrada no Auto de Contraordenação n.º ${data.fineNumber ?? "[N.º DA AUTO]"}, datado de ${fineDate}, pela ${entityLine}, relativo a alegado estacionamento proibido ou irregularidade de estacionamento no local indicado como ${data.fineLocation ?? "[LOCAL]"}, com base nos seguintes

FUNDAMENTOS:

I — ENQUADRAMENTO

1. O/A arguido/a é titular/responsável pelo veículo de matrícula ${plate}, sujeito às disposições dos artigos 162.º e ss. do Código da Estrada (CE).

2. A entidade autuante qualificou a conduta como violação ao artigo 48.º e/ou 49.º do CE, imputando a prática de estacionamento proibido ou irregularidade de estacionamento${d.prohibitionType ? ` do tipo "${d.prohibitionType}"` : ""}.

3. O/A arguido/a não se conforma com tal qualificação pelos fundamentos infra.

II — FUNDAMENTOS DE FACTO E DE DIREITO

${selectedGrounds || "O/A arguido/a nega a prática da infração pelos factos e razões de direito que expõe a seguir."}

${sancaoSection}

${data.additionalNotes ? `IV — CONSIDERAÇÕES ADICIONAIS\n\n${data.additionalNotes}` : ""}

V — PEDIDO

Nestes termos, requer a V. Ex.ª que se digne:

a) Julgar procedente a presente impugnação, absolvendo o/a arguido/a;

b) Subsidiariamente, reduzir a coima para o mínimo legal, tendo em conta a situação económica do/a arguido/a (artigo 18.º do RGCO);
${buildSancaoAcessoriaPedidoItem(data, "c")}
${pedidoLetter}) Condenar a entidade autuante nas custas do processo.

${buildSubmissionSection("VI")}

[LOCAL], ${formatDateLong(new Date().toISOString())}

O/A Arguido/A,
_______________________________
${data.vehicleOwnerName}
NIF: ${data.vehicleOwnerNif}
Morada: ${data.vehicleOwnerAddress}
`;
}

function buildParkingGround(
  idx: number,
  id: string,
  label: string,
  legalBasis: string,
  freeText: string | undefined,
  d: ParkingData
): string {
  const paragraphs: Record<string, string> = {
    parking_no_signage: `${idx}. AUSÊNCIA OU DEFICIÊNCIA DA SINALIZAÇÃO DE PROIBIÇÃO DE ESTACIONAMENTO

No local indicado no auto não existia sinalização vertical ou horizontal que proibisse de forma inequívoca o estacionamento do veículo, ou, existindo, a mesma encontrava-se danificada, obstruída ou de difícil perceção, não cumprindo os requisitos técnicos exigidos pelo artigo 48.º do CE e pelo Regulamento de Sinalização do Trânsito (RST — DL n.º 22-A/98).

O artigo 8.º, n.º 1 do RST determina que os sinais de trânsito devem ser visíveis e legíveis. A ausência ou deficiência de sinalização impossibilita o condutor de conhecer a restrição em vigor, pelo que não lhe pode ser imputada qualquer infração.

(${legalBasis})`,

    parking_force_majeure: `${idx}. PARAGEM DE EMERGÊNCIA / FORÇA MAIOR

O estacionamento em causa não resultou de qualquer infração voluntária, mas sim de uma situação de emergência / força maior (${freeText ?? "avaria mecânica súbita / mal-estar físico / outra causa de força maior"}), que impediu o/a arguido/a de prosseguir ou estacionar noutro local.

O artigo 49.º, n.º 2 do Código da Estrada expressamente prevê que as disposições sobre estacionamento não se aplicam quando a paragem seja motivada por circunstâncias alheias à vontade do condutor.

(${legalBasis})`,

    estado_necessidade: `${idx}. ESTADO DE NECESSIDADE DESCULPANTE — EXCLUSÃO DA CULPA

Nos termos do artigo 35.º do Código Penal, aplicável ex vi do artigo 32.º do RGCO, age sem culpa quem praticar um facto ilícito adequado a afastar um perigo atual que ameace interesses juridicamente protegidos do agente ou de terceiro, quando lhe não seja razoavelmente exigível, segundo as circunstâncias do caso, comportamento diferente.

Sublinhe-se que o estado de necessidade desculpante não pressupõe que o facto seja lícito — pressupõe que o agente atuou sem culpa, dado que, nas circunstâncias concretas, não lhe era exigível conduta diversa. A ausência de culpa é causa de exclusão da responsabilidade contraordenacional, nos termos gerais.

No caso em apreço, o/a arguido/a deparou-se com a seguinte situação de emergência: ${freeText ?? "situação de urgência que tornou inexigível comportamento alternativo"}. Perante tais circunstâncias, a conduta adotada foi a única razoavelmente possível, não lhe sendo exigível agir de outro modo.

Acresce que o/a arguido/a não colocou em perigo a circulação nem a segurança dos demais utentes da via, conforme exige o artigo 49.º, n.º 2 do Código da Estrada para que a conduta seja isenta de responsabilidade contraordenacional.

Verificados os pressupostos do estado de necessidade desculpante — perigo atual, inexigibilidade de comportamento alternativo e ausência de perigo para a circulação e para a vida dos demais condutores —, o/a arguido/a atuou sem culpa, devendo ser absolvido/a.

(${legalBasis})`,

    parking_disabled_badge: `${idx}. TITULAR DE CARTÃO DE ESTACIONAMENTO PARA PESSOAS COM DEFICIÊNCIA

O/A arguido/a é titular de Cartão de Estacionamento para Pessoas com Deficiência válido, emitido ao abrigo do Decreto-Lei n.º 307/2003, de 10 de dezembro, que confere o direito a estacionar nas condições previstas nos artigos 117.º e 118.º do CE.

O cartão encontrava-se devidamente exibido no veículo no momento da autuação. Qualquer condenação com base no estacionamento efetuado ao abrigo daquele título constitui violação dos direitos conferidos por lei ao/à arguido/a.

(${legalBasis})`,

    parking_ticket_missing: `${idx}. IRREGULARIDADE PROCESSUAL — TALÃO DE ESTACIONAMENTO NÃO COLOCADO NO VEÍCULO

A auto de contraordenação não foi colocada de forma visível no veículo, conforme exige o artigo 169.º, n.º 1, al. f) do Código da Estrada, privando o/a arguido/a do imediato conhecimento da autuação e impedindo-o/a de exercer atempadamente o contraditório.

Esta omissão constitui irregularidade processual relevante que afeta a validade do ato e o exercício dos direitos de defesa do/a arguido/a.

(${legalBasis})`,

    parking_emel_competence: `${idx}. INCOMPETÊNCIA DA ENTIDADE AUTUANTE

A ${d.parkingEntity} procede à fiscalização e autuação em estacionamento apenas no âmbito da concessão ou delegação de competências conferida por deliberação municipal, nos termos do DL n.º 44/2002.

No local em causa, à data dos factos, a competência para fiscalização do estacionamento cabia a outra entidade, pelo que a autuação efetuada pela ${d.parkingEntity} é nula por incompetência absoluta do órgão autuante, nos termos do artigo 133.º do Código do Procedimento Administrativo (CPA).

(${legalBasis})`,

    prescription: `${idx}. PRESCRIÇÃO DO PROCEDIMENTO CONTRAORDENACIONAL

O procedimento contraordenacional em causa encontra-se prescrito, por terem decorrido mais de 2 anos sobre a data da alegada infração sem que haja sido proferida decisão condenatória transitada em julgado, nos termos do artigo 27.º, al. c) do RGCO.

(${legalBasis})`,

    notification_defect: `${idx}. NULIDADE DA NOTIFICAÇÃO

A notificação recebida não cumpre os requisitos legais do artigo 79.º do RGCO, nomeadamente no que respeita à identificação completa da infração e ao prazo de defesa, determinando a nulidade do ato notificatório.

(${legalBasis})`,

    in_dubio: `${idx}. PRINCÍPIO IN DUBIO PRO REO

Perante a insuficiência da prova recolhida, o princípio in dubio pro reo (artigo 32.º, n.º 2 da CRP) impõe a absolvição do/a arguido/a.

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

    emel_ma_fe: `${idx}. MÁ-FÉ E DESVIO DE PODER DA ENTIDADE AUTUANTE

Resulta das circunstâncias concretas que a autuação não foi praticada no genuíno interesse público de disciplinar o trânsito, mas antes de forma seletiva, arbitrária ou com o objetivo de maximizar a receita do operador — conduta que consubstancia desvio de poder, nos termos do artigo 161.º, n.º 2, al. l) do Código do Procedimento Administrativo (CPA).

${freeText ? `Em concreto: ${freeText}` : "O/A arguido/a reserva o direito de desenvolver este fundamento em sede de audiência de julgamento."}

Os artigos 266.º, n.º 2 da CRP e 10.º do CPA consagram os princípios da boa-fé e da prossecução do interesse público como limites da atuação administrativa. Qualquer autuação que desvirtue estes princípios para fins alheios à segurança rodoviária é nula, por vício de desvio de poder.

(${legalBasis})`,

    emel_fora_horario: `${idx}. AUTUAÇÃO FORA DO HORÁRIO DE FISCALIZAÇÃO CONTRATUALIZADO

A ${d.parkingEntity} apenas pode exercer competências de fiscalização e emissão de autos de contraordenação dentro do horário expressamente previsto no contrato de concessão ou delegação de competências celebrado com o município, ao abrigo do Decreto-Lei n.º 44/2002, de 2 de março.

${freeText ? `No caso em apreço, a autuação foi emitida às ${freeText}, hora que se encontra fora do horário de funcionamento contratualizado.` : "A autuação foi emitida em hora que se afigura fora do horário de funcionamento contratualizado."}

Toda a atividade administrativa de fiscalização exercida fora desse horário configura atuação sem cobertura legal, determinando a nulidade do auto por incompetência em razão do tempo, nos termos do artigo 133.º do CPA.

(${legalBasis})`,
  };

  return (
    paragraphs[id] ??
    `${idx}. ${label.toUpperCase()}\n\n${freeText ?? label}\n\n(${legalBasis})`
  );
}
