import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sun, Moon, Lock, ArrowLeft, CreditCard, Smartphone, ShieldCheck,
  Check, Users, Loader2, Sparkles,
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
  const { register } = useAuth()
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

    // 2. Register the account so the login page can find it later
    register({
      name: pending.name,
      email: pending.email,
      password: pending.password,
      role: 'Chairman',
      portal: 'admin',
      chamaCode: null,
      allowDuplicate: true,
    }).catch((err) => {
      console.warn('register after payment failed:', err)
    })

    setBaseTier(pending.tier)
    startTrial()
    clearPending()
    navigate('/dashboard', { replace: true })
  }

  const cancel = () => {
    navigate('/register')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper hero:grid-cols-[minmax(340px,5fr)_7fr]">
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

        <h2 className="relative max-w-[15ch] font-display text-[1.4rem] font-bold leading-[1.15] tracking-tight hero:text-[clamp(1.7rem,2.6vw,2.4rem)]">
          One last step to <em className="not-italic text-gold">start your chama</em>
        </h2>

        <p className="relative hidden max-w-[38ch] leading-relaxed text-white/75 hero:block">
          You won't be charged now. Your first 14 days are free, the plan below is what kicks in
          after the trial.
        </p>

        <div className="relative mt-auto hidden rounded-[20px] border border-white/20 bg-white/[0.08] p-5 backdrop-blur hero:block">
          <div className="text-[0.72rem] uppercase tracking-widest text-white/60">Your order</div>
          <div className="mt-3 flex items-center gap-2 text-[0.95rem]">
            <span className="font-display text-[1.1rem] font-bold text-white">
              {pending.tier} plan
            </span>
            {pending.tier === 'Gold' && (
              <Sparkles size={14} strokeWidth={2.4} className="text-gold" />
            )}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[0.8rem] text-white/70">
            <Users size={12} strokeWidth={2} />
            Up to {tier?.maxMembers ?? 0} members
          </div>
          <div className="my-4 h-px bg-white/15" />
          <div className="flex items-baseline justify-between">
            <span className="text-[0.86rem] text-white/70">Monthly</span>
            <span className="font-mono font-semibold">KSh {price.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-[0.86rem] text-white/70">Trial</span>
            <span className="font-mono font-semibold text-gold">14 days free</span>
          </div>
          <div className="my-4 h-px bg-white/15" />
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">Due today</span>
            <span className="font-mono text-[1.3rem] font-bold text-gold">KSh 0</span>
          </div>
          <p className="mt-4 text-[0.75rem] leading-relaxed text-white/60">
            Your card is stored for the trial end. You can cancel any time before day 14.
          </p>
        </div>
      </aside>

      <main className="flex justify-center px-6 py-10 hero:items-center">
        <div className="w-full max-w-[520px]">
          <div className="mb-8 flex items-center justify-between text-[0.88rem] text-ink-soft">
            <button
              type="button"
              onClick={cancel}
              className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"
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
              <h1 className="font-display text-[2rem] font-bold tracking-tight text-navy">
                Complete payment
              </h1>
              <p className="mb-6 mt-2 leading-relaxed text-ink-soft">
                Choose how you'd like to pay. You won't be charged until your trial ends on day 14.
              </p>

              <div className="relative mb-5 grid grid-cols-2 rounded-2xl border border-line bg-white p-1.5">
                <span
                  className={`absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-xl bg-emerald/15 transition-transform ${
                    method === 'mpesa' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
                  }`}
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-xl border-0 bg-transparent py-3 text-[0.9rem] font-semibold transition ${
                    method === 'card' ? 'text-forest' : 'text-ink-soft'
                  }`}
                >
                  <CreditCard size={15} strokeWidth={2} />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('mpesa')}
                  className={`relative z-10 inline-flex items-center justify-center gap-2 rounded-xl border-0 bg-transparent py-3 text-[0.9rem] font-semibold transition ${
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
                      <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                        <CreditCard size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" />
                        <input
                          inputMode="numeric"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(formatCard(e.target.value))}
                          placeholder="4242 4242 4242 4242"
                          autoComplete="cc-number"
                          className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-sm text-navy outline-none placeholder:text-ink-soft/70"
                        />
                      </div>
                    </Field>

                    <Field label="Name on card">
                      <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                        <input
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder="Jane Wanjiku"
                          autoComplete="cc-name"
                          className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-navy outline-none placeholder:text-ink-soft/70"
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3.5">
                      <Field label="Expiry">
                        <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                          <input
                            inputMode="numeric"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                            placeholder="MM/YY"
                            autoComplete="cc-exp"
                            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-sm text-navy outline-none placeholder:text-ink-soft/70"
                          />
                        </div>
                      </Field>
                      <Field label="CVC">
                        <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                          <input
                            inputMode="numeric"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            autoComplete="cc-csc"
                            className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-sm text-navy outline-none placeholder:text-ink-soft/70"
                          />
                        </div>
                      </Field>
                    </div>
                  </>
                ) : (
                  <>
                    <Field label="M-Pesa phone number">
                      <div className="flex items-center gap-2.5 rounded-xl border-[1.5px] border-line bg-[#F8FAFC] px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                        <Smartphone size={18} strokeWidth={1.8} className="shrink-0 text-ink-soft" />
                        <input
                          inputMode="tel"
                          value={mpesaPhone}
                          onChange={(e) => setMpesaPhone(e.target.value)}
                          placeholder="0712345678"
                          autoComplete="tel"
                          className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-sm text-navy outline-none placeholder:text-ink-soft/70"
                        />
                      </div>
                    </Field>

                    <div className="flex items-start gap-2.5 rounded-xl bg-emerald/10 px-4 py-3 text-[0.84rem] leading-relaxed text-navy">
                      <Smartphone size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-forest" />
                      <span>
                        We'll send an STK Push to <b>{mpesaPhone || 'your phone'}</b>. Enter your
                        M-Pesa PIN on the phone to confirm. You won't be charged today.
                      </span>
                    </div>
                  </>
                )}

                <div className="mt-4 flex items-center gap-2 text-[0.78rem] text-ink-soft">
                  <Lock size={13} strokeWidth={2} className="shrink-0" />
                  Secured by 256-bit encryption. We never store your card details.
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-gradient-to-br from-forest to-emerald py-4 font-display text-base font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
                >
                  {busy ? (
                    <>
                      <Loader2 size={17} strokeWidth={2.5} className="animate-spin" />
                      Processing…
                    </>
                  ) : method === 'card' ? (
                    'Start free trial · add card'
                  ) : (
                    `Send STK Push to ${mpesaPhone || 'phone'}`
                  )}
                </button>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 min-h-[1.2em] text-center text-[0.84rem] text-red-600"
                  >
                    {error}
                  </div>
                )}
              </form>

              <div className="mt-6 flex items-start gap-2 px-1">
                <ShieldCheck size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-forest" />
                <p className="text-[0.76rem] leading-relaxed text-ink-soft">
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

function SuccessBlock() {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-emerald/15 text-forest">
        <Check size={28} strokeWidth={2.6} />
      </div>
      <h2 className="font-display text-[1.6rem] font-bold text-navy">You're all set</h2>
      <p className="mt-2 leading-relaxed text-ink-soft">
        Card saved. Setting up your chama dashboard…
      </p>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[0.8rem] font-semibold text-navy">{label}</label>
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