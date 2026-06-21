import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import {
  Heart, Send, Bot, User as UserIcon, LogOut, X, MessageCircle,
  Activity, Calendar, Home,
  ChevronRight, Paperclip, AlertTriangle, CheckCircle,
  Clock, Shield, Star, Loader2, Stethoscope, History, Search, Info, Plus
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

interface ChatSession {
  id: string
  title: string
  preview: string
  time: string
  icon: string
  messages: Message[]
}

interface Appointment {
  doctor: string
  specialty: string
  date: string
  time: string
  status: 'upcoming' | 'completed'
  avatar: string
}


// ── Mock Data & Catalogs ──────────────────────────────────────────────────────
const SAMPLE_RESPONSES: Record<string, string> = {
  default:
    "I'm your AI healthcare assistant. I can help you understand symptoms, review your health records, answer medication questions, and connect you with the right specialists. How can I help you today?",
  headache:
    "Headaches can have many causes including tension, dehydration, stress, or eye strain. For a persistent headache lasting more than 2 days, I recommend consulting a neurologist. Try staying hydrated, resting in a dark room, and avoiding screens. Do you have any other symptoms like nausea or light sensitivity?",
  fever:
    "A fever above 38°C (100.4°F) is typically the body's response to infection. Ensure adequate hydration and rest. Acetaminophen or ibuprofen can help manage discomfort. Seek emergency care if the fever exceeds 39.5°C (103°F) or persists beyond 3 days. Would you like help finding a nearby clinic?",
  medication:
    "I can help you understand your medications. Please note that I provide general information — always follow your prescriber's specific instructions. Would you like information about dosing schedules, potential interactions, or side effects?",
  appointment:
    "I can help you prepare for your appointment. Based on your health records, I'd recommend discussing your recent lab results. Would you like me to generate a summary of your health concerns to share with your doctor?",
  bp: "Your recent blood pressure reading of 118/76 mmHg is within the normal range. Keep maintaining a low-sodium diet, regular exercise, and your current medication schedule. I'll remind you for your next check-up.",
}

function getResponse(input: string): string {
  const l = input.toLowerCase()
  if (l.includes('headache') || l.includes('head pain')) return SAMPLE_RESPONSES.headache
  if (l.includes('fever') || l.includes('temperature')) return SAMPLE_RESPONSES.fever
  if (l.includes('medication') || l.includes('medicine') || l.includes('drug')) return SAMPLE_RESPONSES.medication
  if (l.includes('appointment') || l.includes('doctor') || l.includes('schedule')) return SAMPLE_RESPONSES.appointment
  if (l.includes('blood pressure') || l.includes('bp')) return SAMPLE_RESPONSES.bp
  return SAMPLE_RESPONSES.default
}

function isBookingTrigger(text: string): boolean {
  const l = text.toLowerCase();
  const bookingKeywords = [
    'book', 'schedule', 'appoint', 'booking', 'consultation', 'apointment',
    'milna', 'checkup', 'dikhao', 'karna hai', 'krna hai', 'le', 'krdo', 'kro'
  ];
  const isBookingWord = bookingKeywords.some(kw => l.includes(kw));
  const hasAppointmentWord = l.includes('appointment') || l.includes('doctor') || l.includes('doc') || l.includes('consult');
  return isBookingWord || (hasAppointmentWord && (l.includes('book') || l.includes('kro') || l.includes('krdo') || l.includes('karna') || l.includes('krna')));
}

function extractWebhookReply(payload: unknown): string | null {
  if (payload == null) return null

  if (typeof payload === 'string') {
    const trimmed = payload.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (typeof payload === 'number' || typeof payload === 'boolean' || typeof payload === 'bigint') {
    return String(payload)
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const reply = extractWebhookReply(item)
      if (reply) return reply
    }
    return null
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const keys = [
      'output',
      'message',
      'response',
      'text',
      'reply',
      'answer',
      'content',
      'choices',
      'data',
      'result',
      'body',
      'json',
      'payload',
    ]

    for (const key of keys) {
      const reply = extractWebhookReply(record[key])
      if (reply) return reply
    }
  }

  return null
}

async function parseWebhookResponse(res: Response): Promise<string> {
  const raw = await res.text()
  const trimmed = raw.trim()

  if (!res.ok) {
    throw new Error(trimmed || `HTTP ${res.status}`)
  }

  if (!trimmed) {
    throw new Error('Empty response from webhook')
  }

  try {
    const parsed = JSON.parse(trimmed)
    return extractWebhookReply(parsed) ?? trimmed
  } catch {
    return trimmed
  }
}

function buildWebhookPayload(content: string) {
  return {
    message: content,
    chatInput: content,
    input: content,
    text: content,
    query: content,
    prompt: content,
  }
}

const CONFIGURED_WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL?.trim()
const DEFAULT_WEBHOOK_URL = import.meta.env.DEV
  ? '/webhook-test/medical-chatbot'
  : '/webhook/medical-chatbot'

function toProxiedPath(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return url
  }
}

const WEBHOOK_URL = (() => {
  if (!CONFIGURED_WEBHOOK_URL) return DEFAULT_WEBHOOK_URL

  if (import.meta.env.DEV) {
    return CONFIGURED_WEBHOOK_URL.startsWith('http')
      ? toProxiedPath(CONFIGURED_WEBHOOK_URL)
      : CONFIGURED_WEBHOOK_URL
  }

  if (import.meta.env.PROD && CONFIGURED_WEBHOOK_URL.includes('/webhook-test/')) {
    return CONFIGURED_WEBHOOK_URL.replace('/webhook-test/', '/webhook/')
  }

  return CONFIGURED_WEBHOOK_URL
})()

const DOCTORS = [
  { name: 'Dr. Emily Chen', specialty: 'Cardiologist', avatar: 'EC', rating: '4.9', exp: '12 years', clinic: 'MediAI Cardiology, Suite A', available: 'Tomorrow' },
  { name: 'Dr. Marcus Rivera', specialty: 'General Practitioner', avatar: 'MR', rating: '4.8', exp: '10 years', clinic: 'Primary Care Center, Room 102', available: 'Today' },
  { name: 'Dr. Priya Nair', specialty: 'Dermatologist', avatar: 'PN', rating: '4.7', exp: '8 years', clinic: 'Skin & Allergy Clinic, Suite B', available: 'Thursday' },
  { name: 'Dr. James Wu', specialty: 'Neurologist', avatar: 'JW', rating: '4.9', exp: '15 years', clinic: 'Neurosciences Dept, Floor 3', available: 'Tomorrow' },
  { name: 'Dr. Aisha Patel', specialty: 'Endocrinologist', avatar: 'AP', rating: '4.8', exp: '9 years', clinic: 'Diabetes Care Center, Room 204', available: 'Friday' },
  { name: 'Dr. Kevin Lee', specialty: 'Orthopedist', avatar: 'KL', rating: '4.6', exp: '11 years', clinic: 'Joint & Bone Clinic, Suite C', available: 'Today' },
]

const MEDICINES_DB = [
  { name: 'Lisinopril', category: 'Heart', desc: 'Used to treat high blood pressure and heart failure.', guidelines: 'Take once daily in the morning, with or without food. Avoid potassium supplements.', sideEffects: 'Dry cough, dizziness, headache, fatigue.' },
  { name: 'Metformin', category: 'Diabetes', desc: 'First-line medication for the treatment of type 2 diabetes.', guidelines: 'Take twice daily with meals (breakfast and dinner) to minimize stomach upset.', sideEffects: 'Nausea, diarrhea, abdominal discomfort, metallic taste.' },
  { name: 'Vitamin D3', category: 'Vitamins', desc: 'Supports bone health, calcium absorption, and immune function.', guidelines: 'Take once daily, preferably with a fat-containing meal for optimal absorption.', sideEffects: 'Extremely rare at normal doses. High doses can cause nausea or weakness.' },
  { name: 'Paracetamol', category: 'Pain Relief', desc: 'Common pain reliever and fever reducer.', guidelines: 'Take 500mg - 1000mg every 4-6 hours as needed. Do not exceed 4000mg in 24 hours.', sideEffects: 'Rare, but excessive dose can cause severe liver damage. Avoid alcohol.' },
  { name: 'Ibuprofen', category: 'Pain Relief', desc: 'Nonsteroidal anti-inflammatory drug (NSAID) used for pain and swelling.', guidelines: 'Take 200mg - 400mg every 6 hours with food or milk to prevent stomach irritation.', sideEffects: 'Heartburn, nausea, dizziness, gastrointestinal bleeding on long-term use.' },
  { name: 'Cetirizine', category: 'Allergy', desc: 'Antihistamine that treats hay fever and hives symptoms.', guidelines: 'Take 10mg once daily. Can cause mild drowsiness, avoid driving if affected.', sideEffects: 'Drowsiness, dry mouth, headache, sore throat.' },
]

const INITIAL_MEDICATIONS = [
  { id: 'm1', name: 'Lisinopril', dose: '10mg', frequency: 'Once daily', remaining: 18, color: 'bg-blue-100 text-blue-700 border-blue-200', taken: true, history: ['Jun 17 – Taken 8:00 AM', 'Jun 16 – Taken 8:05 AM', 'Jun 15 – Taken 7:55 AM', 'Jun 14 – Missed', 'Jun 13 – Taken 8:10 AM'] },
  { id: 'm2', name: 'Metformin', dose: '500mg', frequency: 'Twice daily', remaining: 30, color: 'bg-green-100 text-green-700 border-green-200', taken: true, history: ['Jun 17 – Taken 8:00 AM', 'Jun 17 – Taken 8:00 PM', 'Jun 16 – Taken 8:00 AM', 'Jun 16 – Taken 8:00 PM'] },
  { id: 'm3', name: 'Vitamin D3', dose: '2000 IU', frequency: 'Once daily', remaining: 5, color: 'bg-amber-100 text-amber-700 border-amber-200', taken: false, history: ['Jun 16 – Taken 9:00 AM', 'Jun 15 – Taken 9:15 AM', 'Jun 14 – Taken 9:00 AM'] },
]

void MEDICINES_DB
void INITIAL_MEDICATIONS

const INITIAL_APPOINTMENTS: Appointment[] = [
  { doctor: 'Dr. Emily Chen', specialty: 'Cardiologist', date: 'Jun 24, 2026', time: '10:00 AM', status: 'upcoming', avatar: 'EC' },
  { doctor: 'Dr. Marcus Rivera', specialty: 'General Practitioner', date: 'Jul 2, 2026', time: '2:30 PM', status: 'upcoming', avatar: 'MR' },
  { doctor: 'Dr. Priya Nair', specialty: 'Dermatologist', date: 'Jun 10, 2026', time: '9:00 AM', status: 'completed', avatar: 'PN' },
]

const INITIAL_CHAT_SESSIONS: ChatSession[] = [
  {
    id: 'h1',
    title: 'Headache & dizziness',
    preview: 'Could be tension-related...',
    time: '2 hours ago',
    icon: '🤕',
    messages: [
      { id: 'c1_1', role: 'user', content: 'I have a headache since morning and feel a bit dizzy.', time: '2 hours ago' },
      { id: 'c1_2', role: 'assistant', content: 'Headaches can have many causes including tension, dehydration, stress, or eye strain. For a persistent headache lasting more than 2 days, I recommend consulting a neurologist. Try staying hydrated, resting in a dark room, and avoiding screens. Do you have any other symptoms like nausea or light sensitivity?', time: '2 hours ago' }
    ]
  },
  {
    id: 'h2',
    title: 'Blood pressure query',
    preview: '118/76 is in the normal range...',
    time: 'Yesterday',
    icon: '💓',
    messages: [
      { id: 'c2_1', role: 'user', content: 'My blood pressure reading today was 118/76. Is that good?', time: 'Yesterday' },
      { id: 'c2_2', role: 'assistant', content: 'Your recent blood pressure reading of 118/76 mmHg is within the normal range. Keep maintaining a low-sodium diet, regular exercise, and your current medication schedule. I\'ll remind you for your next check-up.', time: 'Yesterday' }
    ]
  },
  {
    id: 'h3',
    title: 'Medication schedule',
    preview: 'Take Lisinopril once daily...',
    time: '2 days ago',
    icon: '💊',
    messages: [
      { id: 'c3_1', role: 'user', content: 'When should I take my Lisinopril medication?', time: '2 days ago' },
      { id: 'c3_2', role: 'assistant', content: 'I can help you understand your medications. Please note that I provide general information — always follow your prescriber\'s specific instructions. Lisinopril is typically taken once daily, in the morning. Would you like information about dosing schedules, potential interactions, or side effects?', time: '2 days ago' }
    ]
  }
]

const NAV_ITEMS = [
  { icon: Home, label: 'Overview', id: 'home' },
  { icon: Bot, label: 'AI Assistant', id: 'ai-assistant' },
  { icon: Stethoscope, label: 'Symptom Checker', id: 'symptom-checker' },
  { icon: Heart, label: 'Doctor Recommendations', id: 'doctor-recommendations' },
  { icon: History, label: 'Chat History', id: 'chat-history' },
]

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('home')
  const [suggestedSpecialty, setSuggestedSpecialty] = useState<string | null>(null)

  // Lifted States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1', role: 'assistant',
      content: "Hello! I'm your MediAI assistant. You can describe symptoms or get help preparing for appointments. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(INITIAL_CHAT_SESSIONS)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)

  const handleConfirmBooking = async (
    msgId: string,
    doctorName: string,
    date: string,
    time: string,
    reason: string,
    isFloat: boolean
  ) => {
    // 1. Simulate API delay
    await new Promise((r) => setTimeout(r, 800))

    // 2. Find doctor info
    const doc = DOCTORS.find((d) => d.name === doctorName) || { avatar: 'MD', specialty: 'General Practitioner' }

    // 3. Format date
    const dateObj = new Date(date + 'T00:00:00')
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    // 4. Create appointment
    const newApt: Appointment = {
      doctor: doctorName,
      specialty: doc.specialty,
      avatar: doc.avatar,
      date: formattedDate,
      time: time,
      status: 'upcoming',
    }

    // 5. Update appointments state
    setAppointments((prev) => [newApt, ...prev])

    // 6. Toast success message
    toast.success(`Appointment booked with ${doctorName}!`)

    // 7. Update message text in chat
    const successText = `✓ **Appointment Booked Successfully!**\n\n**Doctor:** ${doctorName} (${doc.specialty})\n**Date:** ${formattedDate}\n**Time:** ${time}\n**Reason:** ${reason || 'General consultation'}\n\nConfirmation sent. You can view this booking in your overview dashboard.`

    if (isFloat) {
      setFloatMsgs((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: successText } : m))
      )
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: successText } : m))
      )
    }
  }

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? 'U'

  // Sync active session's messages to the chatSessions database when messages change
  useEffect(() => {
    if (activeSessionId) {
      setChatSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: messages,
              preview: messages[messages.length - 1]?.content.slice(0, 40) + '...'
            }
          }
          return s
        })
      )
    }
  }, [messages, activeSessionId])

  // Scroll tracking to update the active navigation tab
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'ai-assistant', 'symptom-checker', 'doctor-recommendations', 'chat-history']
      const scrollPos = window.scrollY + 200 // Offset for header height

      for (const section of sections) {
        const el = document.getElementById(section)
        if (el) {
          const top = el.offsetTop
          const height = el.offsetHeight
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const [showFloatingChat, setShowFloatingChat] = useState(false)
  const [floatMsgs, setFloatMsgs] = useState<Message[]>([
    { id: 'f0', role: 'assistant', content: "Hi! I'm MediAI. Describe your symptoms or ask a health question.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ])
  const [floatInput, setFloatInput] = useState('')
  const [floatTyping, setFloatTyping] = useState(false)
  const floatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { floatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [floatMsgs, floatTyping])

  const sendFloatMsg = async (text?: string) => {
    const content = (text ?? floatInput).trim()
    if (!content) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content, time }
    setFloatMsgs(prev => [...prev, userMsg])
    setFloatInput('')
    setFloatTyping(true)
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWebhookPayload(content)),
      })
      if (!res.ok) throw new Error('fail')
      const reply = await parseWebhookResponse(res)
      const finalReply = isBookingTrigger(content)
        ? `${reply}\n\n[BOOKING_SYSTEM]`
        : reply
      setFloatMsgs(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: finalReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    } catch {
      let reply = getResponse(content)
      if (isBookingTrigger(content)) {
        reply = "I can help you book an appointment right now. Please select a doctor, choose your preferred date & time, and confirm the booking below:\n\n[BOOKING_SYSTEM]"
      }
      setFloatMsgs(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    } finally {
      setFloatTyping(false)
    }
  }

  const startNewChat = () => {
    setMessages([
      {
        id: Date.now().toString(), role: 'assistant',
        content: "New session started. How can I help you today?",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ])
    setActiveSessionId(null)
    scrollToSection('ai-assistant')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">

      {/* ── FIXED TOP HEADER ─────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 shadow-lg px-4 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md">
            <Heart className="w-5 h-5 text-teal-600" fill="currentColor" />
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">MediAI</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/20 backdrop-blur-sm p-1 rounded-2xl border border-white/30">
          {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeSection === id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-white/90 hover:bg-white/20'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* User + Sign out */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 bg-white/20 border border-white/30 rounded-2xl px-3 py-1.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-teal-700 text-xs font-extrabold shadow-sm">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-white text-xs font-bold leading-none">{user?.name}</p>
              <p className="text-teal-100 text-[10px] mt-0.5">{user?.role ?? 'Patient'}</p>
            </div>
          </div>
          <div className="md:hidden w-8 h-8 rounded-xl bg-white flex items-center justify-center text-teal-700 text-xs font-extrabold shadow-sm">
            {initials}
          </div>
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/25 border border-white/30 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 bg-white shadow-xl border border-gray-200 rounded-2xl p-1.5 flex justify-around">
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <button
            key={id}
            onClick={() => scrollToSection(id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === id ? 'text-teal-600 bg-teal-50' : 'text-gray-400'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* ── FLOATING CHAT WIDGET (bottom-right, fixed) ──────────── */}
      <div className="fixed bottom-24 lg:bottom-8 right-5 z-50 flex flex-col items-end gap-3">

        {/* ── Chat Popup Window ── */}
        {showFloatingChat && (
          <div className="w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden" style={{ height: '480px' }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-500 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" fill="white" />
                </div>
                <div>
                  <p className="text-white text-xs font-bold leading-none">MediAI Assistant</p>
                  <p className="text-teal-100 text-[10px] mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full inline-block"></span> Online
                  </p>
                </div>
              </div>
              <button onClick={() => setShowFloatingChat(false)} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {floatMsgs.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-3.5 h-3.5 text-white" fill="white" />
                    </div>
                  )}
                  <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-sm'
                      : 'bg-white text-gray-700 border border-gray-200 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content.includes('[BOOKING_SYSTEM]') ? (
                      <div className="space-y-2 text-left">
                        <p>{msg.content.replace('[BOOKING_SYSTEM]', '').trim()}</p>
                        <InlineBookingCard
                          messageId={msg.id}
                          onConfirm={async (msgId, docName, date, time, reason) => {
                            await handleConfirmBooking(msgId, docName, date, time, reason, true)
                          }}
                        />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
              {floatTyping && (
                <div className="flex gap-2 items-end">
                  <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-white" fill="white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center shadow-sm">
                    {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              )}
              <div ref={floatEndRef} />
            </div>

            {/* Quick chips */}
            <div className="px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0 border-t border-gray-100 bg-white">
              {['Headache', 'Fever', 'Blood pressure', 'Medication'].map(chip => (
                <button
                  key={chip}
                  onClick={() => sendFloatMsg(chip)}
                  className="text-[10px] font-semibold whitespace-nowrap bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2.5 py-1 rounded-full cursor-pointer transition-colors shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all">
                <input
                  type="text"
                  value={floatInput}
                  onChange={e => setFloatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') sendFloatMsg() }}
                  placeholder="Type your health question…"
                  className="flex-1 text-xs bg-transparent outline-none text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={() => sendFloatMsg()}
                  disabled={!floatInput.trim()}
                  className="w-7 h-7 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── FAB Button with chat bubble icon ── */}
        <button
          onClick={() => setShowFloatingChat(!showFloatingChat)}
          className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 rounded-full shadow-2xl flex items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 relative"
          title="Chat with MediAI"
        >
          {showFloatingChat
            ? <X className="w-6 h-6 text-white" />
            : <MessageCircle className="w-6 h-6 text-white" fill="white" />}
          {/* notification dot */}
          {!showFloatingChat && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          )}
        </button>

      </div>

      {/* ── MAIN CONTENT (offset for fixed header) ─────────────── */}
      <main className="pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-28 lg:pb-12">

        {/* Home / Overview Section */}
        <section id="home" className="scroll-mt-20">
          <HomeTab
            scrollToSection={scrollToSection}
            appointments={appointments}
            chatSessions={chatSessions}
          />
        </section>

        {/* AI Health Assistant Section */}
        <section id="ai-assistant" className="scroll-mt-20">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-[600px] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50 to-cyan-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-teal-600" /> AI Health Assistant
              </h3>
              <span className="text-xs text-teal-700 bg-teal-100 border border-teal-200 px-3 py-1 rounded-full font-semibold">● Live</span>
            </div>
            <div className="flex-1 min-h-0">
              <AIHealthAssistantTab
                messages={messages}
                setMessages={setMessages}
                setChatSessions={setChatSessions}
                activeSessionId={activeSessionId}
                setActiveSessionId={setActiveSessionId}
                onConfirmBooking={handleConfirmBooking}
              />
            </div>
          </div>
        </section>

        {/* Symptom Checker Section */}
        <section id="symptom-checker" className="scroll-mt-20">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-purple-600" /> Symptom Checker
              </h3>
            </div>
            <SymptomCheckerTab
              scrollToSection={scrollToSection}
              setSuggestedSpecialty={setSuggestedSpecialty}
            />
          </div>
        </section>

        {/* Doctor Recommendations Section */}
        <section id="doctor-recommendations" className="scroll-mt-20">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" fill="currentColor" /> Specialist Recommendations
              </h3>
            </div>
            <DoctorRecommendationsTab
              suggestedSpecialty={suggestedSpecialty}
              setSuggestedSpecialty={setSuggestedSpecialty}
              appointments={appointments}
              setAppointments={setAppointments}
            />
          </div>
        </section>

        {/* Chat History Section */}
        <section id="chat-history" className="scroll-mt-20">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-sky-50">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" /> Chat History
              </h3>
            </div>
            <ChatHistoryTab
              chatSessions={chatSessions}
              setChatSessions={setChatSessions}
              setMessages={setMessages}
              setActiveSessionId={setActiveSessionId}
              scrollToSection={scrollToSection}
              startNewChat={startNewChat}
            />
          </div>
        </section>
      </main>
    </div>
  )
}

interface InlineBookingCardProps {
  messageId: string
  onConfirm: (
    msgId: string,
    doctorName: string,
    date: string,
    time: string,
    reason: string
  ) => Promise<void>
}

function InlineBookingCard({ messageId, onConfirm }: InlineBookingCardProps) {
  const [selectedDoctor, setSelectedDoctor] = useState(DOCTORS[0].name)
  const [bookingDate, setBookingDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [bookingReason, setBookingReason] = useState('')
  const [errors, setErrors] = useState<{ date?: string; time?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '4:30 PM']

  const selectedDocInfo = DOCTORS.find(d => d.name === selectedDoctor)

  const handleConfirm = async () => {
    const errs: { date?: string; time?: string } = {}
    if (!bookingDate) errs.date = 'Select a date'
    else if (bookingDate < today) errs.date = 'Date is in the past'
    if (!selectedTime) errs.time = 'Select a time'

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setErrors({})
    setSubmitting(true)
    try {
      await onConfirm(messageId, selectedDoctor, bookingDate, selectedTime, bookingReason)
    } catch (e) {
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-slate-800 space-y-3.5 shadow-2xs max-w-full text-xs">
      <div className="border-b border-slate-200 pb-2">
        <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[13px]">
          <Calendar className="w-4 h-4 text-teal-600" /> Book an Appointment
        </p>
      </div>

      {/* Doctor Dropdown */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Doctor</label>
        <select
          value={selectedDoctor}
          onChange={e => setSelectedDoctor(e.target.value)}
          className="w-full bg-white border border-slate-250 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 transition-all cursor-pointer"
        >
          {DOCTORS.map(doc => (
            <option key={doc.name} value={doc.name}>
              {doc.name} ({doc.specialty})
            </option>
          ))}
        </select>

        {selectedDocInfo && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-150 mt-1.5 text-[10px] text-slate-500">
            <div className="w-7 h-7 rounded-full bg-teal-50 text-teal-700 font-extrabold flex items-center justify-center shrink-0">
              {selectedDocInfo.avatar}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-bold text-slate-700 truncate">{selectedDocInfo.name}</p>
              <p className="text-[9px] text-slate-400 font-semibold">{selectedDocInfo.specialty} · {selectedDocInfo.exp}</p>
            </div>
            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded shrink-0">
              ★ {selectedDocInfo.rating}
            </span>
          </div>
        )}
      </div>

      {/* Date input */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1">Preferred Date</label>
        <input
          type="date"
          min={today}
          value={bookingDate}
          onChange={e => {
            setBookingDate(e.target.value)
            setErrors(prev => ({ ...prev, date: undefined }))
          }}
          className={`w-full px-3 py-2 rounded-xl border outline-none bg-white cursor-pointer transition-all ${
            errors.date ? 'border-red-400 focus:border-red-500' : 'border-slate-250 focus:border-teal-500'
          }`}
        />
        {errors.date && <p className="mt-1 text-[9px] text-red-500">{errors.date}</p>}
      </div>

      {/* Time slots grid */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Available Slots</label>
        <div className="grid grid-cols-3 gap-1.5">
          {TIME_SLOTS.map(slot => (
            <button
              key={slot}
              type="button"
              onClick={() => {
                setSelectedTime(slot)
                setErrors(prev => ({ ...prev, time: undefined }))
              }}
              className={`py-1.5 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                selectedTime === slot
                  ? 'bg-teal-600 text-white border-teal-650 shadow-sm shadow-teal-200'
                  : 'bg-white text-slate-655 border-slate-250 hover:border-teal-450 hover:text-teal-700 hover:bg-teal-50'
              }`}
            >
              {slot}
            </button>
          ))}
        </div>
        {errors.time && <p className="mt-1 text-[9px] text-red-500">{errors.time}</p>}
      </div>

      {/* Reason textarea */}
      <div>
        <label className="block text-[11px] font-bold text-slate-500 mb-1">Consultation Details</label>
        <textarea
          rows={2}
          placeholder="Reason for consultation..."
          value={bookingReason}
          onChange={e => setBookingReason(e.target.value)}
          className="w-full bg-white border border-slate-250 text-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500 resize-none transition-all"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full bg-teal-600 hover:bg-teal-750 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Booking'}
      </button>
    </div>
  )
}

// ── 1. AI Health Assistant Tab ────────────────────────────────────────────────
interface ChatTabProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  activeSessionId: string | null
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>
  onConfirmBooking: (
    msgId: string,
    doctorName: string,
    date: string,
    time: string,
    reason: string,
    isFloat: boolean
  ) => Promise<void>
}

function AIHealthAssistantTab({
  messages,
  setMessages,
  setChatSessions,
  activeSessionId,
  setActiveSessionId,
  onConfirmBooking,
}: ChatTabProps) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [webhookError, setWebhookError] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsgId = Date.now().toString()
    
    // Construct new user message
    const userMsg: Message = { id: userMsgId, role: 'user', content, time }

    // If there is no active session, create a new one in the list
    let currentSessionId = activeSessionId
    if (!currentSessionId) {
      const newSessionId = 's_' + Date.now()
      const newSession: ChatSession = {
        id: newSessionId,
        title: content.length > 28 ? content.slice(0, 25) + '...' : content,
        preview: 'Waiting for AI response...',
        time: 'Just now',
        icon: '💬',
        messages: [userMsg]
      }
      setChatSessions((prev) => [newSession, ...prev])
      setActiveSessionId(newSessionId)
      currentSessionId = newSessionId
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setWebhookError(false)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWebhookPayload(content)),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reply = await parseWebhookResponse(res)
      const finalReply = isBookingTrigger(content)
        ? `${reply}\n\n[BOOKING_SYSTEM]`
        : reply

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch {
      setWebhookError(true)
      // Fallback
      let reply = getResponse(content)
      if (isBookingTrigger(content)) {
        reply = "I can help you book an appointment right now. Please select a doctor, choose your preferred date & time, and confirm the booking below:\n\n[BOOKING_SYSTEM]"
      }
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const SUGGESTED_QUESTIONS = [
    'I have a headache since morning',
    'What are the side effects of Metformin?',
    'Explain blood pressure range 118/76',
    'Suggest health checks for annual visit'
  ]

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* HIPAA / Security Notice */}
      <div className="bg-teal-50 border-b border-teal-100 px-5 py-2 flex items-center gap-2 text-xs text-teal-700 shrink-0 font-medium">
        <Shield className="w-3.5 h-3.5 shrink-0 text-teal-600" />
        Encrypted & HIPAA-compliant · AI responses are informational, consult professionals.
      </div>

      {/* Webhook notification */}
      {webhookError && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2 flex items-center gap-2 text-xs text-amber-700 shrink-0 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          Offline fallback triggered — showing pre-programmed responses. Local webhook is not responding.
        </div>
      )}

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 scrollbar-thin">
        {messages.length === 1 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs max-w-2xl mx-auto mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Bot className="w-4 h-4 text-teal-600" /> Suggested Queries
            </h3>
            <p className="text-xs text-slate-400">Click a chip below to start consulting your medical chatbot assistant:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-slate-50 border border-slate-200 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 text-slate-600 px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
              )}
              <div className="max-w-[80%] sm:max-w-[70%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-xs'
                }`}>
                  {msg.content.includes('[BOOKING_SYSTEM]') ? (
                    <div className="space-y-2 text-left">
                      <p>{msg.content.replace('[BOOKING_SYSTEM]', '').trim()}</p>
                      <InlineBookingCard
                        messageId={msg.id}
                        onConfirm={async (msgId, docName, date, time, reason) => {
                          await onConfirmBooking(msgId, docName, date, time, reason, false)
                        }}
                      />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                <p className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.time}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4.5 h-4.5 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-xs px-4 py-3.5 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Container */}
      <div className="border-t border-slate-200 bg-white px-4 sm:px-6 py-4 shrink-0 shadow-inner">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/15 transition-all">
            <label className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer" aria-label="Attach file">
              <Paperclip className="w-4.5 h-4.5" />
              <input type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) sendMessage(`[Attached file: ${f.name}]`)
              }} />
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe symptoms, ask dosage queries, or seek medical tips…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none py-2 min-h-[40px] max-h-24 scrollbar-thin"
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 96) + 'px'
              }}
            />
            <button
              onClick={() => alert("Keyboard shortcuts: Hold Shift+Enter for new line. Press Enter to send.")}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Help info"
            >
              <Info className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors cursor-pointer shadow-xs"
              aria-label="Send message"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── 2. Symptom Checker Tab ────────────────────────────────────────────────────
interface CheckerProps {
  scrollToSection: (id: string) => void
  setSuggestedSpecialty: (spec: string | null) => void
}

const COMMON_SYMPTOMS = [
  { label: 'Fever', specialty: 'General Practitioner', severityBoost: 1 },
  { label: 'Headache', specialty: 'Neurologist', severityBoost: 0 },
  { label: 'Chest Pain', specialty: 'Cardiologist', severityBoost: 3 },
  { label: 'Shortness of Breath', specialty: 'Cardiologist', severityBoost: 3 },
  { label: 'Skin Rash', specialty: 'Dermatologist', severityBoost: 0 },
  { label: 'Fatigue & Weakness', specialty: 'General Practitioner', severityBoost: 0 },
  { label: 'Joint Stiffness', specialty: 'Orthopedist', severityBoost: 1 },
  { label: 'Excessive Thirst / Hunger', specialty: 'Endocrinologist', severityBoost: 1 },
  { label: 'Cough & Sore Throat', specialty: 'General Practitioner', severityBoost: 0 },
]

function SymptomCheckerTab({ scrollToSection, setSuggestedSpecialty }: CheckerProps) {
  const [step, setStep] = useState(1)
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [customSymptom, setCustomSymptom] = useState('')
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild')
  const [duration, setDuration] = useState('1-3 days')
  const [otherSymptoms, setOtherSymptoms] = useState<string[]>([])
  
  // Results State
  const [analysisResult, setAnalysisResult] = useState<{
    risk: 'low' | 'medium' | 'high'
    specialist: string
    causes: string[]
    advice: string[]
  } | null>(null)

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    )
  }

  const toggleOtherSymptom = (label: string) => {
    setOtherSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    )
  }

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault()
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms((prev) => [...prev, customSymptom.trim()])
      setCustomSymptom('')
    }
  }

  const runAnalysis = () => {
    // Determine risk based on severity + high-priority symptoms
    let score = 0
    if (severity === 'moderate') score += 2
    if (severity === 'severe') score += 4
    if (duration === '4-7 days') score += 1
    if (duration === 'Over a week') score += 2

    // Check for high-priority symptoms
    const hasHeartIssues = selectedSymptoms.some((s) => s.includes('Chest') || s.includes('Breath'))
    if (hasHeartIssues) score += 3

    let risk: 'low' | 'medium' | 'high' = 'low'
    if (score >= 6) risk = 'high'
    else if (score >= 3) risk = 'medium'

    // Determine specialty recommendation
    let bestSpecialty = 'General Practitioner'
    for (const symptom of selectedSymptoms) {
      const match = COMMON_SYMPTOMS.find((cs) => cs.label === symptom)
      if (match && match.specialty !== 'General Practitioner') {
        bestSpecialty = match.specialty
        break
      }
    }

    // Dynamic Causes
    const causes: string[] = []
    if (selectedSymptoms.includes('Headache')) {
      causes.push('Tension headache or stress-induced discomfort')
      causes.push('Dehydration or sleep deficiency')
    }
    if (selectedSymptoms.includes('Fever') || selectedSymptoms.includes('Cough & Sore Throat')) {
      causes.push('Viral respiratory infection (flu or common cold)')
      causes.push('Immunological response to localized pathogen')
    }
    if (selectedSymptoms.includes('Chest Pain') || selectedSymptoms.includes('Shortness of Breath')) {
      causes.push('Cardiovascular strain requiring monitoring')
      causes.push('Anxiety-induced breathing alterations')
    }
    if (selectedSymptoms.includes('Skin Rash')) {
      causes.push('Contact dermatitis or allergic reaction')
    }
    if (selectedSymptoms.includes('Joint Stiffness')) {
      causes.push('Mild inflammatory arthralgia or muscular fatigue')
    }
    if (selectedSymptoms.includes('Excessive Thirst / Hunger')) {
      causes.push('Metabolic imbalance requiring glucose evaluation')
    }
    if (causes.length === 0) {
      causes.push('Minor functional body systems imbalance')
      causes.push('Tiredness or physical fatigue accumulation')
    }

    // Advice
    const advice = [
      'Maintain continuous hydration and monitor body temperature.',
      'Practice physical rest and avoid intense exercises for 24-48 hours.',
      'Avoid high-stress activities or visual fatigue from screens.'
    ]
    if (risk === 'high') {
      advice.unshift('Seek immediate medical attention or visit the nearest ER clinic.')
    }

    setAnalysisResult({ risk, specialist: bestSpecialty, causes, advice })
    setStep(3)
  }

  const resetChecker = () => {
    setSelectedSymptoms([])
    setCustomSymptom('')
    setSeverity('mild')
    setDuration('1-3 days')
    setOtherSymptoms([])
    setAnalysisResult(null)
    setStep(1)
  }

  const navigateToDoctor = () => {
    if (analysisResult) {
      setSuggestedSpecialty(analysisResult.specialist)
      scrollToSection('doctor-recommendations')
    }
  }

  const OTHER_OPTIONS = ['Nausea & Vomiting', 'Light Sensitivity', 'Congestion & Sneezing', 'Muscle Soreness', 'Anxiety or Panic']

  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 scrollbar-thin bg-slate-50">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
        
        {/* Step Indicator Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600 animate-pulse" /> Symptom Checker Check-up
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Analyze and get recommendation reviews</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-teal-50 text-teal-700 rounded-full border border-teal-150">
            Step {step} of 3
          </span>
        </div>

        {/* STEP 1: Select Symptoms */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-800">What symptoms are you experiencing?</label>
              <p className="text-xs text-slate-400">Select all that apply or add a custom symptom below</p>
            </div>
            
            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {COMMON_SYMPTOMS.map(({ label }) => {
                const selected = selectedSymptoms.includes(label)
                return (
                  <button
                    key={label}
                    onClick={() => toggleSymptom(label)}
                    className={`py-3 px-4 rounded-2xl text-xs font-semibold text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 shadow-2xs ${
                      selected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200 scale-98'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/40'
                    }`}
                  >
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>

            {/* Custom Input */}
            <form onSubmit={handleAddCustom} className="flex gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10">
              <input
                type="text"
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                placeholder="Type other symptoms (e.g., Stomach Ache)..."
                className="flex-1 px-3 py-2 text-xs bg-transparent outline-none placeholder-slate-400 text-slate-800"
              />
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </form>

            {selectedSymptoms.length > 0 && (
              <div className="flex justify-end pt-3">
                <button
                  onClick={() => setStep(2)}
                  className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Severity & Duration details */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Symptom summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-slate-400 mr-2">Selected:</span>
              {selectedSymptoms.map((s) => (
                <span key={s} className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-md font-semibold">
                  {s}
                </span>
              ))}
            </div>

            {/* Severity selection */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-800 block">How severe is the discomfort?</label>
              <div className="grid grid-cols-3 gap-3">
                {(['mild', 'moderate', 'severe'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    className={`py-3.5 rounded-2xl text-xs font-semibold border text-center transition-all cursor-pointer capitalize shadow-2xs ${
                      severity === level
                        ? level === 'mild'
                          ? 'bg-green-600 border-green-600 text-white shadow-sm shadow-green-250'
                          : level === 'moderate'
                          ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-250'
                          : 'bg-red-600 border-red-600 text-white shadow-sm shadow-red-250'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-350 hover:bg-slate-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration selection */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-800 block">How long have you had these symptoms?</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Less than 24h', '1-3 days', '4-7 days', 'Over a week'].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setDuration(dur)}
                    className={`py-3 rounded-2xl text-xs font-semibold border text-center transition-all cursor-pointer shadow-2xs ${
                      duration === dur
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50'
                    }`}
                  >
                    {dur}
                  </button>
                ))}
              </div>
            </div>

            {/* Associated Symptoms */}
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-slate-800 block">Are you experiencing any of these associated conditions?</label>
              <div className="grid grid-cols-2 gap-2">
                {OTHER_OPTIONS.map((other) => {
                  const checked = otherSymptoms.includes(other)
                  return (
                    <button
                      key={other}
                      onClick={() => toggleOtherSymptom(other)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-medium transition-all text-left cursor-pointer ${
                        checked
                          ? 'bg-teal-50 border-teal-200 text-teal-700'
                          : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle className={`w-4 h-4 shrink-0 transition-colors ${checked ? 'text-teal-600' : 'text-slate-300'}`} />
                      <span className="truncate">{other}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Buttons navigation */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                onClick={() => setStep(1)}
                className="text-sm border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={runAnalysis}
                className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Get Diagnosis <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Analysis Results */}
        {step === 3 && analysisResult && (
          <div className="space-y-6 animate-fade-in">
            {/* Risk Gauge Header */}
            <RiskMeter level={analysisResult.risk} />

            {/* Recommendations & Causes */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" /> Possible Causes
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {analysisResult.causes.map((c, i) => (
                    <li key={i} className="text-xs text-slate-655 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-teal-500 font-bold shrink-0">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-50/60 border border-slate-100 p-4 rounded-2xl shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" /> Recommended Actions
                </h4>
                <ul className="space-y-1.5 pt-1">
                  {analysisResult.advice.map((a, i) => (
                    <li key={i} className="text-xs text-slate-655 flex items-start gap-1.5 leading-relaxed">
                      <span className="text-blue-500 font-bold shrink-0">•</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Specialist Match Panel */}
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center shadow-2xs">
                  <UserIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400">Match recommendation</h4>
                  <p className="text-sm font-bold text-teal-850">Consult a {analysisResult.specialist}</p>
                </div>
              </div>
              <button
                onClick={navigateToDoctor}
                className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
              >
                Find & Book Doctor <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Reset Button */}
            <div className="flex justify-start pt-3 border-t border-slate-100">
              <button
                onClick={resetChecker}
                className="text-xs border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
              >
                Restart Test
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function RiskMeter({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: { bar: 'w-1/3 bg-green-500', text: 'text-green-600 bg-green-50 border-green-200', label: 'Low Risk', desc: 'Symptoms are likely minor. Monitor, drink fluids, and practice self-care.' },
    medium: { bar: 'w-2/3 bg-amber-500', text: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Moderate Risk', desc: 'Consultation with a healthcare provider is recommended soon. Avoid self-treatment.' },
    high: { bar: 'w-full bg-red-500', text: 'text-red-600 bg-red-50 border-red-200', label: 'High Risk / Attention', desc: 'Requires prompt medical attention. Seek urgent evaluation or go to emergency if symptoms worsen.' },
  }
  const active = colors[level]
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Risk Level</span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${active.text}`}>{active.label}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${active.bar}`} />
      </div>
      
      <p className="text-xs text-slate-600 leading-relaxed">{active.desc}</p>
    </div>
  )
}

// ── 3. Doctor Recommendations Tab ─────────────────────────────────────────────
interface DoctorsTabProps {
  suggestedSpecialty: string | null
  setSuggestedSpecialty: (spec: string | null) => void
  appointments: Appointment[]
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>
}

interface ScheduleForm {
  doctor: string
  date: string
  time: string
  reason: string
}

function DoctorRecommendationsTab({
  suggestedSpecialty,
  setSuggestedSpecialty,
  appointments,
  setAppointments,
}: DoctorsTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All')
  
  // Modals
  const [bookingDoc, setBookingDoc] = useState<typeof DOCTORS[number] | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [form, setForm] = useState<ScheduleForm>({ doctor: '', date: '', time: '', reason: '' })
  const [errors, setErrors] = useState<Partial<ScheduleForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [detailApt, setDetailApt] = useState<Appointment | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // If a suggested specialty is pushed from Symptom Checker, use it
  useEffect(() => {
    if (suggestedSpecialty) {
      setSelectedSpecialty(suggestedSpecialty)
    }
  }, [suggestedSpecialty])

  const specialties = ['All', 'General Practitioner', 'Cardiologist', 'Neurologist', 'Dermatologist', 'Endocrinologist', 'Orthopedist']

  const filteredDoctors = DOCTORS.filter((doc) => {
    const matchSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    const matchSpecialty = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty
    return matchSearch && matchSpecialty
  })

  const handleOpenBooking = (doc: typeof DOCTORS[number]) => {
    setBookingDoc(doc)
    setForm({ doctor: doc.name, date: '', time: '', reason: '' })
    setShowModal(true)
  }

  const validate = (): boolean => {
    const e: Partial<ScheduleForm> = {}
    if (!form.date) e.date = 'Choose a preferred date'
    else if (form.date < today) e.date = 'Date cannot be in the past'
    if (!form.time) e.time = 'Select an available time slot'
    if (!form.reason.trim()) e.reason = 'Enter the reason for appointment consultation'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmitBooking = async () => {
    if (!validate()) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 800))

    const dateObj = new Date(form.date + 'T00:00:00')
    const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const newApt: Appointment = {
      doctor: form.doctor,
      specialty: bookingDoc?.specialty ?? 'Generalist',
      avatar: bookingDoc?.avatar ?? 'MD',
      date: formatted,
      time: form.time,
      status: 'upcoming',
    }

    setAppointments((prev) => [newApt, ...prev])
    setSubmitting(false)
    setShowModal(false)
    setShowSuccess(true)
    setForm({ doctor: '', date: '', time: '', reason: '' })
    setErrors({})
    setTimeout(() => setShowSuccess(false), 3500)
  }

  const handleCancelApt = (apt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => a.doctor === apt.doctor && a.date === apt.date ? { ...a, status: 'completed' } : a)
    )
  }

  const TIME_SLOTS = ['9:00 AM', '10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM', '4:30 PM']

  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 scrollbar-thin bg-slate-50 space-y-6">
      
      {/* Toast */}
      {showSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-teal-650 text-white text-xs font-semibold px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Appointment booked successfully! Confirmation sent.
        </div>
      )}

      {/* Filter and search bar */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-2xl focus-within:border-teal-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-500/10">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by doctor name or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs bg-transparent outline-none text-slate-800 placeholder-slate-400"
            />
          </div>
          {suggestedSpecialty && (
            <button
              onClick={() => {
                setSuggestedSpecialty(null)
                setSelectedSpecialty('All')
              }}
              className="text-xs bg-teal-50 text-teal-700 font-semibold px-3 py-2.5 rounded-2xl border border-teal-200 hover:bg-teal-100 shrink-0 cursor-pointer"
            >
              Clear Pre-Filter ({suggestedSpecialty})
            </button>
          )}
        </div>

        {/* Specialty Filter Scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => {
                setSelectedSpecialty(spec)
                if (suggestedSpecialty && spec !== suggestedSpecialty) {
                  setSuggestedSpecialty(null)
                }
              }}
              className={`text-[11px] font-semibold px-3.5 py-1.8 rounded-xl border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                selectedSpecialty === spec
                  ? 'bg-teal-650 border-teal-650 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400 hover:bg-teal-50'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Doctors list */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Recommended Medical Specialists ({filteredDoctors.length})</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDoctors.map((doc) => (
            <div key={doc.name} className="bg-white rounded-3xl border border-slate-250 hover:border-teal-450 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-teal-55 text-teal-705 text-sm font-extrabold flex items-center justify-center shadow-inner">
                    {doc.avatar}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 truncate">{doc.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{doc.specialty}</p>
                  </div>
                </div>
                <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-md">
                  <Star className="w-3 h-3 text-amber-500 fill-current" /> {doc.rating}
                </span>
              </div>

              <div className="text-xs text-slate-655 space-y-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                <p className="flex justify-between"><span>Experience:</span> <span className="font-semibold text-slate-800">{doc.exp}</span></p>
                <p className="flex justify-between"><span>Location:</span> <span className="font-semibold text-slate-800">{doc.clinic}</span></p>
                <p className="flex justify-between"><span>Available:</span> <span className="font-semibold text-teal-600">{doc.available}</span></p>
              </div>

              <button
                onClick={() => handleOpenBooking(doc)}
                className="w-full bg-teal-600 hover:bg-teal-750 active:scale-97 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" /> Book Consultation
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled appointments timeline */}
      <div className="border-t border-slate-200 pt-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Your Scheduled Consultations ({appointments.length})</h3>
        {appointments.length === 0 ? (
          <p className="text-xs text-slate-455 text-center py-6 bg-white border border-slate-200 rounded-3xl">No bookings scheduled yet</p>
        ) : (
          <div className="space-y-2.5">
            {appointments.map((apt, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center shadow-inner">
                    {apt.avatar}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{apt.doctor}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{apt.specialty} · {apt.date}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 bg-slate-50 inline-block px-1.5 py-0.5 rounded-md border border-slate-100">Time slot: {apt.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${apt.status === 'upcoming' ? 'bg-teal-50 text-teal-700' : 'bg-slate-150 text-slate-500'}`}>
                    {apt.status === 'upcoming' ? '● Upcoming' : '✓ Completed'}
                  </span>
                  {apt.status === 'upcoming' && (
                    <>
                      <button
                        onClick={() => setDetailApt(apt)}
                        className="text-[10px] font-bold border border-teal-200 hover:bg-teal-50 text-teal-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleCancelApt(apt)}
                        className="text-[10px] font-bold border border-red-200 hover:bg-red-50 text-red-500 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Booking Modal ── */}
      {showModal && bookingDoc && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Request Booking Consultation</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); setForm({ doctor: '', date: '', time: '', reason: '' }) }} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shadow-inner">{bookingDoc.avatar}</div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{bookingDoc.name}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">{bookingDoc.specialty}</p>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date</label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none cursor-pointer ${
                    errors.date ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'
                  }`}
                />
                {errors.date && <p className="mt-1 text-[10px] text-red-500">{errors.date}</p>}
              </div>

              {/* Time Slots */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Available Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, time: slot }))}
                      className={`py-2 text-[10px] font-bold rounded-xl border transition-all cursor-pointer ${
                        form.time === slot
                          ? 'bg-teal-600 text-white border-teal-650 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {errors.time && <p className="mt-1 text-[10px] text-red-500">{errors.time}</p>}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Details</label>
                <textarea
                  rows={2}
                  placeholder="Describe your query or symptom concerns for this visit..."
                  value={form.reason}
                  onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none resize-none ${
                    errors.reason ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'
                  }`}
                />
                {errors.reason && <p className="mt-1 text-[10px] text-red-500">{errors.reason}</p>}
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6 pt-2 border-t border-slate-100">
              <button
                onClick={() => { setShowModal(false); setErrors({}); setForm({ doctor: '', date: '', time: '', reason: '' }) }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold rounded-xl text-slate-505 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={submitting}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-750 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailApt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Consultation Summary</h3>
              <button onClick={() => setDetailApt(null)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 text-sm font-bold flex items-center justify-center">{detailApt.avatar}</div>
                <div>
                  <h4 className="font-bold text-slate-900">{detailApt.doctor}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">{detailApt.specialty}</p>
                </div>
              </div>
              <hr className="border-slate-100 my-2" />
              <div className="flex justify-between"><span className="text-slate-400">Date & Time:</span> <span className="font-semibold text-slate-800">{detailApt.date} at {detailApt.time}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Location:</span> <span className="font-semibold text-slate-800">Main Medical Complex, Suite F</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Status:</span> <span className="font-semibold text-teal-600 capitalize">{detailApt.status}</span></div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setDetailApt(null)} className="w-full py-2.5 bg-teal-650 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
interface HistoryTabProps {
  chatSessions: ChatSession[]
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setActiveSessionId: (id: string | null) => void
  scrollToSection: (id: string) => void
  startNewChat: () => void
}

function ChatHistoryTab({
  chatSessions,
  setChatSessions,
  setMessages,
  setActiveSessionId,
  scrollToSection,
  startNewChat,
}: HistoryTabProps) {
  const [selectedSessionDetail, setSelectedSessionDetail] = useState<ChatSession | null>(null)

  const handleResumeSession = (session: ChatSession) => {
    setMessages(session.messages)
    setActiveSessionId(session.id)
    scrollToSection('ai-assistant')
  }

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat history session permanently?')) {
      setChatSessions((prev) => prev.filter((s) => s.id !== id))
    }
  }

  return (
    <div className="p-5 sm:p-8 space-y-5">

      {/* Header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-800">Your Consultation Dialogues</h3>
          <p className="text-xs text-gray-400 mt-0.5">Manage and resume past chatbot consultations ({chatSessions.length})</p>
        </div>
        <button
          onClick={startNewChat}
          className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Dialogue
        </button>
      </div>

      {/* Grid of sessions */}
      {chatSessions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center text-gray-400 space-y-3">
          <History className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-xs">No saved dialogues found yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chatSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleResumeSession(session)}
              className="bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 rounded-2xl p-4 cursor-pointer flex flex-col justify-between space-y-3 group transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl shrink-0">{session.icon}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-gray-800 truncate group-hover:text-teal-700 transition-colors">{session.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">{session.time}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="p-1 text-gray-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Delete Session"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed italic bg-white p-2.5 rounded-xl border border-gray-100 truncate">
                "{session.preview}"
              </p>

              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-[10px] text-gray-400 font-semibold">{session.messages.length} messages</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSessionDetail(session)
                  }}
                  className="text-[10px] font-bold border border-gray-200 hover:bg-white text-gray-500 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  View Logs
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspection Logs Modal */}
      {selectedSessionDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] flex flex-col border border-gray-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-cyan-50 shrink-0">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Dialogue: {selectedSessionDetail.title}</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{selectedSessionDetail.time} · {selectedSessionDetail.messages.length} Messages</p>
              </div>
              <button onClick={() => setSelectedSessionDetail(null)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {selectedSessionDetail.messages.map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${m.role === 'user' ? 'text-teal-600' : 'text-blue-600'}`}>
                      {m.role === 'user' ? 'You (Patient)' : 'AI Healthcare Bot'}
                    </span>
                    <span className="text-[9px] text-gray-400">{m.time}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                    {m.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2 shrink-0">
              <button
                onClick={() => setSelectedSessionDetail(null)}
                className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-600 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const s = selectedSessionDetail
                  setSelectedSessionDetail(null)
                  handleResumeSession(s)
                }}
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer text-center shadow-sm"
              >
                Resume Dialogue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface HomeTabProps {
  scrollToSection: (id: string) => void
  appointments: Appointment[]
  chatSessions: ChatSession[]
}

function HomeTab({ scrollToSection, appointments, chatSessions }: HomeTabProps) {
  const { user } = useAuth()
  const upcomingAppointment = appointments.find(a => a.status === 'upcoming')

  return (
    <div className="py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] ?? 'User'}! 👋
            </h2>
            <p className="text-teal-100 text-sm mt-1">Here's your health overview for today.</p>
          </div>
          <button
            onClick={() => scrollToSection('ai-assistant')}
            className="bg-white hover:bg-teal-50 text-teal-700 px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Bot className="w-4 h-4" /> Ask AI Assistant
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Next Appointment Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Next Appointment</h3>
          </div>
          {upcomingAppointment ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{upcomingAppointment.doctor}</p>
                <p className="text-xs text-gray-500">{upcomingAppointment.specialty}</p>
              </div>
              <div className="bg-teal-50 rounded-xl px-4 py-2.5 flex items-center gap-2.5 border border-teal-100">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-teal-800">{upcomingAppointment.date} · {upcomingAppointment.time}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4">No upcoming appointments.</p>
          )}
          <button
            onClick={() => scrollToSection('doctor-recommendations')}
            className="mt-4 text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            Manage Appointments <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recent Activity Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">Recent Chat Activity</h3>
          </div>
          {chatSessions.length > 0 ? (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs font-bold text-gray-800 truncate flex items-center gap-1.5">
                <span>{chatSessions[0].icon}</span> {chatSessions[0].title}
              </p>
              <p className="text-[10px] text-gray-400 truncate italic mt-0.5">"{chatSessions[0].preview}"</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-4">No recent chat activity.</p>
          )}
          <button
            onClick={() => scrollToSection('chat-history')}
            className="mt-4 text-teal-600 hover:text-teal-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            View History <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Check Symptoms', icon: Stethoscope, id: 'symptom-checker', bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-50' },
            { label: 'Book Consultations', icon: Calendar, id: 'doctor-recommendations', bg: 'bg-teal-100', text: 'text-teal-600', hover: 'hover:bg-teal-50' },
            { label: 'Dialogue Logs', icon: History, id: 'chat-history', bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
          ].map((action) => (
            <button
              key={action.id}
              onClick={() => scrollToSection(action.id)}
              className={`bg-white border border-gray-200 ${action.hover} hover:shadow-md p-6 rounded-2xl cursor-pointer text-center flex flex-col items-center justify-center gap-3 transition-all duration-200 group hover:-translate-y-0.5`}
            >
              <div className={`w-12 h-12 rounded-full ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-6 h-6 ${action.text}`} />
              </div>
              <span className="text-xs font-bold text-gray-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
