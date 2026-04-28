"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, FileText, LogOut, LayoutDashboard, User } from "lucide-react";

export function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-lg hidden sm:block">
            Contesta a Tua Multa
          </span>
          <span className="font-bold text-slate-900 text-lg sm:hidden">
            ContestaMulta
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/#como-funciona" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
            Como funciona
          </Link>
          <Link href="/#precos" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
            Preços
          </Link>
          <Link href="/#faq" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
            FAQ
          </Link>

          {session ? (
            <>
              <Link href="/dashboard" className="btn-ghost text-sm">
                <LayoutDashboard className="w-4 h-4" />
                Painel
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-ghost text-sm text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost text-sm">
                Entrar
              </Link>
              <Link href="/wizard" className="btn-primary text-sm py-2">
                Contestar Multa
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
          <Link href="/#como-funciona" className="block py-2 text-slate-700 font-medium" onClick={() => setMobileOpen(false)}>
            Como funciona
          </Link>
          <Link href="/#precos" className="block py-2 text-slate-700 font-medium" onClick={() => setMobileOpen(false)}>
            Preços
          </Link>
          <Link href="/#faq" className="block py-2 text-slate-700 font-medium" onClick={() => setMobileOpen(false)}>
            FAQ
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="block py-2 text-slate-700 font-medium" onClick={() => setMobileOpen(false)}>
                Painel
              </Link>
              <button
                onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                className="block w-full text-left py-2 text-red-500 font-medium"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block py-2 text-slate-700 font-medium" onClick={() => setMobileOpen(false)}>
                Entrar
              </Link>
              <Link href="/wizard" className="btn-primary w-full justify-center mt-2" onClick={() => setMobileOpen(false)}>
                Contestar Multa
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
