import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, Eye, EyeOff, Mail, ArrowRight,
  ShieldCheck, X, Crown, Banknote, BookOpen, UserRound,
  Building2, KeyRound, Fingerprint,
  CircleDollarSign, LineChart, Users, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useMemberAuth } from '../lib/memberAuth'
import ThemeToggle from '../components/ThemeToggle'
import logo from '../assets/logos.png'

const ROLES = {
  Chairman: {
    label: 'Chairman', icon: Crown, accent: 'text-forest', chipBg: 'bg-forest/10',
    gradient: 'from-forest to-emerald', glow: 'shadow-[0_8px_24px_rgba(11,122,90,0.28)]',
    badge: 'Chairman access', heading: 'Welcome back, Chairman',
    subtext: 'Oversee contributions, approve loans and keep your chama running smoothly.',
  },
  Treasurer: {
    label: 'Treasurer', icon: Banknote, accent: 'text-[#8A6417]', chipBg: 'bg-gold/15',
    gradient: 'from-gold to-[#E8A21F]', glow: 'shadow-[0_8px_24px_rgba(232,162,31,0.28)]',
    badge: 'Treasurer access', heading: 'Welcome back, Treasurer',
    subtext: 'Reconcile payments, track the ledger and manage every shilling in the chama.',
  },
  Secretary: {
    label: 'Secretary', icon: BookOpen, accent: 'text-navy', chipBg: 'bg-navy/10',
    gradient: 'from-navy to-[#0A2A3E]', glow: 'shadow-[0_8px_24px_rgba(11,31,51,0.28)]',
    badge: 'Secretary access', heading: 'Welcome back, Secretary',
    subtext: 'Record meetings, keep minutes and stay on top of the chama schedule.',
  },
  Member: {
    label: 'Member', icon: UserRound, accent: 'text-emerald', chipBg: 'bg-emerald/15',
    gradient: 'from-emerald to-[#0A7A5A]', glow: 'shadow-[0_8px_24px_rgba(16,185,129,0.28)]',
    badge: 'Member access', heading: 'Welcome back',
    subtext: 'View your savings, contributions, loans and everything happening in the chama.',
  },
}

const ROLE_ORDER = ['Chairman', 'Treasurer', 'Secretary', 'Member']

export default function Login() {
  const { login: adminLogin } = useAuth()
  const { login: memberLogin } = useMemberAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [activeRole, setActiveRole] = useState('Chairman')
  const role = ROLES[activeRole]
  const RoleIcon = role.icon

  const [chamaName, setChamaName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e?.preventDefault()
    setError('')

    if (!email.trim()) return setError('Enter your email address.')
    if (!password) return setError('Enter your password.')

    setBusy(true)
    try {
      localStorage.removeItem('chametu_auth_session_v1')
      localStorage.removeItem('chametu_accounts_v1')
      localStorage.removeItem('member_session')

      if (activeRole === 'Member') {
        try {
          const member = await memberLogin(email, password)
          toast.success(`Welcome back, ${member.user.name.split(' ')[0]}`)
          navigate('/member', { replace: true })
        } catch (memberErr) {
          setError(memberErr.message || 'Invalid member credentials.')
        }
      } else {
        try {
          const session = await adminLogin({ email, password })
          toast.success(`Welcome back, ${session.name.split(' ')[0]}`)
          navigate(from || '/dashboard', { replace: true })
        } catch (adminErr) {
          setError(adminErr.message || 'Invalid admin credentials.')
        }
      }
    } catch (err) {
      setError(err?.message || 'Authentication failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F5F7F9] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col overflow-hidden bg-navy p-10 text-white lg:flex lg:p-14">
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
            <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-emerald/80">
              Chama Management
            </div>
          </div>
        </Link>

        <div className="relative mt-16 max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-white/70 backdrop-blur">
            <Zap size={11} className="text-gold" /> Trusted by thousands of chamas
          </div>
          <h1 className="mt-6 font-display text-[2.7rem] font-bold leading-[1.03] tracking-tight">
            Every shilling,{' '}
            <span className="bg-gradient-to-r from-emerald via-[#7CF0C0] to-emerald bg-clip-text text-transparent">
              accounted for.
            </span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/70">
            Contributions, loans, payouts and welfare. One dashboard that keeps your chama's money
            transparent and every member in sync.
          </p>
        </div>

        <div className="relative mt-10 grid max-w-[520px] gap-3">
          {[
            { icon: CircleDollarSign, title: 'Automatic M-Pesa reconciliation', sub: 'Every payment matched to the right member' },
            { icon: Users, title: 'Roles for every position', sub: 'Chairman, treasurer, secretary and members' },
            { icon: LineChart, title: 'Live financial reports', sub: 'Statements and dashboards that update instantly' },
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
          <span>Bank-grade encryption. Your data stays yours.</span>
        </div>
      </aside>

      <main className="flex min-h-screen items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:items-center">
        <div className="w-full max-w-[440px]">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4 sm:mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[0.78rem] font-semibold text-navy no-underline transition hover:border-forest hover:bg-forest/[0.04] sm:text-[0.82rem]"
            >
              <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
              Back home
            </Link>
            <ThemeToggle />
          </div>

          <Link to="/" className="mb-6 flex items-center gap-2 no-underline lg:hidden">
            <img src={logo} alt="Chametu" className="h-7 w-7 rounded-lg object-contain sm:h-8 sm:w-8" />
            <span className="font-display text-[0.98rem] font-bold text-navy sm:text-[1.05rem]">Chametu</span>
          </Link>

          <div key={activeRole}>
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em] transition-colors sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[0.65rem] ${role.chipBg} ${role.accent}`}
            >
              <RoleIcon size={10} strokeWidth={2.4} className="sm:hidden" />
              <RoleIcon size={11} strokeWidth={2.4} className="hidden sm:inline" />
              {role.badge}
            </div>
            <h1 className="mt-3 font-display text-[1.7rem] font-bold leading-[1.12] tracking-tight text-navy sm:mt-4 sm:text-[2.05rem] lg:text-[2.15rem]">
              {role.heading}
            </h1>
            <p className="mt-1.5 text-[0.84rem] leading-relaxed text-ink-soft sm:mt-2 sm:text-[0.9rem]">
              {role.subtext}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-white p-1 shadow-[0_1px_2px_rgba(11,31,51,0.03),0_8px_20px_-8px_rgba(11,31,51,0.06)] sm:mt-6 sm:gap-1.5 sm:p-1.5">
            {ROLE_ORDER.map((key) => {
              const cfg = ROLES[key]
              const Icon = cfg.icon
              const isActive = activeRole === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setActiveRole(key); setError('') }}
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-center gap-1 rounded-xl py-2 transition-all duration-200 sm:gap-1.5 sm:py-2.5 ${
                    isActive ? 'bg-gradient-to-b from-forest/[0.06] to-transparent ring-1 ring-forest/15' : 'hover:bg-paper'
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-lg transition-all duration-200 sm:h-7 sm:w-7 ${
                      isActive
                        ? `bg-gradient-to-br ${cfg.gradient} text-white ${cfg.glow}`
                        : 'bg-paper text-ink-soft group-hover:bg-line/60 group-hover:text-navy'
                    }`}
                  >
                    <Icon size={12} strokeWidth={2.3} className="sm:hidden" />
                    <Icon size={13} strokeWidth={2.3} className="hidden sm:inline" />
                  </span>
                  <span
                    className={`text-[0.58rem] font-semibold leading-none transition-colors duration-200 sm:text-[0.64rem] ${
                      isActive ? 'text-navy' : 'text-ink-soft group-hover:text-navy'
                    }`}
                  >
                    {cfg.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-[6px] left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-forest sm:w-6" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald/[0.05] px-3 py-2 text-[0.68rem] leading-relaxed text-navy ring-1 ring-emerald/10 sm:px-3.5 sm:py-2.5 sm:text-[0.74rem]">
            <ShieldCheck size={12} className="mt-0.5 flex-none text-forest" />
            <span>Sign in with the email you used to register your chama.</span>
          </div>

          <form onSubmit={submit} className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[0.72rem] font-semibold text-navy sm:text-[0.78rem]">
                  Chama name (optional)
                </label>
              </div>
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <Building2 size={16} strokeWidth={1.9} className="shrink-0 text-ink-soft transition group-focus-within:text-forest" />
                <input
                  value={chamaName}
                  onChange={(e) => setChamaName(e.target.value)}
                  placeholder="e.g. Umoja Investment Chama"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[0.72rem] font-semibold text-navy sm:text-[0.78rem]">Email address</label>
              </div>
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <Mail size={16} strokeWidth={1.9} className="shrink-0 text-ink-soft transition group-focus-within:text-forest" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[0.72rem] font-semibold text-navy sm:text-[0.78rem]">Password</label>
                <Link to="/forgot-password" className="text-[0.72rem] font-semibold text-forest hover:underline sm:text-[0.76rem]">
                  Forgot?
                </Link>
              </div>
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <KeyRound size={16} strokeWidth={1.9} className="shrink-0 text-ink-soft transition group-focus-within:text-forest" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg p-1 text-ink-soft transition hover:bg-paper hover:text-navy"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

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
              {busy ? 'Signing in...' : 'Sign in'}
              {!busy && <ArrowRight size={15} strokeWidth={2.4} />}
            </button>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[0.78rem] leading-relaxed text-red-700 sm:px-4 sm:py-3 sm:text-[0.84rem]"
              >
                <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-red-500 text-white">
                  <X size={10} strokeWidth={3} />
                </span>
                {error}
              </div>
            )}
          </form>

          <div className="mt-5 sm:mt-6">
            {activeRole === 'Chairman' ? (
              <div className="rounded-2xl border border-line bg-white p-3.5 shadow-sm sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-gradient-to-br from-forest to-emerald text-white shadow-sm sm:h-10 sm:w-10">
                    <Crown size={15} strokeWidth={2} className="sm:hidden" />
                    <Crown size={16} strokeWidth={2} className="hidden sm:inline" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.84rem] font-semibold text-navy sm:text-[0.88rem]">
                      Don't have a chama yet?
                    </div>
                    <p className="mt-0.5 text-[0.72rem] leading-relaxed text-ink-soft sm:text-[0.76rem]">
                      Create one in two minutes. You'll be set as chairman and can invite your
                      treasurer, secretary and members right after.
                    </p>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="group mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-[0.82rem] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 sm:mt-3.5 sm:py-3 sm:text-[0.86rem]"
                >
                  Create a chama
                  <ArrowRight size={14} strokeWidth={2.4} className="transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-line bg-white p-3.5 shadow-sm sm:p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-gradient-to-br from-gold to-[#E8A21F] text-white shadow-sm sm:h-10 sm:w-10">
                    <ShieldCheck size={15} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[0.84rem] font-semibold text-navy sm:text-[0.88rem]">
                      Waiting on your invite?
                    </div>
                    <p className="mt-0.5 text-[0.72rem] leading-relaxed text-ink-soft sm:text-[0.76rem]">
                      Your chairman needs to invite you before you can sign in.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-5 mb-4 text-center text-[0.66rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-[0.7rem]">
            Secured by Chametu. Production login requires a secure backend.
          </p>
        </div>
      </main>
    </div>
  )
}