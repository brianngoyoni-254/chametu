import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Sun, Moon, Eye, EyeOff, Lock, ArrowLeft, Mail, Check, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logos.png'

const CODE_KEY = 'chametu_reset_code'
const CODE_LENGTH = 6

function readReset() {
  try {
    const raw = sessionStorage.getItem(CODE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function strength(pw) {
  if (!pw) return 0
  return (
    (pw.length >= 8 ? 1 : 0) +
    (/[a-z]/.test(pw) && /[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0)
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuth()

  const emailFromUrl = params.get('email') || ''
  const [email, setEmail] = useState(emailFromUrl)
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const inputsRef = useRef([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const pwStrength = strength(password)
  const pwOk =
    pwStrength >= 3 && password.length >= 8 && password === confirm && confirm.length > 0

  /* ---------- code input handlers ---------- */

  const setDigitAt = (i, v) => {
    setDigits((prev) => {
      const next = [...prev]
      next[i] = v
      return next
    })
  }

  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 1)
    if (!v) return
    setDigitAt(i, v)
    if (i < CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[i]) {
        setDigitAt(i, '')
      } else if (i > 0) {
        setDigitAt(i - 1, '')
        inputsRef.current[i - 1]?.focus()
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) inputsRef.current[i - 1]?.focus()
    if (e.key === 'ArrowRight' && i < CODE_LENGTH - 1) inputsRef.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!text) return
    const next = Array(CODE_LENGTH).fill('')
    text.split('').forEach((d, i) => (next[i] = d))
    setDigits(next)
    inputsRef.current[Math.min(text.length, CODE_LENGTH - 1)]?.focus()
  }

  const resend = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const target = email.trim().toLowerCase()
    try {
      sessionStorage.setItem(
        CODE_KEY,
        JSON.stringify({ email: target, code, expiresAt: Date.now() + 10 * 60_000 })
      )
    } catch {}
    toast.success(`New code sent to ${target}`)
    toast.info(`Demo code: ${code}`, { duration: 12000 })
    setDigits(Array(CODE_LENGTH).fill(''))
    inputsRef.current[0]?.focus()
  }

  /* ---------- submit ---------- */

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const target = email.trim().toLowerCase()
    if (!target) return setError('Enter the email you used to sign up.')

    const entered = digits.join('')
    if (entered.length !== CODE_LENGTH) return setError('Enter the 6-digit code.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')

    const reset = readReset()
    if (!reset) {
      return setError('No reset session found. Request a new code.')
    }
    if (reset.email !== target) {
      return setError("The email doesn't match the one you requested the code for.")
    }
    if (Date.now() > reset.expiresAt) {
      return setError('The code has expired. Request a new one.')
    }
    if (reset.code !== entered) {
      return setError('Incorrect code. Check the number and try again.')
    }

    setBusy(true)
    try {
      // Demo mode: AuthContext accepts any password, so we just sign them in.
      // In production this would be POST /auth/reset-password { email, code, newPassword }.
      await login({ email: target, password })
      try {
        sessionStorage.removeItem(CODE_KEY)
      } catch {}
      toast.success('Password updated. Welcome back!')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err?.message || 'Could not update your password. Try again.')
    } finally {
      setBusy(false)
    }
  }

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
          Create a <em className="not-italic text-gold">new password</em>
        </h2>

        <p className="relative text-white/75 max-w-[38ch] leading-relaxed hidden hero:block">
          Almost there. Enter the code we sent and pick a password you haven't used before.
        </p>

        {/* Preview card */}
        <div className="relative mt-auto hidden hero:block border border-white/20 bg-white/[0.08] backdrop-blur rounded-[20px] p-5">
          <div className="text-[0.72rem] tracking-widest uppercase text-white/60">
            New password rules
          </div>
          <ul className="list-none m-0 p-0 mt-3 grid gap-2 text-[0.86rem] text-white/90">
            <Rule ok={password.length >= 8}>At least 8 characters</Rule>
            <Rule ok={/[a-z]/.test(password) && /[A-Z]/.test(password)}>
              Upper and lower case letters
            </Rule>
            <Rule ok={/\d/.test(password)}>At least one number</Rule>
            <Rule ok={/[^A-Za-z0-9]/.test(password)}>At least one symbol</Rule>
          </ul>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex justify-center items-start hero:items-center px-6 py-10">
        <div className="w-full max-w-[480px]">
          <div className="flex justify-between items-center mb-8 text-[0.88rem] text-ink-soft">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-forest font-semibold hover:underline"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to log in
            </Link>
            <ThemeToggle />
          </div>

          <h1 className="font-display font-bold text-[2.1rem] tracking-tight text-navy">
            Set a new password
          </h1>
          <p className="mt-2 mb-6 text-ink-soft leading-relaxed">
            Enter the 6-digit code we sent you and choose a new password.
          </p>

          <form onSubmit={submit}>
            {/* Email */}
            <div className="mb-4">
              <label className="block text-[0.8rem] font-semibold text-navy mb-1.5">Email</label>
              <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Mail size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70"
                />
              </div>
            </div>

            {/* 6-digit code */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[0.8rem] font-semibold text-navy">Reset code</label>
                <button
                  type="button"
                  onClick={resend}
                  className="text-forest font-semibold text-[0.78rem] hover:underline"
                >
                  Resend code
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e)}
                    onKeyDown={(e) => handleKey(i, e)}
                    className="w-full aspect-square text-center text-xl font-mono font-semibold text-navy bg-[#F8FAFC] border-[1.5px] border-line rounded-xl outline-none transition focus:border-emerald focus:bg-white focus:ring-4 focus:ring-emerald/15"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* New password */}
            <div className="mb-4">
              <label className="block text-[0.8rem] font-semibold text-navy mb-1.5">
                New password
              </label>
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
            </div>

            {/* Confirm password */}
            <div className="mb-4">
              <label className="block text-[0.8rem] font-semibold text-navy mb-1.5">
                Confirm new password
              </label>
              <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Lock size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="text-ink-soft hover:text-navy transition p-1"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirm.length > 0 && password !== confirm && (
                <p className="text-red-600 text-[0.78rem] mt-1.5">Passwords don't match yet.</p>
              )}
            </div>

            <button
              type="submit"
              disabled={busy || !pwOk || digits.join('').length !== CODE_LENGTH}
              className="w-full border-0 rounded-2xl py-4 mt-2 font-display font-bold text-base text-white bg-gradient-to-br from-forest to-emerald cursor-pointer shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none"
            >
              {busy ? 'Updating…' : 'Update password'}
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

          <p className="text-[0.76rem] text-ink-soft text-center mt-6 leading-relaxed">
            <b className="text-navy">Demo:</b> codes are shown in a toast. In production, verify
            server-side and rate-limit to 5 attempts per hour per email.
          </p>
        </div>
      </main>
    </div>
  )
}

/* ---------- small bits ---------- */

function Rule({ ok, children }) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`w-4 h-4 rounded-full grid place-items-center transition ${
          ok ? 'bg-emerald' : 'bg-white/15'
        }`}
      >
        {ok ? (
          <Check size={10} strokeWidth={3} className="text-white" />
        ) : (
          <X size={10} strokeWidth={3} className="text-white/50" />
        )}
      </span>
      <span className={ok ? 'text-white' : 'text-white/75'}>{children}</span>
    </li>
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