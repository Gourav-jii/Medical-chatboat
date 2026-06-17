import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Heart, Send, Bot, User as UserIcon, LogOut, Bell, Menu, X,
  Activity, Calendar, FileText, Pill, MessageSquare,
  ChevronRight, Mic, Paperclip, AlertTriangle, CheckCircle,
  BarChart2, Clock, Shield, Settings, TrendingUp, TrendingDown,
  Thermometer, Droplets, Wind, Zap, Star, Loader2, Eye, EyeOff,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
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

const NAV_ITEMS = [
  { icon: BarChart2, label: 'Dashboard', id: 'dashboard' },
  { icon: MessageSquare, label: 'AI Assistant', id: 'chat' },
  { icon: Activity, label: 'Health Overview', id: 'overview' },
  { icon: Calendar, label: 'Appointments', id: 'appointments' },
  { icon: FileText, label: 'Health Records', id: 'records' },
  { icon: Pill, label: 'Medications', id: 'medications' },
  { icon: Settings, label: 'Settings', id: 'settings' },
]

const HEALTH_STATS = [
  {
    label: 'Heart Rate', value: '72', unit: 'bpm',
    icon: Heart, iconColor: 'text-rose-500', bg: 'bg-rose-50',
    border: 'border-rose-100', trend: '+2 bpm', trendUp: false, good: true,
    sub: 'Resting — Normal range',
  },
  {
    label: 'Blood Pressure', value: '118/76', unit: 'mmHg',
    icon: Activity, iconColor: 'text-blue-500', bg: 'bg-blue-50',
    border: 'border-blue-100', trend: 'Optimal', trendUp: true, good: true,
    sub: 'Last checked today',
  },
  {
    label: 'Blood Glucose', value: '94', unit: 'mg/dL',
    icon: Droplets, iconColor: 'text-amber-500', bg: 'bg-amber-50',
    border: 'border-amber-100', trend: '-3 mg/dL', trendUp: false, good: true,
    sub: 'Fasting — Normal',
  },
  {
    label: 'Oxygen Level', value: '98%', unit: 'SpO₂',
    icon: Wind, iconColor: 'text-cyan-500', bg: 'bg-cyan-50',
    border: 'border-cyan-100', trend: 'Stable', trendUp: true, good: true,
    sub: 'Normal range ≥95%',
  },
  {
    label: 'Body Temp', value: '36.6', unit: '°C',
    icon: Thermometer, iconColor: 'text-green-500', bg: 'bg-green-50',
    border: 'border-green-100', trend: 'Normal', trendUp: true, good: true,
    sub: 'No fever detected',
  },
  {
    label: 'Sleep Score', value: '7.2', unit: 'hrs',
    icon: Clock, iconColor: 'text-purple-500', bg: 'bg-purple-50',
    border: 'border-purple-100', trend: '-0.5 hrs', trendUp: false, good: false,
    sub: 'Below 8hr target',
  },
]

const RECENT_CHAT_HISTORY = [
  { id: 'h1', title: 'Headache & dizziness', preview: 'Could be tension-related...', time: '2h ago', icon: '🤕' },
  { id: 'h2', title: 'Blood pressure query', preview: '118/76 is in the normal range...', time: 'Yesterday', icon: '💓' },
  { id: 'h3', title: 'Medication schedule', preview: 'Take Lisinopril once daily...', time: '2 days ago', icon: '💊' },
  { id: 'h4', title: 'Pre-appointment summary', preview: 'Key points for Dr. Chen visit...', time: '4 days ago', icon: '📋' },
]

const UPCOMING_APPOINTMENTS = [
  { doctor: 'Dr. Emily Chen', specialty: 'Cardiologist', date: 'Jun 24', time: '10:00 AM', avatar: 'EC' },
  { doctor: 'Dr. Marcus Rivera', specialty: 'General Practitioner', date: 'Jul 2', time: '2:30 PM', avatar: 'MR' },
]

const MEDICATIONS = [
  { name: 'Lisinopril', dose: '10mg', frequency: 'Once daily', remaining: 18, color: 'bg-blue-100 text-blue-700', taken: true },
  { name: 'Metformin', dose: '500mg', frequency: 'Twice daily', remaining: 30, color: 'bg-green-100 text-green-700', taken: true },
  { name: 'Vitamin D3', dose: '2000 IU', frequency: 'Once daily', remaining: 5, color: 'bg-amber-100 text-amber-700', taken: false },
]

const QUICK_SUGGESTIONS = [
  'I have a headache since morning',
  'Check my blood pressure trend',
  'Medication side effects',
  'Prepare for my appointment',
]

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials = user?.name
    ?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? 'U'
  const firstName = user?.name?.split(' ')[0] ?? 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-slate-900 font-bold text-lg tracking-tight">MediAI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User card */}
        <div className="mx-4 mt-5 bg-gradient-to-br from-teal-600 to-cyan-500 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-teal-100 text-xs">{user?.role ?? 'Patient'}</p>
            </div>
          </div>

        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 pb-2">Menu</p>
          {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              {label}
              {activeTab === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3 border-t border-slate-100 space-y-0.5">
          <button
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-teal-600 text-white shadow-sm shadow-teal-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4.5 h-4.5" /> Settings
            {activeTab === 'settings' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-5 h-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 p-1">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                {NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? 'Dashboard'}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => alert('Notifications:\n• Vitamin D3 supply low (5 days)\n• Appointment with Dr. Emily Chen on Jun 24\n• Lab results ready for review')}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === 'dashboard' && <HomeTab greeting={greeting} firstName={firstName} setActiveTab={setActiveTab} />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
          {activeTab === 'appointments' && <AppointmentsTab />}
          {activeTab === 'records' && <RecordsTab />}
          {activeTab === 'medications' && <MedicationsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  )
}

// ── Home / Dashboard Tab ──────────────────────────────────────────────────────
function HomeTab({ greeting, firstName, setActiveTab }: { greeting: string; firstName: string; setActiveTab: (t: string) => void }) {
  const [todayMeds, setTodayMeds] = useState(MEDICATIONS)

  const toggleMedTaken = (name: string) => {
    setTodayMeds((prev) => prev.map((m) => m.name === name ? { ...m, taken: !m.taken } : m))
  }
  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      {/* Welcome hero */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 px-5 sm:px-8 py-7 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-20 w-28 h-28 rounded-full bg-cyan-300/20" />
        <div className="relative z-10">
          <p className="text-teal-100 text-sm font-medium">{greeting},</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">{firstName} 👋</h2>
          <p className="text-teal-100 text-sm mt-2 max-w-sm">
            Your health is looking great today. Here's a summary of what needs your attention.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveTab('chat')}
              className="bg-white text-teal-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Bot className="w-4 h-4" /> Ask AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className="bg-white/20 border border-white/30 text-white font-medium text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" /> View Appointments
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 py-6 space-y-6">
        {/* Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 items-start">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Medication running low</p>
            <p className="text-xs text-amber-700 mt-0.5">Vitamin D3 has only 5 days remaining. Consider refilling soon.</p>
          </div>
          <button onClick={() => setActiveTab('medications')} className="text-xs text-amber-700 font-semibold hover:underline shrink-0">Refill →</button>
        </div>

        {/* Health Stats Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-slate-900">Health Statistics</h3>
            <button onClick={() => setActiveTab('overview')} className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 font-medium">
              See all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HEALTH_STATS.slice(0, 6).map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>
        </div>

        {/* Two columns: chat history + quick actions */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Recent Chat History */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Recent Chats</h3>
              </div>
              <button onClick={() => setActiveTab('chat')} className="text-xs text-teal-600 font-medium hover:underline">View all</button>
            </div>
            <div className="divide-y divide-slate-100">
              {RECENT_CHAT_HISTORY.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveTab('chat')}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="text-xl shrink-0">{chat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{chat.title}</p>
                    <p className="text-xs text-slate-400 truncate">{chat.preview}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{chat.time}</span>
                </button>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-100">
              <button
                onClick={() => setActiveTab('chat')}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" /> Start New Chat
              </button>
            </div>
          </div>

          {/* Right column: upcoming + meds today */}
          <div className="space-y-4">
            {/* Upcoming appointments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Next Appointments</h3>
                </div>
                <button onClick={() => setActiveTab('appointments')} className="text-xs text-teal-600 font-medium hover:underline">All</button>
              </div>
              <div className="space-y-2.5">
                {UPCOMING_APPOINTMENTS.map((apt) => (
                  <div key={apt.doctor} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {apt.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{apt.doctor}</p>
                      <p className="text-[11px] text-slate-500">{apt.specialty}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-slate-800">{apt.date}</p>
                      <p className="text-[11px] text-teal-600">{apt.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's medications */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Pill className="w-4 h-4 text-purple-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">Today's Medications</h3>
                </div>
                <button onClick={() => setActiveTab('medications')} className="text-xs text-teal-600 font-medium hover:underline">All</button>
              </div>
              <div className="space-y-2.5">
                {todayMeds.map((med) => (
                  <div key={med.name} className="flex items-center gap-3">
                    <button
                      onClick={() => toggleMedTaken(med.name)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${med.taken ? 'bg-teal-100 hover:bg-teal-200' : 'bg-slate-100 hover:bg-slate-200'}`}
                      aria-label={med.taken ? 'Mark as not taken' : 'Mark as taken'}
                    >
                      {med.taken
                        ? <CheckCircle className="w-4 h-4 text-teal-600" />
                        : <Clock className="w-4 h-4 text-slate-400" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{med.name} <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-md ${med.color}`}>{med.dose}</span></p>
                      <p className="text-[11px] text-slate-400">{med.frequency}</p>
                    </div>
                    <span className={`text-[10px] font-semibold ${med.taken ? 'text-teal-600' : 'text-slate-400'}`}>
                      {med.taken ? 'Taken' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ stat }: { stat: typeof HEALTH_STATS[number] }) {
  const Icon = stat.icon
  return (
    <div className={`bg-white rounded-2xl border ${stat.border} shadow-sm p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
        </div>
        <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          stat.good ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
        }`}>
          {stat.trendUp
            ? <TrendingUp className="w-2.5 h-2.5" />
            : <TrendingDown className="w-2.5 h-2.5" />
          }
          {stat.trend}
        </span>
      </div>
      <p className="text-xl font-bold text-slate-900 leading-none">{stat.value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{stat.unit}</p>
      <p className="text-xs font-medium text-slate-700 mt-1.5">{stat.label}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{stat.sub}</p>
    </div>
  )
}

// ── Chat Tab (full AI assistant) ──────────────────────────────────────────────
function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1', role: 'assistant',
      content: "Hello! I'm your MediAI assistant. You can describe symptoms, ask about medications, or get help preparing for appointments. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content) return
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    setMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', content, time }])
    setInput('')
    setIsTyping(true)
    await new Promise((r) => setTimeout(r, 1200))
    setIsTyping(false)
    setMessages((prev) => [
      ...prev,
      { id: (Date.now() + 1).toString(), role: 'assistant', content: getResponse(content), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ])
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex h-full">
      {/* Chat history sidebar */}
      <div className="hidden xl:flex w-60 border-r border-slate-200 bg-white flex-col shrink-0">
        <div className="px-4 py-4 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chat History</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {RECENT_CHAT_HISTORY.map((chat) => (
            <button key={chat.id} className="w-full flex items-start gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors text-left">
              <span className="text-base mt-0.5">{chat.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 truncate">{chat.title}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{chat.preview}</p>
                <p className="text-[10px] text-slate-300 mt-1">{chat.time}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => setMessages([{ id: Date.now().toString(), role: 'assistant', content: "New session started. How can I help?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])}
            className="w-full py-2 text-xs font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors"
          >
            + New Chat
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HIPAA notice */}
        <div className="bg-teal-50 border-b border-teal-100 px-5 py-2 flex items-center gap-2 text-xs text-teal-700 shrink-0">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          Encrypted & HIPAA-compliant · Not a substitute for professional medical advice.
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 space-y-5 scrollbar-thin bg-slate-50">
          {messages.length === 1 && (
            <div className="mb-2">
              <p className="text-xs text-slate-400 font-medium mb-3">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-white border border-slate-200 text-slate-700 px-3.5 py-2 rounded-full hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-colors shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-2xl bg-teal-600 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="max-w-[75%] sm:max-w-[60%]">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <p className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.time}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-2xl bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-2xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3.5 flex gap-1 items-center">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-200 bg-white px-5 sm:px-8 py-4 shrink-0">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
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
              placeholder="Describe your symptoms or ask a health question…"
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none py-2 min-h-[40px] max-h-28 scrollbar-thin"
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 112) + 'px'
              }}
            />
            <button
              onClick={() => alert('Voice input: Please use your browser\'s built-in voice input by pressing the microphone key on your keyboard.')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              aria-label="Voice input"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="p-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              aria-label="Send"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            AI responses are informational only — always consult a licensed healthcare professional.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Health Overview Tab ───────────────────────────────────────────────────────
function OverviewTab({ setActiveTab }: { setActiveTab: (t: string) => void }) {
  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 space-y-5 scrollbar-thin">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {HEALTH_STATS.map((stat) => <StatCard key={stat.label} stat={stat} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Upcoming Appointments</h3>
            <button onClick={() => setActiveTab('appointments')} className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {UPCOMING_APPOINTMENTS.map((apt) => (
              <div key={apt.doctor} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">{apt.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{apt.doctor}</p>
                  <p className="text-xs text-slate-500">{apt.specialty}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-slate-800">{apt.date}</p>
                  <p className="text-xs text-teal-600">{apt.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveTab('appointments')}
            className="mt-3 w-full py-2 text-xs font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors"
          >
            + Schedule New Appointment
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Medications</h3>
            <button onClick={() => setActiveTab('medications')} className="text-xs text-teal-600 font-medium hover:underline flex items-center gap-1">
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {MEDICATIONS.map((med) => (
              <div key={med.name} className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg shrink-0 ${med.color}`}>{med.dose}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{med.name}</p>
                  <p className="text-xs text-slate-500">{med.frequency}</p>
                </div>
                <span className={`text-xs font-semibold ${med.remaining <= 7 ? 'text-red-500' : 'text-slate-600'}`}>{med.remaining}d left</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setActiveTab('medications')}
            className="mt-3 w-full py-2 text-xs font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors"
          >
            View All Medications
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Appointments Tab ──────────────────────────────────────────────────────────
interface Appointment {
  doctor: string
  specialty: string
  date: string
  time: string
  status: 'upcoming' | 'completed'
  avatar: string
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  { doctor: 'Dr. Emily Chen', specialty: 'Cardiologist', date: 'Jun 24, 2026', time: '10:00 AM', status: 'upcoming', avatar: 'EC' },
  { doctor: 'Dr. Marcus Rivera', specialty: 'General Practitioner', date: 'Jul 2, 2026', time: '2:30 PM', status: 'upcoming', avatar: 'MR' },
  { doctor: 'Dr. Priya Nair', specialty: 'Dermatologist', date: 'Jun 10, 2026', time: '9:00 AM', status: 'completed', avatar: 'PN' },
  { doctor: 'Dr. James Wu', specialty: 'Neurologist', date: 'May 5, 2026', time: '11:30 AM', status: 'completed', avatar: 'JW' },
]

const DOCTORS = [
  { name: 'Dr. Emily Chen', specialty: 'Cardiologist', avatar: 'EC' },
  { name: 'Dr. Marcus Rivera', specialty: 'General Practitioner', avatar: 'MR' },
  { name: 'Dr. Priya Nair', specialty: 'Dermatologist', avatar: 'PN' },
  { name: 'Dr. James Wu', specialty: 'Neurologist', avatar: 'JW' },
  { name: 'Dr. Aisha Patel', specialty: 'Endocrinologist', avatar: 'AP' },
  { name: 'Dr. Kevin Lee', specialty: 'Orthopedist', avatar: 'KL' },
]

const TIME_SLOTS = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
]

interface ScheduleForm {
  doctor: string
  date: string
  time: string
  reason: string
}

interface ScheduleFormErrors {
  doctor?: string
  date?: string
  time?: string
  reason?: string
}

function AppointmentsTab() {
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [form, setForm] = useState<ScheduleForm>({ doctor: '', date: '', time: '', reason: '' })
  const [errors, setErrors] = useState<ScheduleFormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [detailApt, setDetailApt] = useState<Appointment | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const updateForm = (field: keyof ScheduleForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const e: ScheduleFormErrors = {}
    if (!form.doctor) e.doctor = 'Please select a doctor'
    if (!form.date) e.date = 'Please choose a date'
    else if (form.date < today) e.date = 'Date cannot be in the past'
    if (!form.time) e.time = 'Please select a time slot'
    if (!form.reason.trim()) e.reason = 'Please describe the reason for your visit'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))

    const selected = DOCTORS.find((d) => d.name === form.doctor)!
    const dateObj = new Date(form.date + 'T00:00:00')
    const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

    const newApt: Appointment = {
      doctor: selected.name,
      specialty: selected.specialty,
      avatar: selected.avatar,
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
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const handleCancel = (apt: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => a.doctor === apt.doctor && a.date === apt.date ? { ...a, status: 'completed' } : a)
    )
  }

  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 space-y-4 scrollbar-thin relative">

      {/* Success toast */}
      {showSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" />
          Appointment scheduled successfully!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">All Appointments</h3>
          <p className="text-xs text-slate-400 mt-0.5">{appointments.filter((a) => a.status === 'upcoming').length} upcoming</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm font-medium"
        >
          <Calendar className="w-4 h-4" /> Schedule new
        </button>
      </div>

      {/* Appointment list */}
      <div className="space-y-3">
        {appointments.map((apt, idx) => (
          <div key={apt.doctor + apt.date + idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-base font-bold shrink-0">
              {apt.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{apt.doctor}</p>
              <p className="text-sm text-slate-500">{apt.specialty}</p>
              <p className="text-xs text-slate-400 mt-1">{apt.date} at {apt.time}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                apt.status === 'upcoming' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {apt.status === 'upcoming' ? '● Upcoming' : '✓ Completed'}
              </span>
              {apt.status === 'upcoming' && (
                <>
                  <button
                    onClick={() => setDetailApt(apt)}
                    className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm font-medium border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    Details <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleCancel(apt)}
                    className="text-red-500 hover:text-red-600 flex items-center gap-1 text-sm font-medium border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              )}
              {apt.status === 'completed' && (
                <button
                  onClick={() => setDetailApt(apt)}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-medium border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Summary <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Schedule Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Schedule Appointment</h3>
                  <p className="text-xs text-slate-400">Book your next visit</p>
                </div>
              </div>
              <button
                onClick={() => { setShowModal(false); setErrors({}); setForm({ doctor: '', date: '', time: '', reason: '' }) }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Doctor select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Select Doctor</label>
                <select
                  value={form.doctor}
                  onChange={(e) => updateForm('doctor', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 appearance-none cursor-pointer ${
                    errors.doctor ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'
                  } ${!form.doctor ? 'text-slate-400' : 'text-slate-900'}`}
                >
                  <option value="">Choose a doctor…</option>
                  {DOCTORS.map((d) => (
                    <option key={d.name} value={d.name}>{d.name} — {d.specialty}</option>
                  ))}
                </select>
                {errors.doctor && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.doctor}</p>}
              </div>

              {/* Date picker */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Date</label>
                <input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 cursor-pointer ${
                    errors.date ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'
                  } text-slate-900`}
                />
                {errors.date && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.date}</p>}
              </div>

              {/* Time slots */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Time Slots</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateForm('time', slot)}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        form.time === slot
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {errors.time && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.time}</p>}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason for Visit</label>
                <textarea
                  rows={3}
                  value={form.reason}
                  onChange={(e) => updateForm('reason', e.target.value)}
                  placeholder="Briefly describe your symptoms or reason for the appointment…"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 resize-none ${
                    errors.reason ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'
                  } text-slate-900 placeholder-slate-400`}
                />
                {errors.reason && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.reason}</p>}
              </div>

              {/* Preview card */}
              {form.doctor && form.date && form.time && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {DOCTORS.find((d) => d.name === form.doctor)?.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-800">{form.doctor}</p>
                    <p className="text-xs text-teal-600">
                      {new Date(form.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {form.time}
                    </p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-teal-500 ml-auto shrink-0" />
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-slate-100">
              <button
                onClick={() => { setShowModal(false); setErrors({}); setForm({ doctor: '', date: '', time: '', reason: '' }) }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling…</>
                ) : (
                  <><Calendar className="w-4 h-4" /> Confirm Appointment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail / Summary Modal ── */}
      {detailApt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Appointment {detailApt.status === 'upcoming' ? 'Details' : 'Summary'}</h3>
              <button onClick={() => setDetailApt(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-lg font-bold">{detailApt.avatar}</div>
                <div>
                  <p className="font-semibold text-slate-900">{detailApt.doctor}</p>
                  <p className="text-sm text-slate-500">{detailApt.specialty}</p>
                </div>
              </div>
              {[
                { label: 'Date', value: detailApt.date },
                { label: 'Time', value: detailApt.time },
                { label: 'Status', value: detailApt.status === 'upcoming' ? 'Confirmed' : 'Completed' },
                { label: 'Location', value: 'MediAI Health Center, Floor 3' },
                { label: 'Mode', value: 'In-person visit' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => setDetailApt(null)}
                className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Records Tab ───────────────────────────────────────────────────────────────
const INITIAL_RECORDS = [
  { id: 'r1', name: 'Annual Blood Work Panel', date: 'Jun 3, 2026', type: 'Lab Result', status: 'normal', notes: 'All values within normal range. Cholesterol slightly elevated — monitor.' },
  { id: 'r2', name: 'Chest X-Ray Report', date: 'May 14, 2026', type: 'Imaging', status: 'normal', notes: 'No abnormalities detected. Lungs clear.' },
  { id: 'r3', name: 'Cardiology Consultation Notes', date: 'Apr 28, 2026', type: 'Visit Notes', status: 'review', notes: 'Follow-up required for mild arrhythmia. Schedule echo in 3 months.' },
  { id: 'r4', name: 'COVID-19 Vaccination Record', date: 'Jan 15, 2026', type: 'Immunization', status: 'normal', notes: 'Booster administered. Next dose recommended in 12 months.' },
]

function RecordsTab() {
  const [records, setRecords] = useState(INITIAL_RECORDS)
  const [viewRecord, setViewRecord] = useState<typeof INITIAL_RECORDS[number] | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', type: 'Lab Result', notes: '' })
  const [uploadErrors, setUploadErrors] = useState<{ name?: string; notes?: string }>({})
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<string>('')

  const RECORD_TYPES = ['Lab Result', 'Imaging', 'Visit Notes', 'Immunization', 'Prescription', 'Surgery Report']

  const validateUpload = () => {
    const e: { name?: string; notes?: string } = {}
    if (!uploadForm.name.trim()) e.name = 'Record name is required'
    if (!uploadForm.notes.trim()) e.notes = 'Please add a brief description'
    setUploadErrors(e)
    return Object.keys(e).length === 0
  }

  const handleUpload = async () => {
    if (!validateUpload()) return
    setUploading(true)
    await new Promise((r) => setTimeout(r, 1000))
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setRecords((prev) => [{
      id: 'r' + Date.now(),
      name: uploadForm.name,
      date: today,
      type: uploadForm.type,
      status: 'normal',
      notes: uploadForm.notes,
    }, ...prev])
    setUploading(false)
    setShowUpload(false)
    setUploadForm({ name: '', type: 'Lab Result', notes: '' })
    setSelectedFile('')
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3500)
  }

  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 space-y-4 scrollbar-thin relative">
      {uploadSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5 shrink-0" /> Record uploaded successfully!
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Health Records</h3>
          <p className="text-xs text-slate-400 mt-0.5">{records.length} records on file</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm font-medium"
        >
          <FileText className="w-4 h-4" /> Upload record
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {records.map((rec, i) => (
          <div key={rec.id} className={`flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors ${i < records.length - 1 ? 'border-b border-slate-100' : ''}`}>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{rec.name}</p>
              <p className="text-xs text-slate-500">{rec.type} · {rec.date}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${rec.status === 'normal' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {rec.status === 'normal' ? <><CheckCircle className="w-3 h-3" />Normal</> : <><AlertTriangle className="w-3 h-3" />Review</>}
              </span>
              <button
                onClick={() => setViewRecord(rec)}
                className="text-teal-600 hover:text-teal-700 border border-teal-200 hover:bg-teal-50 rounded-lg p-1.5 transition-colors"
                aria-label="View record"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Record Modal */}
      {viewRecord && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Record Details</h3>
                  <p className="text-xs text-slate-400">{viewRecord.type}</p>
                </div>
              </div>
              <button onClick={() => setViewRecord(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {[
                { label: 'Record Name', value: viewRecord.name },
                { label: 'Type', value: viewRecord.type },
                { label: 'Date', value: viewRecord.date },
                { label: 'Status', value: viewRecord.status === 'normal' ? '✓ Normal' : '⚠ Needs Review' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4 text-sm">
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <span className={`font-medium text-right ${viewRecord.status !== 'normal' && label === 'Status' ? 'text-amber-600' : 'text-slate-900'}`}>{value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Clinical Notes</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl px-4 py-3">{viewRecord.notes}</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setViewRecord(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Close
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5">
                <FileText className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Record Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-base">Upload Health Record</h3>
                  <p className="text-xs text-slate-400">PDF, JPG, PNG supported</p>
                </div>
              </div>
              <button onClick={() => { setShowUpload(false); setUploadErrors({}) }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* File drop zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-2xl p-6 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0]?.name ?? '')}
                />
                <FileText className="w-8 h-8 text-slate-300 group-hover:text-teal-400 mx-auto mb-2 transition-colors" />
                {selectedFile
                  ? <p className="text-sm font-medium text-teal-600">{selectedFile}</p>
                  : <>
                      <p className="text-sm font-medium text-slate-600">Click to choose a file</p>
                      <p className="text-xs text-slate-400 mt-1">or drag and drop here</p>
                    </>
                }
              </div>

              {/* Record name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Record Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => { setUploadForm((p) => ({ ...p, name: e.target.value })); setUploadErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="e.g. Blood Work — June 2026"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 ${uploadErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900 placeholder-slate-400`}
                />
                {uploadErrors.name && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{uploadErrors.name}</p>}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Record Type</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none cursor-pointer"
                >
                  {RECORD_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description / Notes</label>
                <textarea
                  rows={2}
                  value={uploadForm.notes}
                  onChange={(e) => { setUploadForm((p) => ({ ...p, notes: e.target.value })); setUploadErrors((p) => ({ ...p, notes: undefined })) }}
                  placeholder="Brief summary of this record…"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-teal-500/30 resize-none ${uploadErrors.notes ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900 placeholder-slate-400`}
                />
                {uploadErrors.notes && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{uploadErrors.notes}</p>}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => { setShowUpload(false); setUploadErrors({}) }} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleUpload} disabled={uploading} className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><FileText className="w-4 h-4" />Upload Record</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Medications Tab ───────────────────────────────────────────────────────────
interface Medication {
  id: string
  name: string
  dose: string
  frequency: string
  remaining: number
  color: string
  taken: boolean
  history: string[]
}

const INITIAL_MEDICATIONS: Medication[] = [
  { id: 'm1', name: 'Lisinopril', dose: '10mg', frequency: 'Once daily', remaining: 18, color: 'bg-blue-100 text-blue-700', taken: true, history: ['Jun 17 – Taken 8:00 AM', 'Jun 16 – Taken 8:05 AM', 'Jun 15 – Taken 7:55 AM', 'Jun 14 – Missed', 'Jun 13 – Taken 8:10 AM'] },
  { id: 'm2', name: 'Metformin', dose: '500mg', frequency: 'Twice daily', remaining: 30, color: 'bg-green-100 text-green-700', taken: true, history: ['Jun 17 – Taken 8:00 AM', 'Jun 17 – Taken 8:00 PM', 'Jun 16 – Taken 8:00 AM', 'Jun 16 – Taken 8:00 PM'] },
  { id: 'm3', name: 'Vitamin D3', dose: '2000 IU', frequency: 'Once daily', remaining: 5, color: 'bg-amber-100 text-amber-700', taken: false, history: ['Jun 16 – Taken 9:00 AM', 'Jun 15 – Taken 9:15 AM', 'Jun 14 – Taken 9:00 AM'] },
]

function MedicationsTab() {
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS)
  const [historyMed, setHistoryMed] = useState<Medication | null>(null)
  const [refillMed, setRefillMed] = useState<Medication | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [refillQty, setRefillQty] = useState(30)
  const [refillSuccess, setRefillSuccess] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)
  const [addForm, setAddForm] = useState({ name: '', dose: '', frequency: 'Once daily', supply: '30' })
  const [addErrors, setAddErrors] = useState<{ name?: string; dose?: string }>({})
  const [adding, setAdding] = useState(false)

  const FREQ_OPTIONS = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'As needed', 'Weekly']
  const DOSE_COLORS = ['bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700']

  const toggleTaken = (id: string) => {
    setMedications((prev) => prev.map((m) => m.id === id ? { ...m, taken: !m.taken } : m))
  }

  const handleRefill = () => {
    if (!refillMed) return
    setMedications((prev) => prev.map((m) => m.id === refillMed.id ? { ...m, remaining: m.remaining + refillQty } : m))
    setRefillSuccess(refillMed.name)
    setRefillMed(null)
    setTimeout(() => setRefillSuccess(''), 3500)
  }

  const validateAdd = () => {
    const e: { name?: string; dose?: string } = {}
    if (!addForm.name.trim()) e.name = 'Medication name is required'
    if (!addForm.dose.trim()) e.dose = 'Dose is required'
    setAddErrors(e)
    return Object.keys(e).length === 0
  }

  const handleAdd = async () => {
    if (!validateAdd()) return
    setAdding(true)
    await new Promise((r) => setTimeout(r, 800))
    const color = DOSE_COLORS[medications.length % DOSE_COLORS.length]
    setMedications((prev) => [...prev, {
      id: 'm' + Date.now(), name: addForm.name, dose: addForm.dose,
      frequency: addForm.frequency, remaining: parseInt(addForm.supply) || 30,
      color, taken: false, history: [],
    }])
    setAdding(false)
    setShowAdd(false)
    setAddForm({ name: '', dose: '', frequency: 'Once daily', supply: '30' })
    setAddErrors({})
    setAddSuccess(true)
    setTimeout(() => setAddSuccess(false), 3500)
  }

  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 space-y-4 scrollbar-thin relative">
      {/* Toasts */}
      {refillSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> {refillSuccess} refilled successfully!
        </div>
      )}
      {addSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> Medication added!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Medications</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {medications.filter((m) => m.taken).length}/{medications.length} taken today
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-sm bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm font-medium"
        >
          <Pill className="w-4 h-4" /> Add medication
        </button>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {medications.map((med) => (
          <div key={med.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${med.color}`}>{med.dose}</div>
              <span className={`text-xs font-semibold ${med.remaining <= 7 ? 'text-red-500' : 'text-slate-500'}`}>{med.remaining}d left</span>
            </div>
            <h4 className="font-semibold text-slate-900">{med.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{med.frequency}</p>

            {/* Taken toggle */}
            <button
              onClick={() => toggleTaken(med.id)}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all ${
                med.taken
                  ? 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {med.taken
                ? <><CheckCircle className="w-3.5 h-3.5" /> Taken today — mark undone</>
                : <><Clock className="w-3.5 h-3.5" /> Mark as taken</>
              }
            </button>

            {/* Supply bar */}
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Supply</span><span>{med.remaining} / 30 days</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={`h-1.5 rounded-full transition-all ${med.remaining <= 7 ? 'bg-red-400' : 'bg-teal-500'}`}
                  style={{ width: `${Math.min((med.remaining / 30) * 100, 100)}%` }} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setHistoryMed(med)}
                className="flex-1 text-xs text-teal-600 border border-teal-200 rounded-xl py-2 hover:bg-teal-50 transition-colors font-medium flex items-center justify-center gap-1"
              >
                <Zap className="w-3.5 h-3.5" /> History
              </button>
              <button
                onClick={() => { setRefillMed(med); setRefillQty(30) }}
                className="flex-1 text-xs text-white bg-teal-600 hover:bg-teal-700 rounded-xl py-2 transition-colors font-medium flex items-center justify-center gap-1"
              >
                <Star className="w-3.5 h-3.5" /> Refill
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* History Modal */}
      {historyMed && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900">{historyMed.name}</h3>
                <p className="text-xs text-slate-400">Intake history</p>
              </div>
              <button onClick={() => setHistoryMed(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-4 max-h-72 overflow-y-auto scrollbar-thin">
              {historyMed.history.length === 0
                ? <p className="text-sm text-slate-400 text-center py-4">No history yet</p>
                : historyMed.history.map((entry, i) => (
                  <div key={i} className={`flex items-center gap-3 py-3 ${i < historyMed.history.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${entry.includes('Missed') ? 'bg-red-400' : 'bg-teal-500'}`} />
                    <p className={`text-sm ${entry.includes('Missed') ? 'text-red-500' : 'text-slate-700'}`}>{entry}</p>
                  </div>
                ))
              }
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setHistoryMed(null)} className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refill Modal */}
      {refillMed && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-900">Refill {refillMed.name}</h3>
                <p className="text-xs text-slate-400">Current supply: {refillMed.remaining} days</p>
              </div>
              <button onClick={() => setRefillMed(null)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600">Select refill quantity:</p>
              <div className="grid grid-cols-4 gap-2">
                {[7, 14, 30, 60, 90].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setRefillQty(qty)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      refillQty === qty ? 'bg-teal-600 text-white border-teal-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-400'
                    }`}
                  >
                    {qty}d
                  </button>
                ))}
              </div>
              <div className="bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm">
                <p className="text-teal-800 font-medium">After refill: <span className="font-bold">{refillMed.remaining + refillQty} days</span></p>
                <p className="text-teal-600 text-xs mt-0.5">Adding {refillQty} days to current supply</p>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setRefillMed(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleRefill} className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Star className="w-4 h-4" /> Confirm Refill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Pill className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Add Medication</h3>
                  <p className="text-xs text-slate-400">Track a new prescription</p>
                </div>
              </div>
              <button onClick={() => { setShowAdd(false); setAddErrors({}) }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Medication Name</label>
                <input type="text" value={addForm.name}
                  onChange={(e) => { setAddForm((p) => ({ ...p, name: e.target.value })); setAddErrors((p) => ({ ...p, name: undefined })) }}
                  placeholder="e.g. Atorvastatin"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${addErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900 placeholder-slate-400`}
                />
                {addErrors.name && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{addErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dose</label>
                <input type="text" value={addForm.dose}
                  onChange={(e) => { setAddForm((p) => ({ ...p, dose: e.target.value })); setAddErrors((p) => ({ ...p, dose: undefined })) }}
                  placeholder="e.g. 20mg"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${addErrors.dose ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900 placeholder-slate-400`}
                />
                {addErrors.dose && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{addErrors.dose}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Frequency</label>
                <select value={addForm.frequency} onChange={(e) => setAddForm((p) => ({ ...p, frequency: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none cursor-pointer">
                  {FREQ_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Supply (days)</label>
                <input type="number" min="1" max="365" value={addForm.supply}
                  onChange={(e) => setAddForm((p) => ({ ...p, supply: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => { setShowAdd(false); setAddErrors({}) }} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={adding} className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {adding ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : <><Pill className="w-4 h-4" />Add Medication</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const { user, logout, settings, updateUser, updateSettings } = useAuth()

  // Profile state — seeded from persisted user
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    dob: user?.dob ?? '',
    gender: user?.gender ?? '',
    bloodGroup: user?.bloodGroup ?? '',
  })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string }>({})

  // Photo upload
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Notification prefs — from context/localStorage
  const [notifs, setNotifs] = useState(settings.notifs)
  const [notifsSaved, setNotifsSaved] = useState(false)

  // Privacy — from context/localStorage
  const [privacy, setPrivacy] = useState(settings.privacy)
  const [privacySaved, setPrivacySaved] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [tfaCode, setTfaCode] = useState('')
  const [tfaError, setTfaError] = useState('')

  // Password
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false })
  const [pwErrors, setPwErrors] = useState<{ current?: string; newPw?: string; confirm?: string }>({})
  const [pwSaved, setPwSaved] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  // Appearance — from context/localStorage
  const [appearance, setAppearance] = useState(settings.appearance)
  const [appearanceSaved, setAppearanceSaved] = useState(false)

  // Delete account modal
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const validateProfile = () => {
    const e: { name?: string; email?: string } = {}
    if (!profile.name.trim()) e.name = 'Name is required'
    if (!profile.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = 'Enter a valid email'
    setProfileErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSaveProfile = async () => {
    if (!validateProfile()) return
    setProfileSaving(true)
    await new Promise((r) => setTimeout(r, 700))
    updateUser({ name: profile.name, email: profile.email, phone: profile.phone, dob: profile.dob, gender: profile.gender, bloodGroup: profile.bloodGroup })
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 3000)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleSaveNotifs = () => {
    updateSettings({ notifs })
    setNotifsSaved(true)
    setTimeout(() => setNotifsSaved(false), 3000)
  }

  const handleSavePrivacy = () => {
    updateSettings({ privacy })
    setPrivacySaved(true)
    setTimeout(() => setPrivacySaved(false), 3000)
  }

  const handleToggle2FA = (newVal: boolean) => {
    if (newVal) { setShow2FAModal(true) }
    else { setPrivacy((p) => ({ ...p, twoFactor: false })) }
  }

  const handleConfirm2FA = () => {
    if (tfaCode.length < 6) { setTfaError('Enter the 6-digit code'); return }
    setPrivacy((p) => ({ ...p, twoFactor: true }))
    setShow2FAModal(false)
    setTfaCode('')
    setTfaError('')
  }

  const handleSaveAppearance = () => {
    updateSettings({ appearance })
    setAppearanceSaved(true)
    setTimeout(() => setAppearanceSaved(false), 3000)
  }

  const validatePassword = () => {
    const e: { current?: string; newPw?: string; confirm?: string } = {}
    if (!pwForm.current) e.current = 'Enter your current password'
    if (!pwForm.newPw || pwForm.newPw.length < 8) e.newPw = 'New password must be at least 8 characters'
    if (pwForm.newPw !== pwForm.confirm) e.confirm = 'Passwords do not match'
    setPwErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChangePassword = async () => {
    if (!validatePassword()) return
    setPwLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setPwLoading(false)
    setPwSaved(true)
    setPwForm({ current: '', newPw: '', confirm: '' })
    setTimeout(() => setPwSaved(false), 3000)
  }

  const SectionCard = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
          <Icon className="w-4 h-4 text-teal-600" />
        </div>
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )

  const Toggle = ({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-teal-500' : 'bg-slate-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )

  const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−']
  const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']

  return (
    <div className="h-full overflow-y-auto px-5 sm:px-8 py-6 scrollbar-thin">
      {/* Toasts */}
      {profileSaved && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> Profile saved successfully!
        </div>
      )}
      {pwSaved && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> Password updated!
        </div>
      )}
      {notifsSaved && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> Notification preferences saved!
        </div>
      )}
      {privacySaved && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> Privacy settings saved!
        </div>
      )}
      {appearanceSaved && (
        <div className="fixed top-5 right-5 z-50 bg-teal-600 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle className="w-4.5 h-4.5" /> Appearance settings saved!
        </div>
      )}

      <div className="max-w-2xl mx-auto space-y-5">
        <div className="mb-1">
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage your account, preferences, and privacy</p>
        </div>

        {/* ── Profile ── */}
        <SectionCard title="Profile Information" icon={UserIcon}>
          {/* Avatar row */}
          <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100">
            <div className="relative w-16 h-16 shrink-0">
              {photoPreview
                ? <img src={photoPreview} alt="avatar" className="w-16 h-16 rounded-full object-cover shadow-sm" />
                : <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                    {profile.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'U'}
                  </div>
              }
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile.name || 'Your Name'}</p>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <button
                onClick={() => photoInputRef.current?.click()}
                className="mt-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium border border-teal-200 px-2.5 py-1 rounded-lg hover:bg-teal-50 transition-colors"
              >
                Change photo
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => { setProfile((p) => ({ ...p, name: e.target.value })); setProfileErrors((p) => ({ ...p, name: undefined })) }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${profileErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900`}
              />
              {profileErrors.name && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{profileErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Address</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => { setProfile((p) => ({ ...p, email: e.target.value })); setProfileErrors((p) => ({ ...p, email: undefined })) }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${profileErrors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900`}
              />
              {profileErrors.email && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{profileErrors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={profile.phone}
                placeholder="+1 (555) 000-0000"
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={profile.dob}
                onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all cursor-pointer"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none cursor-pointer transition-all ${!profile.gender ? 'text-slate-400' : 'text-slate-900'}`}
              >
                <option value="">Select gender</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Blood Group</label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => setProfile((p) => ({ ...p, bloodGroup: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none cursor-pointer transition-all ${!profile.bloodGroup ? 'text-slate-400' : 'text-slate-900'}`}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={profileSaving}
            className="mt-5 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {profileSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : <><CheckCircle className="w-4 h-4" />Save Profile</>}
          </button>
        </SectionCard>

        {/* ── Change Password ── */}
        <SectionCard title="Change Password" icon={Shield}>
          <div className="space-y-3">
            {([
              { key: 'current', label: 'Current Password', placeholder: '••••••••' },
              { key: 'newPw', label: 'New Password', placeholder: 'Min. 8 characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ] as const).map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    value={pwForm[key]}
                    placeholder={placeholder}
                    onChange={(e) => { setPwForm((p) => ({ ...p, [key]: e.target.value })); setPwErrors((p) => ({ ...p, [key]: undefined })) }}
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${pwErrors[key] ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900 placeholder-slate-400`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwErrors[key] && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{pwErrors[key]}</p>}
              </div>
            ))}
          </div>
          <button
            onClick={handleChangePassword}
            disabled={pwLoading}
            className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2"
          >
            {pwLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Updating…</> : <><Shield className="w-4 h-4" />Update Password</>}
          </button>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard title="Notification Preferences" icon={Bell}>
          <Toggle checked={notifs.appointmentReminders} onChange={() => setNotifs((p) => ({ ...p, appointmentReminders: !p.appointmentReminders }))}
            label="Appointment Reminders" sub="Get notified 24h before scheduled appointments" />
          <Toggle checked={notifs.medicationAlerts} onChange={() => setNotifs((p) => ({ ...p, medicationAlerts: !p.medicationAlerts }))}
            label="Medication Alerts" sub="Daily reminders to take your medications" />
          <Toggle checked={notifs.labResults} onChange={() => setNotifs((p) => ({ ...p, labResults: !p.labResults }))}
            label="Lab Results Ready" sub="Notify when new reports are available" />
          <Toggle checked={notifs.weeklyReport} onChange={() => setNotifs((p) => ({ ...p, weeklyReport: !p.weeklyReport }))}
            label="Weekly Health Report" sub="Summary of your health activity each week" />
          <Toggle checked={notifs.promotions} onChange={() => setNotifs((p) => ({ ...p, promotions: !p.promotions }))}
            label="Product Updates & Tips" sub="Health tips and platform updates" />
          <button onClick={handleSaveNotifs} className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Save Preferences
          </button>
        </SectionCard>

        {/* ── Privacy & Security ── */}
        <SectionCard title="Privacy & Security" icon={Shield}>
          <Toggle checked={privacy.shareDataWithDoctors} onChange={() => setPrivacy((p) => ({ ...p, shareDataWithDoctors: !p.shareDataWithDoctors }))}
            label="Share Data with Doctors" sub="Allow your health records to be visible to your care team" />
          <Toggle checked={privacy.anonymousAnalytics} onChange={() => setPrivacy((p) => ({ ...p, anonymousAnalytics: !p.anonymousAnalytics }))}
            label="Anonymous Analytics" sub="Help improve MediAI with anonymous usage data" />
          <Toggle checked={privacy.twoFactor} onChange={() => handleToggle2FA(!privacy.twoFactor)}
            label="Two-Factor Authentication" sub={privacy.twoFactor ? '2FA is active — your account is protected' : 'Add an extra layer of security'} />
          <button onClick={handleSavePrivacy} className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Save Privacy Settings
          </button>
        </SectionCard>

        {/* ── Appearance ── */}
        <SectionCard title="Appearance & Language" icon={Settings}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Font Size</label>
              <select
                value={appearance.fontSize}
                onChange={(e) => {
                  const val = e.target.value as 'small' | 'medium' | 'large'
                  setAppearance((p) => ({ ...p, fontSize: val }))
                  // Apply live preview
                  const sizes = { small: '14px', medium: '16px', large: '18px' }
                  document.documentElement.style.fontSize = sizes[val]
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none cursor-pointer"
              >
                {['Small', 'Medium', 'Large'].map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Language</label>
              <select
                value={appearance.language}
                onChange={(e) => setAppearance((p) => ({ ...p, language: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 appearance-none cursor-pointer"
              >
                {['English', 'Hindi', 'Spanish', 'French', 'Arabic'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3">Font size changes apply immediately as a live preview.</p>
          <button onClick={handleSaveAppearance} className="mt-3 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Save Appearance
          </button>
        </SectionCard>

        {/* ── Danger Zone ── */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-red-100 bg-red-50/60">
            <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-semibold text-red-700 text-sm">Danger Zone</h3>
          </div>
          <div className="px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-800">Delete Account</p>
              <p className="text-xs text-slate-400 mt-0.5">Permanently delete your account and all health data. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              className="shrink-0 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm font-semibold rounded-xl transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Sign out row */}
        <div className="pb-6">
          <button
            onClick={logout}
            className="w-full py-3 border border-slate-200 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign out of MediAI
          </button>
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Enable 2FA</h3>
                  <p className="text-xs text-slate-400">Two-factor authentication</p>
                </div>
              </div>
              <button onClick={() => { setShow2FAModal(false); setTfaCode(''); setTfaError('') }} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">Scan this QR code with your authenticator app</p>
                <div className="w-32 h-32 mx-auto bg-white border-2 border-slate-200 rounded-xl flex items-center justify-center">
                  <div className="grid grid-cols-5 gap-1 p-2">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Or enter code: <span className="font-mono font-semibold">MEDI-AI-2FA-DEMO</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Enter 6-digit verification code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={tfaCode}
                  onChange={(e) => { setTfaCode(e.target.value.replace(/\D/g, '')); setTfaError('') }}
                  placeholder="000000"
                  className={`w-full px-4 py-3 rounded-xl border text-sm text-center tracking-[0.3em] font-mono outline-none focus:ring-2 focus:ring-teal-500/30 transition-all ${tfaError ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-teal-500 focus:bg-white'} text-slate-900`}
                />
                {tfaError && <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{tfaError}</p>}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => { setShow2FAModal(false); setTfaCode(''); setTfaError('') }} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleConfirm2FA} className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" /> Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg">Delete your account?</h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                This will permanently delete all your health records, appointments, and data. Type <span className="font-semibold text-red-500">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="mt-4 w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 text-center placeholder-slate-400"
              />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirm !== 'DELETE'}
                onClick={logout}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
