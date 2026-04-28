import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FaqAccordion } from "@/components/landing/FaqAccordion";
import {
  CheckCircle2,
  Clock,
  FileText,
  ShieldCheck,
  Zap,
  ChevronRight,
  Star,
  AlertTriangle,
  RotateCcw,
  Lock,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  MailCheck,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CASE_TYPES = [
  { emoji: "🚗", label: "Excesso de velocidade",   href: "/wizard?type=SPEEDING",      sub: "Radar, LIDAR, VASCo" },
  { emoji: "🅿️", label: "Estacionamento proibido", href: "/wizard?type=PARKING",       sub: "EMEL, SMTUC, câmaras" },
  { emoji: "📋", label: "Erro administrativo",     href: "/wizard?type=ADMIN_ERROR",   sub: "Matrícula, data, local" },
  { emoji: "📱", label: "Uso de telemóvel",        href: "/wizard?type=MOBILE_PHONE",  sub: "Mãos-livres, chamadas" },
  { emoji: "💺", label: "Falta de cinto",          href: "/wizard?type=SEATBELT",      sub: "Condutor ou passageiro" },
  { emoji: "🚦", label: "Semáforo vermelho",       href: "/wizard?type=TRAFFIC_LIGHT", sub: "Câmera ou agente" },
];

const STEPS = [
  {
    n:     "1",
    time:  "2 minutos",
    icon:  <FileText className="w-6 h-6 text-brand-600" />,
    title: "Conta-nos o que aconteceu",
    desc:  "Responde a perguntas simples sobre a multa — sem precisares de saber nada de direito. Nós descodificamos a lei por ti.",
  },
  {
    n:     "2",
    time:  "Automático",
    icon:  <Sparkles className="w-6 h-6 text-brand-600" />,
    title: "A IA identifica os teus argumentos",
    desc:  "O sistema analisa o teu caso, seleciona os melhores fundamentos jurídicos e escreve a carta em linguagem formal e correta.",
  },
  {
    n:     "3",
    time:  "Imediato",
    icon:  <MailCheck className="w-6 h-6 text-brand-600" />,
    title: "Descarregas. Envias com prova.",
    desc:  "PDF pronto a imprimir. Guiamos-te passo a passo até ao envio por correio registado com aviso de receção — a tua prova legal de que a entidade recebeu a contestação.",
  },
];

const TESTIMONIALS = [
  {
    name:   "Ana Pereira",
    city:   "Lisboa",
    fine:   "Excesso de velocidade",
    text:   "Não acreditei que fosse tão simples. Em 5 minutos tinha uma carta que parecia escrita por um advogado. Impressionante para o preço que paguei.",
    rating: 5,
  },
  {
    name:   "João Costa",
    city:   "Porto",
    fine:   "Estacionamento EMEL",
    text:   "A matrícula na multa estava errada. A plataforma gerou exatamente o argumento certo. Processo todo em menos de 10 minutos.",
    rating: 5,
  },
  {
    name:   "Marta Santos",
    city:   "Braga",
    fine:   "Radar de velocidade",
    text:   "Nunca percebi nada de leis mas o formulário é tão guiado que qualquer pessoa consegue. A carta ficou impecável.",
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    q: "Não percebo nada de leis. Consigo mesmo assim usar a plataforma?",
    a: "Sim — foi exatamente para isso que a criámos. O formulário guia-te passo a passo com perguntas simples. Não precisas de citar artigos nem de saber qualquer terminologia jurídica. Nós tratamos disso por ti.",
  },
  {
    q: "Tenho prazo para contestar? Já passaram alguns dias.",
    a: "O prazo habitual é de 15 dias úteis a contar da data em que recebeste a notificação da multa, ao abrigo do art. 70.º do RGCO. Consulta sempre a notificação para confirmares o prazo exato. Se ainda estiveres dentro do prazo, age já — cada dia conta.",
  },
  {
    q: "A contestação garante que fico absolvido/a?",
    a: "Não podemos garantir resultados — e desconfia de qualquer serviço que o faça. O que garantimos é um documento juridicamente correto, com os melhores fundamentos disponíveis para o teu caso. O resultado depende das circunstâncias concretas e da apreciação da autoridade.",
  },
  {
    q: "O documento tem validade legal? Preciso de advogado?",
    a: "Sim, o documento tem validade legal. A lei portuguesa (art. 61.º do RGCO) garante-te o direito de te defenderes sem advogado em fase administrativa — é o teu direito. O nosso serviço gera a minuta; tu assinas e envias.",
  },
  {
    q: "Como envio a carta à entidade autuante?",
    a: "Normalmente por carta registada com aviso de receção, para o endereço indicado na notificação. Algumas entidades como a ANSR e a EMEL aceitam também por email ou balcão digital. Damos-te as instruções específicas depois do download.",
  },
  {
    q: "E se não ficar satisfeito/a?",
    a: "Temos uma garantia de satisfação de 7 dias. Se por qualquer motivo não ficares satisfeito/a com o serviço, devolvemos o valor pago na íntegra, sem questões. Basta enviares um email para suporte@contestaatuamulta.pt.",
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── Urgency Bar ──────────────────────────────────────────────────── */}
      <div className="bg-amber-500 text-white text-center px-4 py-2.5">
        <p className="text-sm font-semibold flex items-center justify-center gap-2 flex-wrap">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Prazo legal: tens <strong>15 dias úteis</strong> após a notificação para contestar.
          <Link href="/wizard" className="underline underline-offset-2 hover:no-underline">
            Começa agora →
          </Link>
        </p>
      </div>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-white pt-16 pb-24 px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/60 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">

          {/* Social proof pill */}
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 shadow-sm text-slate-600 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <div className="flex -space-x-1">
              {["🧑","👩","👨"].map((e, i) => (
                <span key={i} className="w-5 h-5 text-sm flex items-center justify-center">{e}</span>
              ))}
            </div>
            <span>Mais de <strong className="text-slate-900">2.400 portugueses</strong> já contestaram</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            A tua multa pode<br />
            <span className="text-brand-600">estar errada.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-xl sm:text-2xl text-slate-500 max-w-2xl mx-auto mb-4 leading-relaxed font-light">
            Tens direito a contestar — e não precisas de advogado.
          </p>
          <p className="text-base text-slate-500 max-w-xl mx-auto mb-10">
            Em 5 minutos geramos uma carta de impugnação em linguagem jurídica formal,
            pronta a enviar. Por <strong className="text-slate-700">€9,90</strong>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/wizard"
              className="inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30 hover:-translate-y-0.5"
            >
              Contestar a minha multa
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-lg px-8 py-4 rounded-2xl transition-all"
            >
              Ver como funciona
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Sem advogado necessário
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-500" />
              Pronto em menos de 5 minutos
            </span>
            <span className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-brand-500" />
              Garantia de 7 dias
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-slate-400" />
              Pagamento seguro via Stripe
            </span>
            <span className="flex items-center gap-1.5">
              <MailCheck className="w-4 h-4 text-sky-500" />
              Guia de entrega incluído
            </span>
          </div>
        </div>
      </section>

      {/* ─── Case type grid ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest text-center mb-3">
            Começa aqui
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-2">
            Qual é a tua multa?
          </h2>
          <p className="text-slate-500 text-center mb-10 text-sm">
            Seleciona o tipo de infração e começamos de imediato
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {CASE_TYPES.map((ct) => (
              <Link
                key={ct.label}
                href={ct.href}
                className="group bg-white border-2 border-slate-200 hover:border-brand-400 rounded-2xl p-5 flex flex-col items-center gap-2.5 text-center transition-all hover:shadow-md hover:shadow-brand-100"
              >
                <span className="text-3xl sm:text-4xl">{ct.emoji}</span>
                <span className="font-semibold text-slate-800 group-hover:text-brand-700 text-sm sm:text-base leading-snug">
                  {ct.label}
                </span>
                <span className="text-xs text-slate-400 leading-tight">{ct.sub}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Contestar <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest text-center mb-3">
            Como funciona
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            Três passos. Cinco minutos. Sem complicações.
          </h2>
          <p className="text-slate-500 text-center mb-16 max-w-lg mx-auto">
            Não precisas de saber nada de direito. O sistema faz o trabalho difícil por ti.
          </p>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden sm:block absolute top-10 left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-px bg-gradient-to-r from-brand-200 via-brand-300 to-brand-200" />

            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center relative">
                {/* Icon + number */}
                <div className="relative mb-5 z-10">
                  <div className="w-16 h-16 bg-brand-50 border-2 border-brand-100 rounded-2xl flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-brand-600 text-white rounded-full flex items-center justify-center text-xs font-extrabold shadow-sm">
                    {step.n}
                  </div>
                </div>

                {/* Time badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-full px-2.5 py-0.5 mb-3">
                  <Clock className="w-2.5 h-2.5" />
                  {step.time}
                </span>

                <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/wizard"
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-8 py-4 rounded-2xl shadow-md shadow-brand-600/20 transition-all"
            >
              Começar agora — é gratuito ver o documento
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-400 mt-3">A pré-visualização é grátis. Pagas apenas se quiseres descarregar o PDF.</p>
          </div>
        </div>
      </section>

      {/* ─── Comparison ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest text-center mb-3">
            A alternativa ao advogado
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            Poupar €140 numa decisão de 5 minutos
          </h2>
          <p className="text-slate-500 text-center mb-12 text-sm">
            Um advogado cobra entre €150 e €400 para fazer o mesmo documento.
          </p>

          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200">
              <div className="px-5 py-4" />
              <div className="px-5 py-4 text-center border-x border-slate-200">
                <p className="text-xs text-slate-500 font-medium mb-1">Advogado</p>
              </div>
              <div className="px-5 py-4 text-center bg-brand-600">
                <p className="text-xs text-white font-bold mb-1">Contesta a Tua Multa</p>
              </div>
            </div>

            {/* Rows */}
            {[
              {
                label: "Preço",
                lawyer: "€150 – €400",
                us:     "€9,90",
                highlight: true,
              },
              {
                label: "Tempo até ter a carta",
                lawyer: "2 a 5 dias",
                us:     "5 minutos",
                highlight: false,
              },
              {
                label: "Disponibilidade",
                lawyer: "Horário de escritório",
                us:     "24 horas, 7 dias",
                highlight: false,
              },
              {
                label: "Precisas de deslocação",
                lawyer: "Sim",
                us:     "Não",
                highlight: false,
              },
              {
                label: "Legalmente válido",
                lawyer: "✓",
                us:     "✓",
                highlight: false,
              },
              {
                label: "Guia de entrega passo a passo",
                lawyer: "Não incluído",
                us:     "✓ Correio registado (AR)",
                highlight: false,
              },
              {
                label: "Garantia de devolução",
                lawyer: "Raramente",
                us:     "7 dias, sem questões",
                highlight: false,
              },
            ].map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 border-b border-slate-100 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
              >
                <div className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-700">{row.label}</p>
                </div>
                <div className="px-5 py-4 text-center border-x border-slate-100">
                  <p className={`text-sm ${row.highlight ? "text-slate-400 line-through" : "text-slate-500"}`}>
                    {row.lawyer}
                  </p>
                </div>
                <div className="px-5 py-4 text-center bg-brand-50/50">
                  <p className={`text-sm font-semibold ${row.highlight ? "text-brand-600 text-base font-extrabold" : "text-brand-700"}`}>
                    {row.us}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest text-center mb-3">
            Testemunhos
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            O que dizem quem já contestou
          </h2>
          <p className="text-slate-500 text-center mb-12 text-sm">
            Pessoas comuns, sem formação jurídica, que exerceram o seu direito.
          </p>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                {/* Fine badge */}
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2.5 py-0.5 mb-3">
                  {t.fine}
                </span>
                {/* Quote */}
                <p className="text-slate-700 text-sm leading-relaxed mb-5">"{t.text}"</p>
                {/* Author */}
                <div className="flex items-center gap-2.5 pt-4 border-t border-slate-100">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6 max-w-md mx-auto leading-relaxed">
            Os testemunhos refletem a experiência individual com o serviço de geração de documentos.
            Os resultados das contestações variam consoante as circunstâncias de cada caso.
          </p>
        </div>
      </section>

      {/* ─── Trust elements ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-white mb-12">
            Criado para inspirar confiança
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <MailCheck className="w-6 h-6 text-sky-400" />,
                title: "Do formulário ao correio registado",
                desc:  "Não paramos no PDF. Guiamos-te até à entrega — passo a passo, com correio registado com aviso de receção. A tua prova de que a contestação chegou.",
              },
              {
                icon: <ShieldCheck className="w-6 h-6 text-brand-400" />,
                title: "O teu direito, garantido por lei",
                desc:  "O art. 61.º do RGCO garante-te o direito de contestares sem mandatário em fase administrativa.",
              },
              {
                icon: <RotateCcw className="w-6 h-6 text-amber-400" />,
                title: "Garantia de 7 dias",
                desc:  "Não ficaste satisfeito/a? Devolvemos o valor pago na íntegra. Sem burocracia, sem perguntas.",
              },
              {
                icon: <Lock className="w-6 h-6 text-slate-400" />,
                title: "Dados seguros (RGPD)",
                desc:  "Pagamento cifrado via Stripe. Os teus dados pessoais são protegidos conforme o Regulamento Europeu de Privacidade.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-2xl p-5"
              >
                <div className="mb-3">{item.icon}</div>
                <h3 className="font-semibold text-white text-sm mb-1.5">{item.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section id="precos" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest text-center mb-3">
            Preços
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            Simples e transparente
          </h2>
          <p className="text-slate-500 text-center mb-14 max-w-md mx-auto text-sm">
            O advogado cobra €150 a €400 pelo mesmo documento. Nós cobramos muito menos — com garantia de devolução.
          </p>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">

            {/* Pay per document */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 flex flex-col">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-4">Por documento</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-slate-900">€9</span>
                  <span className="text-3xl font-extrabold text-slate-900">,90</span>
                </div>
                <p className="text-slate-400 text-sm mb-6">pagamento único · acesso por 12 meses</p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "1 carta de contestação em PDF",
                    "Todos os tipos de infração",
                    "Análise IA incluída",
                    "Guia de entrega por correio registado (AR)",
                    "Garantia de satisfação de 7 dias",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/wizard"
                className="mt-auto inline-flex items-center justify-center gap-2 border-2 border-brand-600 text-brand-600 hover:bg-brand-50 font-bold py-3.5 px-6 rounded-xl transition-colors"
              >
                Contestar por €9,90
              </Link>
              <p className="text-center text-xs text-slate-400 mt-3">
                Pré-visualização gratuita antes de pagar
              </p>
            </div>

            {/* Subscription */}
            <div className="bg-brand-600 rounded-2xl p-8 flex flex-col relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-5 right-5 bg-amber-400 text-amber-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Melhor valor
              </div>

              <div>
                <p className="text-sm font-semibold text-brand-200 mb-4">Subscrição mensal</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-white">€4</span>
                  <span className="text-3xl font-extrabold text-white">,90</span>
                  <span className="text-brand-300 font-medium ml-1">/mês</span>
                </div>
                <p className="text-brand-300 text-sm mb-6">7 dias grátis · cancela quando quiseres</p>
                <ul className="space-y-2.5 mb-8">
                  {[
                    "Documentos ilimitados",
                    "Todos os tipos de infração",
                    "Análise IA em cada contestação",
                    "Guia de entrega por correio registado (AR)",
                    "Arquivo de todos os casos",
                    "Garantia de satisfação de 7 dias",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-white">
                      <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                href="/auth/login"
                className="mt-auto inline-flex items-center justify-center gap-2 bg-white text-brand-700 hover:bg-brand-50 font-bold py-3.5 px-6 rounded-xl transition-colors shadow-sm"
              >
                <Zap className="w-4 h-4" />
                Experimentar 7 dias grátis
              </Link>
              <p className="text-center text-xs text-brand-300 mt-3">
                Sem cartão de crédito até ao fim do período grátis
              </p>
            </div>
          </div>

          {/* Guarantee callout */}
          <div className="mt-8 flex items-center justify-center gap-2.5 text-sm text-slate-500">
            <RotateCcw className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span>
              Todos os planos incluem <strong className="text-slate-700">garantia de satisfação de 7 dias</strong> — devolução integral sem questões.
            </span>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest text-center mb-3">
            Perguntas frequentes
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-3">
            Tens dúvidas? Nós temos respostas.
          </h2>
          <p className="text-slate-500 text-center mb-12 text-sm">
            As perguntas que toda a gente faz antes de contestar a primeira multa.
          </p>

          <FaqAccordion items={FAQ_ITEMS} />

          <p className="text-center text-slate-500 text-sm mt-10">
            Ainda tens dúvidas?{" "}
            <a href="mailto:suporte@contestaatuamulta.pt" className="text-brand-600 font-semibold hover:underline">
              Envia-nos um email
            </a>{" "}
            — respondemos em menos de 24 horas.
          </p>
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-8">
            <AlertTriangle className="w-4 h-4" />
            O prazo não espera — tens 15 dias úteis
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
            Não deixes passar<br />sem fazer nada.
          </h2>
          <p className="text-slate-500 text-lg mb-2 leading-relaxed">
            Contestar é o teu direito. A carta custa €9,90.
          </p>
          <p className="text-slate-400 text-sm mb-10">
            A pré-visualização do documento é completamente gratuita — pagas só se quiseres descarregar.
          </p>

          <Link
            href="/wizard"
            className="inline-flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:-translate-y-0.5"
          >
            Contestar a minha multa agora
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
              Pré-visualização grátis
            </span>
            <span className="flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 text-brand-400" />
              Garantia de 7 dias
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Pagamento seguro (Stripe)
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              Sem advogado necessário
            </span>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <SiteFooter />
    </div>
  );
}
