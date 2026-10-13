import { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Sun, Moon, Eye, EyeOff, Check, Mail, Lock, User,
  Building2, Phone, Hash, Gift, Smartphone, Vote, Star, Sparkles,
  Crown, Wallet, FileText, User as UserIcon, ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useChama } from '../context/ChamaContext'
import { useTier } from '../context/TierContext'
import { setMemberSession, getChama } from '../lib/chametuStorage'
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

const JOIN_ROLES = [
  { value: 'Treasurer', label: 'Treasurer', icon: Wallet,  tint: 'from-gold to-[#E8A21F]',  desc: 'Handles money & reconciliations' },
  { value: 'Secretary', label: 'Secretary', icon: FileText, tint: 'from-navy to-[#0A2A3E]',  desc: 'Minutes, records & notices' },
  { value: 'Member',    label: 'Member',    icon: UserIcon, tint: 'from-emerald to-[#0A7A5A]', desc: 'Full member account' },
]

function isValidEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) }
function isValidPhone(v) { return /^0[17]\d{8}$/.test(v.replace(/\s/g, '')) }
function isValidCode(v)  { return /^CHM-[A-Z0-9]{4,}$/.test((v || '').trim().toUpperCase()) }

export default function Register() {
  const { register } = useAuth()
  const { joinChamaWithUser } = useChama()
  const { setBaseTier, startTrial } = useTier()
  const navigate = useNavigate()
  const location = useLocation()

  const params = new URLSearchParams(location.search)
  const initialMode = params.get('mode') === 'join' ? 'join' : 'create'
  const initialRole = params.get('role') || 'Treasurer'

  const [mode, setMode] = useState(initialMode)
  const [joinRole, setJoinRole] = useState(initialRole)
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

  useEffect(() => { setError('') }, [mode])

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

  const submit = async (e) => {
    e?.preventDefault()
    setError('')

    if (name.trim().length < 2) return setError('Enter your full name.')
    if (!isValidEmail(email)) return setError('Enter a valid email address.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')

    /* ---------------- JOIN ---------------- */
    if (mode === 'join') {
      const trimmedCode = code.trim().toUpperCase()
      if (!isValidCode(trimmedCode)) return setError('Enter the chama code, e.g. CHM-AB12CD.')

      const existingChama = getChama()
      if (!existingChama || !existingChama.code) {
        return setError(
          'No chama exists on this device yet. Ask your chairman to create it first.'
        )
      }
      if (existingChama.code.toUpperCase() !== trimmedCode) {
        return setError("That chama code doesn't match any chama on this device.")
      }

      setBusy(true)
      try {
        await register({
          name,
          email,
          password,
          role: joinRole,
          chamaCode: trimmedCode,
        })

        // Add them to the chama's member list too
        try {
          joinChamaWithUser({ name, email, code: trimmedCode })
        } catch {}

        // If it's a member, wire the member-portal session
        if (joinRole === 'Member') {
          try {
            setMemberSession({
              id: 'm_' + Date.now(),
              name: name.trim(),
              email: email.trim().toLowerCase(),
              role: 'Member',
              chamaCode: trimmedCode,
              joinedAt: Date.now(),
            })
          } catch {}
          toast.success(`Welcome to ${existingChama.name}, ${name.split(' ')[0]}!`)
          navigate('/member', { replace: true })
          return
        }

        toast.success(`Welcome, ${joinRole} ${name.split(' ')[0]}!`)
        navigate('/dashboard', { replace: true })
      } catch (err) {
        setError(err?.message || 'Could not join the chama.')
      } finally {
        setBusy(false)
      }
      return
    }

    /* ---------------- CREATE ---------------- */
    if (chamaName.trim().length < 2) return setError('Enter your chama name.')
    if (!isValidPhone(phone)) return setError('Enter a valid Kenyan phone number.')

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

        <h2 className="relative max-w-[15ch] font-display text-[1.4rem] font-bold leading-[1.15] tracking-tight hero:text-[clamp(1.7rem,2.6vw,2.4rem)]">
          {mode === 'create' ? (
            <>Run your chama with <em className="not-italic text-gold">total clarity</em></>
          ) : (
            <>Join your chama in <em className="not-italic text-gold">under a minute</em></>
          )}
        </h2>

        <p className="relative hidden max-w-[38ch] leading-relaxed text-white/75 hero:block">
          {mode === 'create'
            ? 'Contributions, loans and payouts in one place, matched automatically from M-Pesa.'
            : 'Enter the code your chairman shared and pick your role.'}
        </p>

        {mode === 'create' && (
          <ul className="relative m-0 hidden list-none gap-3 p-0 hero:grid">
            {BENEFITS.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[0.92rem] text-white/90">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/[0.12]">
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        )}

        {mode === 'join' && (
          <div className="relative hidden rounded-2xl border border-white/20 bg-white/[0.08] p-5 backdrop-blur hero:block">
            <div className="text-[0.68rem] uppercase tracking-widest text-white/60">
              Joining as
            </div>
            <div className="mt-2 font-display text-xl font-bold text-white">{joinRole}</div>
            <p className="mt-2 text-[0.82rem] leading-relaxed text-white/70">
              You'll get access to the right parts of your chama as soon as you sign in.
            </p>
          </div>
        )}

        <div className="relative mt-auto hidden items-start gap-2.5 rounded-2xl border border-white/20 bg-white/[0.07] p-4 text-[0.88rem] leading-relaxed hero:flex">
          <Gift size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-gold" />
          <span>
            <b className="text-gold">14 days free</b> with every plan. You get Gold features during
            the trial.
          </span>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex justify-center px-6 py-10">
        <div className="w-full max-w-[600px]">
          <div className="mb-6 flex items-center justify-between text-[0.88rem] text-ink-soft">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-forest hover:underline"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to log in
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="font-display text-[2rem] font-bold tracking-tight text-navy">
            {mode === 'create' ? 'Create your chama' : `Join as ${joinRole}`}
          </h1>
          <p className="mb-5 mt-2 leading-relaxed text-ink-soft">
            {mode === 'create'
              ? 'Pick a plan and start your chama. First 14 days are on us (Gold features).'
              : 'Enter your details and the chama code from your chairman.'}
          </p>

          {/* Mode toggle */}
          <div className="relative mb-5 grid grid-cols-2 rounded-2xl border border-line bg-white p-1.5">
            <span
              className={`absolute bottom-1.5 top-1.5 w-[calc(50%-6px)] rounded-xl bg-emerald/15 transition-transform ${
                mode === 'join' ? 'translate-x-[calc(100%+6px)]' : 'translate-x-0'
              }`}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`relative z-10 rounded-xl border-0 bg-transparent py-3 text-[0.92rem] font-semibold transition ${
                mode === 'create' ? 'text-forest' : 'text-ink-soft'
              }`}
            >
              <Crown size={14} className="mr-1.5 inline" />
              Create chama
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`relative z-10 rounded-xl border-0 bg-transparent py-3 text-[0.92rem] font-semibold transition ${
                mode === 'join' ? 'text-forest' : 'text-ink-soft'
              }`}
            >
              <Hash size={14} className="mr-1.5 inline" />
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

            {mode === 'create' ? (
              <>
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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

                <div className="mb-3.5 mt-7 flex items-center justify-between">
                  <b className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                    Choose your plan
                  </b>
                  <span className="text-[0.76rem] text-ink-soft">
                    Change anytime · 14 days free
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                <div className="mb-4 mt-4 flex items-center justify-between rounded-2xl border border-dashed border-line bg-white px-4 py-3.5 text-[0.86rem]">
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
              <>
                {/* Role selector */}
                <div className="mb-3.5">
                  <div className="mb-1.5 text-[0.8rem] font-semibold text-navy">
                    Your role in the chama
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {JOIN_ROLES.map((r) => {
                      const active = joinRole === r.value
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setJoinRole(r.value)}
                          className={`flex flex-col items-start gap-1.5 rounded-xl border-[1.5px] px-3 py-3 text-left transition ${
                            active
                              ? 'border-forest bg-forest/[0.06] shadow-sm'
                              : 'border-line bg-white hover:border-forest/50'
                          }`}
                        >
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${r.tint} text-white shadow-sm`}
                          >
                            <r.icon size={13} strokeWidth={2} />
                          </span>
                          <div>
                            <div
                              className={`text-[0.82rem] font-semibold ${
                                active ? 'text-forest' : 'text-navy'
                              }`}
                            >
                              {r.label}
                            </div>
                            <div className="mt-0.5 text-[0.64rem] leading-tight text-ink-soft">
                              {r.desc}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <Field label="Chama code">
                  <IconInput
                    icon={<Hash size={18} strokeWidth={1.8} />}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CHM-XXXXXX"
                    className="font-mono"
                  />
                  <p className="mt-2 text-[0.76rem] text-ink-soft">
                    Ask your chairman for this code — it's the same one they created the chama with.
                  </p>
                </Field>
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full cursor-pointer rounded-2xl border-0 bg-gradient-to-br from-forest to-emerald py-4 font-display text-base font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
            >
              {busy
                ? 'Creating…'
                : mode === 'join'
                  ? `Join as ${joinRole}`
                  : `Continue to payment · ${selectedTier}`}
            </button>

            {error && (
              <div
                role="alert"
                className="mt-4 min-h-[1.2em] rounded-xl bg-red-50 px-3.5 py-2.5 text-center text-[0.84rem] text-red-600"
              >
                {error}
              </div>
            )}

            <p className="mt-3 text-center text-[0.76rem] leading-relaxed text-ink-soft">
              By continuing you agree to the Terms and Privacy Policy.
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
      className={`relative flex flex-col rounded-[18px] px-4.5 py-5 text-left transition ${
        selected
          ? 'border border-gold text-white shadow-[0_0_0_1px_rgba(245,185,66,0.8),0_18px_40px_rgba(11,31,51,0.3)]'
          : 'border border-line bg-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(11,31,51,0.12)]'
      }`}
      style={
        selected ? { background: 'linear-gradient(155deg, #0B1F33, #0A3D46)' } : undefined
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

/* ---------- shared bits ---------- */

function Field({ label, children }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[0.8rem] font-semibold text-navy">{label}</label>
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