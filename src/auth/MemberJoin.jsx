// src/pages/MemberJoin.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  BadgeCheck,
  AlertCircle,
  Loader2,
  XCircle,
  ShieldCheck,
  Crown,
  Users,
  Sparkles,
  Fingerprint,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import logo from '../assets/logos.png'
import { api } from '../lib/api'

export default function MemberJoin() {
  const { chamaCode, token } = useParams()
  const navigate = useNavigate()

  const [invite, setInvite] = useState(null)
  const [chama, setChama] = useState(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState({ ok: false })

  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Simple password strength meter
  const pwStrength = (() => {
    const v = password
    if (!v) return 0
    return (
      (v.length >= 8 ? 1 : 0) +
      (/[a-z]/.test(v) && /[A-Z]/.test(v) ? 1 : 0) +
      (/\d/.test(v) ? 1 : 0) +
      (/[^A-Za-z0-9]/.test(v) ? 1 : 0)
    )
  })()

  useEffect(() => {
    let cancelled = false

    async function verify() {
      try {
        const res = await api(`/api/auth/invites/${chamaCode}/${token}`)
        if (cancelled) return
        setInvite(res.invite)
        setChama(res.chama)
        setContact(res.invite?.contact || '')
        setResult({ ok: true })
      } catch (err) {
        if (cancelled) return
        setResult({ ok: false, reason: err?.message || 'Invite link is not valid.' })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verify()
    return () => {
      cancelled = true
    }
  }, [chamaCode, token])

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F7F9]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-forest" size={30} />
          <p className="text-[0.82rem] text-ink-soft">Verifying your invite…</p>
        </div>
      </div>
    )
  }

  /* ---------- Invalid invite ---------- */
  if (!result.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F7F9] p-6">
        <div className="w-full max-w-[420px] rounded-3xl border border-line bg-white p-8 text-center shadow-[0_10px_40px_-12px_rgba(11,31,51,0.1)]">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <XCircle size={28} strokeWidth={2} />
          </span>
          <h1 className="mt-5 font-display text-[1.4rem] font-bold text-navy">
            Invite not valid
          </h1>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
            {result.reason || 'This invite link is not valid.'}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 text-[0.9rem] font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
            >
              Go to login <ArrowRight size={15} strokeWidth={2.4} />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-white py-3.5 text-[0.9rem] font-semibold text-navy transition hover:border-forest"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- Submit ---------- */
  async function submitCreate(e) {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Enter your full name.')
    if (!password || password.length < 6) {
      return setError('Choose a password with at least 6 characters.')
    }

    setBusy(true)
    try {
      const data = await api('/api/auth/accept-invite', {
        method: 'POST',
        body: {
          email: contact.trim().toLowerCase(),
          name: name.trim(),
          password,
          chamaCode,
          token,
          role: invite?.role || 'Member',
        },
      })

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('auth-changed'))

      toast.success(`Welcome to ${chama?.name || 'the chama'}, ${name.split(' ')[0]}!`)

      const portal = data.user?.portal || (data.user?.role === 'Member' ? 'member' : 'admin')
      navigate(portal === 'member' ? '/member' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  const roleLabel = invite?.role || 'Member'

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F5F7F9] lg:grid-cols-[1.05fr_1fr]">
      {/* ============ LEFT PANEL — brand & invite context ============ */}
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

        <div className="relative mt-14 max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-emerald backdrop-blur">
            <BadgeCheck size={12} /> Verified invite
          </div>

          <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight">
            You're invited to{' '}
            <span className="bg-gradient-to-r from-emerald via-[#7CF0C0] to-emerald bg-clip-text text-transparent">
              {chama?.name || 'join a chama'}
            </span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-white/70">
            Finish setting up your account below. Once you're in, you'll be able to
            track savings, contributions, loans and every shilling your chama moves.
          </p>
        </div>

        {/* Invite summary card */}
        <div className="relative mt-10 max-w-[440px] rounded-3xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur">
          <div className="text-[0.64rem] font-bold uppercase tracking-widest text-white/50">
            Your invitation
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-gradient-to-br from-forest to-emerald text-white shadow-sm">
              <Crown size={18} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-[1.05rem] font-bold text-white">
                {chama?.name || 'Chama'}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[0.76rem] text-white/60">
                <Users size={11} strokeWidth={2.2} />
                Joining as <b className="text-white/90">{roleLabel}</b>
              </div>
            </div>
          </div>

          <div className="my-4 h-px bg-white/10" />

          <ul className="grid gap-2.5 text-[0.86rem] text-white/85">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={14} strokeWidth={2.4} className="mt-0.5 flex-none text-emerald" />
              <span>Set up your login in under a minute</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={14} strokeWidth={2.4} className="mt-0.5 flex-none text-emerald" />
              <span>See savings, contributions and loans in real time</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={14} strokeWidth={2.4} className="mt-0.5 flex-none text-emerald" />
              <span>Your chairman controls who joins your chama</span>
            </li>
          </ul>
        </div>

        <div className="relative mt-auto flex items-center gap-3 pt-12 text-[0.72rem] text-white/40">
          <Fingerprint size={14} />
          <span>Bank-grade encryption. Your data stays yours.</span>
        </div>
      </aside>

      {/* ============ RIGHT PANEL — signup form ============ */}
      <main className="flex min-h-screen items-start justify-center px-4 py-6 sm:px-8 sm:py-10 lg:items-center">
        <div className="w-full max-w-[460px]">
          {/* Top bar */}
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4 sm:mb-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[0.78rem] font-semibold text-navy no-underline transition hover:border-forest hover:bg-forest/[0.04] sm:text-[0.82rem]"
            >
              <ArrowLeft size={14} strokeWidth={2.4} aria-hidden="true" />
              Back to login
            </Link>
          </div>

          {/* Mobile logo */}
          <Link to="/" className="mb-6 flex items-center gap-2 no-underline lg:hidden">
            <img src={logo} alt="Chametu" className="h-7 w-7 rounded-lg object-contain sm:h-8 sm:w-8" />
            <span className="font-display text-[0.98rem] font-bold text-navy sm:text-[1.05rem]">Chametu</span>
          </Link>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald/15 px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-forest">
            <Sparkles size={11} strokeWidth={2.4} />
            {roleLabel} invite
          </div>

          {/* Heading */}
          <h1 className="mt-3 font-display text-[1.85rem] font-bold leading-[1.12] tracking-tight text-navy sm:text-[2.1rem]">
            Create your account
          </h1>
          <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft sm:text-[0.95rem]">
            You're joining <b className="text-navy">{chama?.name || 'the chama'}</b> as{' '}
            <b className="text-navy">{roleLabel}</b>. Pick a name and password to finish.
          </p>

          <form onSubmit={submitCreate} className="mt-6 space-y-4">
            {/* Full name */}
            <div>
              <label className="mb-1.5 block text-[0.78rem] font-semibold text-navy">
                Full name
              </label>
              <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-white px-4 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10">
                <User
                  size={17}
                  strokeWidth={1.9}
                  className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Wambui"
                  autoComplete="name"
                  autoFocus
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.94rem] text-navy outline-none placeholder:text-ink-soft/60"
                />
              </div>
            </div>

            {/* Email (locked) */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[0.78rem] font-semibold text-navy">Email</label>
                <span className="text-[0.7rem] font-medium text-ink-soft">
                  From your invite
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4">
                <Mail size={17} strokeWidth={1.9} className="shrink-0 text-ink-soft" />
                <input
                  value={contact}
                  disabled
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.94rem] text-ink-soft outline-none"
                />
                <ShieldCheck size={15} strokeWidth={2} className="shrink-0 text-emerald" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[0.78rem] font-semibold text-navy">
                  Create a password
                </label>
                <span className="text-[0.7rem] font-medium text-ink-soft">
                  Min. 6 characters
                </span>
              </div>
              <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-white px-4 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10">
                <Lock
                  size={17}
                  strokeWidth={1.9}
                  className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Pick something strong"
                  autoComplete="new-password"
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.94rem] text-navy outline-none placeholder:text-ink-soft/60"
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

              {/* Strength meter */}
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((i) => {
                  const active = i < pwStrength
                  const colors = ['bg-red-500', 'bg-gold', 'bg-emerald', 'bg-forest']
                  return (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition ${
                        active ? colors[pwStrength - 1] : 'bg-line'
                      }`}
                    />
                  )
                })}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-[0.82rem] leading-relaxed text-red-700"
              >
                <AlertCircle size={14} className="mt-0.5 flex-none" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.94rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(11,122,90,0.3)] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55 sm:py-4 sm:text-[0.98rem]"
            >
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating your account…
                </>
              ) : (
                <>
                  Create my account
                  <ArrowRight size={15} strokeWidth={2.4} />
                </>
              )}
            </button>
          </form>

          {/* Info note */}
          <div className="mt-5 flex items-start gap-2 rounded-2xl bg-emerald/[0.05] px-3.5 py-3 text-[0.76rem] leading-relaxed text-navy ring-1 ring-emerald/10">
            <ShieldCheck size={14} className="mt-0.5 flex-none text-forest" />
            <span>
              Your email is locked to the address your chairman invited. If it's
              wrong, ask them to send a new invite.
            </span>
          </div>

          <p className="mt-6 mb-4 text-center text-[0.7rem] leading-relaxed text-ink-soft">
            By creating an account you agree to Chametu's terms. You can leave the
            chama at any time.
          </p>
        </div>
      </main>
    </div>
  )
}