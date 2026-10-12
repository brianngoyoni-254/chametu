import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Sun, Moon, Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logos.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    if (e) e.preventDefault()
    setError('')
    if (!email.trim()) return setError('Enter your email address.')
    if (!password) return setError('Enter your password.')

    setBusy(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.message || 'Incorrect email or password.')
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

        <h2 className="relative font-display font-bold text-[1.4rem] hero:text-[clamp(1.7rem,2.6vw,2.4rem)] leading-[1.15] tracking-tight max-w-[14ch]">
          Welcome back to your <em className="not-italic text-gold">chama</em>
        </h2>

        <p className="relative text-white/75 max-w-[38ch] leading-relaxed hidden hero:block">
          See who has paid, approve loans and keep every shilling accounted for.
        </p>

        {/* Sample preview card */}
        <div className="relative mt-auto hidden hero:block border border-white/20 bg-white/[0.08] backdrop-blur rounded-[20px] p-5">
          <small className="block text-[0.68rem] tracking-widest uppercase text-white/60">
            Sample view · this month
          </small>
          <div className="font-display font-bold text-[1.7rem] my-2">
            <span className="font-mono">KSh 186,000</span>
            <span className="text-[0.8rem] text-gold ml-1.5">93% of target</span>
          </div>
          <div className="h-[7px] rounded-full bg-white/15 overflow-hidden">
            <div className="h-full w-[93%] bg-gradient-to-r from-emerald to-[#7CF0C0]" />
          </div>
          <div className="flex justify-between items-center mt-3.5 text-[0.8rem] text-white/80">
            <span>39 of 42 members paid</span>
            <div className="flex">
              <span className="w-6 h-6 rounded-full border-2 border-[#0B2A3A] bg-emerald" />
              <span className="w-6 h-6 rounded-full border-2 border-[#0B2A3A] bg-gold -ml-2" />
              <span className="w-6 h-6 rounded-full border-2 border-[#0B2A3A] bg-[#7CB8F0] -ml-2" />
              <span className="w-6 h-6 rounded-full border-2 border-[#0B2A3A] bg-[#F08C7C] -ml-2" />
            </div>
          </div>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex justify-center items-start hero:items-center px-6 py-10">
        <div className="w-full max-w-[440px]">
          <div className="flex justify-between items-center mb-8 text-[0.88rem] text-ink-soft">
            <span>
              New to Chametu?{' '}
              <Link to="/register" className="text-forest font-semibold">
                Create account
              </Link>
            </span>
            <ThemeToggle />
          </div>

          <h1 className="font-display font-bold text-[2.1rem] tracking-tight text-navy">
            Log in
          </h1>
          <p className="mt-2 mb-6 text-ink-soft leading-relaxed">
            Enter your details to open your chama dashboard.
          </p>

          <form onSubmit={submit}>
            <Field label="Email">
              <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Mail size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  className="flex-1 min-w-0 border-0 bg-transparent outline-none py-3.5 text-sm text-navy placeholder:text-ink-soft/70"
                />
              </div>
            </Field>

            <Field
              label={
                <div className="flex justify-between items-center">
                  <span>Password </span>
                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        'Password reset by SMS or email needs the Chametu server. Ask your chairman or contact support.'
                      )
                    }
                    className="text-forest font-semibold text-[0.78rem] hover:underline"
                  >
                      Forgot password?
                  </button>
                </div>
              }
            >
              <div className="flex items-center gap-2.5 bg-[#F8FAFC] border-[1.5px] border-line rounded-xl px-3.5 transition focus-within:border-emerald focus-within:bg-white focus-within:ring-4 focus-within:ring-emerald/15">
                <Lock size={18} strokeWidth={1.8} className="text-ink-soft shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
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
            </Field>

            <div className="flex justify-between items-center text-[0.84rem] mb-5 mt-1">
              <label className="flex gap-2 items-center cursor-pointer text-ink-soft">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-forest w-4 h-4"
                />
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full border-0 rounded-2xl py-4 font-display font-bold text-base text-white bg-gradient-to-br from-forest to-emerald cursor-pointer shadow-[0_10px_24px_rgba(11,122,90,0.28)] transition hover:-translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none"
            >
              {busy ? 'Logging in…' : 'Log in'}
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

          <div className="flex items-center gap-3 my-5 text-ink-soft text-[0.78rem]">
            <span className="flex-1 h-px bg-line" />
            <span>or</span>
            <span className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/register"
              className="text-center no-underline font-semibold text-[0.88rem] text-navy bg-white border border-line rounded-xl py-3 hover:border-emerald transition"
            >
              Create a chama
            </Link>
            <Link
              to="/register?mode=join"
              className="text-center no-underline font-semibold text-[0.88rem] text-navy bg-white border border-line rounded-xl py-3 hover:border-emerald transition"
            >
              Join with code
            </Link>
          </div>

          <p className="text-[0.76rem] text-ink-soft text-center mt-5 leading-relaxed">
            Demo build: accounts live in this browser only. Production login needs a server with
            hashed passwords and SMS/email reset.
          </p>
        </div>
      </main>
    </div>
  )
}

/* ---------- shared bits ---------- */

function Field({ label, children }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-[0.8rem] font-semibold text-navy mb-1.5">
        {typeof label === 'string' ? <label>{label}</label> : label}
      </div>
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
      className="border border-line bg-white text-navy rounded-xl px-2.5 py-1.5 hover:border-forest transition"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}