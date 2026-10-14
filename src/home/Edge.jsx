import { FiSmartphone, FiTarget, FiSearch, FiBell } from 'react-icons/fi'
import Reveal from './Reveal'

const EDGE = [
  [
    FiSmartphone,
    'M-Pesa auto reconciliation',
    'Paybill payments match to members automatically. No more scrolling through statements.',
  ],
  [
    FiTarget,
    'Member trust scores',
    'Fair, transparent scores from payment history, repayment and attendance that shape every loan.',
  ],
  [
    FiSearch,
    'Ask Chametu',
    'Ask "who has not paid?" and get the answer instantly. Press Ctrl K anywhere.',
  ],
  [
    FiBell,
    'Smart reminders',
    'SMS and WhatsApp nudges sent at the right time to the members most likely to be late.',
  ],
]

export default function Edge() {
  return (
    <section id="edge" className="border-y border-line bg-card py-20 sm:py-24">
      <div className="wrap grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-[18ch] font-display text-[1.9rem] font-bold leading-tight tracking-tight text-navy sm:text-[2.4rem]">
            Built for how chamas actually run
          </h2>
          <p className="mt-3 max-w-[40ch] text-[1rem] leading-relaxed text-ink-soft">
            Everything Kenyan chamas do by WhatsApp, notebooks and guesswork, now in one place.
          </p>
        </Reveal>

        <Reveal>
          <ul className="divide-y divide-line border-y border-line">
            {EDGE.map(([Icon, title, desc]) => (
              <li key={title} className="flex gap-4 py-6 sm:gap-5">
                <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-forest/10 text-forest">
                  <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.08rem] font-semibold text-navy">{title}</h3>
                  <p className="mt-1.5 max-w-[52ch] text-[.92rem] leading-relaxed text-ink-soft">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}