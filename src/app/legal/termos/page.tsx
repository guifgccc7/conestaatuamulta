import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Termos e Condições",
};

export default function TermosPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Termos e Condições</h1>
        <p className="text-slate-500 text-sm mb-8">Última atualização: Janeiro 2025</p>

        <div className="space-y-8 text-slate-700">

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Objeto</h2>
            <p>
              A plataforma <strong>Contesta a Tua Multa</strong> (contestaatuamulta.pt) presta um serviço
              de geração automática de documentos de contestação de coimas de trânsito em Portugal,
              com base nas informações fornecidas pelo utilizador e em templates legais pré-configurados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Natureza do Serviço</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-3">
              <strong>Aviso importante:</strong> A plataforma contestaatuamulta.pt é um serviço de tecnologia jurídica (LegalTech) que auxilia os cidadãos a exercerem o seu direito de defesa em processos de contraordenação de trânsito, ao abrigo do artigo 61.º do Decreto-Lei n.º 433/82 (RGCO), que <strong>não exige a constituição de mandatário em fase administrativa</strong>. O serviço gera automaticamente minutas de impugnação com base nas informações fornecidas pelo utilizador e em fundamentos jurídicos gerais. <strong>Não constitui consulta jurídica personalizada</strong> (Lei n.º 49/2004) nem exercício de advocacia (Lei n.º 145/2015 — Estatuto da Ordem dos Advogados, art. 66.º).
            </div>
            <p>
              Os documentos gerados baseiam-se no Código da Estrada, no Regime Geral das Contraordenações e Coimas (RGCO) e na jurisprudência pública disponível. O utilizador é o único responsável pela veracidade das informações fornecidas e pela decisão de submeter o documento à entidade competente. A plataforma não garante o resultado da contestação.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2-A. Utilização de Inteligência Artificial</h2>
            <p>
              Parte das funcionalidades desta plataforma recorre a sistemas de inteligência artificial (IA) para auxiliar na sugestão de fundamentos jurídicos e na redação de documentos. Nos termos do Regulamento (UE) 2024/1689 (AI Act), art. 50.º, o utilizador é sempre informado quando interage com um sistema de IA ou quando o documento gerado contém conteúdo elaborado por IA. O utilizador pode rever e editar todo o conteúdo gerado por IA antes de submeter o documento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Registo e Conta</h2>
            <p>
              Para aceder ao serviço pago é necessário criar uma conta com email e password ou através
              de conta Google. O utilizador é responsável pela confidencialidade das suas credenciais.
              É proibida a partilha de conta entre diferentes pessoas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Preços e Pagamentos</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Documento avulso — €4,99</strong>: pagamento único por documento gerado.
                O acesso ao documento fica disponível por 12 meses.
              </li>
              <li>
                <strong>Subscrição mensal — €9,99/mês</strong>: documentos ilimitados durante o período
                de subscrição. Renovação automática mensal. Pode ser cancelada a qualquer momento.
              </li>
              <li>
                <strong>Período experimental</strong>: novos subscritores têm 7 dias gratuitos.
                Não é cobrado qualquer valor durante o período experimental.
              </li>
            </ul>
            <p className="mt-3">
              Os pagamentos são processados pela Stripe, Inc. Todos os preços incluem IVA à taxa legal aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Direito de Arrependimento e Reembolsos</h2>
            <p>
              Ao abrigo do DL 24/2014, o utilizador dispõe de <strong>14 dias</strong> para exercer o direito
              de arrependimento. Contudo, ao solicitar a geração imediata do documento, o utilizador renuncia
              expressamente a este direito, nos termos do art. 16.º, al. m) do referido decreto-lei.
            </p>
            <p className="mt-2">
              Concedemos uma <strong>garantia de satisfação de 7 dias</strong>: se não estiver satisfeito
              com o serviço por qualquer motivo, reembolsamos o valor pago sem questões. Para solicitar
              reembolso, contacte{" "}
              <a href="mailto:suporte@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                suporte@contestaatuamulta.pt
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Cancelamento de Subscrição</h2>
            <p>
              A subscrição pode ser cancelada a qualquer momento através do painel de utilizador ou por email.
              O acesso mantém-se até ao fim do período já pago. Não há reembolsos parciais por períodos não utilizados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Limitação de Responsabilidade</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm mb-3">
              <p className="font-semibold text-slate-800 mb-2">⚠️ Lê esta cláusula com atenção antes de pagar</p>
              <ol className="space-y-2 text-slate-700 list-decimal list-inside">
                <li>A contestaatuamulta.pt <strong>não garante, em qualquer circunstância, o resultado do processo de contestação</strong>. O êxito depende exclusivamente das circunstâncias concretas do caso, da prova disponível, da apreciação da entidade autuante e da interpretação das autoridades competentes.</li>
                <li>A plataforma não garante que os documentos gerados sejam adequados para todas as situações específicas do utilizador. O utilizador é o único responsável pela verificação da adequação do documento ao seu caso e pela decisão de o submeter.</li>
                <li>A responsabilidade total da contestaatuamulta.pt, por qualquer causa, não excederá o valor efetivamente pago pelo utilizador pelo serviço em causa.</li>
                <li>Ficam excluídos da limitação prevista no n.º 3 os casos de dolo ou negligência grosseira da plataforma, bem como os casos previstos na legislação imperativa de defesa do consumidor (Lei n.º 24/96).</li>
                <li>A plataforma não é responsável por decisões que o utilizador tome com base nos documentos gerados ou nas sugestões do assistente de IA.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo da plataforma (templates, código, design) é propriedade da contestaatuamulta.pt.
              Os documentos gerados para o utilizador são de sua propriedade exclusiva para uso pessoal.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Lei Aplicável</h2>
            <p>
              Estes termos regem-se pela lei portuguesa. Para resolução de litígios, é competente o
              tribunal da comarca de Lisboa, sem prejuízo dos meios alternativos de resolução de litígios
              disponíveis em <a href="https://www.consumidor.gov.pt" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">consumidor.gov.pt</a>.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200">
          <Link href="/" className="text-brand-600 hover:underline text-sm">
            ← Voltar ao início
          </Link>
        </div>
      </main>
    </>
  );
}
