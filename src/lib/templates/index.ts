import { WizardFormData, CaseType } from "@/types";
import { generateSpeedingMinuta } from "./speeding";
import { generateParkingMinuta } from "./parking";
import { generateAdminErrorMinuta } from "./admin-error";
import { routeAuthority, CaseType as RouterCaseType } from "@/lib/authority/authority-router";
import {
  buildSancaoAcessoriaSection,
  buildSancaoAcessoriaPedidoItem,
  hasSancaoAcessoria,
} from "./shared/sancao-acessoria";

export function generateMinuta(data: WizardFormData): string {
  switch (data.caseType) {
    case "SPEEDING":
      return generateSpeedingMinuta(data);
    case "PARKING":
      return generateParkingMinuta(data);
    case "ADMIN_ERROR":
      return generateAdminErrorMinuta(data);
    case "MOBILE_PHONE":
      return generateMobilePhoneMinuta(data);
    case "SEATBELT":
      return generateSeatbeltMinuta(data);
    case "TRAFFIC_LIGHT":
      return generateTrafficLightMinuta(data);
    default:
      return generateAdminErrorMinuta(data);
  }
}

// ─── Simple minutas for other infraction types ────────────────────────────────

function generateMobilePhoneMinuta(data: WizardFormData): string {
  const plate = data.vehiclePlate.toUpperCase().replace(/[\s-]/g, "");
  return buildSimpleMinuta(
    data,
    plate,
    "Art. 84.º do Código da Estrada",
    "uso indevido de telemóvel durante a condução",
    `O/A arguido/a nega categoricamente a utilização do telemóvel de forma manual durante a condução. ${
      data.contestationGrounds.find((g) => g.id === "mobile_hands_free" && g.selected)
        ? "O dispositivo estava a ser utilizado em modo mãos-livres/kit de automóvel, o que não constitui infração ao abrigo do artigo 84.º, n.º 2 do Código da Estrada."
        : "A auto carece de qualquer elemento probatório — fotográfico, de vídeo ou outra prova objectiva — que comprove a alegada utilização do telemóvel."
    } ${
      data.additionalNotes ? "\n\n" + data.additionalNotes : ""
    }`,
    "MOBILE_PHONE",
  );
}

function generateSeatbeltMinuta(data: WizardFormData): string {
  const plate = data.vehiclePlate.toUpperCase().replace(/[\s-]/g, "");
  return buildSimpleMinuta(
    data,
    plate,
    "Art. 82.º do Código da Estrada",
    "condução sem cinto de segurança",
    `O/A arguido/a contesta a infração imputada. ${
      data.contestationGrounds.find((g) => g.id === "seatbelt_medical" && g.selected)
        ? "O/A arguido/a beneficia de isenção médica de uso de cinto de segurança, ao abrigo do artigo 82.º, n.º 3 do CE, conforme atestado médico que ora se junta."
        : "O cinto de segurança encontrava-se devidamente colocado no momento da autuação. A auto não é acompanhada de qualquer elemento probatório que sustente a imputação efectuada."
    } ${
      data.additionalNotes ? "\n\n" + data.additionalNotes : ""
    }`,
    "SEATBELT",
  );
}

function generateTrafficLightMinuta(data: WizardFormData): string {
  const plate = data.vehiclePlate.toUpperCase().replace(/[\s-]/g, "");
  return buildSimpleMinuta(
    data,
    plate,
    "Art. 69.º do Código da Estrada",
    "desrespeito de sinal vermelho",
    `O/A arguido/a contesta a infração de alegado desrespeito de sinal luminoso vermelho. ${
      data.contestationGrounds.find((g) => g.id === "tlight_malfunction" && g.selected)
        ? "O semáforo em causa apresentava, à data dos factos, anomalia de funcionamento que justificou a conduta do condutor, nos termos do artigo 69.º do CE."
        : "Não existe qualquer registo fotográfico, de vídeo ou outro elemento de prova objectiva que comprove que o veículo transpôs o sinal encontrando-se o mesmo na fase vermelha."
    } ${
      data.additionalNotes ? "\n\n" + data.additionalNotes : ""
    }`,
    "TRAFFIC_LIGHT",
  );
}

function buildSimpleMinuta(
  data: WizardFormData,
  plate: string,
  legalBasis: string,
  chargeDescription: string,
  groundsText: string,
  caseType: RouterCaseType = "OTHER",
): string {
  const { formatDateLong } = require("@/lib/utils");
  const fineDate = data.fineDate ? formatDateLong(data.fineDate) : "[DATA DA AUTO]";

  const routing = routeAuthority(
    data.fineEntity ?? "PSP",
    caseType,
    {
      name:    data.vehicleOwnerName,
      nif:     data.vehicleOwnerNif,
      address: data.vehicleOwnerAddress,
    },
  );

  const sancaoSection = buildSancaoAcessoriaSection(data, "II");
  const pedidoLetter = hasSancaoAcessoria(data) ? "c" : "b";

  return `${routing.document_type_label.toUpperCase()}
(${routing.legal_basis})

${routing.opening_template}

IMPUGNAÇÃO JUDICIAL

do Auto de Contraordenação n.º ${data.fineNumber ?? "[N.º]"}, datado de ${fineDate}, lavrado pela ${routing.authority}, relativo a alegado ${chargeDescription} (${legalBasis}), no local ${data.fineLocation ?? "[LOCAL]"}.

I — FUNDAMENTOS:

${groundsText}

${sancaoSection}

PEDIDO:

Nestes termos, requer-se a V. Ex.ª que julgue a presente impugnação procedente:

a) Absolvendo o/a arguido/a da contraordenação imputada ou, subsidiariamente, reduzindo a coima ao mínimo legal;
${buildSancaoAcessoriaPedidoItem(data, "b")}
${pedidoLetter}) Condenando a entidade autuante nas custas do processo.

${routing.notes ? `\n⚠️ NOTA: ${routing.notes}\n` : ""}
[LOCAL], ${formatDateLong(new Date().toISOString())}

_______________________________
${data.vehicleOwnerName}
NIF: ${data.vehicleOwnerNif}
Morada: ${data.vehicleOwnerAddress}
`;
}

export { getAvailableGrounds } from "./grounds";
