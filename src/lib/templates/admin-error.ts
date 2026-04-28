// ─── Minuta: Impugnação por Erro Administrativo ──────────────────────────────

import { WizardFormData, AdminErrorData } from "@/types";
import { formatDateLong, normalisePlate } from "@/lib/utils";
import { buildSubmissionSection } from "./shared/submission-section";
import {
  buildSancaoAcessoriaSection,
  buildSancaoAcessoriaPedidoItem,
  hasSancaoAcessoria,
} from "./shared/sancao-acessoria";
import { routeAuthority } from "@/lib/authority/authority-router";

export function generateAdminErrorMinuta(data: WizardFormData): string {
  const d = data.violationData as AdminErrorData;
  const plate = normalisePlate(data.vehiclePlate);
  const fineDate = data.fineDate ? formatDateLong(data.fineDate) : "[DATA DA AUTO]";

  const routing = routeAuthority(
    data.fineEntity ?? "PSP",
    "ADMIN_ERROR",
    {
      name:    data.vehicleOwnerName,
      nif:     data.vehicleOwnerNif,
      address: data.vehicleOwnerAddress,
    },
  );

  const errorTypeLabel: Record<string, string> = {
    WRONG_PLATE:           "identificação incorreta da matrícula do veículo",
    WRONG_DATE:            "indicação incorreta da data ou hora da infração",
    WRONG_LOCATION:        "indicação incorreta do local da infração",
    MISSING_EVIDENCE:      "ausência de prova/evidência da infração",
    NOTIFICATION_DEFECT:   "nulidade ou irregularidade da notificação",
    PRESCRIPTION:          "prescrição do procedimento contraordenacional",
    OTHER:                 "erro de natureza administrativa",
  };

  const mainError = errorTypeLabel[d.errorType] ?? "erro administrativo";

  const selectedGrounds = data.contestationGrounds
    .filter((g) => g.selected)
    .map((g, i) => `${i + 1}. ${g.label.toUpperCase()}\n\n${buildAdminGround(g.id, g.freeText, d)}\n\n(${g.legalBasis})`)
    .join("\n\n");

  const sancaoSection = buildSancaoAcessoriaSection(data, "III");
  const pedidoLetter = hasSancaoAcessoria(data) ? "f" : "e";

  return `${routing.document_type_label.toUpperCase()}
(${routing.legal_basis})

${routing.opening_template}

IMPUGNAÇÃO JUDICIAL

do Auto de Contraordenação n.º ${data.fineNumber ?? "[N.º DA AUTO]"}, datado de ${fineDate}, lavrado pela ${data.fineEntity}, o qual enferma de ${mainError} que vicia o procedimento e determina a sua nulidade, com base nos seguintes

FUNDAMENTOS:

I — ENQUADRAMENTO

1. O presente auto foi notificado ao/à arguido/a e respeita à alegada infração praticada no local: ${data.fineLocation ?? "[LOCAL]"}, com o veículo de matrícula ${plate}.

2. O/A arguido/a examinou atentamente o conteúdo do auto e verificou que o mesmo contém erro(s) de natureza administrativa — concretamente: ${d.errorDescription} — que invalidam a decisão condenatória.

3. A estes vícios formais/substantivos acrescem os fundamentos de direito de seguida expostos.

II — VÍCIOS DO AUTO E FUNDAMENTOS DE DIREITO

${selectedGrounds || buildDefaultAdminSection(d)}

${sancaoSection}

${data.additionalNotes ? `IV — CONSIDERAÇÕES ADICIONAIS\n\n${data.additionalNotes}` : ""}

V — MEIOS DE PROVA

O/A arguido/a requer a junção dos seguintes meios de prova:
${
    d.supportingDocuments && d.supportingDocuments.length > 0
      ? d.supportingDocuments.map((doc, i) => `  ${i + 1}. ${doc}`).join("\n")
      : "  1. Documentos do veículo (DUA)\n  2. Outros documentos de suporte a apresentar oportunamente"
  }

VI — PEDIDO

Nestes termos e nos demais de direito, requer a V. Ex.ª que se digne:

a) Declarar nulo o Auto de Contraordenação n.º ${data.fineNumber ?? "[N.º DA AUTO]"} pelos vícios supra invocados;

b) Julgar procedente a impugnação e absolver o/a arguido/a da infração imputada;

c) Subsidiariamente, determinar a reformulação do auto com correção dos erros identificados;
${buildSancaoAcessoriaPedidoItem(data, "d")}
${pedidoLetter}) Condenar a entidade autuante nas custas do processo.

${buildSubmissionSection("VII")}

[LOCAL], ${formatDateLong(new Date().toISOString())}

O/A Arguido/A,
_______________________________
${data.vehicleOwnerName}
NIF: ${data.vehicleOwnerNif}
Morada: ${data.vehicleOwnerAddress}
`;
}

function buildAdminGround(
  id: string,
  freeText: string | undefined,
  d: AdminErrorData
): string {
  const text: Record<string, string> = {
    admin_wrong_date: `O auto indica uma data e/ou hora que não correspondem ao momento real em que o veículo se encontrava no local. Este erro material na indicação da data constitui nulidade do auto, nos termos do artigo 58.º, al. c) do RGCO, porquanto um dos elementos essenciais da infração se encontra incorretamente identificado, violando o direito de defesa do/a arguido/a.`,

    admin_wrong_location: `O local indicado no auto — "${d.errorDescription}" — não coincide com o local real dos factos, conforme o/a arguido/a pode provar por documentação e/ou testemunhos. A incorreta localização constitui vício insanável nos termos do artigo 58.º, al. d) do RGCO, tornando impossível ao arguido exercer o seu direito de contraditar os factos.`,

    admin_no_identification: `O auto não contém a identificação completa do agente autuante — nome, número de identificação funcional e entidade a que pertence — conforme exigido pelo artigo 58.º, al. a) do RGCO. Esta omissão constitui nulidade do ato, por impossibilitar o controlo e fiscalização da legalidade da autuação.`,

    admin_notification_late: `A notificação da decisão condenatória foi efetuada em data posterior ao prazo de prescrição previsto no artigo 27.º do RGCO, o que determina a extinção do procedimento contraordenacional. O prazo de prescrição do procedimento decorreu sem que tenha sido proferida decisão condenatória com trânsito em julgado.`,

    wrong_plate: `A matrícula inscrita no auto — diferente da matrícula real do veículo "${normalisePlate(
      ""
    )}" — constitui erro material essencial que invalida a autuação. Nos termos do artigo 58.º, al. b) do RGCO, a identificação correta do veículo é elemento indispensável ao auto. Este erro impede a correta imputação da infração ao arguido/veículo em causa.`,

    notification_defect: `A notificação recebida pelo/a arguido/a não preenche os requisitos legais exigidos pelo artigo 79.º, n.º 1 do RGCO: ${freeText ?? "faltam elementos essenciais como prazo de defesa, identificação da infração e/ou forma de exercer o direito de audiência prévia"}. Esta irregularidade determina a nulidade do ato notificatório, com a consequente ineficácia de todos os prazos processuais que do mesmo dependam.`,

    prescription: `O procedimento contraordenacional encontra-se prescrito por força do artigo 27.º, al. b) do RGCO. Desde a data da alegada infração até à notificação da decisão condenatória decorreram mais de 2 (dois) anos sem que tenham ocorrido atos interruptivos válidos e eficazes. Prescrito o procedimento, impõe-se o arquivamento e a absolvição do/a arguido/a.`,

    in_dubio: `Perante a insuficiência e contradições da prova produzida, o princípio constitucional in dubio pro reo (artigo 32.º, n.º 2 CRP; artigo 50.º RGCO) impõe que a dúvida seja resolvida em favor do/a arguido/a, conduzindo à sua absolvição.`,

    estado_necessidade: `O/A arguido/a encontrava-se, à data dos factos, perante uma situação de emergência (${freeText ?? "situação de urgência"}). Nos termos do artigo 35.º do Código Penal (ex vi art. 32.º do RGCO), age sem culpa quem, nessas circunstâncias, adota a conduta que era a única razoavelmente exigível. A ausência de culpa exclui a responsabilidade contraordenacional (art. 8.º RGCO). O/A arguido/a não colocou em perigo a circulação nem a segurança dos demais utentes da via, pelo que devem verificar-se todos os pressupostos do estado de necessidade desculpante e o/a arguido/a absolvido/a.`,

    outro_defect: `O/A arguido/a detetou a seguinte irregularidade no auto ou na notificação recebida: "${freeText ?? "irregularidade a descrever oportunamente"}".

Tal irregularidade constitui vício do auto, porquanto os elementos essenciais que o mesmo deve conter, nos termos do artigo 58.º do RGCO, encontram-se incorretos ou incompletos. A omissão ou incorreção de elementos essenciais invalida o auto e determina a absolvição do/a arguido/a.`,

    sancao_acessoria: `Para além da coima, a autoridade autuante imputa ao/à arguido/a ${freeText ? `a sanção acessória de ${freeText}` : "uma sanção acessória"}.

O/A arguido/a impugna expressamente esta sanção acessória. As sanções acessórias têm carácter excecional, exigindo verificação autónoma e rigorosa dos respetivos pressupostos, com respeito pelo princípio da proporcionalidade (artigo 18.º, n.º 2 da CRP). Os pressupostos legais não se encontram suficientemente demonstrados no auto, pelo que a sanção acessória deve ser declarada improcedente (artigos 21.º e 22.º do RGCO).`,
  };

  return text[id] ?? (freeText ?? `Fundamento invocado: ${id}`);
}

function buildDefaultAdminSection(d: AdminErrorData): string {
  return `1. VÍCIO IDENTIFICADO NO AUTO

${d.errorDescription}

Nos termos do artigo 58.º do RGCO, constituem elementos essenciais do auto de contraordenação: a identificação do arguido, a data, hora e local da infração, a descrição dos factos, a norma violada e a identificação do agente autuante. A omissão ou incorreção de qualquer destes elementos invalida o auto e determina a absolvição do/a arguido/a.`;
}

// normalisePlate is imported from @/lib/utils above
