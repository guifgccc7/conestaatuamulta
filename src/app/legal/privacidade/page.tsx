import { Navbar } from "@/components/layout/Navbar";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade e tratamento de dados pessoais da plataforma Contesta a Tua Multa, ao abrigo do RGPD e da Lei n.º 58/2019.",
};

// ─── TOC items ────────────────────────────────────────────────────────────────

const sections = [
  { id: "responsavel",      label: "1. Responsável pelo Tratamento" },
  { id: "dados",            label: "2. Dados Pessoais Tratados" },
  { id: "finalidades",      label: "3. Finalidades e Bases Jurídicas" },
  { id: "subprocessadores", label: "4. Sub-processadores e Transferências" },
  { id: "ia",               label: "5. Inteligência Artificial" },
  { id: "conservacao",      label: "6. Prazo de Conservação" },
  { id: "direitos",         label: "7. Direitos do Titular" },
  { id: "cookies",          label: "8. Cookies e Tecnologias Similares" },
  { id: "decisoes",         label: "9. Decisões Automatizadas" },
  { id: "seguranca",        label: "10. Segurança" },
  { id: "menores",          label: "11. Menores" },
  { id: "alteracoes",       label: "12. Alterações a esta Política" },
  { id: "reclamacoes",      label: "13. Reclamações e Autoridade de Controlo" },
];

export default function PrivacidadePage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <h1 className="text-3xl font-bold text-slate-900 mb-1">Política de Privacidade</h1>
        <p className="text-slate-500 text-sm mb-1">
          Versão: <strong>2026-04</strong> · Última atualização: <strong>Abril 2026</strong>
        </p>
        <p className="text-slate-500 text-xs mb-8">
          Ao abrigo do Regulamento (UE) 2016/679 (RGPD), da Lei n.º 58/2019 de 8 de agosto
          e do Regulamento (UE) 2024/1689 (AI Act).
        </p>

        {/* ── Legal notice box ────────────────────────────────────────────── */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-900">
          <strong>Resumo simples:</strong> Recolhemos apenas os dados necessários para gerar
          a tua carta de contestação. Não vendemos dados. Não usamos publicidade.
          Podes aceder, corrigir ou apagar os teus dados a qualquer momento.
          A IA é opcional e não recebe o teu NIF, nome ou morada.
        </div>

        {/* ── Table of contents ───────────────────────────────────────────── */}
        <nav className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-10">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Índice</p>
          <ol className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-brand-600 hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10 text-slate-700">

          {/* ── 1. Responsável ──────────────────────────────────────────────── */}
          <section id="responsavel">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">1. Responsável pelo Tratamento</h2>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm space-y-1">
              <p><strong>Designação:</strong> Contesta a Tua Multa</p>
              <p><strong>Website:</strong> contestaatuamulta.pt</p>
              <p><strong>Email geral:</strong>{" "}
                <a href="mailto:contacto@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  contacto@contestaatuamulta.pt
                </a>
              </p>
              <p><strong>Email de privacidade / RGPD:</strong>{" "}
                <a href="mailto:privacidade@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  privacidade@contestaatuamulta.pt
                </a>
              </p>
            </div>
            <p className="text-sm mt-3">
              Nos termos do art. 4.º, n.º 7 do RGPD, somos o <strong>Responsável pelo Tratamento</strong>{" "}
              dos dados pessoais recolhidos e tratados através desta plataforma.
              Não nomeámos um Encarregado de Proteção de Dados (EPD/DPO) por não estarmos
              obrigados nos termos do art. 37.º do RGPD e do art. 9.º da Lei n.º 58/2019,
              dada a natureza e escala do tratamento. O ponto de contacto para todos os
              assuntos de privacidade é <strong>privacidade@contestaatuamulta.pt</strong>.
            </p>
          </section>

          {/* ── 2. Dados recolhidos ─────────────────────────────────────────── */}
          <section id="dados">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">2. Dados Pessoais Tratados</h2>
            <p className="text-sm mb-3">Recolhemos exclusivamente os dados necessários para a prestação do serviço
              (princípio da minimização, art. 5.º, n.º 1, al. c) do RGPD):</p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Categoria</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Dados específicos</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Obrigatório?</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Identificação", "Nome completo, NIF (Número de Identificação Fiscal)", "Sim — exigido pelo documento legal"],
                    ["Contacto", "Endereço de email, número de telefone", "Email obrigatório; telefone opcional"],
                    ["Morada", "Morada completa com código postal", "Sim — consta na carta de contestação"],
                    ["Documento de identidade", "Número do Cartão de Cidadão", "Opcional — fortalece a identificação"],
                    ["Infração", "Tipo de infração, data, hora, local, matrícula", "Sim — essencial para o documento"],
                    ["Contexto do caso", "Respostas às perguntas sobre as circunstâncias da infração", "Sim"],
                    ["Dados de pagamento", "Processados pela Stripe (não armazenamos números de cartão)", "Sim se efetuar pagamento"],
                    ["Dados de sessão", "Token de sessão autenticada (NextAuth)", "Sim — funcional"],
                    ["Autenticação Google", "Token OAuth, email, foto de perfil (se iniciar sessão com Google)", "Só se usar Google Sign-In"],
                  ].map(([cat, dados, obr], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 border border-slate-200 font-medium text-slate-800">{cat}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600">{dados}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-500 text-xs">{obr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-800">
              <strong>NIF — nota especial (Lei n.º 58/2019, art. 4.º):</strong> O Número de Identificação Fiscal
              é tratado com base na necessidade de execução do contrato de prestação de serviços
              (art. 6.º, n.º 1, al. b) do RGPD), uma vez que a sua inclusão na carta de contestação
              é legalmente exigida pelo art. 60.º e seguintes do RGCO (DL 433/82).
            </div>
          </section>

          {/* ── 3. Finalidades e bases jurídicas ────────────────────────────── */}
          <section id="finalidades">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">3. Finalidades e Bases Jurídicas</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Finalidade</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Base jurídica (RGPD)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Criação e gestão de conta de utilizador", "Art. 6.º, n.º 1, al. b) — execução do contrato"],
                    ["Geração do documento de contestação / carta de impugnação", "Art. 6.º, n.º 1, al. b) — execução do contrato"],
                    ["Processamento de pagamentos e emissão de recibos", "Art. 6.º, n.º 1, al. b) e c) — contrato e obrigação legal"],
                    ["Tratamento de dados de infração para construção do caso", "Art. 6.º, n.º 1, al. b) — execução do contrato"],
                    ["Conservação de registos fiscais (7 anos)", "Art. 6.º, n.º 1, al. c) — obrigação legal (art. 52.º CIVA)"],
                    ["Utilização do assistente de IA (opcional)", "Art. 6.º, n.º 1, al. a) — consentimento (dado no passo 5 do assistente)"],
                    ["Manutenção da segurança e prevenção de fraude", "Art. 6.º, n.º 1, al. f) — interesse legítimo"],
                    ["Resposta a pedidos e reclamações", "Art. 6.º, n.º 1, al. f) — interesse legítimo"],
                  ].map(([fin, base], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 border border-slate-200 text-slate-700">{fin}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600 text-xs">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-3 text-slate-600">
              Quando o tratamento se basear no <strong>consentimento</strong> (art. 6.º, n.º 1, al. a)),
              tem o direito de o retirar a qualquer momento, sem que tal afete a licitude do tratamento
              efetuado com base no consentimento previamente dado (art. 7.º, n.º 3 do RGPD).
              Para retirar o consentimento, contacte <a href="mailto:privacidade@contestaatuamulta.pt" className="text-brand-600 hover:underline">privacidade@contestaatuamulta.pt</a>.
            </p>
          </section>

          {/* ── 4. Sub-processadores e transferências internacionais ─────────── */}
          <section id="subprocessadores">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">4. Sub-processadores e Transferências Internacionais</h2>
            <p className="text-sm mb-4">
              Partilhamos dados com os seguintes fornecedores que atuam como
              <strong> sub-processadores</strong> nos termos do art. 28.º do RGPD.
              Não vendemos nem partilhamos dados com terceiros para fins publicitários ou comerciais.
            </p>

            <div className="space-y-3">
              {[
                {
                  name: "Stripe, Inc.",
                  role: "Processamento de pagamentos",
                  country: "EUA",
                  safeguard: "Cláusulas Contratuais Padrão (SCC) aprovadas pela Comissão Europeia + Stripe é certificado no EU-U.S. Data Privacy Framework",
                  link: "https://stripe.com/en-pt/privacy",
                  data: "Dados de pagamento, email para recibo, endereço de faturação",
                },
                {
                  name: "Anthropic, PBC",
                  role: "Assistente de inteligência artificial (opcional)",
                  country: "EUA",
                  safeguard: "Cláusulas Contratuais Padrão (SCC) + DPA com Anthropic. Os dados enviados à IA não são usados para treino de modelos.",
                  link: "https://www.anthropic.com/legal/privacy",
                  data: "Tipo de infração, circunstâncias do caso, fundamentos selecionados, notas adicionais. NÃO inclui: nome, NIF, morada, email.",
                },
                {
                  name: "Fornecedor de infraestrutura cloud (Vercel / Railway)",
                  role: "Alojamento da aplicação e base de dados",
                  country: "UE / EUA",
                  safeguard: "Servidores europeus preferenciais; SCC aplicáveis onde os dados transitam para EUA",
                  link: "https://vercel.com/legal/privacy-policy",
                  data: "Toda a informação armazenada na plataforma",
                },
                {
                  name: "Google LLC (OAuth, opcional)",
                  role: "Autenticação via Google Sign-In",
                  country: "EUA",
                  safeguard: "EU-U.S. Data Privacy Framework + SCC",
                  link: "https://policies.google.com/privacy",
                  data: "Nome, email e foto de perfil (apenas se usar Google Sign-In)",
                },
              ].map((sp) => (
                <div key={sp.name} className="border border-slate-200 rounded-xl p-4 text-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-slate-900">{sp.name}</p>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">{sp.country}</span>
                  </div>
                  <p className="text-slate-600 text-xs mb-1"><strong>Função:</strong> {sp.role}</p>
                  <p className="text-slate-600 text-xs mb-1"><strong>Dados partilhados:</strong> {sp.data}</p>
                  <p className="text-slate-600 text-xs mb-1"><strong>Salvaguarda (transferência internacional):</strong> {sp.safeguard}</p>
                  <a href={sp.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 text-xs hover:underline">
                    Política de Privacidade →
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* ── 5. IA ────────────────────────────────────────────────────────── */}
          <section id="ia">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">5. Inteligência Artificial e Tratamento de Dados</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900 mb-4">
              <strong>Aviso nos termos do RGPD art. 13.º e do Regulamento (UE) 2024/1689 (AI Act), art. 50.º:</strong>{" "}
              Esta plataforma incorpora um sistema de inteligência artificial (Anthropic Claude)
              para sugestão de fundamentos jurídicos e revisão de documentos.
              A utilização do assistente de IA é <strong>sempre opcional</strong>.
              O utilizador é sempre informado quando interage com um sistema de IA e quando
              o documento contém conteúdo gerado ou assistido por IA.
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs">
                <p className="font-semibold text-red-800 mb-2">❌ NÃO é enviado à IA</p>
                <ul className="space-y-1 text-red-700">
                  <li>Nome completo</li>
                  <li>NIF</li>
                  <li>Morada</li>
                  <li>Email e telefone</li>
                  <li>Número do Cartão de Cidadão</li>
                  <li>Dados de pagamento</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs">
                <p className="font-semibold text-green-800 mb-2">✓ Enviado à IA (se usar o assistente)</p>
                <ul className="space-y-1 text-green-700">
                  <li>Tipo e subtipo de infração</li>
                  <li>Data, hora, local e entidade autuante</li>
                  <li>Velocidade registada / limite (excesso velocidade)</li>
                  <li>Fundamentos de defesa selecionados</li>
                  <li>Notas adicionais inseridas</li>
                  <li>Respostas às perguntas de contexto</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              A Anthropic, PBC atua como sub-processador ao abrigo de um Acordo de Tratamento
              de Dados (DPA) nos termos do art. 28.º do RGPD. Os dados enviados ao assistente
              de IA <strong>não são utilizados para treino de modelos</strong> sem consentimento explícito.
              Classificação de risco ao abrigo do AI Act: <strong>risco limitado</strong>
              (art. 50.º — obrigações de transparência aplicáveis). O sistema não toma decisões
              vinculativas — a decisão final de contestar e o conteúdo do documento são sempre
              da responsabilidade do utilizador.
            </p>
          </section>

          {/* ── 6. Conservação ──────────────────────────────────────────────── */}
          <section id="conservacao">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">6. Prazo de Conservação</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Categoria de dados</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Prazo</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Fundamento</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Dados de conta (nome, email)", "Enquanto a conta estiver ativa + 90 dias após pedido de eliminação", "Art. 5.º, n.º 1, al. e) RGPD"],
                    ["Documentos gerados (PDF)", "12 meses a partir da data de geração", "Necessidade contratual; razoabilidade"],
                    ["Dados de contestação (caso)", "12 meses ou até eliminação pelo utilizador", "Necessidade contratual"],
                    ["Registos de pagamento e faturas", "7 anos a partir da data da transação", "Art. 52.º CIVA / art. 35.º CIRC (obrigação fiscal)"],
                    ["Cookies de sessão", "Duração da sessão (expiram com o fecho do browser ou após tempo configurado)", "Estritamente necessário"],
                    ["Logs de segurança e acesso", "90 dias", "Interesse legítimo — segurança"],
                  ].map(([cat, prazo, fund], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 border border-slate-200 text-slate-700 font-medium">{cat}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600">{prazo}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-500 text-xs">{fund}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm mt-3 text-slate-600">
              Após o termo do prazo de conservação, os dados são eliminados de forma segura
              ou anonimizados. Os registos de pagamento são mantidos exclusivamente para
              cumprimento das obrigações fiscais e não podem ser eliminados antecipadamente
              a pedido do utilizador (art. 17.º, n.º 3, al. b) do RGPD).
            </p>
          </section>

          {/* ── 7. Direitos ─────────────────────────────────────────────────── */}
          <section id="direitos">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">7. Direitos do Titular dos Dados</h2>
            <p className="text-sm mb-4">
              Nos termos dos arts. 15.º a 22.º do RGPD e da Lei n.º 58/2019, tem os seguintes direitos,
              exercíveis gratuitamente com resposta no prazo de <strong>30 dias</strong>:
            </p>

            <div className="space-y-3">
              {[
                {
                  right: "Direito de Acesso (art. 15.º)",
                  desc: "Obter confirmação de que tratamos dados seus e aceder a uma cópia dos mesmos.",
                  how: "Automático: descarrega um ficheiro JSON completo em Dashboard → \"Exportar os meus dados\".",
                },
                {
                  right: "Direito de Retificação (art. 16.º)",
                  desc: "Corrigir dados inexatos ou incompletos.",
                  how: "Na plataforma, pode editar os dados do caso em qualquer passo do assistente. Para dados de conta, contacte-nos.",
                },
                {
                  right: "Direito ao Apagamento / Direito a ser esquecido (art. 17.º)",
                  desc: "Solicitar a eliminação dos seus dados pessoais, salvo obrigações legais de retenção.",
                  how: "Automático: Dashboard → \"Conta e dados\" → \"Eliminar conta\". Os registos de pagamento são retidos 7 anos (obrigação fiscal).",
                },
                {
                  right: "Direito de Oposição (art. 21.º)",
                  desc: "Opor-se ao tratamento baseado em interesse legítimo (art. 6.º, n.º 1, al. f)).",
                  how: "Envie email a privacidade@contestaatuamulta.pt com o assunto \"Oposição ao tratamento\".",
                },
                {
                  right: "Direito à Portabilidade (art. 20.º)",
                  desc: "Receber os seus dados num formato estruturado, de uso corrente e leitura automática (JSON).",
                  how: "Automático: Dashboard → \"Conta e dados\" → \"Exportar os meus dados\".",
                },
                {
                  right: "Direito de Limitação do Tratamento (art. 18.º)",
                  desc: "Solicitar a limitação do tratamento enquanto uma disputa está em curso.",
                  how: "Envie email a privacidade@contestaatuamulta.pt com o assunto \"Limitação do tratamento\".",
                },
                {
                  right: "Direito de Retirar o Consentimento (art. 7.º, n.º 3)",
                  desc: "Retirar o consentimento dado para tratamentos baseados no mesmo, sem efeito retroativo.",
                  how: "Envie email a privacidade@contestaatuamulta.pt com o assunto \"Retirada de consentimento\".",
                },
              ].map((item) => (
                <div key={item.right} className="border border-slate-200 rounded-xl p-4">
                  <p className="font-semibold text-slate-900 text-sm mb-1">{item.right}</p>
                  <p className="text-xs text-slate-600 mb-1">{item.desc}</p>
                  <p className="text-xs text-brand-700 font-medium">→ {item.how}</p>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4 text-sm">
              <p className="font-semibold mb-1">Como exercer os seus direitos por email:</p>
              <p className="text-slate-600 text-xs">
                Envie email para{" "}
                <a href="mailto:privacidade@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  privacidade@contestaatuamulta.pt
                </a>{" "}
                indicando: (1) o seu nome e email de conta; (2) o direito que pretende exercer;
                (3) documentação de identificação se solicitarmos (para verificar identidade, art. 12.º, n.º 6 RGPD).
                Respondemos no prazo de 30 dias (prorrogável 60 dias em casos complexos, com informação do atraso).
              </p>
            </div>
          </section>

          {/* ── 8. Cookies ──────────────────────────────────────────────────── */}
          <section id="cookies">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">8. Cookies e Tecnologias Similares</h2>
            <p className="text-sm mb-3">
              Utilizamos exclusivamente cookies <strong>estritamente necessários</strong> para o
              funcionamento da plataforma, ao abrigo da isenção de consentimento prevista na
              Lei n.º 41/2004 de 18 de agosto (transposta da Diretiva ePrivacy 2002/58/CE),
              art. 4.º-A, e nas orientações da CNPD.
              <strong> Não utilizamos cookies de rastreio, publicidade ou análise de comportamento.</strong>
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Cookie</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Finalidade</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Duração</th>
                    <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["next-auth.session-token", "Token de sessão autenticada (NextAuth.js)", "30 dias (renovável)", "Sessão / autenticação — essencial"],
                    ["next-auth.csrf-token", "Proteção CSRF (Cross-Site Request Forgery)", "Sessão", "Segurança — essencial"],
                    ["next-auth.callback-url", "Redirecionamento pós-autenticação", "Sessão", "Funcional — essencial"],
                    ["__Secure-next-auth.*", "Versões seguras dos cookies NextAuth (HTTPS)", "30 dias", "Sessão / autenticação — essencial"],
                  ].map(([name, purpose, duration, type], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-3 py-2 border border-slate-200 font-mono text-xs text-slate-700">{name}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-600 text-xs">{purpose}</td>
                      <td className="px-3 py-2 border border-slate-200 text-slate-500 text-xs">{duration}</td>
                      <td className="px-3 py-2 border border-slate-200 text-xs text-green-700 font-medium">{type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              O armazenamento local (<em>localStorage</em>) é utilizado para guardar rascunhos do
              assistente durante 24 horas, exclusivamente no seu dispositivo. Estes dados não são
              enviados para os nossos servidores enquanto não completar o processo.
            </p>
          </section>

          {/* ── 9. Decisões automatizadas ───────────────────────────────────── */}
          <section id="decisoes">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">9. Decisões Automatizadas e Definição de Perfis</h2>
            <p className="text-sm text-slate-600">
              Esta plataforma <strong>não toma decisões automatizadas com efeitos jurídicos</strong>{" "}
              sobre o utilizador, na aceção do art. 22.º do RGPD. O sistema de IA sugere argumentos
              jurídicos e estrutura o documento, mas a decisão final — incluindo o conteúdo do
              documento enviado às entidades — é sempre da responsabilidade do utilizador, que
              pode aceitar, modificar ou recusar quaisquer sugestões antes de proceder ao download.
              Não realizamos definição de perfis (<em>profiling</em>) para fins de marketing.
            </p>
          </section>

          {/* ── 10. Segurança ───────────────────────────────────────────────── */}
          <section id="seguranca">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">10. Segurança</h2>
            <p className="text-sm text-slate-600 mb-3">
              Aplicamos as medidas técnicas e organizativas adequadas nos termos do art. 32.º do RGPD:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
              <li>Transmissão encriptada com <strong>TLS 1.2+</strong> (HTTPS em todas as páginas)</li>
              <li>Palavras-passe armazenadas com hash <strong>bcrypt</strong> (fator de custo: 12)</li>
              <li>Tokens de sessão seguros com rotação regular (NextAuth.js)</li>
              <li>Proteção CSRF em todos os formulários</li>
              <li>Acesso à base de dados restrito e autenticado</li>
              <li>Dados de pagamento processados exclusivamente pela Stripe (certificação <strong>PCI-DSS Nível 1</strong>)</li>
              <li>Revisão de segurança periódica do código</li>
            </ul>
            <p className="text-sm mt-3 text-slate-600">
              Em caso de violação de dados pessoais com risco para os titulares, notificaremos
              a CNPD no prazo de 72 horas (art. 33.º RGPD) e os utilizadores afetados sem demora
              injustificada se a violação for suscetível de resultar em elevado risco (art. 34.º RGPD).
            </p>
          </section>

          {/* ── 11. Menores ─────────────────────────────────────────────────── */}
          <section id="menores">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">11. Menores</h2>
            <p className="text-sm text-slate-600">
              Esta plataforma destina-se a utilizadores com <strong>18 ou mais anos</strong> (condutores
              e proprietários de veículos). Não recolhemos intencionalmente dados de menores.
              Se tiver conhecimento de que um menor forneceu dados sem consentimento parental,
              contacte-nos para eliminação imediata.
            </p>
          </section>

          {/* ── 12. Alterações ──────────────────────────────────────────────── */}
          <section id="alteracoes">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">12. Alterações a esta Política</h2>
            <p className="text-sm text-slate-600">
              Podemos atualizar esta Política de Privacidade para refletir alterações legais,
              regulatórias ou operacionais. Em caso de alterações materiais, notificaremos os
              utilizadores com conta ativa por email com antecedência mínima de <strong>30 dias</strong>.
              A versão atualizada será identificada pela data de revisão no topo desta página.
              A utilização continuada da plataforma após essa data constitui aceitação das alterações.
            </p>
          </section>

          {/* ── 13. Reclamações ─────────────────────────────────────────────── */}
          <section id="reclamacoes">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">13. Reclamações e Autoridade de Controlo</h2>
            <p className="text-sm text-slate-600 mb-3">
              Se entender que o tratamento dos seus dados viola o RGPD ou a Lei n.º 58/2019,
              tem o direito de apresentar reclamação à autoridade de controlo nacional:
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-slate-900 mb-1">CNPD — Comissão Nacional de Proteção de Dados</p>
              <p className="text-slate-600 text-xs">Av. D. Carlos I, 134, 1.º — 1200-651 Lisboa</p>
              <p className="text-slate-600 text-xs">Tel: +351 213 928 400</p>
              <p className="text-slate-600 text-xs">
                Web:{" "}
                <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                  www.cnpd.pt
                </a>
              </p>
              <p className="text-slate-600 text-xs mt-2">
                Antes de recorrer à CNPD, encorajamo-lo a contactar-nos diretamente em{" "}
                <a href="mailto:privacidade@contestaatuamulta.pt" className="text-brand-600 hover:underline">
                  privacidade@contestaatuamulta.pt
                </a>{" "}
                para que possamos resolver a situação. Responderemos no prazo de 30 dias (art. 12.º RGPD).
              </p>
            </div>
          </section>

        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-brand-600 hover:underline text-sm">
            ← Voltar ao início
          </Link>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/legal/termos" className="hover:underline">Termos de Serviço</Link>
            <Link href="/legal/aviso-legal" className="hover:underline">Aviso Legal</Link>
          </div>
        </div>

      </main>
    </>
  );
}
