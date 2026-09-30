import { FiSmartphone, FiTarget, FiSearch, FiBell } from 'react-icons/fi'

const EDGE = [
  [FiSmartphone, 'M-Pesa auto-reconcile', 'Paybill payments match to members automatically. No more scrolling through statements.'],
  [FiTarget, 'Member Trust Scores', 'Fair, transparent scores from payment history, repayment and attendance size every loan.'],
  [FiSearch, 'Ask Chametu', 'Ask “who hasn’t paid?” and get the answer instantly. Press Ctrl K anywhere.'],
  [FiBell, 'Smart reminders', 'SMS and WhatsApp nudges sent at the right time to the members most likely to be late.'],
]

export default function Edge() {
  return (
    <section id="edge" className="pb-2.5 pt-[70px]">
      <div className="wrap">
        <h2 className="max-w-[22ch] text-[clamp(1.6rem,3vw,2.2rem)]">Built for how chamas actually run</h2>
        <p className="mt-2.5 max-w-[60ch]">
          Everything Kenyan chamas do by WhatsApp, notebooks and guesswork, in one place.
        </p>

        <div className="mt-7 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4">
          {EDGE.map(([Icon, title, desc]) => (
            <div key={title} className="card-v2">
              <Icon size={24} className="mb-2.5 text-forest" aria-hidden="true" />
              <h3 className="mb-1.5 text-[1.02rem]">{title}</h3>
              <p className="text-[.9rem]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}