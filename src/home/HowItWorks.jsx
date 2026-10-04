import { FiSettings, FiUserPlus, FiTrendingUp } from 'react-icons/fi'
import Reveal from './Reveal'

const STEPS = [
  [
    FiSettings,
    '01',
    'Create & configure',
    'Set your contribution rules, loan terms and merry-go-round cycle at onboarding. No hard-coded assumptions.',
  ],
  [
    FiUserPlus,
    '02',
    'Invite & connect',
    'Add members by CSV or invite link, and connect M-Pesa for automatic payment reconciliation.',
  ],
  [
    FiTrendingUp,
    '03',
    'Run & grow',
    'Collect contributions, approve loans, hold meetings and track investments, all from one dashboard.',
  ],
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-16">
      <div className="wrap">
        <Reveal className="mb-[34px] max-w-[44ch]">
          <div className="mb-2 text-[.78rem] font-bold tracking-[.03em] text-forest">HOW IT WORKS</div>
          <h2 className="text-[1.85rem]">Live in three steps</h2>
        </Reveal>

        <Reveal className="rounded-2xl border border-line bg-white px-5 py-7 sm:px-[34px] sm:py-[38px]">
          <div className="grid grid-cols-1 gap-[26px] min-[761px]:grid-cols-3 min-[761px]:gap-7">
            {STEPS.map(([Icon, num, title, desc], i) => (
              <Reveal key={num} delay={i * 90}>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#E9F5EF] text-forest">
                    <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[.8rem] text-gold">{num}</span>
                </div>
                <h3 className="mt-3 text-[1.02rem]">{title}</h3>
                <p className="mt-[7px] text-[.87rem]">{desc}</p>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}