"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatCents } from "@/lib/utils";
import {
  Plus,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Crown,
  ChevronRight,
  Trash2,
  Shield,
  UserX,
} from "lucide-react";

interface Case {
  id: string;
  title: string;
  caseType: string;
  status: string;
  fineNumber: string | null;
  fineDate: string | null;
  fineEntity: string | null;
  createdAt: string;
  documents: { id: string; status: string; pdfUrl: string | null; createdAt: string }[];
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  subscriptionStatus: string;
  subscriptionPeriodEnd: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  DRAFT:            { label: "Rascunho",       badge: "badge-gray",   icon: <Clock className="w-3 h-3" /> },
  PENDING_PAYMENT:  { label: "Aguarda pagam.", badge: "badge-yellow", icon: <AlertCircle className="w-3 h-3" /> },
  READY:            { label: "Pronto",          badge: "badge-green",  icon: <CheckCircle2 className="w-3 h-3" /> },
  DOWNLOADED:       { label: "Descarregado",   badge: "badge-blue",   icon: <Download className="w-3 h-3" /> },
  SUBMITTED:        { label: "Enviado",         badge: "badge-green",  icon: <CheckCircle2 className="w-3 h-3" /> },
};

const CASE_TYPE_EMOJI: Record<string, string> = {
  SPEEDING:      "🚗",
  PARKING:       "🅿️",
  ADMIN_ERROR:   "📋",
  MOBILE_PHONE:  "📱",
  SEATBELT:      "💺",
  TRAFFIC_LIGHT: "🚦",
  OTHER:         "⚠️",
};

interface Props {
  user: User;
  cases: Case[];
}

export function DashboardClient({ user, cases }: Props) {
  const [deletingId,      setDeletingId]      = useState<string | null>(null);
  const [caseList,        setCaseList]        = useState(cases);
  const [exportLoading,   setExportLoading]   = useState(false);
  const [deleteAccLoading, setDeleteAccLoading] = useState(false);

  const isSubscribed = user.subscriptionStatus === "ACTIVE" || user.subscriptionStatus === "TRIALING";

  const handleDelete = async (id: string) => {
    if (!confirm("Tens a certeza que queres eliminar este caso?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCaseList((prev) => prev.filter((c) => c.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (pdfUrl: string, caseId: string) => {
    window.open(pdfUrl, "_blank");
    // Mark as downloaded
    await fetch(`/api/cases/${caseId}/downloaded`, { method: "POST" });
  };

  // ── RGPD art. 20.º — Data portability export ─────────────────────────────
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/user/export");
      if (!res.ok) { alert("Erro ao exportar dados. Tenta mais tarde."); return; }
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const filename = res.headers.get("Content-Disposition")
        ?.match(/filename="([^"]+)"/)?.[1] ?? "dados-pessoais.json";
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao exportar dados. Tenta mais tarde.");
    } finally {
      setExportLoading(false);
    }
  };

  // ── RGPD art. 17.º — Right to erasure ────────────────────────────────────
  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      "⚠️ Tens a certeza absoluta?\n\n" +
      "Esta ação irá:\n" +
      "• Anonimizar os teus dados pessoais (nome, email, NIF, morada)\n" +
      "• Eliminar todos os teus casos e documentos\n" +
      "• Encerrar a tua sessão permanentemente\n\n" +
      "Os registos de pagamento são mantidos 7 anos por obrigação fiscal.\n\n" +
      "Esta operação é IRREVERSÍVEL. Confirmas?"
    );
    if (!confirmed) return;

    setDeleteAccLoading(true);
    try {
      const res  = await fetch("/api/user/delete", { method: "DELETE" });
      const json = await res.json();
      if (res.ok) {
        alert("✓ Conta eliminada. Os teus dados pessoais foram removidos.\n\nSerás redirecionado para a página inicial.");
        window.location.href = "/";
      } else {
        alert(`Erro: ${json.error ?? "Tenta novamente ou contacta privacidade@contestaatuamulta.pt"}`);
      }
    } catch {
      alert("Erro ao eliminar conta. Contacta privacidade@contestaatuamulta.pt");
    } finally {
      setDeleteAccLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Olá, {user.name?.split(" ")[0] ?? "Utilizador"} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {caseList.length === 0
                ? "Ainda não tens contestações. Começa agora!"
                : `${caseList.length} contestaç${caseList.length === 1 ? "ão" : "ões"} no teu arquivo`}
            </p>
          </div>
          <Link href="/wizard" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova contestação
          </Link>
        </div>

        {/* Subscription banner */}
        {!isSubscribed && (
          <div className="card p-5 mb-6 border-brand-200 bg-gradient-to-r from-brand-50 to-blue-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-brand-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    Subscrição para documentos ilimitados
                  </div>
                  <div className="text-xs text-slate-500">
                    €9,99/mês · 7 dias grátis · Cancela quando quiseres
                  </div>
                </div>
              </div>
              <Link href="/api/stripe/checkout" className="btn-primary text-sm py-2">
                Subscrever
              </Link>
            </div>
          </div>
        )}

        {isSubscribed && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Crown className="w-5 h-5 text-green-600" />
            <div className="text-sm">
              <span className="font-semibold text-green-800">Subscrição ativa</span>
              {user.subscriptionPeriodEnd && (
                <span className="text-green-600 ml-1">
                  · Renovação em {formatDate(user.subscriptionPeriodEnd)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cases list */}
        {caseList.length === 0 ? (
          <div className="card p-12 text-center">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">Nenhuma contestação ainda</h3>
            <p className="text-slate-500 text-sm mb-6">
              Cria a tua primeira carta de impugnação em menos de 5 minutos
            </p>
            <Link href="/wizard" className="btn-primary">
              <Plus className="w-4 h-4" />
              Contestar uma multa
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {caseList.map((c) => {
              const statusConfig = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.DRAFT;
              const doc = c.documents[0];

              return (
                <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Emoji */}
                    <div className="text-3xl flex-shrink-0 mt-0.5">
                      {CASE_TYPE_EMOJI[c.caseType] ?? "⚠️"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                          {c.title}
                        </h3>
                        <span className={`${statusConfig.badge} flex items-center gap-1 flex-shrink-0`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
                        {c.fineNumber && <span>Auto n.º {c.fineNumber}</span>}
                        {c.fineDate && <span>{formatDate(c.fineDate)}</span>}
                        {c.fineEntity && <span>{c.fineEntity}</span>}
                        <span>Criado em {formatDate(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    {doc?.pdfUrl && (doc.status === "GENERATED" || doc.status === "PAID") ? (
                      <button
                        onClick={() => handleDownload(doc.pdfUrl!, c.id)}
                        className="btn-primary text-xs py-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descarregar PDF
                      </button>
                    ) : c.status === "DRAFT" ? (
                      <Link href={`/wizard?id=${c.id}`} className="btn-secondary text-xs py-2">
                        Continuar
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link href={`/wizard?id=${c.id}`} className="btn-secondary text-xs py-2">
                        Ver detalhes
                      </Link>
                    )}

                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="btn-ghost text-xs py-2 text-red-400 hover:text-red-500 hover:bg-red-50 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {/* ── RGPD: Conta e dados pessoais ─────────────────────────────── */}
        <div className="mt-10 pt-8 border-t border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700">Conta e dados pessoais</h2>
            <span className="text-xs text-slate-400 font-normal">(RGPD arts. 17.º e 20.º)</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {/* Exportar dados */}
            <div className="border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-900 mb-1">
                Exportar os meus dados
              </p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Descarrega um ficheiro JSON com todos os dados pessoais que guardamos — conta,
                casos, documentos e pagamentos. Direito à portabilidade (art. 20.º RGPD).
              </p>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-2 text-xs font-semibold text-brand-700 border border-brand-300 hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {exportLoading ? "A preparar..." : "Exportar dados (JSON)"}
              </button>
            </div>

            {/* Eliminar conta */}
            <div className="border border-red-100 rounded-xl p-4 bg-red-50/30">
              <p className="text-sm font-medium text-red-800 mb-1">
                Eliminar conta
              </p>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                Anonimiza os teus dados pessoais e elimina todos os casos. Os registos de
                pagamento são mantidos 7 anos por obrigação fiscal. Ação irreversível.
                Direito ao apagamento (art. 17.º RGPD).
              </p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteAccLoading}
                className="flex items-center gap-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <UserX className="w-3.5 h-3.5" />
                {deleteAccLoading ? "A processar..." : "Eliminar conta permanentemente"}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-3">
            Para pedidos de retificação, limitação ou oposição ao tratamento, contacta{" "}
            <a href="mailto:privacidade@contestaatuamulta.pt" className="text-brand-500 hover:underline">
              privacidade@contestaatuamulta.pt
            </a>
            . Respondemos em 30 dias (art. 12.º RGPD).
          </p>
        </div>

      </div>
    </div>
  );
}
