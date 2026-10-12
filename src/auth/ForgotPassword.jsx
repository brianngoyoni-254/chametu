import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sun, Moon, Mail, ArrowLeft, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import logo from '../assets/logos.png'

const MEMBERS_KEY = 'chametu_members_v2'
const CHAMA_KEY = 'chametu_chama_v1'
const CODE_KEY = 'chametu_reset_code'

function isValidEmail(v) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
}

function emailExists(email) {
  const target = email.trim().toLowerCase()
  try {
    const members = JSON.parse(localStorage.getItem(MEMBERS_KEY)) || []
    if (members.some((m) => m.email?.toLowerCase() === target)) return true
    const chama = JSON.parse(localStorage.getItem(CHAMA_KEY))
    if (chama?.email?.toLowerCase() === target) return true
  } catch {}
  return false
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmed = email.trim().toLowerCase()
    if (!isValidEmail(trimmed)) return setError('Enter a valid email address.')

    setBusy(true)
    try {
      // Generate a 6-digit code and stash it for the next screen
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const found = emailExists(trimmed)

      try {
        sessionStorage.setItem(
          CODE_KEY,
          JSON.stringify({ email: trimmed, code, expiresAt: Date.now() + 10 * 60_000 })
        )
      } catch {}

      if (found) {
        toast.success(`Reset code sent to ${trimmed}`, { duration: 6000 })
        toast.info(`Demo code: ${code}`, { duration: 12000 })
      } else {
        // Don't reveal whether the account exists — same UX either way
        toast.success(`If ${trimmed} is registered, a code has been sent`, { duration: 6000 })
        toast.info(`Demo code (try it anyway): ${code}`, { duration: 12000 })
      }

      navigate(`/reset-password?email=${encodeURIComponent(trimmed)}`)
    } catch (err) {
      setError(err?.message || 'Could not send the code. Try again.')
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
          Forgot your <em className="not-italic text-gold">password?</em>
        </h2>

        <p className="relative text-white/75 max-w-[38ch] leading-relaxed hidden hero:block">
          We'll send a one-time code to your email so you can create a new one.
        </p>

        {/* Info card */}
        <div className="relative mt-auto hidden hero:block border border-white/20 bg-white/[0.08] backdrop-blur rounded-[20px] p-5">
          <div className="flex items-center gap-2.5 text-[0.72rem] tracking-widest uppercase text-white/60">
            <ShieldCheck size={13} strokeWidth={2} />
            Secure reset
          </div>
          <div className="font-display font-bold text-[1.15rem] mt-3 leading-snug">
            Your chama's data stays safe.
          </div>
          <p className="text-[0.86rem] text-white/75 mt-2 leading-relaxed">
            Codes expire in 10 minutes. We never email your existing password — only a code you
            use to set a new one.
          </p>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex justify-center items-start hero:items-center px-6 py-10">
        <div className="w-full max-w-[440px]">
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
            Reset password
          </h1>
          <p className="mt-2 mb-6 text-ink-soft leading-relaxed">
            Enter the email you use for Chametu and we'll send you a 6-digit code.
          </p>

          <form onSubmit={submit}>
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
                  autoFocus
                  className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full border-0 rounded-2xl py-4 mt-2 font-display font-bold text-base text-white bg-gradient-to-br from-forest to-emerald cursor-pointer shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none"
            >
              {busy ? 'Sending…' : 'Send reset code'}
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
            <b className="text-navy">Demo:</b> the code is shown in a toast above. In production it
            would arrive by email from Chametu.
          </p>
        </div>
      </main>
    </div>
  )
}

/* ---------- shared ---------- */

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