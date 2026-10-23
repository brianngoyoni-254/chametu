// src/rewards/Rewards.jsx
import { Coins, Loader2 } from 'lucide-react'
import { usePoints } from '../context/PointsContext'
import { useTier } from '../context/TierContext'
import PerkCard from './components/PerkCard'
import TierCard from './TierCard'

export default function Rewards() {
  const { balance, redeemedThisYear, redeem, catalog, loading, refresh } = usePoints()
  const { tier, config, baseConfig, upgrade } = useTier()

  const cap = baseConfig?.annualRedeemCap ?? config?.annualRedeemCap ?? 0

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="animate-spin text-forest" size={26} />
      </div>
    )
  }

  const handleRedeem = async (perkId) => {
    const res = await redeem(perkId)
    if (res.ok) await refresh()
    return res
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Rewards Marketplace</h1>
          <p className="mt-1.5 text-ink-soft max-w-[52ch]">
            Redeem points for subscription credit, templates and recognition.
            Points are never cash and never touch your chama's funds.
          </p>
        </div>
        <TierCard onUpgrade={(next) => upgrade(next)} />
      </header>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald/10 text-navy text-[0.86rem]">
        <Coins size={16} strokeWidth={2} className="text-forest" />
        <span>
          <b>{redeemedThisYear.toLocaleString()}</b> / {cap.toLocaleString()}
          {' '}points redeemed in {new Date().getFullYear()} on {tier}.
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5 mt-4">
        {catalog.map((perk) => (
          <PerkCard
            key={perk.id}
            perk={perk}
            balance={balance}
            tierCap={cap}
            redeemedThisYear={redeemedThisYear}
            onRedeem={handleRedeem}
          />
        ))}
        {catalog.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-line bg-white p-10 text-center text-ink-soft">
            No rewards available right now.
          </div>
        )}
      </div>
    </div>
  )
}