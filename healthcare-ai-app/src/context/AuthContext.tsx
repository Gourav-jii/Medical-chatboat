import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  name: string
  email: string
  role: string
  avatar?: string
  phone?: string
  dob?: string
  gender?: string
  bloodGroup?: string
}

export interface UserSettings {
  notifs: {
    appointmentReminders: boolean
    medicationAlerts: boolean
    labResults: boolean
    weeklyReport: boolean
    promotions: boolean
  }
  privacy: {
    shareDataWithDoctors: boolean
    anonymousAnalytics: boolean
    twoFactor: boolean
  }
  appearance: {
    fontSize: 'small' | 'medium' | 'large'
    language: string
  }
}

const DEFAULT_SETTINGS: UserSettings = {
  notifs: {
    appointmentReminders: true,
    medicationAlerts: true,
    labResults: true,
    weeklyReport: false,
    promotions: false,
  },
  privacy: {
    shareDataWithDoctors: true,
    anonymousAnalytics: false,
    twoFactor: false,
  },
  appearance: {
    fontSize: 'medium',
    language: 'English',
  },
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  settings: UserSettings
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  updateUser: (fields: Partial<User>) => void
  updateSettings: (fields: Partial<UserSettings>) => void
}

const AUTH_KEY = 'mediai_auth'
const SETTINGS_KEY = 'mediai_settings'

function loadAuth(): { isAuthenticated: boolean; user: User | null } {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return { isAuthenticated: false, user: null }
    const parsed = JSON.parse(raw)
    if (parsed?.isAuthenticated && parsed?.user) return { isAuthenticated: true, user: parsed.user }
  } catch { /* ignore */ }
  return { isAuthenticated: false, user: null }
}

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = loadAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(stored.isAuthenticated)
  const [user, setUser] = useState<User | null>(stored.user)
  const [settings, setSettings] = useState<UserSettings>(loadSettings())

  // Persist auth
  useEffect(() => {
    if (isAuthenticated && user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ isAuthenticated: true, user }))
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }, [isAuthenticated, user])

  // Persist settings
  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  // Apply font size to <html>
  useEffect(() => {
    const sizes = { small: '14px', medium: '16px', large: '18px' }
    document.documentElement.style.fontSize = sizes[settings.appearance.fontSize]
  }, [settings.appearance.fontSize])

  const login = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 1000))
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    setUser({ name, email, role: 'Patient' })
    setIsAuthenticated(true)
  }

  const signup = async (name: string, email: string, _password: string, role: string) => {
    await new Promise((r) => setTimeout(r, 1000))
    setUser({ name, email, role })
    setIsAuthenticated(true)
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  const updateUser = (fields: Partial<User>) => {
    setUser((prev) => prev ? { ...prev, ...fields } : prev)
  }

  const updateSettings = (fields: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...fields }))
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, settings, login, signup, logout, updateUser, updateSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
