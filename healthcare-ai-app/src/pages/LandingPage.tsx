import { useEffect, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Heart,
  History,
  Info,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

type Icon = ComponentType<{ className?: string }>

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'contact', label: 'Contact' },
] as const

const SECTION_IDS = ['hero', 'features', 'how-it-works', 'why-choose-us', 'app-preview', 'contact'] as const

const FEATURE_CARDS = [
  {
    icon: Bot,
    title: 'AI Medical Chatbot',
    description: 'A natural, conversational assistant that helps users understand symptoms, medicines, and next steps.',
  },
  {
    icon: Stethoscope,
    title: 'Symptom Checker',
    description: 'Turn plain-language symptoms into structured guidance, urgency cues, and specialty suggestions.',
  },
  {
    icon: Pill,
    title: 'Medicine Information',
    description: 'Instantly explain common use cases, dosage patterns, precautions, and side effects.',
  },
  {
    icon: Heart,
    title: 'Doctor Recommendations',
    description: 'Recommend the right specialist based on the user’s concern, history, and care needs.',
  },
  {
    icon: MessageCircle,
    title: 'Real-Time Chat',
    description: 'Fast, low-friction chat interactions with a polished support-style experience.',
  },
  {
    icon: History,
    title: 'Chat History',
    description: 'Resume previous consultations, review past answers, and keep the conversation context-rich.',
  },
] as const

const WORKFLOW_STEPS = [
  {
    icon: Search,
    step: '01',
    title: 'Enter Your Symptoms',
    description: 'Share what you are feeling in plain language, along with helpful context like duration and severity.',
  },
  {
    icon: Activity,
    step: '02',
    title: 'AI Analyzes Information',
    description: 'The assistant organizes the input, checks for signals, and prepares a clear, concise response.',
  },
  {
    icon: ShieldCheck,
    step: '03',
    title: 'Receive Health Guidance',
    description: 'Get practical next steps, suggested specialties, and a polished summary you can act on confidently.',
  },
] as const

const WHY_CARDS = [
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Support is available whenever users need guidance, including evenings, weekends, and late-night concerns.',
  },
  {
    icon: Bot,
    title: 'Fast AI Responses',
    description: 'Short response times keep the experience fluid, reassuring, and productive from the first message onward.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Conversations',
    description: 'Designed with privacy-first interaction patterns and a professional healthcare experience in mind.',
  },
  {
    icon: Sparkles,
    title: 'User-Friendly Experience',
    description: 'Clean layouts, clear language, and guided flows make the product feel approachable to everyone.',
  },
] as const

const HERO_STATS = [
  { icon: Clock, value: '24/7', label: 'Always-on guidance' },
  { icon: Activity, value: 'Instant', label: 'AI triage support' },
  { icon: ShieldCheck, value: 'Secure', label: 'Private conversations' },
] as const

const CHAT_MESSAGES = [
  {
    role: 'user',
    text: 'I have a headache and mild fever since this morning.',
  },
  {
    role: 'assistant',
    text: 'Thanks for sharing that. I can help you review possible causes, medicine guidance, and whether it would be wise to speak with a doctor.',
  },
] as const

const SYMPTOM_BARS = [
  { label: 'Headache', width: 'w-11/12', tone: 'bg-blue-500' },
  { label: 'Fever', width: 'w-4/5', tone: 'bg-emerald-500' },
  { label: 'Fatigue', width: 'w-3/4', tone: 'bg-cyan-500' },
] as const

const DOCTOR_CARDS = [
  {
    name: 'Dr. Emily Chen',
    specialty: 'Cardiology',
    rating: '4.9',
    note: 'Available tomorrow',
  },
  {
    name: 'Dr. Marcus Rivera',
    specialty: 'General Practice',
    rating: '4.8',
    note: 'Online today',
  },
  {
    name: 'Dr. Priya Nair',
    specialty: 'Dermatology',
    rating: '4.7',
    note: 'Evening slots',
  },
] as const

function scrollToSection(id: string) {
  const element = document.getElementById(id)
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
    </div>
  )
}

function IconTile({
  icon: Icon,
  title,
  description,
  tone = 'bg-blue-50 text-blue-700',
}: {
  icon: Icon
  title: string
  description: string
  tone?: string
}) {
  return (
    <div className="group rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(15,23,42,0.11)]">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone} transition-transform duration-300 group-hover:scale-105`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  )
}

function PreviewPanel({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string
  icon: Icon
  accent: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <div className={`flex items-center justify-between border-b border-slate-200/70 px-5 py-4 ${accent}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/90 text-slate-900 shadow-sm">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="text-[11px] font-medium text-slate-500">Production-style dashboard preview</p>
          </div>
        </div>
        <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          Live
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')

  const primaryCta = isAuthenticated ? '/dashboard' : '/signup'
  const loginTarget = isAuthenticated ? '/dashboard' : '/login'

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180

      for (const id of SECTION_IDS) {
        const element = document.getElementById(id)
        if (!element) continue

        const top = element.offsetTop
        const bottom = top + element.offsetHeight

        if (scrollPosition >= top && scrollPosition < bottom) {
          setActiveSection(id)
          return
        }
      }
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigateToSection = (id: string) => {
    setMobileMenuOpen(false)
    scrollToSection(id)
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-blue-200/40 blur-3xl animate-pulseGlow" />
      <div className="pointer-events-none absolute right-[-6rem] top-[8rem] h-[22rem] w-[22rem] rounded-full bg-emerald-200/35 blur-3xl animate-pulseGlow" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[18rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-100/40 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigateToSection('hero')}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-200">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <div>
              <p className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">MediAssist AI</p>
              <p className="text-[11px] font-medium text-slate-500">AI-Powered Medical Recommendation Chatbot</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm lg:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => navigateToSection(link.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeSection === link.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to={loginTarget}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
            >
              Login
            </Link>
            <Link
              to={primaryCta}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-xl md:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => navigateToSection(link.id)}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    activeSection === link.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ))}

              <div className="mt-2 grid grid-cols-2 gap-3">
                <Link
                  to={loginTarget}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow-sm"
                >
                  Login
                </Link>
                <Link
                  to={primaryCta}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section id="hero" className="scroll-mt-28 pb-12 pt-12 sm:pb-14 sm:pt-14 lg:pb-16 lg:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.03fr_0.97fr]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered healthcare guidance, designed for modern teams
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Your AI-Powered Healthcare Assistant
              </h1>

              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Get symptom-based health guidance, medicine information, and personalized healthcare recommendations
                instantly.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={primaryCta}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Start Chatting
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => navigateToSection('features')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700"
                >
                  Learn More
                </button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {HERO_STATS.map(({ icon: Icon, value, label }) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-slate-200/80 bg-white/80 p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-3 text-xl font-black tracking-tight text-slate-900">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-2xl">
              <div className="relative rounded-[2rem] border border-white/70 bg-white/70 p-3 shadow-[0_28px_90px_rgba(15,23,42,0.16)] backdrop-blur-2xl">
                <div className="rounded-[1.6rem] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 text-white shadow-3d-soft">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                        <Bot className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">MediAssist Live</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-emerald-300">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(52,211,153,0.15)]" />
                          Secure, responsive, and ready to help
                        </div>
                      </div>
                    </div>
                    <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
                      AI Caredesk
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {CHAT_MESSAGES.map((message) => (
                      <div
                        key={message.text}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                            message.role === 'user'
                              ? 'rounded-tr-md bg-blue-600 text-white'
                              : 'rounded-tl-md border border-white/10 bg-white/10 text-white/90'
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {['Headache', 'Fever', 'Medication'].map((chip) => (
                      <div
                        key={chip}
                        className="rounded-2xl border border-white/10 bg-white/10 px-2.5 py-1.5 text-center text-[10px] font-semibold text-white/85"
                      >
                        {chip}
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white/70">
                      <span>Confidence</span>
                      <span>92%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 py-12 sm:py-14">
          <SectionHeading
            eyebrow="Core Capabilities"
            title="Everything a modern healthcare chatbot should feel like"
            description="MediAssist AI brings together triage, medicine guidance, doctor recommendations, and consultation history in one polished experience."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_CARDS.map((feature) => (
              <IconTile
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-28 py-12 sm:py-14">
          <SectionHeading
            eyebrow="Simple Workflow"
            title="How the experience works"
            description="A clear three-step journey keeps users moving from concern to guidance without confusion."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={step.title}
                  className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl"
                >
                  <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-50 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
                      {step.step}
                    </div>
                  </div>
                  <h3 className="relative mt-5 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="relative mt-2.5 text-sm leading-6 text-slate-600">{step.description}</p>
                  <div className="relative mt-5 flex items-center gap-2 text-sm font-semibold text-blue-700">
                    <span>Step {index + 1}</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section id="why-choose-us" className="scroll-mt-28 py-12 sm:py-14">
          <SectionHeading
            eyebrow="Trust Signals"
            title="Why people choose MediAssist AI"
            description="The product balances speed, clarity, and safety so it feels like a dependable healthcare companion."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.11)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <card.icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="app-preview" className="scroll-mt-28 py-12 sm:py-14">
          <SectionHeading
            eyebrow="App Preview"
            title="Designed like a premium healthcare SaaS product"
            description="These dashboard mockups show how the chatbot, symptom analysis, and doctor recommendation flows can feel in a real product."
          />

          <div className="mt-8 grid gap-4 xl:grid-cols-3">
            <PreviewPanel
              title="Chat Interface"
              icon={MessageCircle}
              accent="bg-gradient-to-r from-blue-50 to-cyan-50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">AI Health Chat</p>
                    <p className="text-xs text-slate-500">Real-time consultation style</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    Online
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="max-w-[84%] rounded-3xl rounded-tl-md bg-slate-100 px-4 py-3 text-sm leading-6 text-slate-700">
                    I have a headache and feel tired.
                  </div>
                  <div className="ml-auto max-w-[86%] rounded-3xl rounded-tr-md bg-blue-600 px-4 py-3 text-sm leading-6 text-white">
                    I can help with that. Let’s look at possible causes, medicine guidance, and the best next step.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['Headache', 'Fever', 'Medication'].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700"
                    >
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex-1 text-sm text-slate-400">Ask the assistant anything...</div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </PreviewPanel>

            <PreviewPanel
              title="Symptom Analysis Screen"
              icon={Activity}
              accent="bg-gradient-to-r from-emerald-50 to-cyan-50"
            >
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-950 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold">Symptom summary</p>
                      <p className="text-[11px] text-white/55">Structured AI analysis</p>
                    </div>
                    <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                      Low urgency
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {SYMPTOM_BARS.map((bar) => (
                      <div key={bar.label}>
                        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-white/60">
                          <span>{bar.label}</span>
                          <span>Likely</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className={`h-2 rounded-full ${bar.width} ${bar.tone}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Info className="h-4 w-4 text-blue-600" />
                    Recommended next step
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Rest, stay hydrated, and monitor your symptoms. If they persist or worsen, seek professional care.
                  </p>
                </div>
              </div>
            </PreviewPanel>

            <PreviewPanel
              title="Doctor Recommendation Screen"
              icon={Calendar}
              accent="bg-gradient-to-r from-blue-50 to-emerald-50"
            >
              <div className="space-y-3">
                {DOCTOR_CARDS.map((doctor) => (
                  <div
                    key={doctor.name}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-sm font-bold text-white">
                        {doctor.name
                          .split(' ')
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{doctor.name}</p>
                        <p className="text-xs text-slate-500">{doctor.specialty}</p>
                        <p className="mt-1 text-[11px] font-semibold text-emerald-600">{doctor.note}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                        <Heart className="h-3.5 w-3.5" fill="currentColor" />
                        {doctor.rating}
                      </div>
                      <button
                        type="button"
                        className="mt-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-700"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </PreviewPanel>
          </div>
        </section>

        <section id="disclaimer" className="scroll-mt-28 py-8 sm:py-10">
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-950">Medical Disclaimer</h3>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-amber-900/90 sm:text-base">
                  This platform provides informational health guidance only and does not replace professional medical
                  advice, diagnosis, or treatment.
                </p>
                <p className="mt-3 text-sm leading-7 text-amber-900/75">
                  If symptoms feel severe or urgent, contact a licensed healthcare provider or local emergency services.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-28 py-12 sm:py-14">
          <SectionHeading
            eyebrow="Contact"
            title="Ready to bring MediAssist AI to your audience?"
            description="Use the contact panel below for support, partnership questions, or product conversations."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-7 text-white shadow-[0_28px_90px_rgba(15,23,42,0.2)] sm:p-8">
              <div className="pointer-events-none absolute -right-10 top-[-2rem] h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-8 bottom-[-3rem] h-40 w-40 rounded-full bg-emerald-500/20 blur-3xl" />

              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
                  <Mail className="h-3.5 w-3.5" />
                  We typically reply within one business day
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                  Let’s build a better healthcare conversation.
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
                  MediAssist AI is designed to feel calm, trustworthy, and easy to use for patients, caregivers, and
                  modern healthcare teams.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href="mailto:support@mediassist.ai"
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <Mail className="h-5 w-5 text-blue-200" />
                    <p className="mt-2.5 text-sm font-semibold">support@mediassist.ai</p>
                    <p className="mt-1 text-xs text-white/55">General support and product questions</p>
                  </a>
                  <a
                    href="tel:+15550132026"
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <Phone className="h-5 w-5 text-emerald-200" />
                    <p className="mt-2.5 text-sm font-semibold">+1 (555) 013-2026</p>
                    <p className="mt-1 text-xs text-white/55">Monday to Friday, 9:00 AM - 6:00 PM</p>
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Support scope</p>
                  <p className="text-xs text-slate-500">Great for demos, pilots, and portfolio presentations</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  'Patient support workflows',
                  'AI chatbot UX demos',
                  'Doctor recommendation dashboards',
                  'Product and client presentation support',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg">
                  <Heart className="h-5 w-5" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-extrabold tracking-tight text-slate-900">MediAssist AI</p>
                  <p className="text-[11px] text-slate-500">Smart healthcare recommendations</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
                A polished AI medical recommendation chatbot built for modern, professional product experiences.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">About</h4>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Built to help users quickly understand symptoms, medicines, and the next best action with a friendly UI.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Contact</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  support@mediassist.ai
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-600" />
                  +1 (555) 013-2026
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Legal</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MediAssist AI. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="font-medium text-slate-600 transition hover:text-blue-700"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
