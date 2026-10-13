import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  User, Mail, Lock, ShieldCheck, XCircle, ArrowLeft, ArrowRight,
  Eye, EyeOff, CheckCircle2, Building2, BadgeCheck, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import logo from '../assets/logos.png'
import { useAuth } from '../context/AuthContext'
import {
  findValidInvite,
  createMemberFromInvite,
  loginMember,
  findMemberByContact,
  setMemberSession,
} from '../lib/chametuStorage'

const ROLE_TINTS = {
  member:    'from-emerald to-forest',
  treasurer: 'from-gold to-[#E8A21F]',
  secretary: 'from-navy to-[#0A2A3E]',
  chairman:  'from-forest to-emerald',
  chairperson: 'from-forest to-emerald',
}

function roleTint(role) {
  const key = (role || 'Member').toLowerCase().trim()
  return ROLE_TINTS[key] || ROLE_TINTS.member
}

export default function MemberJoin() {
  const { chamaCode, token } = useParams()
  const navigate = useNavigate()
  const { register } = useAuth()
  const result = useMemo(() => findValidInvite(chamaCode, token), [chamaCode, token])

  const [mode, setMode] = useState('create')
  const [name, setName] = useState('')
  const [contact, setContact] = useState(result.ok ? result.invite.contact : '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  /* ================= INVALID INVITE ================= */
  if (!result.ok) {
    const messages = {
      'wrong-chama': "This invite link doesn't match any chama on this device.",
      'not-found': 'This invite link is not valid. Ask your chairman to send a fresh one.',
      used: 'This invite has already been used to join. Try logging in instead.',
      expired: 'This invite has expired. Ask your chama admin to resend it.',
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA] p-6">
        <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <XCircle size={24} strokeWidth={2} />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-navy">
            Invite not valid
          </h1>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft">
            {messages[result.reason] || messages['not-found']}
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              Go to login
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-3 text-sm font-semibold text-navy transition hover:border-forest"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { invite, chama } = result

  /* ================= CREATE ACCOUNT ================= */
  async function submitCreate(e) {
    e.preventDefault()
    setError('')

    if (!name.trim() || name.trim().length < 2) {
      return setError('Enter your full name.')
    }
    if (!contact.trim()) {
      return setError('Enter your email or phone number.')
    }
    if (!password || password.length < 6) {
      return setError('Choose a password with at least 6 characters.')
    }
    if (findMemberByContact(chama.code, contact.trim())) {
      return setError('An account already exists for this contact — try logging in instead.')
    }

    setBusy(true)
    try {
      // 1. Consume the invite & write the member record
      const member = createMemberFromInvite({
        invite,
        chama,
        name: name.trim(),
        contact: contact.trim(),
        password,
      })

      // 2. Register in AuthContext so the main login works too
      let registeredOk = true
      try {
        await register({
          name: name.trim(),
          email: contact.trim().toLowerCase(),
          password,
          role: invite.role || 'Member',
          chamaCode: chama.code,
          chamaName: chama.name,          // ← new signature
        })
      } catch (err) {
        console.warn('AuthContext register failed:', err)
        registeredOk = false
      }

      // 3. Route to the right portal
      const isMemberRole = (invite.role || 'Member').toLowerCase() === 'member'

      if (isMemberRole) {
        if (!loginMember(chama.code, contact.trim(), password)) {
          setMemberSession(member)
        }
        toast.success(`Welcome to ${chama.name}, ${name.split(' ')[0]}!`)
        navigate('/member', { replace: true })
        return
      }

      // Treasurer / Secretary / Chairman → admin dashboard
      if (!registeredOk) {
        // Rare: account existed but wasn't in the chama members list
        toast.success(`Joined as ${invite.role}`)
      } else {
        toast.success(`Welcome, ${invite.role} ${name.split(' ')[0]}!`)
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not create your account. Try again.')
      setBusy(false)
    }
  }

  /* ================= EXISTING ACCOUNT LOGIN ================= */
  async function submitLogin(e) {
    e.preventDefault()
    setError('')
    if (!contact.trim() || !password) {
      return setError('Enter your contact and password.')
    }

    setBusy(true)
    try {
      const member = loginMember(chama.code, contact.trim(), password)
      if (!member) {
        setError('No account found with those details for this chama.')
        return
      }
      toast.success(`Welcome back, ${member.name.split(' ')[0]}!`)
      navigate('/member', { replace: true })
    } finally {
      setBusy(false)
    }
  }

  /* ================= RENDER ================= */
  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F6F8FA] lg:grid-cols-[1fr_1.05fr]">
      {/* ---------- LEFT: Invite context ---------- */}
      <aside className="relative hidden flex-col overflow-hidden bg-navy p-10 text-white lg:flex lg:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(700px 500px at 0% 0%, rgba(16,185,129,0.32), transparent 60%), radial-gradient(600px 500px at 100% 100%, rgba(245,185,66,0.14), transparent 60%), linear-gradient(160deg, #0B1F33 0%, #0A2A3E 55%, #08222A 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />

        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-emerald/40 blur-lg" />
            <img
              src={logo}
              alt="Chametu"
              className="relative h-10 w-10 rounded-xl object-contain ring-1 ring-white/20"
            />
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">
              Chametu
            </div>
            <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald/80">
              Chama Management
            </div>
          </div>
        </Link>

        {/* Verified invite pill */}
        <div className="relative mt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-emerald backdrop-blur">
            <BadgeCheck size={12} />
            Verified invite
          </div>

          <h1 className="mt-6 max-w-[520px] font-display text-[2.4rem] font-bold leading-[1.08] tracking-tight">
            You're invited to join{' '}
            <span className="bg-gradient-to-r from-emerald to-[#7CF0C0] bg-clip-text text-transparent">
              {chama.name}
            </span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-white/70">
            Set up your account in under a minute and start tracking your contributions,
            savings and loans.
          </p>
        </div>

        {/* Invite details card */}
        <div className="relative mt-10 max-w-[420px] rounded-3xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur">
          <div className="text-[0.62rem] font-bold uppercase tracking-widest text-white/50">
            Invite details
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-white/10">
              <Building2 size={16} className="text-emerald" />
            </span>
            <div className="min-w-0">
              <div className="text-[0.68rem] uppercase tracking-widest text-white/50">
                Chama
              </div>
              <div className="truncate text-[0.95rem] font-semibold text-white">
                {chama.name}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span
              className={`grid h-10 w-10 flex-none place-items-center rounded-2xl bg-gradient-to-br ${roleTint(invite.role)} text-white shadow-sm`}
            >
              <ShieldCheck size={16} />
            </span>
            <div className="min-w-0">
              <div className="text-[0.68rem] uppercase tracking-widest text-white/50">
                Role
              </div>
              <div className="truncate text-[0.95rem] font-semibold text-white">
                {invite.role}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-white/10">
              <Mail size={16} className="text-emerald" />
            </span>
            <div className="min-w-0">
              <div className="text-[0.68rem] uppercase tracking-widest text-white/50">
                Invited contact
              </div>
              <div className="truncate text-[0.95rem] font-semibold text-white">
                {invite.contact}
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-auto flex items-center gap-2 pt-10 text-[0.72rem] text-white/40">
          <ShieldCheck size={13} />
          <span>This link only works for {chama.name}</span>
        </div>
      </aside>

      {/* ---------- RIGHT: Form ---------- */}
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          {/* Mobile brand + role chip */}
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <img
                src={logo}
                alt="Chametu"
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="font-display text-[1.05rem] font-bold text-navy">
                Chametu
              </span>
            </Link>

            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-widest text-emerald ring-1 ring-emerald/20">
              <BadgeCheck size={11} />
              Verified invite
            </div>
            <h2 className="mt-3 font-display text-xl font-bold text-navy">
              Join {chama.name}
            </h2>
            <p className="mt-1 text-[0.84rem] text-ink-soft">
              You were invited as <b className="text-navy">{invite.role}</b>
            </p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block">
            <div className="mb-8 flex items-center justify-between">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest hover:underline"
              >
                <ArrowLeft size={13} strokeWidth={2.2} />
                Back to login
              </Link>
              <ThemeToggle />
            </div>

            <h1 className="font-display text-[1.9rem] font-bold leading-tight tracking-tight text-navy">
              {mode === 'create' ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
              {mode === 'create'
                ? `You're joining ${chama.name} as ${invite.role}.`
                : `Sign in with the details you used for ${chama.name}.`}
            </p>
          </div>

          {/* Card */}
          <div className="mt-0 rounded-3xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(11,31,51,0.04),0_16px_40px_rgba(11,31,51,0.06)] lg:mt-6">
            {/* Mode tabs */}
            <div className="relative mb-5 grid grid-cols-2 rounded-2xl border border-line bg-[#F8FAFC] p-1">
              <span
                className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-transform ${
                  mode === 'login' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
                }`}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => { setMode('create'); setError('') }}
                className={`relative z-10 rounded-xl py-2.5 text-[0.82rem] font-semibold transition ${
                  mode === 'create' ? 'text-forest' : 'text-ink-soft'
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className={`relative z-10 rounded-xl py-2.5 text-[0.82rem] font-semibold transition ${
                  mode === 'login' ? 'text-forest' : 'text-ink-soft'
                }`}
              >
                I already have one
              </button>
            </div>

            {mode === 'create' ? (
              <form onSubmit={submitCreate} className="space-y-3.5">
                <Field label="Full name">
                  <IconInput
                    icon={<User size={16} strokeWidth={1.9} />}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Jane Wambui"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Email or phone">
                  <IconInput
                    icon={<Mail size={16} strokeWidth={1.9} />}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="jane@email.com or 0712 345 678"
                    autoComplete="email"
                  />
                </Field>

                <Field label="Create a password">
                  <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                    <Lock
                      size={16}
                      strokeWidth={1.9}
                      className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="p-1 text-ink-soft transition hover:text-navy"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                {error && <ErrorNote text={error} />}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.95rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
                >
                  {busy ? (
                    'Creating your account…'
                  ) : (
                    <>
                      Create my account
                      <ArrowRight size={15} strokeWidth={2.4} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={submitLogin} className="space-y-3.5">
                <Field label="Email or phone">
                  <IconInput
                    icon={<Mail size={16} strokeWidth={1.9} />}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="jane@email.com or 0712 345 678"
                    autoComplete="email"
                  />
                </Field>

                <Field label="Password">
                  <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                    <Lock
                      size={16}
                      strokeWidth={1.9}
                      className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your password"
                      autoComplete="current-password"
                      className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="p-1 text-ink-soft transition hover:text-navy"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>

                {error && <ErrorNote text={error} />}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.95rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
                >
                  {busy ? (
                    'Signing in…'
                  ) : (
                    <>
                      Sign in
                      <ArrowRight size={15} strokeWidth={2.4} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-emerald/[0.06] px-3.5 py-3 text-[0.76rem] leading-relaxed text-navy ring-1 ring-emerald/10">
            <CheckCircle2 size={13} className="mt-0.5 flex-none text-forest" />
            <span>
              This link only works for <b>{chama.name}</b>. It can't be used to
              join any other chama, and it stops working once you sign up.
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}

/* ---------- small components ---------- */

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.78rem] font-semibold text-navy">
        {label}
      </label>
      {children}
    </div>
  )
}

function IconInput({ icon, className = '', ...props }) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
      <span className="shrink-0 text-ink-soft transition group-focus-within:text-forest">
        {icon}
      </span>
      <input
        {...props}
        className={`min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60 ${className}`}
      />
    </div>
  )
}

function ErrorNote({ text }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-[0.82rem] leading-relaxed text-red-700"
    >
      <AlertCircle size={14} className="mt-0.5 flex-none" />
      <span>{text}</span>
    </div>
  )
}

function ThemeToggle() {
  return null // handled by layout-level theme on this page — hidden by design
}