import { Link } from 'react-router-dom'
import {
  Coins,
  Sparkles,
  Users,
  CalendarCheck,
  ShieldCheck,
  Receipt,
} from 'lucide-react'
import { ORDER, TIERS } from '../lib/tiers'
import { CATALOG } from '../lib/catalog'
import { useAuth } from '../context/AuthContext'

const EARN_RULES = [
  {
    icon: CalendarCheck,
    title: 'Subscription paid on time',
    body: 'Earn 0.5 points per KSh paid. A KSh 1,000 month earns 500 points.',
  },
  {
    icon: Sparkles,
    title: 'Upgrade your plan',
    body: '+500 points, once per tier per year.',
  },
  {
    icon: Users,
    title: 'Referral that pays',
    body: '+2,000 points after the new chama pays its first invoice. Max 10 per year.',
  },
  {
    icon: Coins,
    title: 'Annual prepay',
    body: '+1,000 points, once per year.',
  },
]

const SAFEGUARDS = [
  'No cash-outs. Points only redeem for subscription credit and digital rewards.',
  'Never touch chama funds. Points are earned by app activity, not member contributions.',
  'Points expire 12 months after earning, or after 12 months of inactivity.',
  'Annual caps per tier protect both the chama and Chametu from abuse.',
]

export default function HowRewardsWork() {
  const { isAuthenticated } = useAuth()

  return (
    <main className="bg-paper">
      {/* Hero */}
      <section className="pt-[100px] pb-14">
        <div className="wrap">
          <span className="inline-flex items-center gap-2 text-[.78rem] font-bold tracking-wide text-forest">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            CHAMETU POINTS
          </span>
          <h1 className="mt-3 max-w-[18ch] text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] text-navy">
            Earn points. Redeem for free months.
          </h1>
          <p className="mt-4 max-w-[60ch] text-ink-soft">
            Chametu Points reward chamas that pay on time, stay active and refer
            others. Redeem them for subscription credit, templates and recognition.
            Points are never cash and never touch your chama&rsquo;s funds.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {isAuthenticated ? (
              <Link to="/rewards" className="btn btn-primary">
                Open Rewards Marketplace
              </Link>
            ) : (
              <Link to="/register" className="btn btn-primary">
                Create your chama
              </Link>
            )}
            <Link to="/login" className="btn btn-ghost">
              Log in
            </Link>
          </div>

          <p className="mt-5 text-[.84rem] text-ink-soft">
            <b className="text-navy">Value anchor:</b> 1,000 points = KSh 100 in subscription credit.
          </p>
        </div>
      </section>

      {/* How you earn */}
      <section className="pb-14">
        <div className="wrap">
          <h2 className="text-2xl font-bold text-navy">How you earn</h2>
          <p className="mt-2 max-w-[60ch] text-ink-soft">
            Only actions that bring revenue or reduce churn award points. Nothing
            that touches member contributions earns a single point.
          </p>

          <ul className="mt-6 grid gap-4 nav:grid-cols-2">
            {EARN_RULES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="card-v2 flex items-start gap-3">
                <Icon size={20} strokeWidth={2} className="mt-0.5 shrink-0 text-forest" />
                <div>
                  <b className="text-navy">{title}</b>
                  <p className="mt-1 text-[.88rem] text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Plans matrix */}
      <section className="pb-14">
        <div className="wrap">
          <h2 className="text-2xl font-bold text-navy">Plans</h2>
          <p className="mt-2 max-w-[60ch] text-ink-soft">
            Every paid tier earns points on subscription spend and can redeem up to
            its annual cap. The cap is the only gate, with no hidden perk locks.
          </p>

          <div className="mt-6 grid gap-4 nav:grid-cols-4">
            {ORDER.map((name) => {
              const t = TIERS[name]
              return (
                <div key={name} className="card-v2">
                  <b className="font-display text-lg text-navy">{name}</b>
                  <p className="mt-1 text-[.86rem] text-ink-soft">
                    {t.price === 0 ? 'Free forever' : `KSh ${t.price.toLocaleString()} / month`}
                  </p>
                  <ul className="mt-3 space-y-1.5 text-[.86rem] text-ink-soft">
                    <li>Up to {t.maxMembers} members</li>
                    <li>{t.pointsMultiplier > 0 ? 'Earns points' : 'No points earned'}</li>
                    <li>
                      {t.annualRedeemCap === 0
                        ? 'Cannot redeem'
                        : `Redeem up to ${t.annualRedeemCap.toLocaleString()} pts/yr`}
                    </li>
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Redeem catalogue */}
      <section className="pb-14">
        <div className="wrap">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-navy">
            <Receipt size={22} strokeWidth={2} />
            Redeem for
          </h2>
          <p className="mt-2 max-w-[60ch] text-ink-soft">
            Subscription credit is the hero reward. Smaller perks are zero-cost to
            us, so you can redeem them without spending much balance.
          </p>

          <div className="mt-6 grid gap-3 nav:grid-cols-3">
            {CATALOG.map((perk) => (
              <div key={perk.id} className="card-v2 flex flex-col gap-2">
                <b className="font-display text-[.96rem] text-navy">{perk.name}</b>
                <p className="text-[.84rem] text-ink-soft">{perk.desc}</p>
                <div className="mt-auto flex items-center gap-1.5 font-mono text-[.84rem] text-forest">
                  <Coins size={14} strokeWidth={2} />
                  {perk.pts.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safeguards */}
      <section className="pb-14">
        <div className="wrap">
          <h2 className="text-2xl font-bold text-navy">Safeguards</h2>
          <ul className="mt-6 space-y-2.5">
            {SAFEGUARDS.map((s) => (
              <li key={s} className="flex gap-2.5 text-ink-soft">
                <ShieldCheck size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-forest" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20">
        <div className="wrap">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-forest p-8 nav:p-10">
            <div>
              <h2 className="text-2xl font-bold text-white">Ready to earn?</h2>
              <p className="mt-1 text-white/80">
                Free for groups up to 10 members. No card required.
              </p>
            </div>
            {isAuthenticated ? (
              <Link to="/rewards" className="btn btn-white">
                Open Rewards Marketplace
              </Link>
            ) : (
              <Link to="/register" className="btn btn-white">
                Create your chama
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}