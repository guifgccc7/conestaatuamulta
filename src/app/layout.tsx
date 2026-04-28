import type { Metadata } from "next";
import "./globals.css";
import { Providers }    from "@/components/layout/Providers";
import { CookieBanner } from "@/components/compliance/CookieBanner";

export const metadata: Metadata = {
  title: {
    default: "Contesta a Tua Multa — Impugna Coimas em Portugal",
    template: "%s | Contesta a Tua Multa",
  },
  description:
    "Gera automaticamente minutas legais para contestar multas de trânsito em Portugal. Velocidade, estacionamento, erros administrativos. Rápido, simples, legal.",
  keywords: [
    "contestar multa trânsito portugal",
    "impugnar coima velocidade",
    "impugnar coima estacionamento",
    "minuta contestação multa",
    "código da estrada contestação",
    "recurso coima ANSR",
  ],
  authors: [{ name: "contestaatuamulta.pt" }],
  openGraph: {
    title: "Contesta a Tua Multa",
    description: "Impugna a tua coima de trânsito com documentos legais gerados automaticamente.",
    url: "https://contestaatuamulta.pt",
    siteName: "Contesta a Tua Multa",
    locale: "pt_PT",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
        {/* RGPD / ePrivacy — cookie information notice (Lei n.º 41/2004) */}
        <CookieBanner />
      </body>
    </html>
  );
}
