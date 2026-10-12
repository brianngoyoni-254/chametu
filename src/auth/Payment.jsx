import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sun, Moon, Lock, ArrowLeft, CreditCard, Smartphone, ShieldCheck,
  Check, Users, Loader2, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../context/ChamaContext'
import { useTier } from '../context/TierContext'
import { TIERS } from '../lib/tiers'
import logo from '../assets/logos.png'

const PENDING_KEY = 'chametu_pending_signup'

function readPending() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clearPending() {
  try { sessionStorage.removeItem(PENDING_KEY) } catch {}
}

function formatCard(v) {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(v) {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function isValidPhone(v) {
  return /^0[17]\d{8}$/.test(v.replace(/\s/g, ''))
}

export default function Payment() {
  const navigate = useNavigate()
  const { createChamaForUser } = useChama()
  const { setBaseTier, startTrial } = useTier()

  const [pending] = useState(readPending)
  const [method, setMethod] = useState('card') // 'card' | 'mpesa'
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Card fields
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState(pending?.name || '')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  // M-Pesa field
  const [mpesaPhone, setMpesaPhone] = useState(pending?.phone || '')

  // Guard — no pending signup, bounce back to /register
  useEffect(() => {
    if (!pending) {
      toast.error('Session expired. Please start again.')
      navigate('/register', { replace: true })
    }
  }, [pending, navigate])

  if (!pending) return null

  const tier = TIERS[pending.tier]
  const price = tier?.price ?? 0

  /* ------------------------------------------------------------------ */
  /* Payment submit                                                      */
  /*                                                                     */
  /* In this demo we simulate the gateway. When you wire a real one:    */
  /*   1. POST /api/payments/initialize { email, amount, tier } → { authorization_url } */
  /*   2. window.location.href = authorization_url                       */
  /*   3. On return, verify on backend, then run finishSignup()          */
  /* ------------------------------------------------------------------ */
  const pay = async (e) => {
    e.preventDefault()
    setError('')

    if (method === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) return setError('Enter a valid card number.')
      if (!cardName.trim()) return setError('Enter the name on the card.')
      if (cardExpiry.length !== 5) return setError('Enter the expiry (MM/YY).')
      if (cardCvc.length < 3) return setError('Enter the CVC.')
    } else {
      if (!isValidPhone(mpesaPhone)) return setError('Enter a valid Kenyan phone number.')
    }

    setBusy(true)
    try {
      // ---------- Simulated gateway call ----------
      // Real: await fetch('/api/payments/initialize', { ... })
      await new Promise((resolve) => setTimeout(resolve, 1800))

      // ---------- Success ----------
      setDone(true)
      toast.success('Payment received. Welcome to Chametu!')

      // Give the success animation a beat, then finish
      setTimeout(() => finishSignup(), 900)
    } catch (err) {
      setError(err?.message || 'Payment failed. Try a different method.')
      setBusy(false)
    }
  }

  const finishSignup = () => {
    createChamaForUser({
      name: pending.name,
      email: pending.email,
      chamaName: pending.chamaName,
      baseTier: pending.tier,
    })
    setBaseTier(pending.tier)
    startTrial() // 14-day Gold trial on top of the chosen base tier
    clearPending()
    navigate('/dashboard', { replace: true })
  }

  const cancel = () => {
    // Keep the pending payload so they can come back and retry
    navigate('/register')
  }

  /* ------------------------------------------------------------------ */

  return (
    <div className="grid grid-cols-1 min-h-screen bg-paper hero:grid-cols-[minmax(340px,5fr)_7fr]">
      {/* Left panel — order summary */}
      <aside className="relative bg-navy text-white p-7 hero:p-11 flex flex-col gap-4 hero:gap-7 hero:sticky hero:top-0 hero:h-screen hero:overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(600px 400px at 0 0, rgba(16,185,129,0.35), transparent), linear-gradient(160deg, #0B1F33, #0A3D46)',
          }}
        />

        <Link to="/" className="relative flex items-center gap-2.5 text-white no-underline">
          <img src={logo} alt="Chametu" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-display font-bold text-[1.15rem]">Chametu</span>
        </Link>

        <h2 className="relative font-display font-bold text-[1.4rem] hero:text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.15] tracking-tight max-w-[15ch]">
          One last step to <em className="not-italic text-gold">start your chama</em>
        </h2>

        <p className="relative text-white/75 max-w-[38ch] leading-relaxed hidden hero:block">
          You won't be charged now. Your first 14 days are free, the plan below is what kicks in
          after the trial.
        </p>

        {/* Order summary card */}
        <div className="relative mt-auto hidden hero:block border border-white/20 bg-white/[0.08] backdrop-blur rounded-[20px] p-5">
          <div className="text-[0.72rem] tracking-widest uppercase text-white/60">
            Your order
          </div>

          <div className="flex items-center gap-2 mt-3 text-[0.95rem]">
            <span className="font-display font-bold text-white text-[1.1rem]">
              {pending.tier} plan
            </span>
            {pending.tier === 'Gold' && (
              <Sparkles size={14} strokeWidth={2.4} className="text-gold" />
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1 text-[0.8rem] text-white/70">
            <Users size={12} strokeWidth={2} />
            Up to {tier?.maxMembers ?? 0} members
          </div>

          <div className="h-px bg-white/15 my-4" />

          <div className="flex justify-between items-baseline">
            <span className="text-[0.86rem] text-white/70">Monthly</span>
            <span className="font-mono font-semibold">KSh {price.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-[0.86rem] text-white/70">Trial</span>
            <span className="font-mono font-semibold text-gold">14 days free</span>
          </div>

          <div className="h-px bg-white/15 my-4" />

          <div className="flex justify-between items-baseline">
            <span className="font-semibold">Due today</span>
            <span className="font-mono font-bold text-[1.3rem] text-gold">KSh 0</span>
          </div>

          <p className="text-[0.75rem] text-white/60 mt-4 leading-relaxed">
            Your card is stored for the trial end. You can cancel any time before day 14.
          </p>
        </div>
      </aside>

      {/* Right panel — payment form */}
      <main className="flex justify-center items-start hero:items-center px-6 py-10">
        <div className="w-full max-w-[520px]">
          <div className="flex justify-between items-center mb-8 text-[0.88rem] text-ink-soft">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 text-forest font-semibold hover:underline"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to signup
            </button>
            <ThemeToggle />
          </div>

          {done ? (
            <SuccessBlock />
          ) : (
            <>
              <h1 className="font-display font-bold text-[2rem] tracking-tight text-navy">
                Complete payment
              </h1>
              <p className="text-ink-soft mt-2 mb-6 leading-relaxed">
                Choose how you'd like to pay. You won't be charged until your trial ends on day 14.
              </p>

              {/* Method tabs */}
              <div className="relative grid grid-cols-2 bg-white border border-line rounded-2xl p-1.5 mb-5">
                <span
                  className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-emerald/15 rounded-xl transition-transform ${
                    method === 'mpesa' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 border-0 bg-transparent py-3 rounded-xl font-semibold text-[0.9rem] transition ${
                    method === 'card' ? 'text-forest' : 'text-ink-soft'
                  }`}
                >
                  <CreditCard size={15} strokeWidth={2} />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('mpesa')}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 border-0 bg-transparent py-3 rounded-xl font-semibold text-[0.9rem] transition ${
                    method === 'mpesa' ? 'text-forest' : 'text-ink-soft'
                  }`}
                >
                  <Smartphone size={15} strokeWidth={2} />
                  M-Pesa
                </button>
              </div>

              <form onSubmit={pay}>
                {method === 'card' ? (
                  <>
                    <Field label="Card number">
                      <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                        <CreditCard size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                        <input
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCard(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          autoComplete="cc-number"
                          className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy font-mono placeholder:text-ink-soft/70"
                        />
                      </div>
                    </Field>

                    <Field label="Name on card">
                      <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                        <input
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Jane Wanjiku"
                          autoComplete="cc-name"
                          className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70"
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3.5">
                      <Field label="Expiry">
                        <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                          <input
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy font-mono placeholder:text-ink-soft/70"
                          />
                        </div>
                      </Field>
                      <Field label="CVC">
                        <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                          <input
                            inputMode="numeric"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            autoComplete="cc-csc"
                            className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy font-mono placeholder:text-ink-soft/70"
                          />
                        </div>
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="M-Pesa phone number">
                      <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                        <Smartphone size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                        <input
                          inputMode="tel"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="0712345678"
                          autoComplete="tel"
                          className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy font-mono placeholder:text-ink-soft/70"
                        />
                      </div>
                    </Field>

                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald/10 text-navy text-[0.84rem] leading-relaxed">
                      <Smartphone size={16} strokeWidth={2} className="text-forest mt-0.5 shrink-0" />
                      <span>
                        We'll send an STK Push to <b>{mpesaPhone || 'your phone'}</b>. Enter your
                        M-Pesa PIN on the phone to confirm. You won't be charged today.
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 text-[0.78rem] text-ink-soft mt-4">
                  <Lock size={13} strokeWidth={2} className="shrink-0" />
                  Secured by 256-bit encryption. We never store your card details.
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full border-0 rounded-2xl py-4 mt-4 font-display font-bold text-base text-white bg-gradient-to-br from-forest to-emerald cursor-pointer shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none inline-flex items-center justify-center gap-2"
                >
                  {busy ? (
                    <>
                      <Loader2 size={17} strokeWidth={2.5} className="animate-spin" />
                      Processing…
                    </>
                  ) : method === 'card' ? (
                    `Start free trial · add card`
                  ) : (
                    `Send STK Push to ${mpesaPhone || 'phone'}`
                  )}
                </button>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 text-center text-[0.84rem] text-red-600 min-h-[1.2em]"
                  >
                    {error}
                  </div>
                )}
              </form>

              <div className="flex items-start gap-2 mt-6 px-1">
                <ShieldCheck size={15} strokeWidth={2} className="text-forest shrink-0 mt-0.5" />
                <p className="text-[0.76rem] text-ink-soft leading-relaxed">
                  <b className="text-navy">Demo:</b> no real charge. When you connect Paystack,
                  IntaSend or Daraja, this page will redirect to their hosted checkout and return
                  to a verification step on your backend.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

/* ---------- pieces ---------- */

function SuccessBlock() {
  return (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald/15 text-forest grid place-items-center mb-5 animate-pulse">
        <Check size={28} strokeWidth={2.6} />
      </div>
      <h2 className="font-display font-bold text-[1.6rem] text-navy">
        You're all set
      </h2>
      <p className="text-ink-soft mt-2 leading-relaxed">
        Card saved. Setting up your chama dashboard…
      </p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[0.8rem] font-semibold text-navy mb-1.5">{label}</label>
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
    try { localStorage.setItem('chametu_theme', next) } catch {}
    setDark(!dark)
  }
  return (
    <button
      type="button"
      onClick={toggle}
      className="border border-line bg-white text-navy rounded-xl px-2.5 py-1.5 hover:border-forest transition"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}