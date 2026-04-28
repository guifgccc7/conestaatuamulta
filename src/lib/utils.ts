import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateLong(date: Date | string): string {
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function generateCaseTitle(
  caseType: string,
  fineDate?: string | null
): string {
  const labels: Record<string, string> = {
    SPEEDING:      "Multa — Excesso de Velocidade",
    PARKING:       "Multa — Estacionamento Proibido",
    ADMIN_ERROR:   "Impugnação — Erro Administrativo",
    MOBILE_PHONE:  "Multa — Uso de Telemóvel",
    SEATBELT:      "Multa — Falta de Cinto de Segurança",
    TRAFFIC_LIGHT: "Multa — Infração ao Semáforo",
    OTHER:         "Impugnação de Coima",
  };

  const label = labels[caseType] ?? "Impugnação de Coima";
  const date = fineDate ? ` — ${formatDate(fineDate)}` : "";
  return `${label}${date}`;
}

/** Sanitise a plate number: uppercase, remove spaces/hyphens */
export function normalisePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, "");
}
