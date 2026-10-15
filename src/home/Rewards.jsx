import { Link } from 'react-router-dom'
import {
  FiGift,
  FiAward,
  FiArrowRight,
  FiCalendar,
  FiArrowUpCircle,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import { CATALOG } from '../lib/catalog'
import Reveal from './Reveal'

const EARN = [
  [FiCalendar, 'Subscription paid on time', '0.5 pts / KSh'],
  [FiArrowUpCircle, 'Upgrade your plan', '+500'],
  [FiUsers, 'Referral that pays', '+2,000'],
  [FiZap, 'Annual prepay', '+1,000'],
]

const REDEEM_PREVIEW = 5

export default function Rewards() {
  const perks = CATALOG.slice(0, REDEEM_PREVIEW)
  const extra = CATALOG.length - perks.length

  return (
    <section id="rewards" className="py-16 sm:py-20 md:py-24">
      <div className="wrap">
        <Reveal className="relative overflow-hidden rounded-3xl bg-[linear-gradient(150deg,#0B7A5A,#0A3D46)] p-5 text-white sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[rgba(245,185,66,.14)]" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-[rgba(255,255,255,.05)]" />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
            <div className="min-w-0">
              <h2 className="max-w-[20ch] font-display text-[clamp(1.5rem,4.6vw,2.3rem)] font-bold leading-tight tracking-tight text-white">
                Chametu Points: rewards for chamas that run well
              </h2>
              <p className="mt-3 max-w-[48ch] text-[0.95rem] leading-relaxed text-white/80 sm:text-[1rem]">
                Earn points for paying on time and staying active. Spend them on perks. Points are never cash
                and never touch your chama&rsquo;s money.
              </p>

              <ul className="mt-7 grid grid-cols-1 gap-3 min-[520px]:grid-cols-2">
                {EARN.map(([Icon, label, points]) => (
                  <li
                    key={label}
                    className="group rounded-2xl border border-white/10 bg-white/[.07] p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[.10]"
                  >
                    <Icon size={16} className="text-white/60" aria-hidden="true" />
                    <b className="mt-3 block font-display text-[1.3rem] font-bold leading-none text-gold sm:text-[1.35rem]">
                      {points}
                    </b>
                    <span className="mt-1.5 block text-[0.82rem] text-white/80 sm:text-[.84rem]">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap gap-2.5">
                <Link to="/rewards" className="btn btn-white">
                  <FiGift size={15} strokeWidth={2.5} aria-hidden="true" />
                  Open Rewards Marketplace
                </Link>
                <Link to="/rewards/how-it-works" className="btn btn-white-outline">
                  See how it works
                  <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-[#06161A]/35 p-4 backdrop-blur-sm sm:p-6 lg:self-center">
              <h3 className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-white sm:text-[1.1rem]">
                <FiAward size={17} className="text-gold" aria-hidden="true" />
                Redeem for
              </h3>

              <ul className="mt-4 divide-y divide-white/10">
                {perks.map((perk) => (
                  <li
                    key={perk.id ?? perk.name}
                    className="flex items-center justify-between gap-3 py-3 text-[0.88rem] sm:text-[.9rem]"
                  >
                    <span className="min-w-0 truncate text-white">{perk.name}</span>
                    <b className="whitespace-nowrap font-mono text-[0.82rem] font-medium text-gold sm:text-[.84rem]">
                      {perk.pts.toLocaleString()} pts
                    </b>
                  </li>
                ))}
              </ul>

              {extra > 0 && (
                <p className="mt-1 text-[0.78rem] text-white/60 sm:text-[.8rem]">
                  + {extra} more in the marketplace
                </p>
              )}
            </div>
          </div>

          <p className="relative mt-8 max-w-[70ch] text-[0.78rem] leading-relaxed text-white/70 sm:text-[.8rem]">
            Plans start at KSh 500/month for up to 10 members. Only verified chama admins can redeem. Points
            expire after 6 to 12 months of inactivity.
          </p>
        </Reveal>
      </div>
    </section>
  )
}