/**
 * Serialize WizardState into a plain-language case description for the AI.
 * Avoids sending raw JSON — gives the model clean prose context.
 */

import { WizardState, DefenseSuggestion } from "@/lib/wizard/logic-engine";

const FINE_TYPE_LABELS: Record<string, string> = {
  SPEEDING:      "Excesso de velocidade",
  PARKING:       "Estacionamento proibido",
  ADMIN_ERROR:   "Erro administrativo / formal",
  MOBILE_PHONE:  "Utilização de telemóvel ao volante",
  SEATBELT:      "Falta de cinto de segurança",
  TRAFFIC_LIGHT: "Avanço ao sinal vermelho",
  OTHER:         "Outro tipo de infração",
};

const AUTHORITY_LABELS: Record<string, string> = {
  gnr:   "GNR — Guarda Nacional Republicana",
  psp:   "PSP — Polícia de Segurança Pública",
  ansr:  "ANSR — Autoridade Nacional de Segurança Rodoviária",
  cm:    "Câmara Municipal / Polícia Municipal",
  emel:  "EMEL (Lisboa)",
  other: "Outra entidade",
};

export function buildCaseContext(
  state: WizardState,
  defenses: DefenseSuggestion[]
): string {
  const lines: string[] = [];

  // Fine type
  const fineType = FINE_TYPE_LABELS[state.fineType.fineCategory ?? ""] ?? "Não especificado";
  lines.push(`**Tipo de infração:** ${fineType}`);
  if (state.fineType.fineSubCategory) {
    lines.push(`**Subcategoria:** ${state.fineType.fineSubCategory}`);
  }

  // Fine details
  if (state.fineDetails.fineDate) {
    lines.push(`**Data da infração:** ${new Date(state.fineDetails.fineDate).toLocaleDateString("pt-PT")}`);
  }
  if (state.fineDetails.fineAuthority) {
    const auth = AUTHORITY_LABELS[state.fineDetails.fineAuthority] ?? state.fineDetails.fineAuthority;
    lines.push(`**Entidade autuante:** ${auth}`);
  }
  if (state.fineDetails.fineLocation) {
    lines.push(`**Local:** ${state.fineDetails.fineLocation}`);
  }
  if (state.fineDetails.vehiclePlate) {
    lines.push(`**Matrícula:** ${state.fineDetails.vehiclePlate}`);
  }
  if (state.fineDetails.speedRegistered && state.fineDetails.speedLimit) {
    lines.push(`**Velocidade registada:** ${state.fineDetails.speedRegistered} km/h (limite: ${state.fineDetails.speedLimit} km/h)`);
  }

  // Context
  lines.push("");
  lines.push("**Circunstâncias:**");

  const driverLabels: Record<string, string> = {
    yes:       "O arguido era o condutor no momento da infração",
    no:        "O arguido não era o condutor no momento da infração",
    uncertain: "Não tem certeza se era o condutor",
  };
  if (state.context.wasDriverAtTime) {
    lines.push(`- Condutor: ${driverLabels[state.context.wasDriverAtTime] ?? state.context.wasDriverAtTime}`);
  }
  if (state.context.wasDriverAtTime === "no" && state.context.realDriverName) {
    lines.push(`- Condutor real identificado: ${state.context.realDriverName}`);
  }

  const agreesLabels: Record<string, string> = {
    no:      "Não concorda com a infração imputada",
    partial: "Concorda parcialmente",
    yes:     "Concorda mas pretende apenas reduzir a coima",
  };
  if (state.context.agreesWithFine) {
    lines.push(`- Posição: ${agreesLabels[state.context.agreesWithFine] ?? state.context.agreesWithFine}`);
  }

  const evidenceLabels: Record<string, string> = {
    yes:     "tem prova",
    partial: "tem alguma prova",
    no:      "não tem prova",
  };
  if (state.context.hasEvidence) {
    lines.push(`- Prova disponível: ${evidenceLabels[state.context.hasEvidence]}`);
    if (state.context.evidenceTypes?.length) {
      lines.push(`  Tipos: ${state.context.evidenceTypes.join(", ")}`);
    }
  }

  if (state.context.fineHasDefects === "yes" && state.context.fineDefectTypes?.length) {
    lines.push(`- Defeitos formais detetados: ${state.context.fineDefectTypes.join(", ")}`);
  }

  // Speeding-specific
  if (state.context.radarCalibration) {
    lines.push(`- Calibração do radar no auto: ${state.context.radarCalibration}`);
  }
  if (state.context.speedSignageVisible) {
    lines.push(`- Sinalização de velocidade visível: ${state.context.speedSignageVisible}`);
  }

  // Parking-specific
  if (state.context.parkingSignageVisible) {
    lines.push(`- Sinalização de proibição visível: ${state.context.parkingSignageVisible}`);
  }
  if (state.context.parkingEmergency === "yes") {
    lines.push(`- Paragem por emergência: Sim`);
    if (state.context.parkingEmergencyDetail) {
      lines.push(`  Detalhe: ${state.context.parkingEmergencyDetail}`);
    }
  }

  // Selected defenses
  if (defenses.length > 0) {
    lines.push("");
    lines.push("**Fundamentos jurídicos sugeridos pela plataforma:**");
    defenses.forEach((d) => {
      const tag = d.strength === "strong" ? "🟢" : d.strength === "medium" ? "🟡" : "🔴";
      lines.push(`${tag} ${d.title} (${d.legalBasis}) — score ${d.score}/100`);
    });
  }

  // Additional notes
  if (state.legalGrounds.additionalNotes?.trim()) {
    lines.push("");
    lines.push(`**Notas adicionais do utilizador:**`);
    lines.push(state.legalGrounds.additionalNotes);
  }

  return lines.join("\n");
}
