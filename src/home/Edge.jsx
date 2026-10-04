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
    <section id="edge" className="pb-2.5 pt-[70px]">
      <div className="wrap">
        <Reveal className="max-w-[60ch]">
          <h2 className="max-w-[22ch] text-[clamp(1.6rem,3vw,2.2rem)]">Built for how chamas actually run</h2>
          <p className="mt-2.5">
            Everything Kenyan chamas do by WhatsApp, notebooks and guesswork, now in one place.
          </p>
        </Reveal>

        <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
          {EDGE.map(([Icon, title, desc], i) => (
            <Reveal key={title} delay={i * 70} className="h-full">
              <div className="card-v2 h-full">
                <span className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#E9F5EF] text-forest">
                  <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3 className="mb-1.5 text-[1.02rem]">{title}</h3>
                <p className="text-[.9rem]">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}