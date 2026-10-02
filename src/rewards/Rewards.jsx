import { Coins } from 'lucide-react'
import { usePoints } from '../context/PointsContext'
import { useTier } from '../context/TierContext'
import { CATALOG } from '../lib/catalog'
import { nextTier } from '../lib/tiers'
import PerkCard from './components/PerkCard'
import TierCard from './TierCard'

export default function Rewards() {
  const { balance, redeemedThisYear, redeem } = usePoints()
  const { tier, config, upgrade, order } = useTier()

  const handleUpgrade = () => {
    const next = nextTier(tier)
    if (!next || order.indexOf(next) <= order.indexOf(tier)) return
    upgrade(next)
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Rewards Marketplace</h1>
          <p className="mt-1.5 text-ink-soft max-w-[52ch]">
            Redeem points for subscription credit, templates and recognition. Points are never cash and never touch your chama's funds.
          </p>
        </div>
        <TierCard onUpgrade={handleUpgrade} />
      </header>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald/10 text-navy text-[0.86rem]">
        <Coins size={16} strokeWidth={2} className="text-forest" />
        <span>
          <b>{redeemedThisYear.toLocaleString()}</b> / {config.annualRedeemCap.toLocaleString()} points redeemed in {new Date().getFullYear()} on {tier}.
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5 mt-4">
        {CATALOG.map((perk) => (
          <PerkCard
            key={perk.id}
            perk={perk}
            balance={balance}
            tierCap={config.annualRedeemCap}
            redeemedThisYear={redeemedThisYear}
            onRedeem={redeem}
          />
        ))}
      </div>
    </div>
  )
}