import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye, EyeOff, Mail, Lock, User, Heart,
  AlertCircle, Loader2, Phone, CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  role?: string
  password?: string
  confirm?: string
  terms?: string
}

const roles = ['Patient', 'Caregiver', 'Healthcare Professional', 'Researcher']

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special character', ok: /[^a-zA-Z0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length

  const bar = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-teal-500']
  const label = ['Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? bar[score - 1] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {checks.map(({ label, ok }) => (
            <span key={label} className={`text-xs flex items-center gap-1 ${ok ? 'text-teal-600' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-3 h-3" />
              {label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-semibold ${bar[score - 1].replace('bg-', 'text-')}`}>
            {label[score - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const update = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    else if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'

    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address'

    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone)) {
      e.phone = 'Enter a valid phone number'
    }

    if (!form.role) e.role = 'Please select your role'

    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'

    if (!form.confirm) e.confirm = 'Please confirm your password'
    else if (form.password !== form.confirm) e.confirm = 'Passwords do not match'

    if (!termsAccepted) e.terms = 'You must accept the terms to continue'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return
    setLoading(true)
    try {
      await signup(form.name, form.email, form.password, form.role)
    } catch {
      setApiError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FormErrors) =>
    `w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-400'
        : 'border-gray-300 bg-white focus:border-teal-500'
    }`

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-teal-700 via-teal-600 to-cyan-500 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-28 -right-28 w-96 h-96 rounded-full bg-white/10" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-teal-600" fill="currentColor" />
          </div>
          <span className="text-white text-xl font-bold">MediAI</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug">
              Join thousands of people managing their health smarter
            </h1>
            <p className="mt-4 text-teal-100">
              Create your free account and get instant access to AI-powered health tools.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '200K+', label: 'Active users' },
              { value: '98%', label: 'Satisfaction rate' },
              { value: '50+', label: 'Specialties covered' },
              { value: '24/7', label: 'AI availability' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 border border-white/20 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-teal-200 text-sm mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-teal-200 text-xs">
          © 2026 MediAI Inc. · HIPAA Compliant · SOC 2 Certified
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-start justify-center bg-gray-50 px-6 py-10 sm:px-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <span className="text-teal-700 text-xl font-bold">MediAI</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
            <p className="mt-1.5 text-gray-500">Start your health journey — it's free</p>
          </div>

          {apiError && (
            <div className="mb-5 flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jane Smith"
                  className={inputClass('name')}
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

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
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white focus:border-teal-500'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                I am a…
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 appearance-none cursor-pointer ${
                  errors.role ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white focus:border-teal-500'
                } ${!form.role ? 'text-gray-400' : 'text-gray-900'}`}
              >
                <option value="" disabled>Select your role</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.role}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 pointer-events-none" />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => update('confirm', e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm transition-colors outline-none focus:ring-2 focus:ring-teal-500/30 ${
                    errors.confirm ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {form.confirm && form.password === form.confirm && (
                <p className="mt-1.5 text-xs text-teal-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
              {errors.confirm && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.confirm}
                </p>
              )}
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start gap-2.5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (errors.terms) setErrors((prev) => ({ ...prev, terms: undefined }))
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-teal-600 cursor-pointer shrink-0"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer leading-relaxed">
                  I agree to the{' '}
                  <a href="#" className="text-teal-600 hover:underline font-medium">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-teal-600 hover:underline font-medium">Privacy Policy</a>
                  , including data sharing for health services.
                </label>
              </div>
              {errors.terms && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create free account'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
