import { useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  ArrowLeft, Eye, EyeOff, Mail, ArrowRight,
  Sparkles, ShieldCheck, RotateCcw, X,
  Crown, Banknote, BookOpen, UserRound, Users,
  Building2, KeyRound, Fingerprint, BadgeCheck, ArrowUpRight,
  CircleDollarSign, LineChart, Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { setMemberSession, getChama } from '../lib/chametuStorage'
import { setupDemoChama, resetAll, DEMO_CHAMA } from '../lib/setupDemo'
import ThemeToggle from '../components/ThemeToggle'
import logo from '../assets/logos.png'

/* ============================================================
   Role configuration
   ============================================================ */
const ROLES = {
  Chairman: {
    label: 'Chairman',
    icon: Crown,
    accent: 'text-forest',
    chipBg: 'bg-forest/10',
    gradient: 'from-forest to-emerald',
    glow: 'shadow-[0_8px_24px_rgba(11,122,90,0.28)]',
    badge: 'Chairman access',
    heading: 'Welcome back, Chairman',
    subtext:
      'Oversee contributions, approve loans and keep your chama running smoothly.',
    hint: 'Use the chama name and email you set up when you created your chama.',
  },
  Treasurer: {
    label: 'Treasurer',
    icon: Banknote,
    accent: 'text-[#8A6417]',
    chipBg: 'bg-gold/15',
    gradient: 'from-gold to-[#E8A21F]',
    glow: 'shadow-[0_8px_24px_rgba(232,162,31,0.28)]',
    badge: 'Treasurer access',
    heading: 'Welcome back, Treasurer',
    subtext:
      'Reconcile payments, track the ledger and manage every shilling in the chama.',
    hint: 'Sign in with the chama name and email your chairman invited you with.',
  },
  Secretary: {
    label: 'Secretary',
    icon: BookOpen,
    accent: 'text-navy',
    chipBg: 'bg-navy/10',
    gradient: 'from-navy to-[#0A2A3E]',
    glow: 'shadow-[0_8px_24px_rgba(11,31,51,0.28)]',
    badge: 'Secretary access',
    heading: 'Welcome back, Secretary',
    subtext:
      'Record meetings, keep minutes and stay on top of the chama schedule.',
    hint: 'Sign in with the chama name and email your chairman invited you with.',
  },
  Member: {
    label: 'Member',
    icon: UserRound,
    accent: 'text-emerald',
    chipBg: 'bg-emerald/15',
    gradient: 'from-emerald to-[#0A7A5A]',
    glow: 'shadow-[0_8px_24px_rgba(16,185,129,0.28)]',
    badge: 'Member access',
    heading: 'Welcome back',
    subtext:
      'View your savings, contributions, loans and everything happening in the chama.',
    hint: 'Sign in with the chama name and email your chairman invited you with.',
  },
}

const ROLE_ORDER = ['Chairman', 'Treasurer', 'Secretary', 'Member']

export default function Login() {
  const { login, listAccounts } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [refreshKey, setRefreshKey] = useState(0)

  const accounts = useMemo(() => {
    try {
      return listAccounts()
    } catch {
      return []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listAccounts, refreshKey])

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

  const [demoOpen, setDemoOpen] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState(null)

  const goToPortal = (session) => {
    if (session.portal === 'member') {
      try {
        const chama = getChama()
        setMemberSession({
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          chamaCode: session.chamaCode || chama?.code,
          chamaName: session.chamaName || chama?.name,
          joinedAt: Date.now(),
        })
      } catch {}
      navigate('/member', { replace: true })
      return
    }
    navigate(from || '/dashboard', { replace: true })
  }

  const submit = async (e) => {
    e?.preventDefault()
    setError('')

    if (!chamaName.trim()) return setError('Enter your chama name.')
    if (!email.trim()) return setError('Enter your email address.')
    if (!password) return setError('Enter your password.')

    setBusy(true)
    try {
      const session = await login({ chamaName, email, password })
      toast.success(`Welcome back, ${session.name.split(' ')[0]}`)
      goToPortal(session)
    } catch (err) {
      setError(err?.message || 'Could not log you in.')
    } finally {
      setBusy(false)
    }
  }

  const quickLogin = async (acc) => {
    setChamaName(acc.chamaName || '')
    setEmail(acc.email)
    setPassword(acc.password || 'demo')
    if (ROLES[acc.role]) setActiveRole(acc.role)
    setError('')
    setBusy(true)
    try {
      const session = await login({
        chamaName: acc.chamaName || '',
        email: acc.email,
        password: acc.password || 'demo',
      })
      toast.success(`Signed in as ${session.role}`)
      goToPortal(session)
    } catch (err) {
      setError(err?.message || 'Could not log you in.')
    } finally {
      setBusy(false)
    }
  }

  const handleSetupDemo = () => {
    const result = setupDemoChama()
    setDemoAccounts(result.accounts)
    setDemoOpen(true)
    setRefreshKey((k) => k + 1)
    toast.success('Demo chama is ready')
  }

  const handleReset = () => {
    resetAll()
    setRefreshKey((k) => k + 1)
    setChamaName('')
    setEmail('')
    setPassword('')
    setError('')
    setDemoOpen(false)
    setDemoAccounts(null)
    setActiveRole('Chairman')
    toast.success('All demo data cleared')
  }

  const handleRoleChange = (next) => {
    setActiveRole(next)
    setError('')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F5F7F9] lg:grid-cols-[1.05fr_1fr]">
      {/* ================= LEFT: Brand panel (desktop only) ================= */}
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

        {/* Brand */}
        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald/50 blur-xl" />
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.08] ring-1 ring-white/15 backdrop-blur">
              <img
                src={logo}
                alt="Chametu"
                className="h-7 w-7 rounded-lg object-contain"
              />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">
              Chametu
            </div>
            <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-emerald/80">
              Chama Management
            </div>
          </div>
        </Link>

        {/* Headline */}
        <div className="relative mt-16 max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-white/70 backdrop-blur">
            <Zap size={11} className="text-gold" />
            Trusted by thousands of chamas
          </div>

          <h1 className="mt-6 font-display text-[2.7rem] font-bold leading-[1.03] tracking-tight">
            Every shilling,{' '}
            <span className="bg-gradient-to-r from-emerald via-[#7CF0C0] to-emerald bg-clip-text text-transparent">
              accounted for.
            </span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/70">
            Contributions, loans, payouts and welfare. One dashboard that keeps
            your chama's money transparent and every member in sync.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative mt-10 grid max-w-[520px] gap-3">
          {[
            {
              icon: CircleDollarSign,
              title: 'Automatic M-Pesa reconciliation',
              sub: 'Every payment matched to the right member',
            },
            {
              icon: Users,
              title: 'Roles for every position',
              sub: 'Chairman, treasurer, secretary and members',
            },
            {
              icon: LineChart,
              title: 'Live financial reports',
              sub: 'Statements and dashboards that update instantly',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 backdrop-blur transition hover:border-white/20 hover:bg-white/[0.07]"
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-emerald/15 text-emerald ring-1 ring-emerald/20 transition group-hover:bg-emerald/20">
                <f.icon size={16} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-[0.88rem] font-semibold text-white/95">
                  {f.title}
                </div>
                <div className="mt-0.5 text-[0.76rem] leading-snug text-white/55">
                  {f.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div className="relative mt-auto flex items-center gap-3 pt-12 text-[0.72rem] text-white/40">
          <Fingerprint size={14} />
          <span>Bank-grade encryption. Your data stays yours.</span>
        </div>
      </aside>

      {/* ================= RIGHT: Login form ================= */}
      <main className="flex min-h-screen items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:items-center">
        <div className="w-full max-w-[440px]">
          {/* Top bar: back to homepage + theme toggle */}
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

          {/* Mobile brand */}
          <Link to="/" className="mb-6 flex items-center gap-2 no-underline lg:hidden">
            <img
              src={logo}
              alt="Chametu"
              className="h-7 w-7 rounded-lg object-contain sm:h-8 sm:w-8"
            />
            <span className="font-display text-[0.98rem] font-bold text-navy sm:text-[1.05rem]">
              Chametu
            </span>
          </Link>

          {/* ============ DYNAMIC HEADER ============ */}
          <div key={activeRole} className="animate-fade-in">
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

          {/* ============ ROLE TABS ============ */}
          <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-white p-1 shadow-[0_1px_2px_rgba(11,31,51,0.03),0_8px_20px_-8px_rgba(11,31,51,0.06)] sm:mt-6 sm:gap-1.5 sm:p-1.5">
            {ROLE_ORDER.map((key) => {
              const cfg = ROLES[key]
              const Icon = cfg.icon
              const isActive = activeRole === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleRoleChange(key)}
                  aria-pressed={isActive}
                  className={`group relative flex flex-col items-center gap-1 rounded-xl py-2 transition-all duration-200 sm:gap-1.5 sm:py-2.5 ${
                    isActive
                      ? 'bg-gradient-to-b from-forest/[0.06] to-transparent ring-1 ring-forest/15'
                      : 'hover:bg-paper'
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

          {/* Hint strip */}
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald/[0.05] px-3 py-2 text-[0.68rem] leading-relaxed text-navy ring-1 ring-emerald/10 sm:px-3.5 sm:py-2.5 sm:text-[0.74rem]">
            <ShieldCheck size={12} className="mt-0.5 flex-none text-forest" />
            <span>{role.hint}</span>
          </div>

          {/* ============ FORM ============ */}
          <form onSubmit={submit} className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            <Field label="Chama name">
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <Building2
                  size={16}
                  strokeWidth={1.9}
                  className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                />
                <input
                  value={chamaName}
                  onChange={(e) => setChamaName(e.target.value)}
                  placeholder="e.g. Umoja Investment Chama"
                  autoComplete="organization"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
              </div>
            </Field>

            <Field label="Email address">
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <Mail
                  size={16}
                  strokeWidth={1.9}
                  className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 sm:py-3.5 sm:text-[0.94rem]"
                />
              </div>
            </Field>

            <Field
              label="Password"
              action={
                <Link
                  to="/forgot-password"
                  className="text-[0.72rem] font-semibold text-forest hover:underline sm:text-[0.76rem]"
                >
                  Forgot?
                </Link>
              }
            >
              <div className="group flex items-center gap-2.5 rounded-2xl border-[1.5px] border-line bg-white px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 sm:gap-3 sm:px-4">
                <KeyRound
                  size={16}
                  strokeWidth={1.9}
                  className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                />
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
              {busy ? `Signing in as ${role.label}...` : `Sign in as ${role.label}`}
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

          {/* ============ ROLE-SPECIFIC PANEL ============ */}
          <div key={`panel-${activeRole}`} className="animate-fade-in mt-5 sm:mt-6">
            {activeRole === 'Chairman' ? (
              <ChairmanPanel />
            ) : (
              <InviteePanel role={activeRole} />
            )}
          </div>

          {/* Accounts on this device */}
          {accounts.length > 0 && (
            <div className="mt-6 sm:mt-7">
              <div className="mb-2.5 flex items-center justify-between">
                <div className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-ink-soft sm:text-[0.7rem]">
                  Accounts on this device
                </div>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 text-[0.66rem] font-semibold text-ink-soft transition hover:text-red-600 sm:text-[0.7rem]"
                >
                  <RotateCcw size={11} />
                  Reset
                </button>
              </div>
              <div className="flex flex-col gap-1.5">
                {accounts.map((a) => {
                  const accRole = ROLES[a.role] || ROLES.Member
                  const AccIcon = accRole.icon
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => quickLogin(a)}
                      disabled={busy}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-left transition hover:border-forest/40 hover:bg-forest/[0.02] hover:shadow-[0_4px_12px_rgba(11,122,90,0.06)] disabled:opacity-50"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span
                          className={`grid h-8 w-8 flex-none place-items-center rounded-lg bg-gradient-to-br ${accRole.gradient} text-white shadow-sm`}
                        >
                          <AccIcon size={13} strokeWidth={2.2} />
                        </span>
                        <div className="min-w-0">
                          <div className="truncate text-[0.8rem] font-semibold text-navy">
                            {a.name}
                          </div>
                          <div className="truncate text-[0.66rem] text-ink-soft">
                            {a.role} / {a.chamaName || 'No chama yet'}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight
                        size={13}
                        className="flex-none text-ink-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest"
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Demo setup */}
          {accounts.length === 0 && (
            <button
              type="button"
              onClick={handleSetupDemo}
              className="mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-white px-3.5 py-3 text-left transition hover:border-forest/50 hover:bg-forest/[0.02] hover:shadow-[0_4px_16px_rgba(11,122,90,0.06)] sm:mt-7 sm:px-4 sm:py-3.5"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[0.78rem] font-semibold text-navy sm:text-[0.82rem]">
                  No accounts yet?
                </div>
                <div className="mt-0.5 text-[0.68rem] text-ink-soft sm:text-[0.72rem]">
                  Load a demo chama with all four roles pre-built.
                </div>
              </div>
              <span className="flex flex-none items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-2.5 py-2 text-[0.7rem] font-semibold text-white shadow-sm sm:px-3 sm:text-[0.74rem]">
                <Sparkles size={11} className="sm:hidden" />
                <Sparkles size={12} className="hidden sm:inline" />
                Setup demo
              </span>
            </button>
          )}

          <p className="mt-5 mb-4 text-center text-[0.66rem] leading-relaxed text-ink-soft sm:mt-6 sm:text-[0.7rem]">
            Accounts live in this browser only. Production login requires a
            server with hashed passwords.
          </p>
        </div>
      </main>

      {/* Demo modal */}
      {demoOpen && demoAccounts && (
        <DemoModal
          accounts={demoAccounts}
          onClose={() => setDemoOpen(false)}
          onPick={(acc) => {
            setDemoOpen(false)
            quickLogin(acc)
          }}
        />
      )}

      {/* Local keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeInUp 280ms cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  )
}

/* ============================================================
   Chairman panel
   ============================================================ */
function ChairmanPanel() {
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_2px_rgba(11,31,51,0.03)] sm:p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center rounded-2xl bg-gradient-to-br from-forest to-emerald text-white shadow-[0_6px_16px_rgba(11,122,90,0.25)] sm:h-10 sm:w-10">
          <Crown size={15} strokeWidth={2} className="sm:hidden" />
          <Crown size={16} strokeWidth={2} className="hidden sm:inline" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[0.84rem] font-semibold text-navy sm:text-[0.88rem]">
            Don't have a chama yet?
          </div>
          <p className="mt-0.5 text-[0.72rem] leading-relaxed text-ink-soft sm:text-[0.76rem]">
            Create one in two minutes. You'll be set as chairman and can invite
            your treasurer, secretary and members right after.
          </p>
        </div>
      </div>

      <Link
        to="/register"
        className="group mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-[0.82rem] font-semibold text-white shadow-[0_6px_18px_rgba(11,122,90,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,122,90,0.28)] sm:mt-3.5 sm:py-3 sm:text-[0.86rem]"
      >
        Create a chama
        <ArrowRight
          size={14}
          strokeWidth={2.4}
          className="transition group-hover:translate-x-0.5"
        />
      </Link>
    </div>
  )
}

/* ============================================================
   Invitee panel
   ============================================================ */
function InviteePanel({ role }) {
  const config = {
    Treasurer: {
      icon: Banknote,
      gradient: 'from-gold to-[#E8A21F]',
      glow: 'shadow-[0_6px_16px_rgba(232,162,31,0.25)]',
      heading: 'Waiting on your invite?',
      body: 'Your chairman needs to invite you before you can sign in as Treasurer.',
    },
    Secretary: {
      icon: BookOpen,
      gradient: 'from-navy to-[#0A2A3E]',
      glow: 'shadow-[0_6px_16px_rgba(11,31,51,0.25)]',
      heading: 'Waiting on your invite?',
      body: 'Your chairman needs to invite you before you can sign in as Secretary.',
    },
    Member: {
      icon: UserRound,
      gradient: 'from-emerald to-[#0A7A5A]',
      glow: 'shadow-[0_6px_16px_rgba(16,185,129,0.25)]',
      heading: 'Waiting on your invite?',
      body: 'Your chairman needs to invite you before you can sign in as a member.',
    },
  }[role]

  if (!config) return null
  const Icon = config.icon

  return (
    <div className="rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_2px_rgba(11,31,51,0.03)] sm:p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-9 flex-none place-items-center rounded-2xl bg-gradient-to-br ${config.gradient} text-white ${config.glow} sm:h-10 sm:w-10`}
        >
          <Icon size={15} strokeWidth={2} className="sm:hidden" />
          <Icon size={16} strokeWidth={2} className="hidden sm:inline" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[0.84rem] font-semibold text-navy sm:text-[0.88rem]">
            {config.heading}
          </div>
          <p className="mt-0.5 text-[0.72rem] leading-relaxed text-ink-soft sm:text-[0.76rem]">
            {config.body}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-paper px-3 py-2.5 ring-1 ring-line sm:mt-3.5 sm:px-3.5 sm:py-3">
        <div className="text-[0.64rem] font-bold uppercase tracking-wider text-navy sm:text-[0.68rem]">
          How to join
        </div>
        <ol className="mt-2 space-y-1.5 text-[0.72rem] leading-relaxed text-ink-soft sm:text-[0.76rem]">
          <li className="flex gap-2">
            <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-forest/10 text-[0.6rem] font-bold text-forest">
              1
            </span>
            Open the invite link your chairman sent you.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-forest/10 text-[0.6rem] font-bold text-forest">
              2
            </span>
            Set your password on the secure page that opens.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-forest/10 text-[0.6rem] font-bold text-forest">
              3
            </span>
            Come back and sign in as <b className="text-navy">{role}</b>.
          </li>
        </ol>
      </div>
    </div>
  )
}

/* ============================================================
   Field
   ============================================================ */
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

/* ============================================================
   Demo modal
   ============================================================ */
function DemoModal({ accounts, onClose, onPick }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-3 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-line px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-forest sm:text-[0.66rem]">
              <BadgeCheck size={10} className="sm:hidden" />
              <BadgeCheck size={11} className="hidden sm:inline" />
              Demo ready
            </div>
            <h3 className="mt-1 truncate font-display text-base font-bold text-navy sm:text-lg">
              {DEMO_CHAMA.name}
            </h3>
            <p className="mt-0.5 text-[0.7rem] text-ink-soft sm:text-[0.76rem]">
              Chama code{' '}
              <span className="font-mono font-semibold text-navy">
                {DEMO_CHAMA.code}
              </span>
              {' '}/ password{' '}
              <span className="font-mono font-semibold text-navy">demo</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-none rounded-lg p-1.5 text-ink-soft transition hover:bg-paper hover:text-navy"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto p-3.5 sm:p-4">
          <p className="mb-3 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-ink-soft sm:text-[0.7rem]">
            Tap a role to sign in
          </p>
          <div className="flex flex-col gap-2">
            {accounts.map((a) => {
              const cfg = ROLES[a.role] || ROLES.Member
              const Icon = cfg.icon
              return (
                <button
                  key={a.id}
                  onClick={() => onPick(a)}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-paper/40 px-3 py-2.5 text-left transition hover:-translate-y-0.5 hover:border-forest/40 hover:bg-forest/[0.03] hover:shadow-[0_6px_16px_rgba(11,122,90,0.08)] sm:px-3.5 sm:py-3"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      className={`grid h-8 w-8 flex-none place-items-center rounded-xl bg-gradient-to-br ${cfg.gradient} text-white shadow-sm sm:h-9 sm:w-9`}
                    >
                      <Icon size={13} strokeWidth={2.2} className="sm:hidden" />
                      <Icon size={14} strokeWidth={2.2} className="hidden sm:inline" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[0.82rem] font-semibold text-navy sm:text-[0.86rem]">
                        {a.role}
                      </div>
                      <div className="truncate text-[0.66rem] text-ink-soft sm:text-[0.7rem]">
                        {a.name} / {a.email}
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="flex-none text-forest" />
                </button>
              )
            })}
          </div>

          <div className="mt-3.5 rounded-xl bg-emerald/[0.06] px-3 py-2.5 text-[0.68rem] leading-relaxed text-navy ring-1 ring-emerald/10 sm:mt-4 sm:px-3.5 sm:py-3 sm:text-[0.72rem]">
            Chairman, Treasurer and Secretary open the <b>admin dashboard</b>.
            Member opens the <b>member portal</b>.
          </div>
        </div>
      </div>
    </div>
  )
}