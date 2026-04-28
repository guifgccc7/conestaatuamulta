/**
 * /checkout/success
 *
 * Landed here from Stripe after successful payment.
 * Handles two flows:
 *   - type=single  → auto-generates the document, shows download button
 *   - type=subscription → shows activation confirmation + go-to-wizard CTA
 */

"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ArrowRight,
  Loader2,
  AlertTriangle,
  FileText,
  Sparkles,
  Crown,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase =
  | "checking"    // polling payment status
  | "generating"  // calling /api/documents/generate
  | "ready"       // PDF ready
  | "subscribed"  // subscription flow
  | "error";

// ─── Main component ───────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">A carregar…</div>}>
      <CheckoutSuccessInner />
    </Suspense>
  );
}

function CheckoutSuccessInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const type      = searchParams.get("type");       // "single" | "subscription"
  const caseId    = searchParams.get("case_id");
  const sessionId = searchParams.get("session_id");

  const isSubscription = type === "subscription";

  const [phase,      setPhase]      = useState<Phase>(isSubscription ? "subscribed" : "checking");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [attempts,   setAttempts]   = useState(0);
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null);

  // ── 1. Poll payment status until webhook fires (max ~20s) ──────────────────

  const pollStatus = useCallback(async () => {
    if (!caseId || isSubscription) return;

    try {
      const res  = await fetch(`/api/documents/status?caseId=${caseId}`);
      const json = await res.json();

      if (!json.success) throw new Error(json.error);

      const { isPaid, hasDocument, documentId: docId } = json.data;

      if (isPaid && hasDocument && docId) {
        // Payment confirmed — check if PDF already exists (e.g. retry)
        if (json.data.pdfReady) {
          setDocumentId(docId);
          setPhase("ready");
          return;
        }
        // Generate PDF now
        setPhase("generating");
        await generateDocument(caseId, docId);
      } else {
        // Not yet confirmed — retry (webhook may be slightly delayed)
        setAttempts((n) => n + 1);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao verificar pagamento.");
      setPhase("error");
    }
  }, [caseId, isSubscription]);

  // ── 2. Generate document ───────────────────────────────────────────────────

  const generateDocument = async (id: string, _existingDocId?: string) => {
    try {
      const res  = await fetch("/api/documents/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ caseId: id }),
      });
      const json = await res.json();

      if (!json.success) {
        if (json.requiresPayment) {
          // Webhook hasn't fired yet — wait and retry
          setPhase("checking");
          setAttempts((n) => n + 1);
          return;
        }
        throw new Error(json.error ?? "Erro ao gerar documento.");
      }

      setDocumentId(json.data.documentId);
      setPhase("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro ao gerar documento.");
      setPhase("error");
    }
  };

  // ── 3. Retry loop ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isSubscription) return;
    if (phase !== "checking") return;
    if (attempts >= 12) {
      setErrorMsg("O pagamento ainda não foi confirmado. Aguarda um momento e vai ao painel.");
      setPhase("error");
      return;
    }

    const delay = attempts < 3 ? 2000 : 3500; // faster initial checks
    const timer = setTimeout(pollStatus, delay);
    return () => clearTimeout(timer);
  }, [phase, attempts, pollStatus, isSubscription]);

  // ── Download handler ───────────────────────────────────────────────────────

  const handleDownload = () => {
    if (!documentId) return;
    window.location.href = `/api/documents/download?documentId=${documentId}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full">

          {/* ── SUBSCRIPTION SUCCESS ──────────────────────────────────────── */}
          {phase === "subscribed" && (
            <SubscriptionSuccess />
          )}

          {/* ── CHECKING PAYMENT ─────────────────────────────────────────── */}
          {phase === "checking" && (
            <StatusCard
              icon={<Loader2 className="w-10 h-10 text-brand-500 animate-spin" />}
              iconBg="bg-brand-100"
              title="A confirmar o pagamento…"
              subtitle="Estamos a aguardar a confirmação do Stripe. Isto demora normalmente 5–10 segundos."
            >
              <div className="space-y-2 mt-2">
                <ProgressDot active={true}  label="Pagamento processado" />
                <ProgressDot active={false} label="Documento a ser gerado" />
                <ProgressDot active={false} label="PDF pronto para descarregar" />
              </div>
            </StatusCard>
          )}

          {/* ── GENERATING ───────────────────────────────────────────────── */}
          {phase === "generating" && (
            <StatusCard
              icon={<Loader2 className="w-10 h-10 text-brand-500 animate-spin" />}
              iconBg="bg-brand-100"
              title="A gerar o teu documento…"
              subtitle="Estamos a preparar a tua minuta de impugnação. Demora apenas alguns segundos."
            >
              <div className="space-y-2 mt-2">
                <ProgressDot active={true}  label="Pagamento confirmado" done />
                <ProgressDot active={true}  label="A compor documento legal" />
                <ProgressDot active={false} label="PDF pronto para descarregar" />
              </div>
            </StatusCard>
          )}

          {/* ── READY ────────────────────────────────────────────────────── */}
          {phase === "ready" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Documento pronto!
              </h1>
              <p className="text-slate-500 mb-2 leading-relaxed">
                A tua minuta de impugnação está pronta. Descarrega o PDF, assina e envia para a entidade autuante.
              </p>

              {/* AI badge */}
              <div className="flex items-center justify-center gap-1.5 mb-8">
                <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                <span className="text-xs text-brand-600 font-medium">
                  Documento gerado com análise jurídica assistida por IA
                </span>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  className="btn-primary w-full justify-center py-4 text-base"
                >
                  <Download className="w-5 h-5" />
                  Descarregar PDF
                </button>

                <Link href="/dashboard" className="btn-secondary w-full justify-center py-3">
                  Ver painel de casos
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Next steps */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6 text-left">
                <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Próximos passos
                </p>
                <ol className="space-y-1 text-xs text-amber-700 list-decimal list-inside">
                  <li>Descarrega o PDF e revê o documento</li>
                  <li>Assina o documento (caneta azul ou assinatura digital)</li>
                  <li>Envia por correio registado com aviso de receção</li>
                  <li>Guarda o comprovativo de envio</li>
                </ol>
              </div>

              <p className="text-xs text-slate-400 mt-4">
                Receberás também uma cópia por email.
              </p>
            </div>
          )}

          {/* ── ERROR ────────────────────────────────────────────────────── */}
          {phase === "error" && (
            <div className="text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Algo correu mal
              </h1>
              <p className="text-slate-500 mb-2 leading-relaxed text-sm">
                {errorMsg ?? "Não foi possível verificar o pagamento ou gerar o documento."}
              </p>
              <p className="text-xs text-slate-400 mb-6">
                O teu pagamento pode já ter sido processado — vai ao painel para verificar.
                Se o problema persistir, contacta-nos em{" "}
                <a href="mailto:contacto@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  contacto@contestaatuamulta.pt
                </a>
              </p>

              <div className="space-y-3">
                <Link href="/dashboard" className="btn-primary w-full justify-center py-3">
                  Ir para o painel
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {caseId && (
                  <button
                    onClick={() => { setPhase("checking"); setAttempts(0); setErrorMsg(null); }}
                    className="btn-secondary w-full justify-center py-3"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SubscriptionSuccess() {
  return (
    <div className="text-center">
      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Crown className="w-10 h-10 text-amber-500" />
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        Subscrição ativada!
      </h1>
      <p className="text-slate-500 mb-8 leading-relaxed">
        Tens agora acesso a documentos ilimitados durante os próximos 7 dias grátis.
        Após o período experimental, a subscrição renova automaticamente a{" "}
        <strong>€9,99/mês</strong>.
      </p>

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-6 text-left">
        <p className="text-xs font-semibold text-brand-800 mb-2">O que tens incluído:</p>
        <ul className="space-y-1.5 text-xs text-brand-700">
          {[
            "Documentos de contestação ilimitados",
            "Análise jurídica assistida por IA",
            "Histórico completo de casos",
            "Atualizações quando a lei muda",
            "Suporte por email em 24 horas",
          ].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-brand-500 flex-shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <Link href="/wizard" className="btn-primary w-full justify-center py-4">
          Contestar uma multa agora
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/dashboard" className="btn-secondary w-full justify-center py-3">
          Ver painel
        </Link>
      </div>

      <p className="text-xs text-slate-400 mt-5">
        Receberás um email de confirmação em breve.
      </p>
    </div>
  );
}

function StatusCard({
  icon, iconBg, title, subtitle, children,
}: {
  icon:     React.ReactNode;
  iconBg:   string;
  title:    string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="text-center">
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6", iconBg)}>
        {icon}
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500 mb-6 leading-relaxed text-sm">{subtitle}</p>
      {children}
    </div>
  );
}

function ProgressDot({ active, label, done }: { active: boolean; label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
        done    && "bg-green-500",
        active && !done && "bg-brand-500",
        !active && !done && "bg-slate-200",
      )}>
        {done
          ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          : active
          ? <Loader2 className="w-3 h-3 text-white animate-spin" />
          : <div className="w-2 h-2 rounded-full bg-slate-400" />
        }
      </div>
      <span className={cn(
        "text-sm",
        done || active ? "text-slate-700 font-medium" : "text-slate-400"
      )}>
        {label}
      </span>
    </div>
  );
}
