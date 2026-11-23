// src/components/TrialBanner.jsx
import { Link } from 'react-router-dom'
import { Clock, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react'
import { useTrial } from '../context/TrialContext'

export default function TrialBanner() {
  const { trial, isTrial, daysLeft } = useTrial()

  if (!isTrial || daysLeft == null) return null

  const urgent = daysLeft <= 1
  const warning = daysLeft <= 3 && !urgent

  const palette = urgent
    ? {
        bg: 'bg-red-600',
        text: 'text-white',
        sub: 'text-red-100',
        chip: 'bg-white/15 text-white',
        icon: <AlertTriangle size={15} strokeWidth={2.4} />,
      }
    : warning
      ? {
          bg: 'bg-amber-500',
          text: 'text-[#2E2200]',
          sub: 'text-[#5A4A10]',
          chip: 'bg-black/10 text-[#2E2200]',
          icon: <Clock size={15} strokeWidth={2.4} />,
        }
      : {
          bg: 'bg-gradient-to-r from-forest to-emerald',
          text: 'text-white',
          sub: 'text-emerald-50/90',
          chip: 'bg-white/15 text-white',
          icon: <Sparkles size={15} strokeWidth={2.4} />,
        }

  const dayLabel = daysLeft === 1 ? '1 day' : `${daysLeft} days`

  return (
    <div className={`relative z-40 ${palette.bg} ${palette.text}`}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${palette.chip}`}>
            {palette.icon}
          </span>
          <p className={`min-w-0 text-[0.78rem] font-semibold leading-tight sm:text-[0.84rem] ${palette.text}`}>
            {urgent
              ? 'Last day of your free trial!'
              : warning
                ? 'Your free trial is ending soon.'
                : 'You are on a free trial.'}
            <span className={`ml-1 font-normal ${palette.sub}`}>
              {dayLabel} left
              {trial?.endsAt
                ? ` · ends ${new Date(trial.endsAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`
                : ''}
            </span>
          </p>
        </div>
        <Link
          to="/billing/upgrade"
          className={`group inline-flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-[0.74rem] font-bold no-underline transition ${palette.chip} hover:opacity-90 sm:text-[0.78rem]`}
        >
          {urgent ? 'Keep my account' : 'Upgrade now'}
          <ArrowRight size={13} strokeWidth={2.6} className="transition group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}