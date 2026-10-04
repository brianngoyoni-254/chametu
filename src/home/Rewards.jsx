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

const REDEEM = CATALOG.map((perk) => [FiGift, perk.name, perk.pts.toLocaleString()])

function PointsList({ items }) {
  return (
    <ul className="mb-[22px] mt-4 grid gap-[9px]">
      {items.map(([Icon, label, points]) => (
        <li
          key={label}
          className="flex items-center justify-between gap-2.5 rounded-xl bg-white/[.09] px-3.5 py-2.5 text-[.9rem] text-white"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Icon size={14} className="shrink-0 text-white/70" aria-hidden="true" />
            <span className="truncate">{label}</span>
          </span>
          <b className="whitespace-nowrap font-mono font-medium text-gold">{points}</b>
        </li>
      ))}
    </ul>
  )
}

export default function Rewards() {
  return (
    <section id="rewards" className="pb-2.5 pt-[70px]">
      <div className="wrap">
        <Reveal className="mt-7 grid grid-cols-1 gap-7 rounded-3xl bg-[linear-gradient(150deg,#0B7A5A,#0A3D46)] p-6 text-white nav:grid-cols-[1.1fr_.9fr] nav:p-[34px]">
          <div className="min-w-0">
            <h2 className="max-w-[22ch] text-[clamp(1.6rem,3vw,2.2rem)] text-white">
              Chametu Points: rewards for chamas that run well
            </h2>
            <p className="mt-2.5 text-white/80">
              Earn points for paying on time and staying active. Spend them on perks. Points are never cash and
              never touch your chama&rsquo;s money.
            </p>

            <PointsList items={EARN} />

            <div className="flex flex-wrap gap-2">
              <Link to="/rewards" className="btn btn-white">
                <FiGift size={15} strokeWidth={2.5} aria-hidden="true" />
                Open Rewards Marketplace
              </Link>
              <Link to="/rewards/how-it-works" className="btn btn-white-outline">
                See how it works
                <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-3.5 text-[.8rem] text-white/80">
              Plans start at KSh 500/month for up to 10 members. Only verified chama admins can redeem. Points
              expire after 6 to 12 months of inactivity.
            </p>
          </div>

          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[1.17rem] text-white">
              <FiAward size={17} className="text-gold" aria-hidden="true" />
              Redeem for
            </h3>
            <PointsList items={REDEEM} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}