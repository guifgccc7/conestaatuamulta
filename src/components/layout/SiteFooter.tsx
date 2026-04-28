/**
 * SiteFooter
 *
 * Full-width website footer.  Rendered on the homepage and legal pages.
 * Intentionally NOT a client component — no interactivity needed.
 *
 * Legal requirements met:
 *   EOA (Lei 145/2015) art. 66.º   — "não constitui aconselhamento jurídico"
 *                                    must be clearly stated
 *   Lei 49/2004                    — "não constitui consulta jurídica"
 *   RGCO (DL 433/82) art. 61.º    — positive framing of the legal basis
 *   Lei 24/96 art. 8.º             — limitation clause is conspicuous
 *   DL 24/2014 art. 4.º            — pre-contractual info available
 *   AI Act (UE 2024/1689) art. 50.º— AI disclosure present
 *   RGPD (UE 2016/679, art. 13.º)  — link to privacy policy
 *
 * Visual hierarchy:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  LOGO + tagline   │  NAV links   │  LEGAL links     │
 *   ├─────────────────────────────────────────────────────┤
 *   │  Legal nature statement (2 lines, readable)         │
 *   ├─────────────────────────────────────────────────────┤
 *   │  "NÃO CONSTITUI ACONSELHAMENTO JURÍDICO" badge      │
 *   │  + copyright                   + contact email      │
 *   └─────────────────────────────────────────────────────┘
 */

import Link from "next/link";
import {
  FileText,
  Scale,
  ShieldCheck,
  Mail,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { PLATFORM, LEGAL_BASIS, AI_ACT } from "@/lib/compliance/disclaimers";

// ─── Navigation link sets ─────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Como funciona",  href: "/#como-funciona" },
  { label: "Preços",         href: "/#precos"        },
  { label: "FAQ",            href: "/#faq"           },
  { label: "Contestar multa", href: "/wizard"         },
] as const;

const LEGAL_LINKS = [
  { label: "Termos e condições",    href: "/legal/termos"      },
  { label: "Política de privacidade", href: "/legal/privacidade" },
  { label: "Aviso legal",           href: "/legal/aviso-legal" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="bg-slate-900 text-slate-400"
      role="contentinfo"
      aria-label="Rodapé do site"
    >

      {/* ── Main footer body ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

          {/* Column 1 — Brand + tagline + compliance badge */}
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 group"
              aria-label="Contesta a Tua Multa — página inicial"
            >
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="font-bold text-white text-base group-hover:text-slate-100 transition-colors">
                Contesta a Tua Multa
              </span>
            </Link>

            <p className="text-sm leading-relaxed">
              Minutas de impugnação de contraordenações de trânsito geradas
              automaticamente. Por €4,99. Sem precisares de advogado.
            </p>

            {/* Legal service nature badge */}
            <div
              className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              title={LEGAL_BASIS.SELF_REPRESENTATION}
            >
              <Scale className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-slate-300 font-medium">
                {LEGAL_BASIS.SELF_REPRESENTATION_SHORT}
              </span>
            </div>

            {/* AI disclosure badge */}
            <div
              className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
              title={AI_ACT.RISK_CLASS_NOTICE}
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" aria-hidden="true" />
              <span className="text-xs text-slate-300 font-medium">
                Plataforma com IA — AI Act (UE) 2024/1689
              </span>
            </div>
          </div>

          {/* Column 2 — Navigation */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
              Plataforma
            </h3>
            <nav aria-label="Navegação do rodapé — plataforma">
              <ul className="space-y-2.5">
                {NAV_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm hover:text-white transition-colors hover:underline underline-offset-2"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Column 3 — Legal + contact */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">
              Legal & Privacidade
            </h3>
            <nav aria-label="Navegação do rodapé — legal">
              <ul className="space-y-2.5 mb-6">
                {LEGAL_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm hover:text-white transition-colors hover:underline underline-offset-2 inline-flex items-center gap-1"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <a
              href={`mailto:${PLATFORM.FOOTER_FULL.CONTACT}`}
              className="inline-flex items-center gap-2 text-sm hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" aria-hidden="true" />
              {PLATFORM.FOOTER_FULL.CONTACT}
            </a>
          </div>
        </div>

        {/* ── Legal nature statement ─────────────────────────────────────── */}
        {/*
          This block is legally required to be present and readable.
          EOA art. 66.º / Lei 49/2004 — must disclaim legal advice.
          DL 446/85 art. 8.º — limitation clauses must be highlighted.
        */}
        <div
          className="border-t border-slate-800 pt-8 pb-6 space-y-3"
          role="note"
          aria-label="Declaração de natureza do serviço"
        >
          {/* "NOT LEGAL ADVICE" — most legally important statement */}
          <div className="flex items-start gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3.5">
            <ShieldCheck
              className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
                Não constitui aconselhamento jurídico
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {PLATFORM.FOOTER_FULL.NOT_LEGAL_ADVICE}
              </p>
            </div>
          </div>

          {/* Legal nature */}
          <p className="text-xs text-slate-500 leading-relaxed">
            {PLATFORM.FOOTER_FULL.LEGAL_NATURE}
          </p>

          {/* Limitation of liability */}
          <p className="text-xs text-slate-500 leading-relaxed">
            {PLATFORM.FOOTER_FULL.LIABILITY}
          </p>
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────────── */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600 text-center sm:text-left">
            {PLATFORM.FOOTER_FULL.COPYRIGHT}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
