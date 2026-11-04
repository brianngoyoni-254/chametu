import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sun, Moon, Eye, EyeOff, Check, Mail, Lock, User,
  Building2, Phone, Smartphone, Vote, Star, Sparkles,
  ArrowLeft, Crown, ShieldCheck, Loader2, CheckCircle2, AlertCircle, Clock, Lock as LockIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTier } from '../context/TierContext'
import { ORDER } from '../lib/tiers'
import { toast } from 'sonner'
import { api } from '../lib/api'
import { friendlyFailureReason } from '../lib/paymentMessages'
import logo from '../assets/logos.png'

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

const readPending = () => {
  try { return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null') } catch { return null }
}
const writePending = (v) => { try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(v)) } catch {} }
const clearPending = () => { try { sessionStorage.removeItem(PENDING_KEY) } catch {} }

const STEPS = ['Details & plan', 'Pay with M-Pesa', 'Chama ready']

const isValidEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
const isValidPhone = (v) => /^0[17]\d{8}$/.test(v.replace(/\s/g, ''))

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
    if (!isValidPhone(phone)) return setError('Enter a valid Kenyan phone number (e.g., 0712345678).')

    const cleanPhone = phone.replace(/\s/g, '')
    setBusy(true)
    try {
      if (price <= 0) {
        setError('This plan is not available right now. Please choose another plan.')
        return
      }

      const res = await api('/api/billing/signup/checkout', {
        method: 'POST',
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: cleanPhone,
          chama_name: chamaName.trim(),
          tier: selectedTier,
        },
      })
      claimRef.current = res.claim
      signupIdRef.current = res.signup.id
      writePending({
        id: res.signup.id,
        claim: res.claim,
        tier: res.signup.tier,
        amount: res.signup.amount,
        phone: res.signup.phone,
      })
      setSignup(res.signup)
      triesRef.current = 0
      reviewSeenRef.current = 0
      setStage('waiting')
    } catch (err) {
      setError(err?.message || 'Could not start your signup. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  // Poll: depends only on `stage` and `pollKick`; the signup id is read
  // from a ref so setSignup() during polling does NOT restart the interval.
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
        setStage('success')
        toast.success(`${s.tier} plan activated`)
        return true
      }
      if (s.status === 'review') {
        // The payment arrived but needs a check. Give the server a few more
        // polls to settle (it may just be finishing the account), then show
        // the "confirming" screen. Never show the red failure screen for this.
        // The pending signup stays in sessionStorage so a refresh resumes here.
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

    // Only one status request at a time. The status call can be slow (it may
    // create the chama), and overlapping calls can race each other.
    let inFlight = false

    const check = async () => {
      inFlight = true
      try {
        const res = await api(`/api/billing/signup/${signupId}/status`, {
          method: 'POST',
          body: { claim: claimRef.current },
        })
        if (cancelled) return true
        const payload = { ...res.signup, session: res.session }
        return await applyOutcome(payload)
      } catch {
        return false
      } finally {
        inFlight = false
      }
    }

    ;(async () => {
      const done = await check()
      if (done || cancelled) return
    })()

    const id = setInterval(async () => {
      if (inFlight) return undefined
      triesRef.current += 1
      const done = await check()
      if (done) return clearInterval(id)
      if (triesRef.current >= MAX_POLLS) {
        clearInterval(id)
        if (!cancelled) setStage('timeout')
      }
      return undefined
    }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pollKick])

  const retryCheck = () => {
    triesRef.current = 0
    reviewSeenRef.current = 0
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
    setStage('form')
  }

  const finish = () => {
    if (destination !== '/login') toast.success(`Welcome, ${name.trim().split(' ')[0] || 'chairman'}! Your chama is ready.`)
    navigate(destination, { replace: true })
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper lg:grid-cols-[minmax(340px,5fr)_7fr]">
      <aside className="relative flex flex-col gap-4 overflow-hidden bg-navy p-7 text-white lg:sticky lg:top-0 lg:h-screen lg:gap-7 lg:p-11">
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

        <h2 className="relative max-w-[15ch] font-display text-[1.4rem] font-bold leading-[1.15] tracking-tight lg:text-[clamp(1.7rem,2.6vw,2.4rem)]">
          Start your chama with{' '}
          <em className="not-italic text-gold">total clarity</em>
        </h2>

        <p className="relative hidden max-w-[38ch] leading-relaxed text-white/75 lg:block">
          You'll be the chairman. Invite your treasurer, secretary and members once
          you're set up.
        </p>

        <ul className="relative m-0 hidden list-none gap-3 p-0 lg:grid">
          {BENEFITS.map(({ Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-[0.92rem] text-white/90">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.12]">
                <Icon size={14} strokeWidth={2} />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-auto hidden items-start gap-2.5 rounded-2xl border border-white/20 bg-white/[0.07] p-4 text-[0.88rem] leading-relaxed lg:flex">
          <LockIcon size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-gold" />
          <span>
            <b className="text-gold">Pay first, then you're in.</b> Your chama is
            created the moment M-Pesa confirms your plan payment.
          </span>
        </div>
      </aside>

      <main className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[600px]">
          <div className="mb-6 flex items-center justify-between text-[0.88rem] text-ink-soft">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to login
            </Link>
            <ThemeToggle />
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-[0.66rem] font-bold uppercase tracking-widest text-[#8A6417]">
            <Crown size={11} />
            Chairman signup
          </div>

          <h1 className="mt-4 font-display text-[2rem] font-bold tracking-tight text-navy">
            Create your chama
          </h1>
          <p className="mb-5 mt-2 leading-relaxed text-ink-soft">
            You'll be set up as the chama's chairman. Choose a plan, pay securely
            with M-Pesa, and your chama is created as soon as payment is confirmed.
          </p>

          <Stepper stage={stage} />

          {stage !== 'form' && (
            <StatusCard
              stage={stage}
              signup={signup}
              failReason={failReason}
              onRetryCheck={retryCheck}
              onBack={backToForm}
              onFinish={finish}
            />
          )}

          {stage === 'form' && (
          <form onSubmit={submit}>
            <Field label="Your full name">
              <IconInput
                icon={<User size={18} strokeWidth={1.8} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Daniel Muthui"
                autoComplete="name"
              />
            </Field>

            <Field label="Email">
              <IconInput
                type="email"
                icon={<Mail size={18} strokeWidth={1.8} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </Field>

            <Field label="Password">
              <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Lock size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
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
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field label="Chama name">
                <IconInput
                  icon={<Building2 size={18} strokeWidth={1.8} />}
                  value={chamaName}
                  onChange={(e) => setChamaName(e.target.value)}
                  placeholder="e.g. Umoja Investment Chama"
                />
              </Field>
              <Field label="M-Pesa phone (required)">
                <IconInput
                  inputMode="tel"
                  icon={<Phone size={18} strokeWidth={1.8} />}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  required
                />
              </Field>
            </div>

            <div className="mb-3.5 mt-7 flex items-center justify-between">
              <b className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                Choose your plan
              </b>
              <span className="text-[0.76rem] text-ink-soft">
                Upgrade anytime · billed monthly
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ORDER.map((tierName) => (
                <PlanCard
                  key={tierName}
                  tierName={tierName}
                  tier={tiers[tierName]}
                  meta={PLAN_META[tierName]}
                  selected={selectedTier === tierName}
                  onSelect={() => setSelectedTier(tierName)}
                />
              ))}
            </div>

            <div className="mb-4 mt-4 flex items-center justify-between rounded-2xl border border-dashed border-line bg-white px-4 py-3.5 text-[0.86rem]">
              <div>
                <b>Due today</b>
                <br />
                <span className="text-ink-soft">
                  {selectedTier} plan · billed monthly via M-Pesa
                </span>
              </div>
              <b className="font-mono text-[1.25rem] text-navy">
                KSh {price.toLocaleString()}
              </b>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-forest to-emerald py-4 font-display text-base font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
            >
              {busy ? 'Sending M-Pesa prompt…' : `Pay KSh ${price.toLocaleString()} with M-Pesa`}
            </button>

            <p className="mt-2.5 text-center text-[0.76rem] text-ink-soft">
              An M-Pesa prompt will be sent to {phone.trim() || 'your phone number'}. Your chama is created once payment is confirmed.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-center text-[0.84rem] text-red-600"
              >
                {error}
              </div>
            )}

            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-3.5 py-3 text-[0.76rem] leading-relaxed text-navy ring-1 ring-emerald/10">
              <ShieldCheck size={14} className="mt-0.5 flex-none text-forest" />
              <span>
                <b>Not the chairman?</b> Your chairman creates your account and sends
                you an invite link. Ask them to invite you.
              </span>
            </div>
          </form>
          )}
        </div>
      </main>
    </div>
  )
}

function PlanCard({ tierName, tier, meta, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col rounded-[18px] px-4.5 py-5 text-left transition ${
        selected
          ? 'border border-gold text-white shadow-[0_0_0_1px_rgba(245,185,66,0.8),0_18px_40px_rgba(11,31,51,0.3)]'
          : 'border border-line bg-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(11,31,51,0.12)]'
      }`}
      style={
        selected
          ? { background: 'linear-gradient(155deg, #0B1F33, #0A3D46)' }
          : undefined
      }
    >
      {meta.popular && (
        <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-br from-gold to-[#E8A21F] px-2.5 py-1 text-[0.6rem] font-bold tracking-widest text-[#2E2200]">
          MOST POPULAR
        </span>
      )}

      <span
        className={`absolute right-4 top-5 grid h-[18px] w-[18px] place-items-center rounded-full border-[1.5px] ${
          selected ? 'border-gold' : 'border-line'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full bg-gold transition-transform ${
            selected ? 'scale-100' : 'scale-0'
          }`}
        />
      </span>

      <div
        className={`flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] ${
          selected ? 'text-white/65' : 'text-ink-soft'
        }`}
      >
        {meta.star && (
          <Sparkles
            size={11}
            strokeWidth={2.4}
            className={selected ? 'text-gold' : 'text-forest'}
          />
        )}
        {tierName}
      </div>

      <div
        className={`mb-0.5 mt-2.5 font-display text-[1.65rem] font-bold tracking-tight ${
          selected ? 'text-white' : 'text-navy'
        }`}
      >
        KSh {tier.price.toLocaleString()}{' '}
        <small
          className={`text-[0.78rem] font-medium ${
            selected ? 'text-white/65' : 'text-ink-soft'
          }`}
        >
          / month
        </small>
      </div>

      <div
        className="my-3.5 h-px"
        style={{
          background: selected
            ? 'linear-gradient(90deg, rgba(245,185,66,0.55), transparent)'
            : 'linear-gradient(90deg, #E3E9EF, transparent)',
        }}
      />

      <ul
        className={`m-0 grid list-none gap-2 p-0 text-[0.8rem] leading-snug ${
          selected ? 'text-white/90' : 'text-ink-soft'
        }`}
      >
        <li className="flex items-start gap-2">
          <Check
            size={13}
            strokeWidth={2.6}
            className={`mt-0.5 shrink-0 ${selected ? 'text-gold' : 'text-forest'}`}
          />
          <span>Up to {tier.maxMembers} members</span>
        </li>
        {meta.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check
              size={13}
              strokeWidth={2.6}
              className={`mt-0.5 shrink-0 ${selected ? 'text-gold' : 'text-forest'}`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}

function Stepper({ stage }) {
  const active = stage === 'form' ? 0 : stage === 'success' ? 2 : 1
  return (
    <ol className="m-0 mb-6 flex list-none items-center gap-2 p-0">
      {STEPS.map((label, i) => {
        const done = i < active || (i === 2 && stage === 'success')
        const current = i === active
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.7rem] font-bold ${
                done
                  ? 'bg-forest text-white'
                  : current
                    ? 'bg-gold text-[#2E2200]'
                    : 'bg-line text-ink-soft'
              }`}
            >
              {done ? <Check size={12} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={`truncate text-[0.74rem] font-semibold ${
                current || done ? 'text-navy' : 'text-ink-soft'
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        )
      })}
    </ol>
  )
}

function StatusCard({ stage, signup, failReason, onRetryCheck, onBack, onFinish }) {
  const amount = Number(signup?.amount ?? 0).toLocaleString()
  const reference = String(signup?.id || '').slice(0, 8).toUpperCase() || 'N/A'
  const btnGhost =
    'rounded-xl border border-line bg-white px-4 py-2.5 text-[0.86rem] font-semibold text-navy'
  const btnSolid =
    'rounded-xl bg-forest px-5 py-2.5 text-[0.86rem] font-semibold text-white'

  return (
    <div className="rounded-2xl border border-line bg-white px-6 py-9 text-center shadow-sm">
      {stage === 'waiting' && (
        <>
          <Loader2 size={34} className="mx-auto animate-spin text-forest" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy">
            Check your phone
          </p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft">
            Enter your M-Pesa PIN to pay <b className="text-navy">KSh {amount}</b> for
            the {signup?.tier} plan. Please keep this page open. Your chama is
            created as soon as payment is confirmed.
          </p>
          <p className="mx-auto mt-3 max-w-[42ch] text-[0.76rem] text-ink-soft/80">
            This page updates automatically when the payment is confirmed or cancelled.
          </p>
        </>
      )}

      {stage === 'success' && (
        <>
          <CheckCircle2 size={40} className="mx-auto text-emerald" />
          <p className="mt-4 font-display text-[1.1rem] font-semibold text-navy">
            Payment received, your chama is ready
          </p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft">
            Your {signup?.tier} plan is active and you're set up as the chairman.
          </p>
          <button type="button" onClick={onFinish} className={`mt-6 ${btnSolid}`}>
            Go to my dashboard
          </button>
        </>
      )}

      {stage === 'failed' && (
        <>
          <AlertCircle size={40} className="mx-auto text-red-500" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy">
            Payment not completed
          </p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft">
            {failReason} No chama was created and you have not been charged for one.
          </p>
          <button type="button" onClick={onBack} className={`mt-6 ${btnSolid}`}>
            Try again
          </button>
        </>
      )}

      {stage === 'review' && (
        <>
          <Clock size={40} className="mx-auto text-amber-500" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy">
            Payment received, we are confirming it
          </p>
          <p className="mx-auto mt-1.5 max-w-[44ch] text-[0.86rem] leading-relaxed text-ink-soft">
            Your payment of <b className="text-navy">KSh {amount}</b> came through
            and needs a quick check before your chama is created. Please do not
            pay again. This usually takes a few minutes.
          </p>
          <p className="mx-auto mt-3 max-w-[44ch] text-[0.78rem] leading-relaxed text-ink-soft">
            Reference: <span className="font-mono text-navy">{reference}</span>
            <br />
            If your chama is not ready within a few hours, email{' '}
            <a
              href={`mailto:support@chametu.co.ke?subject=Chametu%20payment%20${reference}`}
              className="font-semibold text-forest hover:underline"
            >
              support@chametu.co.ke
            </a>{' '}
            with this reference.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/login" className={`${btnGhost} no-underline`}>
              Back to login
            </Link>
            <button type="button" onClick={onRetryCheck} className={btnSolid}>
              Check again
            </button>
          </div>
        </>
      )}

      {stage === 'timeout' && (
        <>
          <AlertCircle size={40} className="mx-auto text-amber-500" />
          <p className="mt-4 font-display text-[1.05rem] font-semibold text-navy">
            Still waiting for M-Pesa
          </p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.86rem] leading-relaxed text-ink-soft">
            We haven't received confirmation yet. If you already entered your PIN,
            check again in a moment.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" onClick={onBack} className={btnGhost}>
              Start over
            </button>
            <button type="button" onClick={onRetryCheck} className={btnSolid}>
              Check again
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[0.8rem] font-semibold text-navy">
        {label}
      </label>
      {children}
    </div>
  )
}

function IconInput({ icon, className = '', ...props }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
      <span className="shrink-0 text-ink-soft">{icon}</span>
      <input
        {...props}
        className={`min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-navy outline-none placeholder:text-ink-soft/70 ${className}`}
      />
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