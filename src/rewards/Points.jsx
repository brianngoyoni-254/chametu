// src/rewards/Points.jsx
import {
  Coins, Receipt, CalendarCheck, Sparkles, ArrowUpCircle, Users,
  Loader2,
} from 'lucide-react'
import { usePoints } from '../context/PointsContext'
import { useTier } from '../context/TierContext'
import { nextTier } from '../lib/tiers'

export default function Points() {
  const { balance, state, redeemedThisYear, loading, refresh } = usePoints()
  const { tier, isTrial, order, upgrade } = useTier()

  const handleUpgrade = async () => {
    const next = nextTier(tier)
    if (!next || order.indexOf(next) <= order.indexOf(tier)) return
    await upgrade(next)
    await refresh()
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="animate-spin text-forest" size={26} />
      </div>
    )
  }

  const actions = [
    { icon: CalendarCheck, label: 'Paid KSh 500 on time',   note: 'contribution' },
    { icon: CalendarCheck, label: 'Paid KSh 1,000 on time', note: 'contribution' },
    { icon: Sparkles,      label: 'Annual prepay',          note: 'prepay' },
    { icon: ArrowUpCircle, label: 'Upgrade tier',           note: 'upgrade' },
    { icon: Users,         label: 'Referral paid',          note: 'referral' },
  ]

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="mb-5">
        <h1 className="font-display font-bold text-2xl text-navy">Chametu Points</h1>
        <p className="mt-1.5 text-ink-soft max-w-[60ch]">
          Earn points on the actions that keep your chama healthy.
          Redeem for subscription credit and digital rewards.
        </p>
      </header>

      <div className="grid grid-cols-1 hero:grid-cols-2 gap-3.5 mb-5">
        <div className="bg-white border border-line rounded-2xl p-5">
          <div className="flex items-center gap-2 text-[0.82rem] text-ink-soft">
            <Coins size={18} strokeWidth={2} />
            <span>{tier} plan{isTrial ? ' · trial' : ''}</span>
          </div>
          <div className="font-display font-extrabold text-4xl text-navy mt-2 mb-1.5">
            {balance.toLocaleString()}
          </div>
          <div className="text-[0.84rem] text-ink-soft">
            points · worth <b className="text-forest">
              KSh {(balance / 10).toLocaleString()}
            </b> in subscription credit
          </div>
          <div className="text-[0.84rem] text-ink-soft mt-1">
            {redeemedThisYear.toLocaleString()} redeemed in {new Date().getFullYear()}
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl p-5">
          <h3 className="font-display font-semibold text-navy text-[0.98rem] mb-2.5">
            Simulate an earning event
          </h3>
          <div className="flex flex-col gap-2">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.note === 'upgrade' ? handleUpgrade : undefined}
                disabled={a.note !== 'upgrade'}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white text-left text-sm font-medium text-navy hover:border-forest transition disabled:opacity-50 disabled:cursor-not-allowed"
                title={a.note !== 'upgrade' ? 'Triggered by real finance events' : ''}
              >
                <a.icon size={14} strokeWidth={2} className="text-forest" />
                {a.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[0.72rem] text-ink-soft">
            Points are granted server-side when the matching finance event
            commits. Only tier upgrades can be triggered manually.
          </p>
        </div>
      </div>

      <h2 className="flex items-center gap-2 font-display font-semibold text-navy text-[1.05rem] mb-3">
        <Receipt size={20} strokeWidth={2} />
        Points ledger
      </h2>

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.86rem]">
            <thead>
              <tr className="text-ink-soft text-[0.72rem] uppercase tracking-wider">
                <th className="text-left px-4 py-3 border-b border-line font-semibold">Date</th>
                <th className="text-left px-4 py-3 border-b border-line font-semibold">Event</th>
                <th className="text-left px-4 py-3 border-b border-line font-semibold">Points</th>
                <th className="text-left px-4 py-3 border-b border-line font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {state.ledger.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-ink-soft">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                state.ledger.map((l) => (
                  <tr key={l.id} className="hover:bg-forest/[0.03]">
                    <td className="px-4 py-3 border-b border-line">
                      {new Date(l.t).toLocaleDateString('en-KE', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 border-b border-line font-mono text-[0.82rem] text-ink-soft">
                      {l.ev}
                    </td>
                    <td className={`px-4 py-3 border-b border-line font-semibold ${
                      l.pts > 0 ? 'text-forest'
                      : l.pts < 0 ? 'text-red-600' : 'text-ink-soft'
                    }`}>
                      {l.pts > 0 ? '+' : ''}{l.pts}
                    </td>
                    <td className="px-4 py-3 border-b border-line text-ink-soft">{l.note}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}