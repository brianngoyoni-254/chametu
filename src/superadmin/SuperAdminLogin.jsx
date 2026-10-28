import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Eye, EyeOff, Mail, ArrowRight,
  ShieldCheck, Zap, KeyRound, Fingerprint,
  LayoutDashboard, CreditCard, ShieldAlert, X
} from 'lucide-react'
import { toast } from 'sonner'
import ThemeToggle from '../components/ThemeToggle'
import logo from '../assets/logos.png'
import { api } from '../lib/api' // <-- Import API

export default function SuperAdminLogin() {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) return setError('Enter your developer email.')
    if (!password) return setError('Enter your password.')

    setBusy(true)

    try {
      // REAL API CALL to Flask backend
      const data = await api('/api/superadmin/login', {
        method: 'POST',
        body: { email, password }
      })

      // Save the real JWT token
      localStorage.setItem('superadmin_token', data.token)
      localStorage.setItem('superadmin_user', JSON.stringify(data.user))
      
      toast.success(`Welcome back, ${data.user.name}`)
      navigate('/superadmin')
    } catch (err) {
      setError(err.message || 'Access Denied. Invalid developer credentials.')
      toast.error('Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F5F7F9] dark:bg-paper lg:grid-cols-[1.05fr_1fr]">
      {/* ================= LEFT: Brand panel (desktop only) ================= */}
      <aside className="relative hidden flex-col overflow-hidden bg-[#071625] p-10 text-white lg:flex lg:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 600px at -10% -10%, rgba(16,185,129,0.32), transparent 55%), radial-gradient(700px 500px at 110% 110%, rgba(245,185,66,0.14), transparent 55%), linear-gradient(155deg, #071625 0%, #0A2534 50%, #051C26 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald/50 blur-xl" />
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.08] ring-1 ring-white/15 backdrop-blur">
              <img src={logo} alt="Chametu" className="h-7 w-7 rounded-lg object-contain" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">Chametu</div>
            <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold">Super Admin Portal</div>
          </div>
        </Link>

        <div className="relative mt-16 max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-white/70 backdrop-blur">
            <Zap size={11} className="text-gold" />
            Restricted Access
          </div>

          <h1 className="mt-6 font-display text-[2.7rem] font-bold leading-[1.03] tracking-tight">
            Platform control,{' '}
            <span className="bg-gradient-to-r from-emerald via-[#7CF0C0] to-emerald bg-clip-text text-transparent">
              simplified.
            </span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/70">
            Monitor all chamas, manage billing, and oversee the entire Chametu ecosystem from one secure developer dashboard.
          </p>
        </div>

        <div className="relative mt-10 grid max-w-[520px] gap-3">
          {[
            { icon: LayoutDashboard, title: 'Global Overview', sub: 'Real-time MRR, active chamas and platform health' },
            { icon: CreditCard, title: 'Billing & Enforcement', sub: 'Manage tier invoices and bulk-block overdue chamas' },
            { icon: ShieldAlert, title: 'Audit & Compliance', sub: 'Every admin action is logged and traceable' },
          ].map((f) => (
            <div key={f.title} className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07]">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-emerald/15 text-emerald ring-1 ring-emerald/20 transition group-hover:bg-emerald/20">
                <f.icon size={16} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-[0.88rem] font-semibold text-white/95">{f.title}</div>
                <div className="mt-0.5 text-[0.76rem] leading-snug text-white/55">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-auto flex items-center gap-3 pt-12 text-[0.72rem] text-white/40">
          <Fingerprint size={14} />
          <span>Developer access only. All attempts are logged.</span>
        </div>
      </aside>

      <main className="flex min-h-screen items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:items-center">
        <div className="w-full max-w-[440px]">
          
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4 sm:mb-6">
            <Link to="/" className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-[0.78rem] font-semibold text-navy no-underline transition hover:border-forest hover:bg-forest/[0.04] sm:text-[0.82rem]">
              <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
              Back home
            </Link>
            <ThemeToggle />
          </div>

          <Link to="/" className="mb-6 flex items-center gap-2 no-underline lg:hidden">
            <img src={logo} alt="Chametu" className="h-7 w-7 rounded-lg object-contain sm:h-8 sm:w-8" />
            <span className="font-display text-[0.98rem] font-bold text-navy sm:text-[1.05rem]">Chametu</span>
          </Link>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] bg-navy/10 text-navy dark:bg-white/10 dark:text-white sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[0.65rem]">
              <ShieldCheck size={11} strokeWidth={2.4} />
              Super Admin Access
            </div>

            <h1 className="mt-3 font-display text-[1.7rem] font-bold leading-[1.12] tracking-tight text-navy sm:mt-4 sm:text-[2.05rem] lg:text-[2.15rem]">
              Developer Portal
            </h1>
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-soft sm:mt-2 sm:text-[0.9rem]">
              Sign in to manage the entire Chametu platform.
            </p>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl bg-emerald/[0.05] px-3 py-2 text-[0.68rem] leading-relaxed text-navy ring-1 ring-emerald/10 sm:px-3.5 sm:py-2.5 sm:text-[0.74rem]">
            <ShieldCheck size={12} className="mt-0.5 flex-none text-forest" />
            <span>Use your assigned developer credentials. Unauthorized access is prohibited.</span>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            <Field label="Developer Email">
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-card px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <Mail size={16} strokeWidth={1.9} className="shrink-0 text-ink-soft transition group-focus-within:text-forest" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@chametu.co.ke"
                  autoComplete="email"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-card px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <KeyRound size={16} strokeWidth={1.9} className="shrink-0 text-ink-soft transition group-focus-within:text-forest" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg p-1 text-ink-soft transition hover:bg-paper hover:text-navy"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between pt-0.5 sm:pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-[0.78rem] text-ink-soft sm:text-[0.82rem]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded accent-forest"
                />
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.9rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(11,122,90,0.3)] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55 sm:mt-2 sm:py-4 sm:text-[0.98rem]"
            >
              {busy ? 'Authenticating...' : 'Access Platform'}
              {!busy && <ArrowRight size={15} strokeWidth={2.4} />}
            </button>

            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-red-700 sm:px-4 sm:py-3 sm:text-[0.84rem]">
                <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-red-500 text-white">
                  <X size={10} strokeWidth={3} />
                </span>
                {error}
              </div>
            )}
          </form>

          <p className="mt-8 mb-4 text-center text-[0.66rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-[0.7rem]">
            This portal is for Chametu developers only. <br />
            Production authentication requires a secure backend.
          </p>
        </div>
      </main>
    </div>
  )
}

function Field({ label, action, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[0.72rem] font-semibold text-navy sm:text-[0.78rem]">
          {label}
        </label>
        {action}
      </div>
      {children}
    </div>
  )
}