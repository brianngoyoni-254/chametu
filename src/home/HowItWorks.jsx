import { FiSettings, FiUserPlus, FiTrendingUp } from 'react-icons/fi'
import Reveal from './Reveal'

const STEPS = [
  [
    FiSettings,
    'Create & configure',
    'Set your contribution rules, loan terms and merry-go-round cycle at onboarding. No hard-coded assumptions.',
  ],
  [
    FiUserPlus,
    'Invite & connect',
    'Add members by CSV or invite link, and connect M-Pesa for automatic payment reconciliation.',
  ],
  [
    FiTrendingUp,
    'Run & grow',
    'Collect contributions, approve loans, hold meetings and track investments, all from one dashboard.',
  ],
]

export default function HowItWorks() {
  return (
    <section id="how" className="border-y border-line bg-card py-16 sm:py-20 md:py-24">
      <div className="wrap">
        <Reveal className="max-w-[52ch]">
          <h2 className="font-display text-[clamp(1.6rem,5vw,2.4rem)] font-bold leading-tight tracking-tight text-navy">
            Live in three steps
          </h2>
        </Reveal>

        <Reveal>
          <ol className="relative mt-10 grid gap-10 md:mt-12 md:grid-cols-3 md:gap-8">
            {/* connector: vertical on mobile, horizontal from md */}
            <span
              className="absolute bottom-6 left-[22px] top-6 w-px bg-line md:hidden"
              aria-hidden="true"
            />
            <span
              className="absolute left-0 right-0 top-[22px] hidden h-px bg-line md:block"
              aria-hidden="true"
            />

            {STEPS.map(([Icon, title, desc], i) => (
              <li key={title} className="group relative pl-16 md:pl-0 md:pt-16">
                <span className="absolute left-0 top-0 grid h-11 w-11 place-items-center rounded-full bg-forest text-white ring-8 ring-card transition-transform duration-300 group-hover:scale-110">
                  <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
                </span>
                <span className="font-mono text-[0.78rem] text-gold sm:text-[.8rem]">0{i + 1}</span>
                <h3 className="mt-1 font-display text-[1.05rem] font-semibold text-navy sm:text-[1.12rem]">
                  {title}
                </h3>
                <p className="mt-2 max-w-[38ch] text-[0.9rem] leading-relaxed text-ink-soft sm:text-[.92rem]">
                  {desc}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}