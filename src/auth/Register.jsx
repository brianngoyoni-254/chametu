import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Sun, Moon, Eye, EyeOff, Check, Mail, Lock, User,
  Building2, Phone, Hash, Gift, Smartphone, Vote, Star, Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useChama } from '../context/ChamaContext'
import { useTier } from '../context/TierContext'
import { TIERS, ORDER } from '../lib/tiers'
import logo from '../assets/logos.png'

const PLAN_META = {
  Starter:  { features: ['Core chama management for small groups'] },
  Growth:   { features: ['Everything in Starter', 'Investments and financial reports'], popular: true },
  Business: { features: ['Everything in Growth', 'Governance, voting and role management'] },
  Gold:     { features: ['Everything in Business', 'Built for large chamas and SACCOs'], star: true },
}

const BENEFITS = [
  { Icon: Smartphone, text: 'Members pay by Paybill or STK Push and the dashboard updates for everyone' },
  { Icon: Vote,       text: 'Loan requests approved by member vote, with clear repayment tracking' },
  { Icon: Star,       text: 'Earn Chametu Points for paying on time and redeem digital perks' },
]

export default function Register() {
  const { register } = useAuth()
  const { joinChamaWithUser } = useChama()
  const { setBaseTier, startTrial } = useTier()
  const navigate = useNavigate()
  const location = useLocation()

  const initialMode = new URLSearchParams(location.search).get('mode') === 'join' ? 'join' : 'create'

  const [mode, setMode] = useState(initialMode) // 'create' | 'join'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [chamaName, setChamaName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [selectedTier, setSelectedTier] = useState('Growth')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setError('')
  }, [mode])

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

  const isValidEmail = (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
  const isValidPhone = (v) => /^0[17]\d{8}$/.test(v.replace(/\s/g, ''))
  const isValidCode = (v) => /^CHM-[A-Z0-9]{4,}$/.test(v.trim().toUpperCase())

  const submit = async (e) => {
    e?.preventDefault()
    setError('')

    if (name.trim().length < 2) return setError('Enter your full name.')
    if (!isValidEmail(email)) return setError('Enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')

    if (mode === 'join') {
      if (!isValidCode(code)) return setError('Enter the code, e.g. CHM-AB12CD.')
    } else {
      if (chamaName.trim().length < 2) return setError('Enter your chama name.')
      if (!isValidPhone(phone)) return setError('Enter a valid Kenyan phone number.')
    }

    // ---- Join-with-code does not pay — create the account directly ----
    if (mode === 'join') {
      setBusy(true)
      try {
        await register({ name, email, password })
        joinChamaWithUser({ name, email, code: code.trim().toUpperCase() })
        toast.success(`Welcome to the chama, ${name.split(' ')[0]}!`)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        setError(err?.message || 'Could not join the chama.')
      } finally {
        setBusy(false)
      }
      return
    }

    // ---- Create-a-chama → hand off to /payment ----
    // The pending signup is stashed in sessionStorage so the payment page
    // can complete the flow (create chama, set base tier, start trial)
    // once the user comes back from checkout.
    try {
      sessionStorage.setItem(
        'chametu_pending_signup',
        JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          chamaName: chamaName.trim(),
          phone: phone.replace(/\s/g, ''),
          tier: selectedTier,
        })
      )
    } catch {
      return setError('Your browser blocked storage. Enable it to continue.')
    }

    navigate('/payment')
  }

  const selectedPlan = TIERS[selectedTier]

  return (
    <div className="grid grid-cols-1 min-h-screen bg-paper hero:grid-cols-[minmax(340px,5fr)_7fr]">
      {/* Left panel */}
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
          Run your chama with <em className="not-italic text-gold">total clarity</em>
        </h2>

        <p className="relative text-white/75 max-w-[38ch] leading-relaxed hidden hero:block">
          Contributions, loans and payouts in one place, matched automatically from M-Pesa.
        </p>

        <ul className="relative hidden hero:grid gap-3 m-0 p-0 list-none">
          {BENEFITS.map(({ Icon, text }) => (
            <li key={text} className="flex gap-3 items-start text-[0.92rem] text-white/90">
              <span className="shrink-0 w-7 h-7 rounded-lg bg-white/[0.12] grid place-items-center">
                <Icon size={14} strokeWidth={2} />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div className="relative mt-auto hidden hero:flex items-start gap-2.5 border border-white/20 bg-white/[0.07] rounded-2xl p-4 text-[0.88rem] leading-relaxed">
          <Gift size={16} strokeWidth={2} className="text-gold shrink-0 mt-0.5" />
          <span>
            <b className="text-gold">14 days free</b> with every plan. You get Gold features during
            the trial, and your chama's money is never touched by Chametu.
          </span>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[600px]">
          <div className="flex justify-between items-center mb-6 text-[0.88rem] text-ink-soft">
            <span>
              Already have an account?{' '}
              <Link to="/login" className="text-forest font-semibold">
                Log in
              </Link>
            </span>
            <ThemeToggle />
          </div>

          <h1 className="font-display font-bold text-[2rem] tracking-tight text-navy">
            Create account
          </h1>
          <p className="text-ink-soft mt-2 mb-5 leading-relaxed">
            {mode === 'create'
              ? 'Pick a plan and start your chama. First 14 days are on us (Gold features).'
              : 'Enter the code from your chairman to join your chama.'}
          </p>

          {/* Mode toggle */}
          <div className="relative grid grid-cols-2 bg-white border border-line rounded-2xl p-1.5 mb-5">
            <span
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-emerald/15 rounded-xl transition-transform ${
                mode === 'join' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
              }`}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`relative z-10 border-0 bg-transparent py-3 rounded-xl font-semibold text-[0.92rem] transition ${
                mode === 'create' ? 'text-forest' : 'text-ink-soft'
              }`}
            >
              Create a chama
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`relative z-10 border-0 bg-transparent py-3 rounded-xl font-semibold text-[0.92rem] transition ${
                mode === 'join' ? 'text-forest' : 'text-ink-soft'
              }`}
            >
              Join with code
            </button>
          </div>

          <form onSubmit={submit}>
            <Field label="Full name">
              <IconInput
                icon={<User size={18} strokeWidth={1.8} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anne Wanjiku"
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
              <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Lock size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-ink-soft hover:text-navy transition p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
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

            {mode === 'create' ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <Field label="Chama name">
                    <IconInput
                      icon={<Building2 size={18} strokeWidth={1.8} />}
                      value={chamaName}
                      onChange={(e) => setChamaName(e.target.value)}
                      placeholder="e.g. Umoja Investment Chama"
                    />
                  </Field>
                  <Field label="M-Pesa phone">
                    <IconInput
                      inputMode="tel"
                      icon={<Phone size={18} strokeWidth={1.8} />}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712345678"
                    />
                  </Field>
                </div>

                <div className="flex justify-between items-center mt-7 mb-3.5">
                  <b className="text-[0.72rem] tracking-[0.14em] uppercase text-ink-soft font-bold">
                    Choose your plan
                  </b>
                  <span className="text-[0.76rem] text-ink-soft">
                    Change anytime · 14 days free
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ORDER.map((tierName) => (
                    <PlanCard
                      key={tierName}
                      tierName={tierName}
                      tier={TIERS[tierName]}
                      meta={PLAN_META[tierName]}
                      selected={selectedTier === tierName}
                      onSelect={() => setSelectedTier(tierName)}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 mb-4 px-4 py-3.5 rounded-2xl bg-white border border-dashed border-line text-[0.86rem]">
                  <div>
                    <b>Due today</b>
                    <br />
                    <span className="text-ink-soft">
                      14-day free trial, then KSh {selectedPlan.price.toLocaleString()}/mo
                    </span>
                  </div>
                  <b className="font-mono text-[1.25rem] text-navy">KSh 0</b>
                </div>
              </>
            ) : (
              <Field label="Chama code">
                <IconInput
                  icon={<Hash size={18} strokeWidth={1.8} />}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="CHM-XXXXXX"
                  className="font-mono"
                />
                <p className="text-[0.76rem] text-ink-soft mt-2">
                  Ask your chairman for the code. Joining is free — your chama's plan covers you.
                </p>
              </Field>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full border-0 rounded-2xl py-4 mt-2 font-display font-bold text-base text-white bg-gradient-to-br from-forest to-emerald cursor-pointer shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none"
            >
              {busy
                ? 'Creating…'
                : mode === 'join'
                  ? 'Join chama'
                  : `Continue to payment · ${selectedTier}`}
            </button>

            {error && (
              <div
                role="alert"
                className="mt-4 text-center text-[0.84rem] text-red-600 min-h-[1.2em]"
              >
                {error}
              </div>
            )}

            <p className="text-[0.76rem] text-ink-soft text-center mt-3 leading-relaxed">
              By continuing you agree to the Terms and Privacy Policy. Chametu Points have no cash
              value.
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}

/* ---------- plan card ---------- */

function PlanCard({ tierName, tier, meta, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative text-left flex flex-col rounded-[18px] px-4.5 py-5 transition ${
        selected
          ? 'text-white border border-gold shadow-[0_0_0_1px_rgba(245,185,66,0.8),0_18px_40px_rgba(11,31,51,0.3)]'
          : 'bg-white border border-line hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(11,31,51,0.12)]'
      }`}
      style={
        selected
          ? { background: 'linear-gradient(155deg, #0B1F33, #0A3D46)' }
          : undefined
      }
    >
      {meta.popular && (
        <span className="absolute -top-2.5 left-4 bg-gradient-to-br from-gold to-[#E8A21F] text-[#2E2200] text-[0.6rem] font-bold tracking-widest px-2.5 py-1 rounded-full">
          MOST POPULAR
        </span>
      )}

      <span
        className={`absolute top-5 right-4 w-[18px] h-[18px] rounded-full border-[1.5px] grid place-items-center ${
          selected ? 'border-gold' : 'border-line'
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full bg-gold transition-transform ${
            selected ? 'scale-100' : 'scale-0'
          }`}
        />
      </span>

      <div
        className={`flex items-center gap-1.5 text-[0.7rem] tracking-[0.16em] uppercase font-semibold ${
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
        className={`font-display font-bold text-[1.65rem] tracking-tight mt-2.5 mb-0.5 ${
          selected ? 'text-white' : 'text-navy'
        }`}
      >
        KSh {tier.price.toLocaleString()}{' '}
        <small
          className={`font-medium text-[0.78rem] ${
            selected ? 'text-white/65' : 'text-ink-soft'
          }`}
        >
          / month
        </small>
      </div>

      <div
        className="h-px my-3.5"
        style={{
          background: selected
            ? 'linear-gradient(90deg, rgba(245,185,66,0.55), transparent)'
            : 'linear-gradient(90deg, #E3E9EF, transparent)',
        }}
      />

      <ul
        className={`list-none m-0 p-0 grid gap-2 text-[0.8rem] leading-snug ${
          selected ? 'text-white/90' : 'text-ink-soft'
        }`}
      >
        <li className="flex gap-2 items-start">
          <Check
            size={13}
            strokeWidth={2.6}
            className={`shrink-0 mt-0.5 ${selected ? 'text-gold' : 'text-forest'}`}
          />
          <span>Up to {tier.maxMembers} members</span>
        </li>
        {meta.features.map((f) => (
          <li key={f} className="flex gap-2 items-start">
            <Check
              size={13}
              strokeWidth={2.6}
              className={`shrink-0 mt-0.5 ${selected ? 'text-gold' : 'text-forest'}`}
            />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}

/* ---------- shared bits ---------- */

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-[0.8rem] font-semibold text-navy mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function IconInput({ icon, className = '', ...props }) {
  return (
    <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
      <span className="text-ink-soft shrink-0">{icon}</span>
      <input
        {...props}
        className={`flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70 ${className}`}
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
      className="border border-line bg-white text-navy rounded-xl px-2.5 py-1.5 hover:border-forest transition"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}