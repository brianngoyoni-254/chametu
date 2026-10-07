import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiBarChart2,
  FiUsers,
  FiArrowUpRight,
  FiArrowDownLeft,
} from 'react-icons/fi'
import Reveal from './Reveal'

const VIEWS = {
  treasurer: {
    name: 'Brian',
    stats: [
      ['Group balance', 'KSh 4,820,500'],
      ['Contributions', 'KSh 280,000'],
      ['Loans out', 'KSh 720,000', 'gold'],
      ['Investments', 'KSh 3,100,000', 'green'],
    ],
    rows: [
      ['Contribution from Kevin', '+ 5,000', false],
      ['Loan disbursed to Mary', '- 40,000', true],
      ['Kiambu land valuation', '+ 300,000', false],
    ],
  },
  chair: {
    name: 'Ann',
    stats: [
      ['Pending approvals', '3'],
      ['Loans to approve', '2'],
      ['Meetings this month', '1', 'gold'],
      ['Open votes', '1', 'green'],
    ],
    rows: [
      ['Vote: Kilifi property', 'Due Oct 2', false],
      ['Loan LN-102 awaiting approval', 'KSh 100,000', false],
      ['September minutes sign-off', 'Pending', false],
    ],
  },
  member: {
    name: 'Jane',
    stats: [
      ['My savings', 'KSh 60,000'],
      ['My contributions', 'KSh 120,000'],
      ['My loan balance', 'KSh 0', 'gold'],
      ['My welfare', 'KSh 12,500', 'green'],
    ],
    rows: [
      ['September contribution', '+ 5,000', false],
      ['Welfare fund paid in', '+ 500', false],
      ['Next meeting', 'Sep 28, 2:00 PM', false],
    ],
  },
}

const TONES = {
  gold: 'text-gold',
  green: 'text-[#5FE3A8]',
}

export default function Hero() {
  const [view, setView] = useState('treasurer')
  const data = VIEWS[view]

  return (
    <section className="pb-[46px] pt-[68px]">
      <div className="wrap grid grid-cols-1 items-center gap-[38px] hero:grid-cols-[1.05fr_.95fr] hero:gap-[52px]">
        <Reveal className="min-w-0" direction="up">
          <div className="mb-[18px] flex items-center gap-[9px]">
            <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-forest/10 text-forest">
              <FiUsers size={13} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-[.84rem] font-semibold text-forest">
              For savings groups, investment chamas &amp; SACCOs
            </span>
          </div>

          <h1 className="max-w-[14ch] text-[clamp(2.1rem,4.2vw,3.15rem)] font-bold leading-[1.1] tracking-[-.01em]">
            Run your chama with{' '}
            <em className="bg-[linear-gradient(90deg,#0B7A5A,#10B981)] bg-clip-text not-italic text-transparent">
              total clarity.
            </em>
          </h1>

          <p className="mt-[18px] max-w-[44ch] text-[1.05rem]">
            Chametu brings contributions, M-Pesa payments, loans, investments, meetings and reports into one secure
            ledger so every official and every member sees the same numbers.
          </p>

          <div className="mt-7 flex flex-wrap gap-[13px]">
            <Link to="/register" className="btn btn-primary max-[480px]:flex-auto">
              Create your chama
              <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn-ghost max-[480px]:flex-auto">
              <FiBarChart2 size={15} strokeWidth={2.5} aria-hidden="true" />
              See a live dashboard
            </Link>
          </div>
        </Reveal>

        <Reveal
          className="relative min-w-0 overflow-hidden rounded-2xl bg-navy p-[22px] text-white shadow-[0_30px_60px_-20px_rgba(16,42,67,.42)]"
          direction="up"
          delay={120}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(420px 220px at 90% -10%, rgba(18,166,106,.32), transparent 60%)',
            }}
          />

          <div className="relative flex flex-wrap items-start justify-between gap-x-3 gap-y-3">
            <div className="text-[.78rem] text-[#B9C6D2]">
              Good morning
              <b className="mt-0.5 block font-display text-[1rem] text-white">{data.name}</b>
            </div>
            <div
              className="flex gap-1.5 rounded-lg bg-white/[.08] p-[3px]"
              role="tablist"
              aria-label="Switch dashboard view"
            >
              {Object.keys(VIEWS).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => setView(key)}
                  className={`rounded-md px-2.5 py-1.5 text-[.72rem] font-semibold capitalize transition-colors max-[400px]:px-2 ${
                    view === key ? 'bg-emerald text-[#06331F]' : 'text-[#C7D2DA]'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div className="relative mt-5 grid grid-cols-1 gap-2.5 min-[381px]:grid-cols-2">
            {data.stats.map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-[10px] border border-white/[.09] bg-white/[.06] px-3.5 py-3"
              >
                <div className="text-[.7rem] text-[#AEBBC6]">{label}</div>
                <div
                  className={`mt-1 font-display text-[1.18rem] font-bold max-[480px]:text-[1.05rem] ${
                    TONES[tone] || 'text-white'
                  }`}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-4 rounded-[10px] bg-white/5 px-1 py-[5px]">
            {data.rows.map(([label, amount, negative], i) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-3 px-3 py-2 text-[.75rem] ${
                  i > 0 ? 'border-t border-white/[.07]' : ''
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                      negative
                        ? 'bg-[#F0A6A0]/15 text-[#F0A6A0]'
                        : 'bg-[#5FE3A8]/15 text-[#5FE3A8]'
                    }`}
                  >
                    {negative ? (
                      <FiArrowUpRight size={11} strokeWidth={2.5} aria-hidden="true" />
                    ) : (
                      <FiArrowDownLeft size={11} strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </span>
                  <span className="truncate">{label}</span>
                </span>
                <span
                  className={`whitespace-nowrap font-mono ${
                    negative ? 'text-[#F0A6A0]' : 'text-[#5FE3A8]'
                  }`}
                >
                  {amount}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}