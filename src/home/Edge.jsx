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
    <section id="edge" className="border-y border-line bg-card py-16 sm:py-20 md:py-24">
      <div className="wrap grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="max-w-[18ch] font-display text-[clamp(1.6rem,5vw,2.4rem)] font-bold leading-tight tracking-tight text-navy">
            Built for how chamas actually run
          </h2>
          <p className="mt-3 max-w-[40ch] text-[0.95rem] leading-relaxed text-ink-soft sm:text-[1rem]">
            Everything Kenyan chamas do by WhatsApp, notebooks and guesswork, now in one place.
          </p>
        </Reveal>

        <Reveal>
          <ul className="divide-y divide-line border-y border-line">
            {EDGE.map(([Icon, title, desc]) => (
              <li
                key={title}
                className="group flex gap-3 py-5 transition-colors hover:bg-forest/[0.03] sm:gap-5 sm:py-6"
              >
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-forest/10 text-forest transition-all duration-300 group-hover:bg-forest group-hover:text-white sm:h-11 sm:w-11">
                  <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-[1.02rem] font-semibold text-navy sm:text-[1.08rem]">
                    {title}
                  </h3>
                  <p className="mt-1.5 max-w-[52ch] text-[0.9rem] leading-relaxed text-ink-soft sm:text-[.92rem]">
                    {desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}