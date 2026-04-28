import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Aviso Legal",
};

/**
 * Aviso Legal — Imprint / Legal Notice
 *
 * Required under Portuguese e-commerce law:
 *  - DL 7/2004 (Comércio Eletrónico), art. 10.º — mandatory service provider information
 *  - DL 24/2014 (Contratos Celebrados à Distância), art. 4.º — pre-contract disclosure
 */
export default function AvisoLegalPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Aviso Legal</h1>
        <p className="text-slate-500 text-sm mb-8">Última atualização: Janeiro 2025</p>

        <div className="space-y-8 text-slate-700">

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Identificação do Prestador de Serviços</h2>
            <p className="mb-2">
              Nos termos do art. 10.º do Decreto-Lei n.º 7/2004 (Lei do Comércio Eletrónico), o
              prestador do serviço da sociedade da informação acessível em{" "}
              <strong>contestaatuamulta.pt</strong> disponibiliza as seguintes informações:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-1.5">
              <p><strong>Designação:</strong> Contesta a Tua Multa</p>
              <p><strong>Website:</strong> contestaatuamulta.pt</p>
              <p><strong>Email de contacto:</strong>{" "}
                <a href="mailto:contacto@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  contacto@contestaatuamulta.pt
                </a>
              </p>
              <p><strong>Suporte ao cliente:</strong>{" "}
                <a href="mailto:suporte@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  suporte@contestaatuamulta.pt
                </a>
              </p>
              <p><strong>Proteção de dados:</strong>{" "}
                <a href="mailto:privacidade@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  privacidade@contestaatuamulta.pt
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Natureza do Serviço</h2>
            <p>
              A plataforma contestaatuamulta.pt é um serviço de tecnologia jurídica (LegalTech) que
              gera automaticamente minutas de impugnação de coimas de trânsito com base nas
              informações fornecidas pelo utilizador. O serviço <strong>não constitui consulta
              jurídica personalizada</strong> nos termos da Lei n.º 49/2004 (acesso ao direito),
              nem exercício de advocacia ao abrigo do Estatuto da Ordem dos Advogados (Lei n.º
              145/2015, art. 66.º).
            </p>
            <p className="mt-2">
              A auto-representação em fase administrativa de contraordenação de trânsito é um
              direito legalmente garantido pelo art. 61.º do Regime Geral das Contraordenações e
              Coimas (Decreto-Lei n.º 433/82, RGCO), que <strong>não exige a constituição de
              mandatário</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Inteligência Artificial</h2>
            <p>
              Parte das funcionalidades desta plataforma utiliza sistemas de inteligência artificial
              (IA) para auxiliar na sugestão de fundamentos jurídicos e redação de documentos. Em
              conformidade com o Regulamento (UE) 2024/1689 (AI Act), art. 50.º, o utilizador é
              sempre informado quando interage com um sistema de IA. A utilização do assistente de
              IA é opcional. Consulte a nossa{" "}
              <Link href="/legal/privacidade#ia" className="text-brand-600 hover:underline">
                Política de Privacidade — secção 4-A
              </Link>{" "}
              para informação sobre dados enviados ao assistente de IA.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Propriedade Intelectual</h2>
            <p>
              Todos os conteúdos da plataforma (código-fonte, design, templates, textos) são
              propriedade da contestaatuamulta.pt e estão protegidos por direitos de autor nos
              termos do Código do Direito de Autor e dos Direitos Conexos (CDADC). Os documentos
              gerados para o utilizador são da sua propriedade exclusiva para uso pessoal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Responsabilidade</h2>
            <p>
              A contestaatuamulta.pt não garante o resultado de nenhum processo de contestação.
              O êxito depende exclusivamente das circunstâncias concretas do caso e da apreciação
              das autoridades competentes. Consulte a cláusula 7 dos nossos{" "}
              <Link href="/legal/termos" className="text-brand-600 hover:underline">
                Termos e Condições
              </Link>{" "}
              para a delimitação completa de responsabilidade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Resolução Alternativa de Litígios</h2>
            <p>
              Em caso de litígio de consumo, o utilizador pode recorrer a entidades de resolução
              alternativa de litígios (RAL) registadas em Portugal, disponíveis em{" "}
              <a
                href="https://www.consumidor.gov.pt"
                className="text-brand-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                consumidor.gov.pt
              </a>
              {" "}e na plataforma europeia de resolução de litígios em linha{" "}
              <a
                href="https://ec.europa.eu/consumers/odr"
                className="text-brand-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                ec.europa.eu/consumers/odr
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Lei Aplicável</h2>
            <p>
              O presente aviso legal e a utilização da plataforma regem-se pela legislação
              portuguesa. Para efeitos de resolução judicial de litígios, é competente o tribunal
              da comarca de Lisboa.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-brand-600 hover:underline">
            ← Voltar ao início
          </Link>
          <Link href="/legal/termos" className="text-slate-500 hover:underline">
            Termos e Condições
          </Link>
          <Link href="/legal/privacidade" className="text-slate-500 hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </main>
    </>
  );
}
