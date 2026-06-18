import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import toast from 'react-hot-toast'
import { generateToken, verifyToken } from '../utils/jwt'

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

const JWT_KEY = 'mediai_jwt_token'
const SETTINGS_KEY = 'mediai_settings'

function loadAuth(): { isAuthenticated: boolean; user: User | null } {
  try {
    const token = localStorage.getItem(JWT_KEY)
    if (!token) return { isAuthenticated: false, user: null }
    const user = verifyToken(token)
    return { isAuthenticated: true, user }
  } catch (error) {
    console.error('JWT Verification failed:', error)
    localStorage.removeItem(JWT_KEY)
    return { isAuthenticated: false, user: null }
  }
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
      const token = generateToken(user)
      localStorage.setItem(JWT_KEY, token)
    } else {
      localStorage.removeItem(JWT_KEY)
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

  const USERS_DB_KEY = 'mediai_users_db'

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 1000))
    
    // Hardcoded demo account for testing
    if (email === 'demo@example.com' && password === 'password123') {
      setUser({ name: 'Demo User', email, role: 'Patient' })
      setIsAuthenticated(true)
      toast.success('Successfully logged in!')
      return
    }

    const usersRaw = localStorage.getItem(USERS_DB_KEY)
    const users = usersRaw ? JSON.parse(usersRaw) : []
    const foundUser = users.find((u: any) => u.email === email && u.password === password)
    
    if (!foundUser) {
      toast.error('Invalid email or password')
      throw new Error('Invalid credentials')
    }
    
    setUser({ name: foundUser.name, email: foundUser.email, role: foundUser.role })
    setIsAuthenticated(true)
    toast.success('Successfully logged in!')
  }

  const signup = async (name: string, email: string, password: string, role: string) => {
    await new Promise((r) => setTimeout(r, 1000))
    
    const usersRaw = localStorage.getItem(USERS_DB_KEY)
    const users = usersRaw ? JSON.parse(usersRaw) : []
    
    // Store new user credential
    if (users.some((u: any) => u.email === email)) {
      toast.error('Email already registered')
      throw new Error('Email already registered')
    }

    users.push({ name, email, password, role })
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(users))

    setUser({ name, email, role })
    setIsAuthenticated(true)
    toast.success('Account created successfully!')
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    toast.success('Successfully logged out')
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
