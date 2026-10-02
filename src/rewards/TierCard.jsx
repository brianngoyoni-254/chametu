import { Coins, Crown, CalendarClock, ArrowUpCircle } from 'lucide-react'
import { useTier } from '../context/TierContext'
import { usePoints } from '../context/PointsContext'
import { nextTier } from '../lib/tiers'

export default function TierCard({ onUpgrade }) {
  const { tier, isTrial, trialExpiresAt, order } = useTier()
  const { balance, state } = usePoints()

  const oldestExpiry = state.lots.length
    ? new Date(Math.min(...state.lots.map((l) => l.exp)))
    : null
  const next = nextTier(tier)
  const canUpgrade = next && order.indexOf(next) > order.indexOf(tier)

  return (
    <div className="bg-white border border-line rounded-2xl p-5 min-w-[240px] flex flex-col gap-2.5 shadow-sm">
      <div className="flex items-center gap-2 text-[0.78rem] text-ink-soft">
        <Crown size={16} strokeWidth={2} />
        <span>{tier} plan{isTrial ? ' · trial' : ''}</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <Coins size={26} strokeWidth={1.75} className="self-center text-forest" />
        <span className="font-display font-extrabold text-3xl text-navy">{balance.toLocaleString()}</span>
        <span className="text-sm text-ink-soft">pts</span>
      </div>

      <div className="flex items-center gap-1.5 text-[0.78rem] text-ink-soft">
        <CalendarClock size={14} strokeWidth={2} />
        {isTrial && trialExpiresAt ? (
          <span>Trial ends {new Date(trialExpiresAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}</span>
        ) : oldestExpiry ? (
          <span>Oldest points expire {oldestExpiry.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        ) : (
          <span>No active points</span>
        )}
      </div>

      {canUpgrade && onUpgrade && (
        <button
          onClick={onUpgrade}
          className="inline-flex items-center justify-center gap-1.5 mt-1 px-3.5 py-2 rounded-xl border border-forest text-forest font-semibold text-sm hover:bg-forest/5 transition"
        >
          <ArrowUpCircle size={16} strokeWidth={2} />
          Upgrade to {next}
        </button>
      )}
    </div>
  )
}
