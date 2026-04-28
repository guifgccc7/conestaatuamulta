/**
 * DocumentEditorExample
 *
 * Standalone usage example — drop this into any page for testing.
 * Shows the full flow: AI analysis → editable document → paywall gate.
 *
 * In the real wizard this component is mounted inside Step6Review.
 */

"use client";

import { useState } from "react";
import { DocumentEditor } from "./DocumentEditor";
import { PaywallModal }   from "@/components/paywall/PaywallModal";
import type { AiOutput }  from "@/lib/document/types";

// ─── Sample document (would come from /api/documents/generate in production) ──

const SAMPLE_DOCUMENT = `IMPUGNAÇÃO JUDICIAL / RECURSO DE COIMA
(Artigo 59.º e ss. do Decreto-Lei n.º 433/82, de 27 de outubro — Regime Geral das Contraordenações e Coimas)

Exmo. Senhor
Presidente do Tribunal de Instrução Criminal
Entidade Autuante: GNR — Guarda Nacional Republicana

JOÃO MANUEL SILVA FERREIRA, portador/a do NIF n.º 123456789, com domicílio em Rua das Flores, n.º 12, 1200-192 Lisboa, na qualidade de arguido/a e titular/condutor do veículo com a matrícula AA-12-BB, vem, nos termos e para os efeitos dos artigos 59.º e seguintes do Decreto-Lei n.º 433/82, de 27 de outubro (Regime Geral das Contraordenações e Coimas — RGCO), apresentar a presente

IMPUGNAÇÃO JUDICIAL

da decisão condenatória constante do Auto de Contraordenação n.º 2024/GNR/00123, datado de 15 de março de 2024, lavrado pela GNR — Guarda Nacional Republicana, com base nos seguintes

FUNDAMENTOS DE FACTO E DE DIREITO:

I — IDENTIFICAÇÃO E ENQUADRAMENTO

1. O/A arguido/a é titular/responsável pelo veículo de matrícula AA-12-BB, nos termos do artigo 162.º, n.º 1 do CE.

2. A velocidade máxima alegadamente registada foi de 112 km/h, num local com limite fixado em 90 km/h, o que, segundo a autoridade autuante, consubstanciaria uma infração ao disposto no artigo 24.º do CE.

3. O/A arguido/a não se conforma com tal decisão pelos fundamentos que se expõem de seguida.

II — FUNDAMENTOS DA IMPUGNAÇÃO

1. FALTA DE CERTIFICADO DE CALIBRAÇÃO DO EQUIPAMENTO DE MEDIÇÃO

Nos termos do Decreto-Lei n.º 291/90, de 20 de setembro, e da Portaria n.º 1504/2008, de 22 de dezembro, os equipamentos de medição de velocidade estão sujeitos a verificação metrológica periódica obrigatória.

O auto de contraordenação não especifica o número de série, modelo, marca ou data da última verificação periódica do equipamento utilizado. A ausência desta informação impede o arguido de aferir da validade e conformidade do equipamento, violando o direito ao contraditório (artigo 32.º, n.º 1 da CRP).

(CE art. 24.º; DL 291/90; Portaria 1504/2008; TRP acórdão 14/11/2018)

2. FALTA DE PROVA DO EXCESSO DE VELOCIDADE

Não consta do auto qualquer elemento fotográfico, de vídeo ou de outro suporte documental que comprove a velocidade alegadamente registada de 112 km/h.

O princípio in dubio pro reo, consagrado no artigo 32.º, n.º 2 da Constituição da República Portuguesa (CRP), impõe que, na dúvida, se decida a favor do arguido.

(CE art. 170.º, n.º 1; CRP art. 32.º, n.º 2)

3. FUNDAMENTOS COMPLEMENTARES — ANÁLISE JURÍDICA ADICIONAL

3.1 A ausência de registo fotográfico ou vídeo da alegada infração constitui lacuna probatória grave que, à luz da jurisprudência consolidada dos tribunais de relação portugueses, impede uma condenação segura.

3.2 A margem de erro legal do equipamento de medição, conforme estabelecida na Portaria 1504/2008, não foi deduzida ao valor registado, o que pode alterar o escalão da infração ou mesmo excluir a sua existência.

IV — PEDIDO

Nestes termos e nos demais de direito aplicáveis, requer a V. Ex.ª que se digne:

a) Julgar procedente a presente impugnação e, em consequência, absolver o/a arguido/a da contraordenação que lhe é imputada;

b) Subsidiariamente, determinar a redução da coima aplicada para o mínimo legal, ponderando a situação económica do/a arguido/a e a ausência de antecedentes contraordenacionais relevantes, nos termos do artigo 18.º do RGCO;

c) Condenar a entidade autuante nas custas do processo.

Lisboa, 1 de abril de 2026

O/A Arguido/A,
_______________________________
João Manuel Silva Ferreira
NIF: 123456789
Morada: Rua das Flores, n.º 12, 1200-192 Lisboa

---

NOTA INFORMATIVA — GERAÇÃO AUTOMÁTICA

Este documento foi gerado automaticamente pela plataforma contestaatuamulta.pt em 1 de abril de 2026. O texto da secção de fundamentação jurídica foi redigido com apoio de inteligência artificial.

Este documento constitui uma minuta de apoio ao cidadão no exercício do seu direito de impugnação ao abrigo do artigo 59.º e seguintes do Decreto-Lei n.º 433/82 (RGCO). Não constitui aconselhamento jurídico personalizado.

contestaatuamulta.pt — contacto@contestaatuamulta.pt`;

// ─── Sample AI output ─────────────────────────────────────────────────────────

const SAMPLE_AI_OUTPUT: AiOutput = {
  argumentos: [
    "A ausência de registo fotográfico ou vídeo da alegada infração constitui lacuna probatória grave que, à luz da jurisprudência consolidada dos tribunais de relação portugueses, impede uma condenação segura.",
    "A margem de erro legal do equipamento de medição, conforme estabelecida na Portaria 1504/2008, não foi deduzida ao valor registado, o que pode alterar o escalão da infração ou mesmo excluir a sua existência.",
  ],
  caseStrength: "forte",
};

// ─── Example component ────────────────────────────────────────────────────────

export function DocumentEditorExample() {
  const [isPaid,      setIsPaid]      = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [editedText,  setEditedText]  = useState(SAMPLE_DOCUMENT);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Revisão do documento
          </h1>
          <p className="text-sm text-slate-500">
            Podes editar o documento antes de descarregar
          </p>
        </div>
        {/* Dev toggle to simulate payment */}
        <button
          onClick={() => setIsPaid((v) => !v)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${
            isPaid
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-slate-100 text-slate-500 border-slate-200"
          }`}
        >
          {isPaid ? "✓ Pago (simular)" : "Simular pagamento"}
        </button>
      </div>

      {/* The editor */}
      <DocumentEditor
        documentText={SAMPLE_DOCUMENT}
        aiOutput={SAMPLE_AI_OUTPUT}
        isPaid={isPaid}
        onPaywall={() => setPaywallOpen(true)}
        onDownload={() => alert("Download triggered — integrate with /api/documents/download")}
        onChange={setEditedText}
      />

      {/* Word count */}
      <p className="text-xs text-slate-400 text-right">
        Texto atual: {editedText.length.toLocaleString("pt-PT")} caracteres
      </p>

      {/* Paywall modal (demo — no real caseId) */}
      <PaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        caseId="00000000-0000-0000-0000-000000000000"
        previewText={editedText.slice(0, 800)}
        fineLabel="Exemplo — Excesso de velocidade"
      />
    </div>
  );
}
