import { Link } from 'react-router-dom'

const EARN = [
  ['Subscription paid on time', '+100'],
  ['Upgrade your plan', '+500'],
  ['Referral that subscribes', '+1,000'],
  ['Weekly activity', '+50'],
]

const REDEEM = [
  ['Template pack', '500'],
  ['10% off next month', '1,000'],
  ['100 SMS reminders', '1,200'],
  ['Advanced analytics', '2,000'],
  ['Partner data bundle', '3,000'],
  ['Chama of the Month', '4,000'],
]

function PointsList({ items }) {
  return (
    <ul className="mb-[22px] mt-4 grid gap-[9px]">
      {items.map(([label, points]) => (
        <li
          key={label}
          className="flex justify-between gap-2.5 rounded-xl bg-white/[.09] px-3.5 py-2.5 text-[.9rem] text-white"
        >
          {label}
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
        <div className="mt-7 grid grid-cols-1 gap-7 rounded-3xl bg-[linear-gradient(150deg,#0B7A5A,#0A3D46)] p-6 text-white nav:grid-cols-[1.1fr_.9fr] nav:p-[34px]">
          <div className="min-w-0">
            <h2 className="max-w-[22ch] text-[clamp(1.6rem,3vw,2.2rem)] text-white">
              Chametu Points: rewards for chamas that run well
            </h2>
            <p className="mt-2.5 text-white/80">
              Earn points for paying on time and staying active. Spend them on perks. Points are never cash and never
              touch your chama&rsquo;s money.
            </p>

            <PointsList items={EARN} />

            <div className="flex flex-wrap gap-2">
              <Link to="/dashboard/admin" className="btn btn-white">
                Open Rewards Marketplace
              </Link>
              <a href="#rewards" className="btn btn-white-outline">
                See how it works
              </a>
            </div>

            <p className="mt-3.5 text-[.8rem] text-white/80">
              Only verified chama admins can redeem. Points expire after 6–12 months of inactivity.
            </p>
          </div>

          <div className="min-w-0">
            <h3 className="text-[1.17rem] text-white">Redeem for</h3>
            <PointsList items={REDEEM} />
          </div>
        </div>
      </div>
    </section>
  )
}