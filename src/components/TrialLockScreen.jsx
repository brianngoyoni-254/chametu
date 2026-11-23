// src/components/TrialLockScreen.jsx
import { Link, useNavigate } from 'react-router-dom'
import {
  Lock, Sparkles, ArrowRight, LogOut, ShieldCheck,
  CheckCircle2, Users, LineChart, CircleDollarSign, Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTrial } from '../context/TrialContext'
import logo from '../assets/logos.png'

const PERKS = [
  { icon: CircleDollarSign, text: 'Automatic M-Pesa reconciliation' },
  { icon: Users, text: 'Roles for every chama position' },
  { icon: LineChart, text: 'Live financial reports & statements' },
]

export default function TrialLockScreen() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { trial } = useTrial()

  const firstName = (user?.name || '').split(' ')[0] || 'there'

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[#F5F7F9] lg:grid-cols-[1.05fr_1fr]">
      {/* Left brand panel */}
      <aside className="relative hidden flex-col overflow-hidden bg-navy p-10 text-white lg:flex lg:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(900px 600px at -10% -10%, rgba(16,185,129,0.32), transparent 55%), radial-gradient(700px 500px at 110% 110%, rgba(245,185,66,0.14), transparent 55%), linear-gradient(155deg, #071625 0%, #0A2534 50%, #051C26 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-emerald/50 blur-xl" />
            <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.08] ring-1 ring-white/15 backdrop-blur">
              <img src={logo} alt="Chametu" className="h-7 w-7 rounded-lg object-contain" />
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">Chametu</div>
            <div className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-emerald/80">
              Chama Management
            </div>
          </div>
        </Link>

        <div className="relative mt-16 max-w-[520px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-red-200 backdrop-blur">
            <Lock size={11} /> Account locked
          </div>
          <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.05] tracking-tight">
            Your chama is{' '}
            <span className="bg-gradient-to-r from-red-300 via-red-200 to-red-300 bg-clip-text text-transparent">
              paused, not gone.
            </span>
          </h1>
          <p className="mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/70">
            Your 7-day free trial has ended. All your data — members, contributions,
            loans and reports — is safe. Pick a plan to switch everything back on.
          </p>
        </div>

        <div className="relative mt-10 grid max-w-[520px] gap-3">
          {PERKS.map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3.5 backdrop-blur"
            >
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-emerald/15 text-emerald ring-1 ring-emerald/20">
                <f.icon size={16} strokeWidth={2} />
              </span>
              <div className="text-[0.88rem] font-semibold text-white/90">{f.text}</div>
            </div>
          ))}
        </div>

        <div className="relative mt-auto flex items-center gap-3 pt-12 text-[0.72rem] text-white/40">
          <ShieldCheck size={14} />
          <span>Your data stays yours. We never delete it on lock.</span>
        </div>
      </aside>

      {/* Right action panel */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[460px]">
          <Link to="/" className="mb-6 flex items-center gap-2 no-underline lg:hidden">
            <img src={logo} alt="Chametu" className="h-8 w-8 rounded-lg object-contain" />
            <span className="font-display text-[1.05rem] font-bold text-navy">Chametu</span>
          </Link>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_10px_40px_-12px_rgba(11,31,51,0.12)] sm:p-8">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <Lock size={26} strokeWidth={2.2} />
            </span>

            <h2 className="mt-5 font-display text-[1.6rem] font-bold leading-tight text-navy">
              Hi {firstName}, your trial has ended
            </h2>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
              Your 7-day free trial on Chametu is over
              {trial?.tier ? ` (${trial.tier} plan)` : ''}. Upgrade to regain access
              to your dashboard and keep your chama moving.
            </p>

            {trial?.endsAt && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5 text-[0.8rem] font-semibold text-navy ring-1 ring-line">
                <Clock size={13} className="text-red-500" />
                Trial ended{' '}
                {new Date(trial.endsAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </div>
            )}

            <ul className="mt-5 grid gap-2.5">
              {[
                'All your members and history are safe',
                'Pick any plan — Starter, Growth, Business or Gold',
                'Unlock instantly after M-Pesa confirmation',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-[0.86rem] text-navy">
                  <CheckCircle2 size={15} className="mt-0.5 flex-none text-forest" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => navigate('/billing/upgrade')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.94rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(11,122,90,0.3)]"
            >
              <Sparkles size={15} strokeWidth={2.4} />
              Choose a plan & unlock
              <ArrowRight size={15} strokeWidth={2.6} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-line bg-white py-3 text-[0.86rem] font-semibold text-ink-soft transition hover:border-navy hover:text-navy"
            >
              <LogOut size={14} strokeWidth={2.2} />
              Sign out
            </button>
          </div>

          <p className="mt-6 text-center text-[0.72rem] leading-relaxed text-ink-soft">
            Questions? Email{' '}
            <a
              href="mailto:support@chametu.co.ke"
              className="font-semibold text-forest hover:underline"
            >
              support@chametu.co.ke
            </a>{' '}
            and we'll help you get back in.
          </p>
        </div>
      </main>
    </div>
  )
}