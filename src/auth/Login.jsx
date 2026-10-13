import { useMemo, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Sun, Moon, Eye, EyeOff, Mail, Lock, ArrowRight,
  Crown, Wallet, FileText, User as UserIcon,
  Sparkles, RotateCcw, CheckCircle2, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { setMemberSession, getChama } from '../lib/chametuStorage'
import { setupDemoChama, resetAll, DEMO_PEOPLE, DEMO_CHAMA_CODE } from '../lib/setupDemo'
import logo from '../assets/logos.png'

const ROLE_CARDS = [
  {
    role: 'Chairman',
    label: 'Chairman',
    tagline: 'Create a chama',
    icon: Crown,
    to: '/register',
    tint: 'from-forest to-emerald',
  },
  {
    role: 'Treasurer',
    label: 'Treasurer',
    tagline: 'Join with a code',
    icon: Wallet,
    to: '/register?mode=join&role=Treasurer',
    tint: 'from-gold to-[#E8A21F]',
  },
  {
    role: 'Secretary',
    label: 'Secretary',
    tagline: 'Join with a code',
    icon: FileText,
    to: '/register?mode=join&role=Secretary',
    tint: 'from-navy to-[#0A2A3E]',
  },
  {
    role: 'Member',
    label: 'Member',
    tagline: 'Join with a code',
    icon: UserIcon,
    to: '/register?mode=join&role=Member',
    tint: 'from-emerald to-[#0A7A5A]',
  },
]

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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [demoOpen, setDemoOpen] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState(null)

  const goToPortal = (session) => {
    // Members have their own session too
    if (session.portal === 'member') {
      try {
        const chama = getChama()
        setMemberSession({
          id: session.id,
          name: session.name,
          email: session.email,
          role: session.role,
          chamaCode: session.chamaCode || chama?.code,
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
    if (!email.trim()) return setError('Enter your email address.')
    if (!password) return setError('Enter your password.')

    setBusy(true)
    try {
      const session = await login({ email, password })
      toast.success(`Welcome back, ${session.name.split(' ')[0]}!`)
      goToPortal(session)
    } catch (err) {
      setError(err?.message || 'Could not log you in.')
    } finally {
      setBusy(false)
    }
  }

  const fillAccount = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password || 'demo')
    setError('')
  }

  const quickLogin = async (acc) => {
    setEmail(acc.email)
    setPassword(acc.password || 'demo')
    setError('')
    setBusy(true)
    try {
      const session = await login({ email: acc.email, password: acc.password || 'demo' })
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
    setEmail('')
    setPassword('')
    setError('')
    setDemoOpen(false)
    setDemoAccounts(null)
    toast.success('All demo data cleared')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper hero:grid-cols-[minmax(340px,5fr)_7fr]">
      {/* Left panel */}
      <aside className="relative flex flex-col gap-4 overflow-hidden bg-navy p-7 text-white hero:sticky hero:top-0 hero:h-screen hero:gap-7 hero:p-11">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(600px 400px at 0 0, rgba(16,185,129,0.35), transparent), linear-gradient(160deg, #0B1F33, #0A3D46)',
          }}
        />
        <Link to="/" className="relative flex items-center gap-2.5 text-white no-underline">
          <img src={logo} alt="Chametu" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-[1.15rem] font-bold">Chametu</span>
        </Link>

        <h2 className="relative max-w-[14ch] font-display text-[1.4rem] font-bold leading-[1.15] tracking-tight hero:text-[clamp(1.7rem,2.6vw,2.4rem)]">
          Welcome back to your <em className="not-italic text-gold">chama</em>
        </h2>

        <p className="relative hidden max-w-[38ch] leading-relaxed text-white/75 hero:block">
          See who has paid, approve loans and keep every shilling accounted for.
        </p>

        <div className="relative mt-auto hidden rounded-[20px] border border-white/20 bg-white/[0.08] p-5 backdrop-blur hero:block">
          <small className="block text-[0.68rem] uppercase tracking-widest text-white/60">
            Sample view · this month
          </small>
          <div className="my-2 font-display text-[1.7rem] font-bold">
            <span className="font-mono">KSh 186,000</span>
            <span className="ml-1.5 text-[0.8rem] text-gold">93% of target</span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-white/15">
            <div className="h-full w-[93%] bg-gradient-to-r from-emerald to-[#7CF0C0]" />
          </div>
          <div className="mt-3.5 flex items-center justify-between text-[0.8rem] text-white/80">
            <span>39 of 42 members paid</span>
          </div>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex justify-center px-6 py-10 hero:items-center">
        <div className="w-full max-w-[440px]">
          <div className="mb-8 flex items-center justify-between text-[0.88rem] text-ink-soft">
            <span className="text-ink-soft">Sign in to your account</span>
            <ThemeToggle />
          </div>

          <h1 className="font-display text-[2.1rem] font-bold tracking-tight text-navy">
            Log in
          </h1>
          <p className="mb-6 mt-2 leading-relaxed text-ink-soft">
            Enter your details to open your chama dashboard.
          </p>

          <form onSubmit={submit}>
            <Field label="Email">
              <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Mail size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
              </div>
            </Field>

            <Field
              label={
                <div className="flex items-center justify-between">
                  <span>Password</span>
                  <Link
                    to="/forgot-password"
                    className="text-[0.78rem] font-semibold text-forest hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              }
            >
              <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Lock size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="p-1 text-ink-soft transition hover:text-navy"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <div className="mb-5 mt-1 flex items-center justify-between text-[0.84rem]">
              <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 accent-forest"
                />
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-forest to-emerald py-4 font-display text-base font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
            >
              {busy ? 'Logging in…' : 'Log in'}
            </button>

            {error && (
              <div
                role="alert"
                className="mt-4 min-h-[1.2em] rounded-xl bg-red-50 px-3.5 py-2.5 text-center text-[0.84rem] text-red-600"
              >
                {error}
              </div>
            )}
          </form>

          {/* Role signup cards */}
          <div className="mt-7">
            <div className="mb-4 flex items-center gap-3 text-[0.78rem] text-ink-soft">
              <span className="h-px flex-1 bg-line" />
              <span className="font-medium">New here? Pick your role</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_CARDS.map((c) => (
                <Link
                  key={c.role}
                  to={c.to}
                  className="group flex flex-col items-start gap-2 rounded-2xl border-[1.5px] border-line bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-forest hover:shadow-md"
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${c.tint} text-white shadow-sm`}
                    >
                      <c.icon size={15} strokeWidth={2} />
                    </span>
                    <ArrowRight
                      size={13}
                      className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-forest"
                    />
                  </div>
                  <div>
                    <div className="text-[0.86rem] font-semibold leading-tight text-navy">
                      {c.label}
                    </div>
                    <div className="mt-0.5 text-[0.7rem] text-ink-soft">{c.tagline}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Existing accounts */}
          {accounts.length > 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[0.78rem] font-semibold text-navy">
                  Accounts on this device
                </div>
                <span className="text-[0.68rem] text-ink-soft">{accounts.length}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {accounts.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => quickLogin(a)}
                    disabled={busy}
                    className="flex items-center justify-between rounded-xl border border-line bg-paper/40 px-3 py-2.5 text-left transition hover:border-forest hover:bg-forest/[0.03] disabled:opacity-50"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`grid h-7 w-7 flex-none place-items-center rounded-lg text-[0.62rem] font-bold text-white ${
                          a.portal === 'member'
                            ? 'bg-gradient-to-br from-emerald to-forest'
                            : 'bg-gradient-to-br from-navy to-[#0A2A3E]'
                        }`}
                      >
                        {a.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[0.82rem] font-semibold text-navy">
                          {a.name}
                        </div>
                        <div className="truncate text-[0.68rem] text-ink-soft">
                          {a.role} · {a.email}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={13} className="flex-none text-ink-soft" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Demo controls */}
          <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line bg-white px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[0.78rem] font-semibold text-navy">
                {accounts.length === 0 ? 'No accounts yet?' : 'Need a clean slate?'}
              </div>
              <div className="mt-0.5 text-[0.7rem] text-ink-soft">
                {accounts.length === 0
                  ? 'Create a demo chama with all four roles.'
                  : 'Reset and start fresh.'}
              </div>
            </div>
            {accounts.length === 0 ? (
              <button
                type="button"
                onClick={handleSetupDemo}
                className="flex flex-none items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-3.5 py-2 text-[0.78rem] font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <Sparkles size={13} />
                Setup demo
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="flex flex-none items-center gap-1.5 rounded-xl border border-line bg-white px-3.5 py-2 text-[0.78rem] font-semibold text-ink-soft transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>

          <p className="mt-5 text-center text-[0.72rem] leading-relaxed text-ink-soft">
            Accounts live in this browser only.
          </p>
        </div>
      </main>

      {/* Demo credentials modal */}
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
    </div>
  )
}

/* ---------- Demo modal ---------- */

function DemoModal({ accounts, onClose, onPick }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-forest">
              <CheckCircle2 size={12} />
              Demo ready
            </div>
            <h3 className="mt-1 font-display text-lg font-bold text-navy">
              Umoja Investment Chama
            </h3>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              Chama code{' '}
              <span className="font-mono font-semibold text-navy">{DEMO_CHAMA_CODE}</span> ·
              password <span className="font-mono font-semibold text-navy">demo</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-soft transition hover:bg-paper hover:text-navy"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4">
          <p className="mb-3 text-[0.76rem] font-semibold uppercase tracking-wider text-ink-soft">
            Tap a role to sign in instantly
          </p>
          <div className="flex flex-col gap-2">
            {accounts.map((a) => (
              <button
                key={a.id}
                onClick={() => onPick(a)}
                className="flex items-center justify-between rounded-2xl border border-line bg-paper/40 px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:border-forest hover:bg-forest/[0.03] hover:shadow-sm"
              >
                <div className="min-w-0">
                  <div className="text-[0.86rem] font-semibold text-navy">{a.role}</div>
                  <div className="truncate text-[0.72rem] text-ink-soft">
                    {a.name} · {a.email}
                  </div>
                </div>
                <ArrowRight size={14} className="flex-none text-forest" />
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-emerald/[0.06] px-3.5 py-3 text-[0.72rem] leading-relaxed text-navy ring-1 ring-emerald/10">
            Chairman, Treasurer and Secretary open the <b>admin dashboard</b>. Member opens the{' '}
            <b>member portal</b>.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Shared bits ---------- */

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex justify-between text-[0.8rem] font-semibold text-navy">
        {typeof label === 'string' ? <label>{label}</label> : label}
      </div>
      {children}
    </div>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-theme') === 'dark'
  )
  const toggle = () => {
    const html = document.documentElement
    const next = dark ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    try {
      localStorage.setItem('chametu_theme', next)
    } catch {}
    setDark(!dark)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-navy transition hover:border-forest"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}