import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Loader2,
  Lock,
  Mail,
  User,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface FormErrors {
  name?: string
  email?: string
  role?: string
  password?: string
  confirm?: string
  terms?: string
}

const roles = ['Patient', 'Caregiver', 'Healthcare Professional', 'Researcher']

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
    { label: 'Special char', ok: /[^a-zA-Z0-9]/.test(password) },
  ]

  const score = checks.filter((check) => check.ok).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']

  if (!password) return null

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Password strength</p>
        <span className={`text-xs font-bold ${score <= 1 ? 'text-red-600' : score === 2 ? 'text-amber-600' : 'text-emerald-600'}`}>
          {labels[Math.max(score - 1, 0)]}
        </span>
      </div>

      <div className="mt-3 flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index < score
                ? score === 1
                  ? 'bg-red-400'
                  : score === 2
                    ? 'bg-amber-400'
                    : score === 3
                      ? 'bg-blue-400'
                      : 'bg-emerald-500'
                : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(({ label, ok }) => (
          <span key={label} className={`flex items-center gap-1 text-xs ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
            <CheckCircle2 className="h-3 w-3" />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const { signup } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', role: '', password: '', confirm: '' })
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

  const inputClass = (field: keyof FormErrors, withRightPadding = false) =>
    `w-full rounded-2xl border py-3 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${
      errors[field]
        ? 'border-red-400 bg-red-50 focus:border-red-400'
        : 'border-slate-200 bg-slate-50 focus:border-blue-500'
    } ${withRightPadding ? 'pl-10 pr-11' : 'pl-10 pr-4'}`

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef6ff_100%)] text-slate-900">
      <div className="pointer-events-none absolute -left-24 top-[-6rem] h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5rem] top-24 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/2 h-80 w-[32rem] -translate-x-1/2 rounded-full bg-cyan-100/40 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-200">
              <Heart className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="text-left">
              <p className="text-base font-extrabold tracking-tight text-slate-900">MediAssist AI</p>
              <p className="text-[11px] font-medium text-slate-500">Create your secure health profile</p>
            </div>
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-100"
          >
            Sign in
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur-2xl sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-emerald-500 text-white shadow-lg shadow-blue-200">
                <Heart className="h-5 w-5" fill="currentColor" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">Create account</p>
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Join MediAssist AI</h2>
              </div>
            </div>
          </div>

          <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
            Create your profile to save chats, compare recommendations, and move between desktop and mobile with ease.
          </p>

          {apiError && (
            <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-slate-700">
                I am a...
              </label>
              <select
                id="role"
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                className={`w-full appearance-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${
                  errors.role ? 'border-red-400 bg-red-50 focus:border-red-400' : 'border-slate-200 bg-slate-50 focus:border-blue-500'
                } ${!form.role ? 'text-slate-400' : 'text-slate-900'}`}
              >
                <option value="" disabled>
                  Select your role
                </option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.role}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`w-full rounded-2xl border py-3 pl-10 pr-11 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${
                    errors.password
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={form.confirm}
                  onChange={(e) => update('confirm', e.target.value)}
                  placeholder="Repeat your password"
                  className={`w-full rounded-2xl border py-3 pl-10 pr-11 text-sm font-medium text-slate-950 placeholder:text-slate-400 outline-none transition focus:bg-white focus:ring-2 focus:ring-blue-500/20 ${
                    errors.confirm
                      ? 'border-red-400 bg-red-50 focus:border-red-400'
                      : 'border-slate-200 bg-slate-50 focus:border-blue-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.confirm && form.password === form.confirm && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Passwords match
                </p>
              )}
              {errors.confirm && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.confirm}
                </p>
              )}
            </div>

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
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-blue-600"
                />
                <label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed text-slate-600">
                  I agree to the{' '}
                  <a href="#" className="font-medium text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="font-medium text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                  , including data sharing for health services.
                </label>
              </div>
              {errors.terms && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" /> {errors.terms}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create free account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 transition hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
