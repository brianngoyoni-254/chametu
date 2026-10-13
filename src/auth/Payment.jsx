import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sun, Moon, Lock, ArrowLeft, CreditCard, Smartphone, ShieldCheck,
  Check, Users, Loader2, Sparkles, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
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
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {}
}

function formatCard(v) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
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
  const { register, findAccount } = useAuth()
  const { createChamaForUser } = useChama()
  const { setBaseTier, startTrial } = useTier()

  const [pending] = useState(readPending)
  const [method, setMethod] = useState('card')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState(pending?.name || '')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  const [mpesaPhone, setMpesaPhone] = useState(pending?.phone || '')

  useEffect(() => {
    if (!pending) {
      toast.error('Session expired. Please start again.')
      navigate('/register', { replace: true })
    }
  }, [pending, navigate])

  if (!pending) return null

  const tier = TIERS[pending.tier]
  const price = tier?.price ?? 0

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
      await new Promise((resolve) => setTimeout(resolve, 1800))
      setDone(true)
      toast.success('Payment received. Welcome to Chametu!')
      setTimeout(() => finishSignup(), 900)
    } catch (err) {
      setError(err?.message || 'Payment failed. Try a different method.')
      setBusy(false)
    }
  }

  const finishSignup = () => {
    // 1. Create the chama in the chama store
    createChamaForUser({
      name: pending.name,
      email: pending.email,
      chamaName: pending.chamaName,
      baseTier: pending.tier,
    })

    // 2. Register the chairman account. If it already exists (e.g. user
    //    re-ran the flow with the same email), just log them in instead.
    const existing = findAccount(pending.email)
    if (existing) {
      // They already have an account — proceed without re-registering.
      // The chama store is already updated above.
    } else {
      register({
        name: pending.name,
        email: pending.email,
        password: pending.password,
        role: 'Chairman',
        chamaCode: null,
        chamaName: pending.chamaName,
      }).catch((err) => {
        console.warn('register after payment failed:', err)
      })
    }

    setBaseTier(pending.tier)
    startTrial()
    clearPending()
    navigate('/dashboard', { replace: true })
  }

  const cancel = () => {
    navigate('/register')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F6F8FA] lg:grid-cols-[1fr_1.05fr]">
      {/* ---------- LEFT: Order summary ---------- */}
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

        <div className="relative mt-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-gold backdrop-blur">
            <Sparkles size={11} />
            One last step
          </div>

          <h1 className="mt-6 max-w-[520px] font-display text-[2.4rem] font-bold leading-[1.08] tracking-tight">
            Start your chama with{' '}
            <span className="bg-gradient-to-r from-emerald to-[#7CF0C0] bg-clip-text text-transparent">
              14 days free.
            </span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-white/70">
            No charge today. Your chosen plan kicks in after the trial and you can
            cancel any time before day 14.
          </p>
        </div>

        {/* Order summary card */}
        <div className="relative mt-10 max-w-[420px] rounded-3xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur">
          <div className="text-[0.62rem] font-bold uppercase tracking-widest text-white/50">
            Your order
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="font-display text-[1.15rem] font-bold text-white">
              {pending.tier} plan
            </span>
            {pending.tier === 'Gold' && (
              <Sparkles size={14} strokeWidth={2.4} className="text-gold" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[0.78rem] text-white/70">
            <Users size={12} strokeWidth={2} />
            Up to {tier?.maxMembers ?? 0} members
          </div>

          <div className="my-4 h-px bg-white/15" />

          <div className="flex items-baseline justify-between">
            <span className="text-[0.84rem] text-white/70">Monthly</span>
            <span className="font-mono font-semibold">
              KSh {price.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[0.84rem] text-white/70">Trial</span>
            <span className="font-mono font-semibold text-gold">14 days free</span>
          </div>

          <div className="my-4 h-px bg-white/15" />

          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Due today</span>
            <span className="font-mono text-[1.3rem] font-bold text-gold">
              KSh 0
            </span>
          </div>

          <p className="mt-4 text-[0.72rem] leading-relaxed text-white/60">
            Your card is stored for the trial end. You can cancel any time before day 14.
          </p>
        </div>

        <div className="relative mt-auto flex items-center gap-2 pt-10 text-[0.72rem] text-white/40">
          <ShieldCheck size={13} />
          <span>256-bit encrypted · Card details never stored</span>
        </div>
      </aside>

      {/* ---------- RIGHT: Payment form ---------- */}
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 flex items-center justify-between">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest hover:underline"
            >
              <ArrowLeft size={13} strokeWidth={2.2} />
              Back to signup
            </button>
            <ThemeToggle />
          </div>

          {done ? (
            <SuccessBlock />
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/[0.08] px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-widest text-forest">
                <Lock size={11} />
                Secure checkout
              </div>

              <h1 className="mt-4 font-display text-[1.9rem] font-bold leading-tight tracking-tight text-navy">
                Complete payment
              </h1>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
                Choose how you'd like to pay. You won't be charged until your trial
                ends on day 14.
              </p>

              {/* Method tabs */}
              <div className="relative mt-6 mb-5 grid grid-cols-2 rounded-2xl border border-line bg-white p-1">
                <span
                  className={`absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-xl bg-emerald/15 transition-transform ${
                    method === 'mpesa' ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.86rem] font-semibold transition ${
                    method === 'card' ? 'text-forest' : 'text-ink-soft'
                  }`}
                >
                  <CreditCard size={14} strokeWidth={2} />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('mpesa')}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[0.86rem] font-semibold transition ${
                    method === 'mpesa' ? 'text-forest' : 'text-ink-soft'
                  }`}
                >
                  <Smartphone size={14} strokeWidth={2} />
                  M-Pesa
                </button>
              </div>

              <form onSubmit={pay} className="space-y-3.5">
                {method === 'card' ? (
                  <>
                    <Field label="Card number">
                      <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                        <CreditCard
                          size={16}
                          strokeWidth={1.9}
                          className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                        />
                        <input
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCard(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          autoComplete="cc-number"
                          className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                        />
                      </div>
                    </Field>

                    <Field label="Name on card">
                      <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                        <input
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Jane Wanjiku"
                          autoComplete="cc-name"
                          className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3.5">
                      <Field label="Expiry">
                        <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                          <input
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                          />
                        </div>
                      </Field>
                      <Field label="CVC">
                        <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                          <input
                            inputMode="numeric"
                            value={cardCvc}
                            onChange={(e) =>
                              setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))
                            }
                            placeholder="123"
                            autoComplete="cc-csc"
                            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                          />
                        </div>
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="M-Pesa phone number">
                      <div className="group flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10">
                        <Smartphone
                          size={16}
                          strokeWidth={1.9}
                          className="shrink-0 text-ink-soft transition group-focus-within:text-forest"
                        />
                        <input
                          inputMode="tel"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="0712345678"
                          autoComplete="tel"
                          className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60"
                        />
                      </div>
                    </Field>

                    <div className="flex items-start gap-2.5 rounded-2xl bg-emerald/[0.07] px-4 py-3 text-[0.82rem] leading-relaxed text-navy ring-1 ring-emerald/10">
                      <Smartphone
                        size={15}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-forest"
                      />
                      <span>
                        We'll send an STK Push to <b>{mpesaPhone || 'your phone'}</b>.
                        Enter your M-Pesa PIN on the phone to confirm. You won't be
                        charged today.
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 pt-1 text-[0.76rem] text-ink-soft">
                  <Lock size={12} strokeWidth={2} className="shrink-0" />
                  Secured by 256-bit encryption. We never store your card details.
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-[0.82rem] leading-relaxed text-red-700"
                  >
                    <AlertCircle size={14} className="mt-0.5 flex-none" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-gradient-to-br from-forest to-emerald py-4 font-display text-[0.95rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                      Processing…
                    </>
                  ) : method === 'card' ? (
                    'Start free trial · add card'
                  ) : (
                    `Send STK Push to ${mpesaPhone || 'phone'}`
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2 px-1">
                <ShieldCheck
                  size={14}
                  strokeWidth={2}
                  className="mt-0.5 shrink-0 text-forest"
                />
                <p className="text-[0.74rem] leading-relaxed text-ink-soft">
                  <b className="text-navy">Demo:</b> no real charge. When you connect
                  Paystack, IntaSend or Daraja, this page will redirect to their
                  hosted checkout and return to a verification step on your backend.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

/* ---------- small components ---------- */

function SuccessBlock() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-emerald/15 text-forest ring-1 ring-emerald/20">
        <Check size={28} strokeWidth={2.6} />
      </div>
      <h2 className="font-display text-[1.6rem] font-bold text-navy">
        You're all set
      </h2>
      <p className="mt-2 leading-relaxed text-ink-soft">
        Card saved. Setting up your chama dashboard…
      </p>
    </div>
  )
}

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
      className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-white text-navy transition hover:border-forest"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}