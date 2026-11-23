// src/components/TrialReminderModal.jsx
import { useNavigate } from 'react-router-dom'
import { X, Sparkles, Clock, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useTrial } from '../context/TrialContext'

const COPY = {
  soon: {
    icon: Sparkles,
    iconBg: 'bg-emerald/10 text-forest ring-emerald/20',
    title: "You're on a 7-day free trial",
    body: 'Explore every feature of Chametu free for a week. Upgrade any time to keep your chama running without interruption.',
    cta: 'See plans',
  },
  mid: {
    icon: Clock,
    iconBg: 'bg-amber-100 text-amber-700 ring-amber-200',
    title: 'Your trial is halfway done',
    body: "You've got {days} days left. Upgrade now so your chama doesn't lose access to contributions, loans and reports.",
    cta: 'Upgrade now',
  },
  last: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100 text-red-600 ring-red-200',
    title: 'Your trial ends tomorrow',
    body: "This is your last full day of free access. If you don't upgrade, your account will lock at the end of the day.",
    cta: 'Keep my account',
  },
  expired: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100 text-red-600 ring-red-200',
    title: 'Your free trial has ended',
    body: 'Your account is now locked. Upgrade to restore access to your chama, contributions and reports.',
    cta: 'Unlock now',
  },
}

function pickCopy(days) {
  if (days == null || days > 3) return 'soon'
  if (days > 1) return 'mid'
  return 'last'
}

export default function TrialReminderModal() {
  const navigate = useNavigate()
  const { reminderOpen, reminderDays, dismissReminder } = useTrial()

  if (!reminderOpen) return null

  const kind = pickCopy(reminderDays)
  const cfg = COPY[kind]
  const Icon = cfg.icon
  const body = cfg.body.replace('{days}', reminderDays ?? '')

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-reminder-title"
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
    >
      <div
        className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
        onClick={dismissReminder}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[420px] rounded-3xl border border-line bg-white p-6 shadow-[0_24px_60px_-20px_rgba(11,31,51,0.4)] dark:border-white/10 dark:bg-[#0F1D2B] sm:p-7">
        <button
          type="button"
          onClick={dismissReminder}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-navy dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={16} strokeWidth={2.4} />
        </button>

        <span className={`grid h-12 w-12 place-items-center rounded-2xl ring-1 ${cfg.iconBg}`}>
          <Icon size={22} strokeWidth={2.2} />
        </span>

        <h2
          id="trial-reminder-title"
          className="mt-4 font-display text-[1.25rem] font-bold leading-tight text-navy dark:text-white"
        >
          {cfg.title}
        </h2>
        <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft dark:text-slate-300">
          {body}
        </p>

        {reminderDays != null && reminderDays > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-paper px-3.5 py-2.5 text-[0.8rem] font-semibold text-navy dark:bg-white/5 dark:text-white">
            <Clock size={13} className="text-forest dark:text-emerald-400" />
            {reminderDays === 1 ? '1 day remaining' : `${reminderDays} days remaining`}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              dismissReminder()
              navigate('/billing/upgrade')
            }}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald py-3 text-[0.88rem] font-bold text-white shadow-[0_8px_20px_-6px_rgba(11,122,90,0.5)] transition hover:-translate-y-0.5"
          >
            {cfg.cta}
            <ArrowRight size={14} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            onClick={dismissReminder}
            className="flex-1 rounded-xl border border-line bg-white py-3 text-[0.88rem] font-semibold text-navy transition hover:border-forest dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-emerald"
          >
            Remind me later
          </button>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[0.7rem] text-ink-soft dark:text-slate-400">
          <ShieldCheck size={11} className="text-forest dark:text-emerald-400" />
          No charge until you choose a plan
        </p>
      </div>
    </div>
  )
}