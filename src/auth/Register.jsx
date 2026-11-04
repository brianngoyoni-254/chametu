import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sun, Moon, Eye, EyeOff, Check, Mail, Lock, User,
  Building2, Phone, Smartphone, Vote, Star, Sparkles,
  ArrowLeft, Crown, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Clock,
  Lock as LockIcon, Printer, Download, Receipt,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTier } from '../context/TierContext'
import { ORDER } from '../lib/tiers'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { friendlyFailureReason } from '../lib/paymentMessages'
import MpesaWaiting from '../components/MpesaWaiting'
import { ReceiptPrinter } from '../components/ReceiptPrinter'
import logo from '../assets/logos.png'

/* ================================================================== */
/*  REAL M-PESA LOGO — inline SVG, matches the official wordmark      */
/*  (bold green wordmark + the signature swoosh under the “M”)        */
/* ================================================================== */
function MpesaLogo({ className = 'h-5', color = '#00A651' }) {
  return (
    <svg
      viewBox="0 0 176 48"
      role="img"
      aria-label="M-Pesa"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Wordmark: M-PESA drawn as thick strokes so it scales cleanly */}
      <g fill={color}>
        {/* M */}
        <path d="M4 34 V14 h4.2 l5.6 9.4 5.6-9.4 H23.6 V34 h-4 V22.2 L15.4 30 h-2.8 L8 22.2 V34 Z" />
        {/* - */}
        <rect x="28.4" y="27.6" width="6.4" height="3.2" rx="1.2" />
        {/* P */}
        <path d="M38 34 V14 h8.2 c4.4 0 7.4 2.6 7.4 6.6 s-3 6.6-7.4 6.6 H42.4 V34 Z M42.4 23.6 h3.6 c2.2 0 3.6-1.2 3.6-3 s-1.4-3-3.6-3 h-3.6 Z" />
        {/* E */}
        <path d="M56 34 V14 h13 v3.6 H60.4 v4.4 h8 v3.6 h-8 v4.8 H69 V34 Z" />
        {/* S */}
        <path d="M78.2 34.4 c-3 0-5.4-1-7.2-2.6 l2.4-3 c1.4 1.2 3 1.9 4.8 1.9 1.8 0 2.9-.8 2.9-2 0-1.1-.7-1.7-3.3-2.3 l-1.8-.4 c-3.4-.8-5.3-2.4-5.3-5.4 0-3.4 2.9-5.9 7.1-5.9 2.9 0 5.2 1 6.7 2.5 l-2.3 3 c-1.2-1-2.7-1.7-4.4-1.7-1.7 0-2.7.7-2.7 1.9 0 1 .7 1.6 3 2.1 l1.8.4 c3.7.9 5.5 2.5 5.5 5.6 0 3.5-2.9 6.1-7.2 6.1 Z" />
        {/* A */}
        <path d="M88 34 L94.6 14 h4.4 L105.6 34 h-4.3 l-1.3-4.2 h-6.2 L92.5 34 Z M95 18.4 l-2.3 7.6 h4.6 Z" />
      </g>
      {/* The signature swoosh under the wordmark */}
      <path
        d="M4 42 C 34 36, 74 36, 108 42"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ---------- Kenya flag chip ---------- */
function KenyaFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-4 w-6 rounded-sm shadow-sm" aria-hidden="true">
      <rect width="24" height="16" fill="#000" />
      <rect y="4" width="24" height="8" fill="#BB0000" />
      <rect y="12" width="24" height="4" fill="#006600" />
      <rect y="3.4" width="24" height="1" fill="#fff" />
      <rect y="11.6" width="24" height="1" fill="#fff" />
    </svg>
  )
}

/* ---------- Tier visuals ---------- */
const TIER_STYLES = {
  Starter: {
    accent: '#64748B',
    accentDark: '#CBD5E1',
    accentSoft: 'rgba(100,116,139,0.10)',
    accentSoftDark: 'rgba(203,213,225,0.12)',
    accentRing: 'rgba(100,116,139,0.25)',
    gradient: 'linear-gradient(135deg, #64748B, #94A3B8)',
  },
  Growth: {
    accent: '#00A651',
    accentDark: '#4ADE80',
    accentSoft: 'rgba(0,166,81,0.10)',
    accentSoftDark: 'rgba(74,222,128,0.14)',
    accentRing: 'rgba(0,166,81,0.28)',
    gradient: 'linear-gradient(135deg, #00A651, #008C44)',
    badge: { text: 'MOST POPULAR', bg: 'linear-gradient(135deg, #00A651, #008C44)', color: '#fff' },
  },
  Business: {
    accent: '#0B1F33',
    accentDark: '#93C5FD',
    accentSoft: 'rgba(11,31,51,0.08)',
    accentSoftDark: 'rgba(147,197,253,0.14)',
    accentRing: 'rgba(11,31,51,0.22)',
    gradient: 'linear-gradient(135deg, #0B1F33, #0A3D46)',
  },
  Gold: {
    accent: '#B8860B',
    accentDark: '#FCD34D',
    accentSoft: 'rgba(245,185,66,0.16)',
    accentSoftDark: 'rgba(252,211,77,0.16)',
    accentRing: 'rgba(245,185,66,0.45)',
    gradient: 'linear-gradient(135deg, #F5B942, #E8A21F)',
    badge: { text: 'BEST VALUE', bg: 'linear-gradient(135deg, #F5B942, #E8A21F)', color: '#2E2200' },
  },
}

const PLAN_META = {
  Starter:  { features: ['Core chama management for small groups'] },
  Growth:   { features: ['Everything in Starter', 'Investments and financial reports'], popular: true },
  Business: { features: ['Everything in Growth', 'Governance, voting and role management'] },
  Gold:     { features: ['Everything in Business', 'Built for large chamas and SACCOs'], star: true },
}
const BENEFITS = [
  { Icon: Smartphone, text: 'Members pay by Paybill or STK Push, and the dashboard updates for everyone' },
  { Icon: Vote,       text: 'Loan requests approved by member vote with clear repayment tracking' },
  { Icon: Star,       text: 'Earn Chametu Points for on-time payments and redeem digital perks' },
]

const POLL_MS = 3000
const MAX_POLLS = 40
const PENDING_KEY = 'chametu_pending_signup'

const readPending = () => { try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null') } catch { return null } }
const writePending = (v) => { try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(v)) } catch {} }
const clearPending = () => { try { sessionStorage.removeItem(PENDING_KEY) } catch {} }

const STEPS = ['Details & plan', 'Pay with M-Pesa', 'Chama ready']
const isValidEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)

const stripDigits = (v) => String(v || '').replace(/\D/g, '').slice(0, 10)
const formatPhone = (digits) => {
  if (!digits) return ''
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`
}
const isValidPhone = (digits) => /^0[17]\d{8}$/.test(digits)
const formatKsh = (n) => `KSh ${Number(n || 0).toLocaleString()}`

export default function Register() {
  const { adoptSession } = useAuth()
  const { tiers, refresh: refreshTier } = useTier()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [chamaName, setChamaName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedTier, setSelectedTier] = useState('Growth')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [stage, setStage] = useState('form')
  const [signup, setSignup] = useState(null)
  const [failReason, setFailReason] = useState('')
  const [pollKick, setPollKick] = useState(0)
  const [destination, setDestination] = useState('/dashboard')
  const [elapsed, setElapsed] = useState(0)
  const [pollCount, setPollCount] = useState(0)
  const [completedAt, setCompletedAt] = useState(null)

  const claimRef = useRef(null)
  const signupIdRef = useRef(null)
  const triesRef = useRef(0)
  const reviewSeenRef = useRef(0)

  useEffect(() => {
    const p = readPending()
    if (p?.id && p?.claim) {
      claimRef.current = p.claim
      signupIdRef.current = p.id
      setSignup({ id: p.id, tier: p.tier, amount: p.amount, phone: p.phone })
      if (p.tier) setSelectedTier(p.tier)
      setStage('waiting')
    }
  }, [])

  useEffect(() => {
    if (stage !== 'waiting') return undefined
    const id = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [stage])

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

  const selectedPlan = tiers[selectedTier]
  const price = Number(selectedPlan?.price ?? 0)
  const routeFor = (portal) => (portal === 'member' ? '/member' : '/dashboard')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) return setError('Enter your full name.')
    if (!isValidEmail(email)) return setError('Enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (chamaName.trim().length < 2) return setError('Enter your chama name.')
    if (!isValidPhone(phone)) return setError('Enter a valid 10-digit Kenyan phone number (e.g., 0712 345 678).')

    setBusy(true)
    try {
      if (price <= 0) return setError('This plan is not available right now. Please choose another plan.')

      const res = await api('/api/billing/signup/checkout', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone,
          chama_name: chamaName.trim(),
          tier: selectedTier,
        },
      })
      claimRef.current = res.claim
      signupIdRef.current = res.signup.id
      writePending({ id: res.signup.id, claim: res.claim, tier: res.signup.tier, amount: res.signup.amount, phone: res.signup.phone })
      setSignup(res.signup)
      triesRef.current = 0
      reviewSeenRef.current = 0
      setElapsed(0)
      setPollCount(0)
      setStage('waiting')
    } catch (err) {
      setError(err?.message || 'Could not start your signup. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (stage !== 'waiting' || !signupIdRef.current) return undefined
    let cancelled = false
    const signupId = signupIdRef.current

    const applyOutcome = async (s) => {
      setSignup(s)
      if (s.status === 'complete') {
        clearPending()
        if (s.session) {
          const sessionUser = adoptSession(s.session)
          setDestination(routeFor(sessionUser.portal))
          try { await refreshTier() } catch { /* tier loads on next navigation */ }
        } else {
          setDestination('/login')
        }
        setCompletedAt(new Date())
        setStage('success')
        toast.success(`${s.tier} plan activated`)
        return true
      }
      if (s.status === 'review') {
        reviewSeenRef.current += 1
        if (reviewSeenRef.current <= 4) return false
        setStage('review')
        return true
      }
      if (['failed', 'expired'].includes(s.status)) {
        clearPending()
        setFailReason(friendlyFailureReason(s.failedReason, s.status))
        setStage('failed')
        if (s.status === 'failed') toast.error('Payment not completed')
        return true
      }
      return false
    }

    let inFlight = false
    const check = async () => {
      inFlight = true
      try {
        const res = await api(`/api/billing/signup/${signupId}/status`, {
          method: 'POST',
          body: { claim: claimRef.current },
        })
        if (cancelled) return true
        return await applyOutcome({ ...res.signup, session: res.session })
      } catch {
        return false
      } finally { inFlight = false }
    }

    ;(async () => { const done = await check(); if (done || cancelled) return })()
    const id = setInterval(async () => {
      if (inFlight) return undefined
      triesRef.current += 1
      setPollCount(triesRef.current)
      const done = await check()
      if (done) return clearInterval(id)
      if (triesRef.current >= MAX_POLLS) { clearInterval(id); if (!cancelled) setStage('timeout') }
      return undefined
    }, POLL_MS)

    return () => { cancelled = true; clearInterval(id) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pollKick])

  const retryCheck = () => {
    triesRef.current = 0
    reviewSeenRef.current = 0
    setPollCount(0)
    setStage('waiting')
    setPollKick((n) => n + 1)
  }

  const backToForm = () => {
    clearPending()
    claimRef.current = null
    signupIdRef.current = null
    reviewSeenRef.current = 0
    setSignup(null)
    setFailReason('')
    setError('')
    setElapsed(0)
    setPollCount(0)
    setCompletedAt(null)
    setStage('form')
  }

  const finish = () => {
    if (destination !== '/login') {
      toast.success(`Welcome, ${name.trim().split(' ')[0] || 'chairman'}! Your chama is ready.`)
    }
    navigate(destination, { replace: true })
  }

  const phoneValid = isValidPhone(phone)

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper lg:grid-cols-[minmax(340px,5fr)_7fr]">
      <aside className="relative flex flex-col gap-4 overflow-hidden bg-navy p-7 text-white lg:sticky lg:top-0 lg:h-screen lg:gap-7 lg:p-11">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(600px 400px at 0 0, rgba(16,185,129,0.35), transparent), linear-gradient(160deg, #0B1F33, #0A3D46)' }} />
        <Link to="/" className="relative flex items-center gap-2.5 text-white no-underline">
          <img src={logo} alt="Chametu" className="h-8 w-8 rounded-lg object-contain" />
          <span className="font-display text-[1.15rem] font-bold">Chametu</span>
        </Link>
        <h2 className="relative max-w-[15ch] font-display text-[1.4rem] font-bold leading-[1.15] tracking-tight lg:text-[clamp(1.7rem,2.6vw,2.4rem)]">
          Start your chama with <em className="not-italic text-gold">total clarity</em>
        </h2>
        <p className="relative hidden max-w-[38ch] leading-relaxed text-white/75 lg:block">
          You'll be the chairman. Invite your treasurer, secretary and members once you're set up.
        </p>
        <ul className="relative m-0 hidden list-none gap-3 p-0 lg:grid">
          {BENEFITS.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-[0.92rem] text-white/90">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.12]"><Icon size={14} strokeWidth={2} /></span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
        <div className="relative mt-auto hidden items-start gap-2.5 rounded-2xl border border-white/20 bg-white/[0.07] p-4 text-[0.88rem] leading-relaxed lg:flex">
          <LockIcon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-gold" />
          <span><b className="text-gold">Pay first, then you're in.</b> Your chama is created the moment M-Pesa confirms your plan payment.</span>
        </div>
      </aside>

      <main className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[600px]">
          <div className="mb-6 flex items-center justify-between text-[0.88rem] text-ink-soft">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline">
              <ArrowLeft size={14} strokeWidth={2} /> Back to login
            </Link>
            <ThemeToggle />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-widest text-[#8A6417] dark:bg-gold/20 dark:text-gold">
            <Crown size={11} /> Chairman signup
          </div>

          <h1 className="mt-4 font-display text-[2rem] font-bold tracking-tight text-navy dark:text-white">Create your chama</h1>
          <p className="mb-5 mt-2 leading-relaxed text-ink-soft dark:text-slate-300">
            You'll be set up as the chama's chairman. Choose a plan, pay securely with M-Pesa, and your chama is created as soon as payment is confirmed.
          </p>

          <Stepper stage={stage} />

          {stage !== 'form' && (
            <StatusCard
              stage={stage}
              signup={signup}
              failReason={failReason}
              elapsed={elapsed}
              attempts={pollCount}
              completedAt={completedAt}
              claim={claimRef.current}
              onRetryCheck={retryCheck}
              onBack={backToForm}
              onFinish={finish}
            />
          )}

          {stage === 'form' && (
          <form onSubmit={submit}>
            <Field label="Your full name">
              <IconInput icon={<User size={18} strokeWidth={1.8} />} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Daniel Muthui" autoComplete="name" />
            </Field>
            <Field label="Email">
              <IconInput type="email" icon={<Mail size={18} strokeWidth={1.8} />} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </Field>
            <Field label="Password">
              <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15 dark:border-white/15 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
                <Lock size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft dark:text-slate-300" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-navy outline-none placeholder:text-ink-soft/70 dark:text-white dark:placeholder:text-slate-400" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="p-1 text-ink-soft transition hover:text-navy dark:text-slate-300 dark:hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((i) => {
                  const active = i < pwStrength
                  const colors = ['bg-red-500', 'bg-gold', 'bg-emerald', 'bg-forest']
                  return <span key={i} className={`h-1 rounded-full transition ${active ? colors[pwStrength - 1] : 'bg-line dark:bg-white/10'}`} />
                })}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Chama name">
                <IconInput icon={<Building2 size={18} strokeWidth={1.8} />} value={chamaName} onChange={(e) => setChamaName(e.target.value)} placeholder="e.g. Umoja Investment Chama" />
              </Field>
              <Field label="M-Pesa phone (required)">
                <PhoneInput value={phone} onChange={(digits) => setPhone(digits)} valid={phoneValid} />
              </Field>
            </div>

            <div className="mb-3.5 mt-7 flex items-center gap-3 rounded-2xl border border-[#00A651]/20 bg-gradient-to-r from-[#00A651]/[0.06] to-transparent px-4 py-3 dark:border-[#00A651]/30 dark:from-[#00A651]/[0.10]">
              <span className="grid h-10 w-16 flex-none place-items-center rounded-xl bg-white shadow-sm ring-1 ring-[#00A651]/20">
                <MpesaLogo className="h-6" />
              </span>
              <div className="min-w-0">
                <div className="text-[0.82rem] font-semibold text-navy dark:text-white">Pay securely with M-Pesa</div>
                <div className="text-[0.74rem] leading-snug text-ink-soft dark:text-slate-300">STK Push to your phone · No card needed · Instant activation</div>
              </div>
            </div>

            <div className="mb-3.5 flex items-center justify-between">
              <b className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-slate-300">Choose your plan</b>
              <span className="text-[0.76rem] text-ink-soft dark:text-slate-400">Upgrade anytime · billed monthly</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ORDER.map((tierName) => (
                <PlanCard key={tierName} tierName={tierName} tier={tiers[tierName]} meta={PLAN_META[tierName]} selected={selectedTier === tierName} onSelect={() => setSelectedTier(tierName)} />
              ))}
            </div>

            <div className="mb-4 mt-4 flex items-center justify-between rounded-2xl border border-dashed border-line bg-white px-4 py-3.5 text-[0.86rem] dark:border-white/15 dark:bg-white/[0.04]">
              <div className="dark:text-slate-300">
                <b className="text-navy dark:text-white">Due today</b>
                <br />
                <span className="text-ink-soft dark:text-slate-400">{selectedTier} plan · billed monthly via M-Pesa</span>
              </div>
              <b className="font-mono text-[1.25rem] text-navy dark:text-white">KSh {price.toLocaleString()}</b>
            </div>

            <button type="submit" disabled={busy}
              className="group relative mt-2 flex w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border-0 bg-gradient-to-r from-[#00A651] via-[#009947] to-[#008C44] px-4 py-3.5 text-left text-white shadow-[0_12px_28px_-10px_rgba(0,166,81,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-10px_rgba(0,166,81,0.65),inset_0_1px_0_rgba(255,255,255,0.22)] disabled:cursor-not-allowed disabled:transform-none disabled:opacity-60">
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative flex items-center gap-3">
                <span className="grid h-11 w-16 flex-none place-items-center rounded-xl bg-white shadow-sm">
                  {busy ? <Loader2 size={18} className="animate-spin text-[#00A651]" /> : <MpesaLogo className="h-6" />}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-white/80">{busy ? 'Sending STK push…' : 'Pay with M-Pesa'}</span>
                  <span className="font-display text-[1rem] font-bold">KSh {price.toLocaleString()}</span>
                </span>
              </span>
              <span className="relative flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[0.72rem] font-bold tracking-wide backdrop-blur">
                {busy ? 'Please wait' : 'Continue'}
                {!busy && (<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)}
              </span>
            </button>

            <div className="mt-3 flex items-center justify-center gap-2 text-[0.72rem] text-ink-soft dark:text-slate-400">
              <ShieldCheck size={12} className="text-[#00A651]" />
              <span>Secured by Safaricom · No card needed · Instant activation</span>
            </div>

            <p className="mt-3 text-center text-[0.76rem] text-ink-soft dark:text-slate-400">
              An M-Pesa prompt will be sent to <b className="font-mono text-navy dark:text-white">{phone ? formatPhone(phone) : 'your phone number'}</b>. Your chama is created once payment is confirmed.
            </p>

            {error && (<div role="alert" className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-center text-[0.84rem] text-red-600 dark:bg-red-500/15 dark:text-red-300">{error}</div>)}

            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-3.5 py-3 text-[0.76rem] leading-relaxed text-navy ring-1 ring-emerald/10 dark:bg-emerald/[0.08] dark:text-slate-200 dark:ring-emerald/20">
              <ShieldCheck size={14} className="mt-0.5 flex-none text-forest dark:text-emerald-400" />
              <span><b className="dark:text-white">Not the chairman?</b> Your chairman creates your account and sends you an invite link. Ask them to invite you.</span>
            </div>
          </form>
          )}
        </div>
      </main>
    </div>
  )
}

/* ================================================================== */
/*  Receipt success view — driven by the backend receipt              */
/* ================================================================== */
function ReceiptSuccessView({ signup, claim, completedAt, onFinish }) {
  const [stage, setStage] = useState('processing')
  const [receipt, setReceipt] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const receiptRef = useRef(null)

  const signupId = signup?.id || ''
  const when = completedAt || new Date()

  // Fetch the persisted receipt from the backend.
  useEffect(() => {
    let cancelled = false
    let tries = 0

    const load = async () => {
      tries += 1
      try {
        const res = await api(
          `/api/billing/receipts/signup/${signupId}?claim=${encodeURIComponent(claim || '')}`,
          { method: 'GET' },
        )
        if (cancelled) return
        if (res?.receipt) {
          setReceipt(res.receipt)
          setStage('printing')
          setTimeout(() => { if (!cancelled) setStage('complete') }, 2300)
        } else {
          setFetchError('Receipt could not be generated yet.')
        }
      } catch (err) {
        if (cancelled) return
        if (tries < 3) {
          setTimeout(load, 1500)
        } else {
          setFetchError(err?.message || 'Could not load your receipt.')
          setStage('complete')
        }
      }
    }

    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signupId, claim])

  const handlePrint = useCallback(() => {
    if (!receiptRef.current) return
    const node = receiptRef.current
    const printCSS = `
      <style>
        @media print {
          body * { visibility: hidden !important; }
          #chametu-receipt-printable, #chametu-receipt-printable * { visibility: visible !important; }
          #chametu-receipt-printable {
            position: fixed !important; inset: 0 !important; margin: 0 !important;
            background: #fff !important; color: #0B1F33 !important;
            width: 80mm !important; padding: 8mm !important;
          }
          @page { margin: 0; size: 80mm auto; }
        }
      </style>
    `
    const host = document.createElement('div')
    host.id = 'chametu-receipt-printable'
    host.innerHTML = node.innerHTML
    document.head.insertAdjacentHTML('beforeend', printCSS)
    document.body.appendChild(host)
    window.print()
    document.body.removeChild(host)
    document.head.querySelectorAll('style').forEach((s) => {
      if (s.textContent?.includes('chametu-receipt-printable')) s.remove()
    })
  }, [])

  const handleDownload = useCallback(() => {
    if (!receipt) return
    const lines = [
      '        CHAMETU RECEIPT',
      '     Chama Management Platform',
      '================================',
      `Receipt no: ${receipt.receiptNumber}`,
      `Date:       ${receipt.issuedAtLabel || when.toLocaleString()}`,
      '--------------------------------',
      `Chama:      ${receipt.chama?.name || '—'}`,
      `Code:       ${receipt.chama?.code || '—'}`,
      `Chairman:   ${receipt.payer?.name || '—'}`,
      `Email:      ${receipt.payer?.email || '—'}`,
      `Phone:      ${receipt.payer?.phone || '—'}`,
      '--------------------------------',
      `Plan:       ${receipt.tier}`,
      `Amount:     ${receipt.amountLabel || '—'}`,
      `Status:     ${(receipt.status || '').toUpperCase()}`,
      '================================',
      '',
      'Thank you for choosing Chametu.',
      `Support:    ${receipt.brand?.supportEmail || 'support@chametu.co.ke'}`,
      '',
      'Keep this receipt for your records.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Chametu-Receipt-${receipt.receiptNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [receipt, when])

  return (
    <div className="rounded-2xl border border-line bg-white px-5 py-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald/10 text-emerald ring-1 ring-emerald/20 dark:bg-emerald/15 dark:text-emerald-300 dark:ring-emerald/30">
          <Receipt size={22} strokeWidth={2.2} />
        </div>
        <h3 className="mt-3 font-display text-[1.15rem] font-bold text-navy dark:text-white">Payment confirmed</h3>
        <p className="mx-auto mt-1 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft dark:text-slate-300">
          Your <b className="text-navy dark:text-white">{signup?.tier || receipt?.tier}</b> plan is active. Here's your official receipt.
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <ReceiptPrinter.Root stage={stage} feedMotion="stepped" animate>
          <ReceiptPrinter.Machine>
            <ReceiptPrinter.Header>
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Receipt size={14} className="text-emerald" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/60">Chametu</div>
                  <div className="text-[0.78rem] font-semibold text-white">Receipt printer</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[0.58rem] font-bold text-emerald-200 ring-1 ring-white/15">
                <span className="h-1 w-1 rounded-full bg-emerald-300" />
                READY
              </div>
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Screen className="mt-2">
              <ReceiptPrinter.Status />
              <div className="mt-2 flex items-center justify-between text-[0.62rem] font-mono text-emerald-200/70">
                <span>#{receipt?.receiptNumber || '—'}</span>
                <span>{receipt?.amountLabel || `KSh ${signup?.amount ?? 0}`}</span>
              </div>
            </ReceiptPrinter.Screen>

            <ReceiptPrinter.Output>
              <div ref={receiptRef}>
                <ReceiptPrinter.Paper>
                  {receipt ? <ReceiptBody receipt={receipt} /> : <ReceiptSkeleton />}
                </ReceiptPrinter.Paper>
              </div>
            </ReceiptPrinter.Output>
          </ReceiptPrinter.Machine>
        </ReceiptPrinter.Root>
      </div>

      {fetchError && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-center text-[0.78rem] text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
          {fetchError} You can still access it later from Billing history.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={handlePrint} disabled={!receipt}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white py-2.5 text-[0.84rem] font-semibold text-navy transition hover:border-forest hover:text-forest disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:border-emerald dark:hover:text-emerald-300">
          <Printer size={14} strokeWidth={2.2} /> Print receipt
        </button>
        <button type="button" onClick={handleDownload} disabled={!receipt}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-[0.84rem] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
          <Download size={14} strokeWidth={2.2} /> Download
        </button>
      </div>

      <button type="button" onClick={onFinish}
        className="mt-3 w-full rounded-xl border border-line bg-paper py-2.5 text-[0.84rem] font-semibold text-navy transition hover:border-forest dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:border-emerald">
        Go to my dashboard
      </button>
    </div>
  )
}

function ReceiptSkeleton() {
  return (
    <div className="py-10 text-center text-[0.7rem] font-mono" style={{ color: '#3B5063' }}>
      Preparing your receipt…
    </div>
  )
}

function ReceiptBody({ receipt }) {
  const Row = ({ label, value, bold }) => (
    <div className="flex items-baseline justify-between gap-3 py-[3px] text-[0.72rem]">
      <span className="text-[#3B5063]">{label}</span>
      <span className={`text-right ${bold ? 'font-bold' : 'font-medium'}`} style={{ color: '#0B1F33' }}>{value}</span>
    </div>
  )
  const Divider = ({ char = '·' }) => (
    <div className="my-2 overflow-hidden whitespace-nowrap text-[0.6rem] leading-none tracking-[0.2em] text-[#0B1F33]/30">
      {char.repeat(34)}
    </div>
  )

  const issued = receipt.issuedAt ? new Date(receipt.issuedAt) : null
  const dateStr = issued
    ? issued.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'
  const timeStr = issued
    ? issued.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div>
      <div className="text-center">
        <div className="mx-auto grid h-8 w-8 place-items-center rounded-lg" style={{ background: 'linear-gradient(135deg, #0B7A5A, #10B981)' }}>
          <Receipt size={14} className="text-white" strokeWidth={2.4} />
        </div>
        <div className="mt-2 font-display text-[0.92rem] font-bold tracking-wide" style={{ color: '#0B1F33' }}>
          {receipt.brand?.name || 'CHAMETU'}
        </div>
        <div className="text-[0.58rem] uppercase tracking-[0.24em]" style={{ color: '#3B5063' }}>
          Official Receipt
        </div>
        <div className="mt-1 text-[0.6rem] font-mono" style={{ color: '#3B5063' }}>
          Ref · {receipt.receiptNumber}
        </div>
      </div>

      <Divider />

      <div className="font-mono">
        <Row label="Date" value={dateStr} />
        <Row label="Time" value={timeStr} />
        <Row label="Status" value={(receipt.status || '').toUpperCase()} bold />
      </div>

      <Divider />

      <div className="text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#3B5063' }}>Chama</div>
      <div className="mb-1 font-display text-[0.86rem] font-bold leading-tight" style={{ color: '#0B1F33' }}>
        {receipt.chama?.name || '—'}
      </div>
      <div className="font-mono">
        <Row label="Chairman" value={receipt.payer?.name || '—'} />
        <Row label="Email" value={receipt.payer?.email || '—'} />
        <Row label="Phone" value={receipt.payer?.phone || '—'} />
      </div>

      <Divider />

      <div className="text-[0.58rem] uppercase tracking-[0.2em]" style={{ color: '#3B5063' }}>Plan</div>
      <div className="flex items-baseline justify-between py-1">
        <span className="font-display text-[0.9rem] font-bold" style={{ color: '#0B1F33' }}>{receipt.tier}</span>
        <span className="font-mono text-[0.9rem] font-bold" style={{ color: '#0B7A5A' }}>{receipt.amountLabel}</span>
      </div>

      <Divider />

      <div className="flex items-baseline justify-between py-1">
        <span className="font-display text-[0.86rem] font-bold uppercase tracking-wider" style={{ color: '#0B1F33' }}>Total paid</span>
        <span className="font-mono text-[1.05rem] font-extrabold" style={{ color: '#0B7A5A' }}>{receipt.amountLabel}</span>
      </div>

      <Divider char="=" />

      <div className="text-center text-[0.62rem] font-mono" style={{ color: '#3B5063' }}>
        Paid via M-Pesa · Thank you!
      </div>
      <div className="mt-1 text-center text-[0.58rem] font-mono" style={{ color: '#0B1F33' }}>
        {receipt.brand?.supportEmail || 'support@chametu.co.ke'}
      </div>
      <div className="mt-1 text-center text-[0.56rem] font-mono" style={{ color: '#3B5063' }}>
        Keep this receipt for your records.
      </div>
    </div>
  )
}

/* ---------- Modern M-Pesa phone field ---------- */
function PhoneInput({ value = '', onChange, valid = false }) {
  const [focused, setFocused] = useState(false)
  const shown = formatPhone(value)
  const complete = value.length === 10
  const showGreen = complete && valid
  const showWarn = complete && !valid
  const remaining = Math.max(0, 10 - value.length)

  return (
    <div>
      <div className={`flex items-center gap-2 rounded-xl border-[1.5px] bg-[#F8FAFC] px-2.5 py-1.5 transition dark:bg-white/[0.04] ${focused ? 'border-[#00A651] bg-white ring-4 ring-[#00A651]/15 dark:bg-white/[0.06]' : showWarn ? 'border-red-300 bg-white dark:bg-white/[0.06]' : showGreen ? 'border-[#00A651]/60 bg-white dark:bg-white/[0.06]' : 'border-line dark:border-white/15'}`}>
        <span className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[0.78rem] font-semibold transition ${focused ? 'border-[#00A651]/40 bg-[#00A651]/[0.08] text-navy dark:text-white' : 'border-line bg-white text-navy dark:border-white/15 dark:bg-white/[0.06] dark:text-white'}`}>
          <KenyaFlag />
          <span className="font-mono tracking-tight">+254</span>
        </span>
        <input inputMode="numeric" autoComplete="tel" value={shown}
          onChange={(e) => onChange(stripDigits(e.target.value))}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          maxLength={12} placeholder="0712 345 678" aria-label="M-Pesa phone number"
          aria-invalid={showWarn || undefined}
          className="min-w-0 flex-1 border-0 bg-transparent py-2 font-mono text-sm tracking-wide text-navy outline-none placeholder:font-sans placeholder:text-ink-soft/70 dark:text-white dark:placeholder:text-slate-400" />
        <span className="grid h-6 w-6 flex-none place-items-center">
          {showGreen && <Check size={14} strokeWidth={3} className="text-[#00A651] dark:text-emerald-400" />}
          {showWarn && <AlertCircle size={14} strokeWidth={2.4} className="text-red-500" />}
          {!complete && focused && (<span className="rounded-md bg-[#00A651]/10 px-1.5 py-0.5 font-mono text-[0.6rem] font-bold text-[#008C44] dark:bg-emerald-400/15 dark:text-emerald-300">{remaining}</span>)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[0.68rem] leading-tight">
        <span className="flex items-center gap-1 text-ink-soft dark:text-slate-400"><Smartphone size={10} className="text-[#00A651] dark:text-emerald-400" /> Safaricom or Airtel · 10 digits</span>
        <span className={`font-mono ${showWarn ? 'text-red-500' : showGreen ? 'text-[#008C44] dark:text-emerald-400' : 'text-ink-soft/70 dark:text-slate-400'}`}>{value.length}/10</span>
      </div>
    </div>
  )
}

/* ---------- Tier card (dark-mode-safe price) ---------- */
function PlanCard({ tierName, tier, meta, selected, onSelect }) {
  const style = TIER_STYLES[tierName] || TIER_STYLES.Starter
  const badge = meta.popular || meta.star ? style.badge : null

  const cssVars = {
    '--tier-accent': style.accent,
    '--tier-accent-dark': style.accentDark || style.accent,
    '--tier-accent-soft': style.accentSoft,
    '--tier-accent-soft-dark': style.accentSoftDark || style.accentSoft,
    '--tier-ring': style.accentRing,
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={cssVars}
      className={`group relative flex flex-col overflow-hidden rounded-[18px] text-left transition-all duration-200 dark:bg-white/[0.03] ${selected ? '-translate-y-0.5' : 'hover:-translate-y-0.5'}`}
      data-selected={selected ? 'true' : 'false'}
    >
      <style>{`
        .tier-card { background: #ffffff; border: 1.5px solid #E3E9EF; box-shadow: 0 1px 2px rgba(11,31,51,0.04); }
        .dark .tier-card { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.10); box-shadow: 0 1px 2px rgba(0,0,0,0.3); }
        .tier-card[data-selected="true"] { border-color: var(--tier-accent); box-shadow: 0 0 0 3px var(--tier-accent-soft), 0 18px 40px -16px var(--tier-ring); }
        .dark .tier-card[data-selected="true"] { border-color: var(--tier-accent-dark); box-shadow: 0 0 0 3px var(--tier-accent-soft-dark), 0 18px 40px -16px var(--tier-accent-dark); }
        .tier-price { color: #0B1F33; }
        .dark .tier-price { color: #FFFFFF; }
        .tier-price-suffix { color: #6B7A8C; }
        .dark .tier-price-suffix { color: #CBD5E1; }
        .tier-name { color: var(--tier-accent); }
        .dark .tier-name { color: var(--tier-accent-dark); }
        .tier-members { color: #6B7A8C; }
        .dark .tier-members { color: #CBD5E1; }
        .tier-feature-text { color: #6B7A8C; }
        .dark .tier-feature-text { color: #CBD5E1; }
        .tier-check-bubble { background: var(--tier-accent-soft); }
        .dark .tier-check-bubble { background: var(--tier-accent-soft-dark); }
        .tier-check-icon { color: var(--tier-accent); }
        .dark .tier-check-icon { color: var(--tier-accent-dark); }
        .tier-divider { background: linear-gradient(90deg, #E3E9EF, transparent); }
        .tier-divider[data-selected="true"] { background: linear-gradient(90deg, var(--tier-accent), transparent); opacity: 0.6; }
        .dark .tier-divider { background: linear-gradient(90deg, rgba(255,255,255,0.12), transparent); }
        .dark .tier-divider[data-selected="true"] { background: linear-gradient(90deg, var(--tier-accent-dark), transparent); opacity: 0.7; }
        .tier-strip { background: rgba(11,31,51,0.03); color: #6B7A8C; }
        .dark .tier-strip { background: rgba(255,255,255,0.05); color: #CBD5E1; }
        .tier-strip[data-selected="true"] { background: var(--tier-accent-soft); color: var(--tier-accent); }
        .dark .tier-strip[data-selected="true"] { background: var(--tier-accent-soft-dark); color: var(--tier-accent-dark); }
        .tier-radio { border-color: #CBD5E1; }
        .dark .tier-radio { border-color: rgba(255,255,255,0.3); }
        .tier-radio[data-selected="true"] { border-color: var(--tier-accent); background: var(--tier-accent); }
        .dark .tier-radio[data-selected="true"] { border-color: var(--tier-accent-dark); background: var(--tier-accent-dark); }
      `}</style>

      <div className="tier-card relative flex flex-col overflow-hidden rounded-[18px]" data-selected={selected ? 'true' : 'false'}>
        <div className="h-[4px] w-full" style={{ background: selected ? style.gradient : 'linear-gradient(90deg, #E3E9EF, #EEF2F6)', opacity: selected ? 1 : 0.9 }} />

        {badge && (
          <span className="absolute right-3 top-3 z-10 rounded-full px-2.5 py-1 text-[0.58rem] font-bold tracking-[0.14em] shadow-sm" style={{ background: badge.bg, color: badge.color }}>
            {badge.text}
          </span>
        )}

        <div className="flex flex-1 flex-col px-4 pb-5 pt-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl text-white shadow-sm" style={{ background: style.gradient }}>
              {meta.star ? <Sparkles size={15} strokeWidth={2.4} /> : meta.popular ? <Star size={15} strokeWidth={2.4} /> : <ShieldCheck size={15} strokeWidth={2.4} />}
            </span>
            <div className="min-w-0">
              <div className="tier-name text-[0.68rem] font-bold uppercase tracking-[0.16em]">{tierName}</div>
              <div className="tier-members text-[0.72rem] font-medium">{tier.maxMembers} members max</div>
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="tier-price font-display text-[1.7rem] font-bold leading-none tracking-tight">KSh {tier.price.toLocaleString()}</span>
            <span className="tier-price-suffix text-[0.76rem] font-medium">/mo</span>
          </div>

          <div className="tier-divider my-3.5 h-px w-full" data-selected={selected ? 'true' : 'false'} />

          <ul className="m-0 grid list-none gap-2 p-0 text-[0.8rem] leading-snug">
            {meta.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="tier-check-bubble mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full">
                  <Check size={10} strokeWidth={3} className="tier-check-icon" />
                </span>
                <span className="tier-feature-text">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-4">
            <div className="tier-strip flex items-center justify-between rounded-xl px-3 py-2 text-[0.72rem] font-semibold transition-colors" data-selected={selected ? 'true' : 'false'}>
              <span>{selected ? 'Selected plan' : 'Tap to choose'}</span>
              <span className="tier-radio grid h-4 w-4 place-items-center rounded-full border-[1.5px]" data-selected={selected ? 'true' : 'false'}>
                {selected && <Check size={9} strokeWidth={3} className="text-white" />}
              </span>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

/* ---------- Stepper ---------- */
function Stepper({ stage }) {
  const active = stage === 'form' ? 0 : stage === 'success' ? 2 : 1
  return (
    <ol className="m-0 mb-6 flex list-none items-center gap-2 p-0">
      {STEPS.map((label, i) => {
        const done = i < active || (i === 2 && stage === 'success')
        const current = i === active
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold ${done ? 'bg-forest text-white' : current ? 'bg-gold text-[#2E2200]' : 'bg-line text-ink-soft dark:bg-white/10 dark:text-slate-400'}`}>
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span className={`truncate text-[0.74rem] font-semibold ${current || done ? 'text-navy dark:text-white' : 'text-ink-soft dark:text-slate-400'}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line dark:bg-white/10" />}
          </li>
        )
      })}
    </ol>
  )
}

/* ---------- Status card ---------- */
function StatusCard({ stage, signup, failReason, elapsed, attempts, completedAt, claim, onRetryCheck, onBack, onFinish }) {
  const amount = Number(signup?.amount ?? 0)
  const tier = signup?.tier || ''
  const phone = signup?.phone || ''
  const reference = String(signup?.id || '').slice(0, 8).toUpperCase() || 'N/A'
  const btnGhost = 'rounded-xl border border-line bg-white px-4 py-2.5 text-[0.86rem] font-semibold text-navy dark:border-white/15 dark:bg-white/[0.04] dark:text-white'
  const btnSolid = 'rounded-xl bg-forest px-5 py-2.5 text-[0.86rem] font-semibold text-white'

  if (stage === 'waiting') {
    return <MpesaWaiting amount={amount} phone={phone} tier={tier} elapsed={elapsed} attempts={attempts} onRetry={onRetryCheck} onCancel={onBack} />
  }

  if (stage === 'success') {
    return (
      <ReceiptSuccessView
        signup={signup}
        claim={claim}
        completedAt={completedAt}
        onFinish={onFinish}
      />
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-white px-6 py-9 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      {stage === 'failed' && (
        <>
          <AlertCircle size={40} className="mx-auto text-red-500" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy dark:text-white">Payment not completed</p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft dark:text-slate-300">{failReason} No chama was created and you have not been charged for one.</p>
          <button type="button" onClick={onBack} className={`mt-6 ${btnSolid}`}>Try again</button>
        </>
      )}

      {stage === 'review' && (
        <>
          <Clock size={40} className="mx-auto text-amber-500 dark:text-amber-400" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy dark:text-white">Payment received, we are confirming it</p>
          <p className="mx-auto mt-1.5 max-w-[44ch] text-[0.86rem] leading-relaxed text-ink-soft dark:text-slate-300">
            Your payment of <b className="text-navy dark:text-white">KSh {amount.toLocaleString()}</b> came through and needs a quick check before your chama is created. Please do not pay again. This usually takes a few minutes.
          </p>
          <p className="mx-auto mt-3 max-w-[44ch] text-[0.78rem] leading-relaxed text-ink-soft dark:text-slate-400">
            Reference: <span className="font-mono text-navy dark:text-white">{reference}</span><br />
            If your chama is not ready within a few hours, email <a href={`mailto:support@chametu.co.ke?subject=Chametu%20payment%20${reference}`} className="font-semibold text-forest hover:underline dark:text-emerald-400">support@chametu.co.ke</a> with this reference.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/login" className={`${btnGhost} no-underline`}>Back to login</Link>
            <button type="button" onClick={onRetryCheck} className={btnSolid}>Check again</button>
          </div>
        </>
      )}

      {stage === 'timeout' && (
        <>
          <AlertCircle size={40} className="mx-auto text-amber-500 dark:text-amber-400" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy dark:text-white">Still waiting for M-Pesa</p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft dark:text-slate-300">We haven't received confirmation yet. If you already entered your PIN, check again in a moment.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" onClick={onBack} className={btnGhost}>Start over</button>
            <button type="button" onClick={onRetryCheck} className={btnSolid}>Check again</button>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- Field / IconInput / ThemeToggle ---------- */
function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[0.8rem] font-semibold text-navy dark:text-white">{label}</label>
      {children}
    </div>
  )
}
function IconInput({ icon, className = '', ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15 dark:border-white/15 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
      <span className="shrink-0 text-ink-soft dark:text-slate-300">{icon}</span>
      <input {...props} className={`min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-navy outline-none placeholder:text-ink-soft/70 dark:text-white dark:placeholder:text-slate-400 ${className}`} />
    </div>
  )
}
function ThemeToggle() {
  const [dark, setDark] = useState(typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark')
  const toggle = () => {
    const html = document.documentElement
    const next = dark ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    try { localStorage.setItem('chametu_theme', next) } catch {}
    setDark(!dark)
  }
  return (<button type="button" onClick={toggle} className="rounded-xl border border-line bg-white px-2.5 py-1.5 text-navy transition hover:border-forest dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:border-emerald" aria-label="Toggle theme">{dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}</button>)
}