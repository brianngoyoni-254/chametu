import { Check, Minus } from 'lucide-react'
import { ORDER, TIERS } from '../lib/tiers'
import { CATALOG } from '../lib/catalog'

const ROWS = [
  { label: 'Monthly price', get: (t) => (t.price === 0 ? 'Free' : `KSh ${t.price.toLocaleString()}`) },
  { label: 'Max members', get: (t) => t.maxMembers.toLocaleString() },
  { label: 'Points earning', get: (t) => (t.pointsMultiplier > 0 ? 'Active' : 'None') },
  { label: 'Annual redemption cap', get: (t) => (t.annualRedeemCap === 0 ? '—' : `${t.annualRedeemCap.toLocaleString()} pts`) },
  { label: 'Cap value', get: (t) => (t.annualRedeemCap === 0 ? '—' : `KSh ${(t.annualRedeemCap / 10).toLocaleString()}`) },
]

export default function TierComparison() {
  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="mb-5">
        <h1 className="font-display font-bold text-2xl text-navy">Plans &amp; rewards</h1>
        <p className="mt-1.5 text-ink-soft max-w-[62ch]">
          Every paid tier earns points on subscription spend and can redeem up to its annual cap. The cap is the only gate — no hidden perk locks.
        </p>
      </header>

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.88rem]">
            <thead>
              <tr className="text-ink-soft text-[0.74rem] uppercase tracking-wider">
                <th className="text-left px-4 py-3.5 border-b border-line font-semibold"></th>
                {ORDER.map((name) => (
                  <th key={name} className="text-left px-4 py-3.5 border-b border-line font-semibold">{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3.5 border-b border-line font-semibold text-navy">{row.label}</td>
                  {ORDER.map((name) => (
                    <td key={name} className="px-4 py-3.5 border-b border-line text-ink-soft">{row.get(TIERS[name])}</td>
                  ))}
                </tr>
              ))}

              <tr>
                <td colSpan={ORDER.length + 1} className="px-4 py-2.5 bg-emerald/10 text-forest font-semibold text-[0.82rem] border-b border-line">
                  Rewards catalogue
                </td>
              </tr>

              {CATALOG.map((perk) => (
                <tr key={perk.id}>
                  <td className="px-4 py-3 border-b border-line font-medium text-navy">{perk.name}</td>
                  {ORDER.map((name) => {
                    const ok = TIERS[name].annualRedeemCap >= perk.pts
                    return (
                      <td key={name} className="px-4 py-3 border-b border-line text-center">
                        {ok ? (
                          <Check size={15} strokeWidth={2.25} className="inline-block text-forest" />
                        ) : (
                          <Minus size={15} strokeWidth={2} className="inline-block text-line" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
