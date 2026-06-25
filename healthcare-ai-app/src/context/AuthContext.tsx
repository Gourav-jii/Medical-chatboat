import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import toast from 'react-hot-toast'
import { verifyToken } from '../utils/jwt'

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
    if (!isAuthenticated || !user) {
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

  const API_URL = 'http://localhost:5000/api';

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Invalid email or password');
        throw new Error(data.message || 'Invalid credentials');
      }

      setUser({ name: data.user.name, email: data.user.email, role: data.user.role });
      setIsAuthenticated(true);
      localStorage.setItem(JWT_KEY, data.token);
      toast.success('Successfully logged in!');
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  const signup = async (name: string, email: string, password: string, role: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.message || 'Email already registered');
        throw new Error(data.message || 'Email already registered');
      }

      toast.success('Account created successfully!');
    } catch (error) {
      console.error(error);
      throw error;
    }
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
