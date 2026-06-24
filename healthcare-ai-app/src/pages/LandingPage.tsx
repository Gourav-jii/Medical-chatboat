import { useEffect, useState, type ComponentType, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Bot,
  Clock,
  Heart,
  History,
  Info,
  Mail,
  Menu,
  MessageCircle,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Send,
  User,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import HealFlowLogo from '../components/HealFlowLogo'

type Icon = ComponentType<{ className?: string }>

const NAV_LINKS = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'contact', label: 'Contact' },
] as const

const SECTION_IDS = ['hero', 'features', 'how-it-works', 'why-choose-us', 'disclaimer', 'contact'] as const

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
    description: "Recommend the right specialist based on the user's concern, history, and care needs.",
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

const CONTACT_TOPICS = ['Product demos', 'Partnerships', 'Feedback', 'Support'] as const

interface ContactErrors {
  name?: string
  email?: string
  message?: string
}

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

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('hero')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactErrors, setContactErrors] = useState<ContactErrors>({})
  const [contactLoading, setContactLoading] = useState(false)

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

  const updateContactField = (field: keyof typeof contactForm, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
    if (contactErrors[field]) {
      setContactErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const contactInputClass = (field: keyof ContactErrors) =>
    `w-full rounded-2xl border py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${
      contactErrors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-400'
        : 'border-slate-200 bg-slate-50 focus:border-blue-500'
    }`

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: ContactErrors = {}
    if (!contactForm.name.trim()) nextErrors.name = 'Name is required'
    else if (contactForm.name.trim().length < 2) nextErrors.name = 'Enter at least 2 characters'

    if (!contactForm.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) nextErrors.email = 'Enter a valid email'

    if (!contactForm.message.trim()) nextErrors.message = 'Message is required'
    else if (contactForm.message.trim().length < 12) nextErrors.message = 'Please write a bit more detail'

    setContactErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setContactLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 700))
      toast.success('Thanks for reaching out. We will get back to you soon.')
      setContactForm({ name: '', email: '', message: '' })
    } finally {
      setContactLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-blue-200/40 blur-3xl animate-pulseGlow" />
      <div className="pointer-events-none absolute right-[-6rem] top-[8rem] h-[22rem] w-[22rem] rounded-full bg-emerald-200/35 blur-3xl animate-pulseGlow" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[18rem] w-[36rem] -translate-x-1/2 rounded-full bg-cyan-100/40 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => navigateToSection('hero')} className="flex items-center gap-3 text-left">
            <HealFlowLogo />
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
        <section id="hero" className="scroll-mt-28 pb-12 pt-14 sm:pb-16 sm:pt-16 lg:pb-16 lg:pt-16">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                AI-powered healthcare guidance, designed for modern teams
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Your companion for clear, reassuring health guidance.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Understand symptoms, explore medicine insights, and connect with trusted doctors in a supportive, conversational experience.
              </p>

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
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
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 py-12 sm:py-14">
          <SectionHeading
            eyebrow="How We Help You"
            title="A supportive companion for your health journey"
            description="HealFlow brings together triage, medicine guidance, doctor recommendations, and consultation history in one polished, reassuring experience."
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
            title="Why people choose HealFlow"
            description="The product balances speed, clarity, and safety so it feels like a dependable healthcare companion."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-[2rem] border border-slate-200/80 bg-white/85 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.11)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2.5 text-sm leading-6 text-slate-600">{card.description}</p>
              </div>
            ))}
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
            title="Have a question or want a demo?"
            description="A warm contact area designed to keep support simple, friendly, and accessible."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700">
                <Mail className="h-3.5 w-3.5" />
                Contact & Support
              </div>

              <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Let&apos;s make care feel simpler.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                We are here to support your wellness journey. Reach out to our compassionate team with any questions or feedback.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Email</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">support@healflow.com</p>
                  <p className="mt-1 text-xs text-slate-500">General support and product questions</p>
                </div>
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600">Response</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">Within one business day</p>
                  <p className="mt-1 text-xs text-slate-500">Mon to Fri, 9:00 AM to 6:00 PM</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {CONTACT_TOPICS.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-8"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-200">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Send a message</p>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">Contact form</h3>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Your name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="contact-name"
                      type="text"
                      value={contactForm.name}
                      onChange={(e) => updateContactField('name', e.target.value)}
                      placeholder="Jane Smith"
                      className={`${contactInputClass('name')} pl-10`}
                    />
                  </div>
                  {contactErrors.name && (
                    <p className="mt-1.5 text-xs text-red-600">{contactErrors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="contact-email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => updateContactField('email', e.target.value)}
                      placeholder="you@example.com"
                      className={`${contactInputClass('email')} pl-10`}
                    />
                  </div>
                  {contactErrors.email && (
                    <p className="mt-1.5 text-xs text-red-600">{contactErrors.email}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="contact-message" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Message
                </label>
                <div className="relative">
                  <MessageCircle className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={contactForm.message}
                    onChange={(e) => updateContactField('message', e.target.value)}
                    placeholder="Tell us what you would like help with..."
                    className={`${contactInputClass('message')} min-h-[9rem] resize-none pl-10 pt-3`}
                  />
                </div>
                {contactErrors.message && (
                  <p className="mt-1.5 text-xs text-red-600">{contactErrors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={contactLoading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
              >
                {contactLoading ? (
                  <>
                    Sending...
                  </>
                ) : (
                  <>
                    Send message
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
            <div>
              <HealFlowLogo />
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
                A warm and reassuring health companion, connecting you with clarity and trusted medical professionals.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Company</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>
                  <button type="button" onClick={() => scrollToSection('features')} className="transition hover:text-blue-700">
                    Features
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('how-it-works')} className="transition hover:text-blue-700">
                    How It Works
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => scrollToSection('contact')} className="transition hover:text-blue-700">
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">About Us</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Medical Disclaimer</li>
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">Contact</h4>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  support@healflow.com
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Reply within one business day
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 HealFlow. All rights reserved.</p>
            <div className="flex flex-wrap gap-4">
              <button type="button" onClick={() => scrollToSection('disclaimer')} className="font-medium text-slate-600 transition hover:text-blue-700">
                Medical Disclaimer
              </button>
              <button type="button" onClick={() => scrollToSection('contact')} className="font-medium text-slate-600 transition hover:text-blue-700">
                Contact me
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
