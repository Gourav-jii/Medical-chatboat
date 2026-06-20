import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Heart, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface FormErrors {
  email?: string
  password?: string
}

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setApiError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-400 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-white/10" />
        <div className="absolute top-1/3 right-0 w-64 h-64 rounded-full bg-cyan-300/20" />

        {/* Logo */}
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-teal-600" fill="currentColor" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">MediAI</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your AI-Powered<br />Healthcare Partner
            </h1>
            <p className="mt-4 text-teal-100 text-lg leading-relaxed">
              Get instant medical guidance, symptom analysis, and personalized health insights — available 24/7.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3">
            {['Symptom Checker', 'AI Diagnosis', 'Health Records', '24/7 Support'].map((f) => (
              <span
                key={f}
                className="bg-white/20 backdrop-blur-sm text-white text-sm px-4 py-1.5 rounded-full border border-white/30"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
          <p className="text-white text-sm leading-relaxed italic">
            "MediAI helped me understand my symptoms and guided me to the right specialist in minutes. It's like having a doctor in my pocket."
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-300/50 flex items-center justify-center text-white text-xs font-bold">
              SJ
            </div>
            <div>
              <p className="text-white text-sm font-semibold">Sarah Johnson</p>
              <p className="text-teal-200 text-xs">Verified Patient</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-teal-700 text-xl font-bold">MediAI</span>
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-gray-500">Sign in to access your health dashboard</p>
          </div>

          {apiError && (
            <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    errors.email
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-gray-300 bg-white focus:border-teal-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a href="#" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    errors.password
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-gray-300 bg-white focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-teal-600 accent-teal-600 cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-teal-600 hover:text-teal-700 font-semibold">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
