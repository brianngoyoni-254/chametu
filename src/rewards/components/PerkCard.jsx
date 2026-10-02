import { useState } from 'react'
import * as Icons from 'lucide-react'
import { Coins } from 'lucide-react'

export default function PerkCard({ perk, balance, tierCap, redeemedThisYear, onRedeem }) {
  const Icon = Icons[perk.icon] ?? Coins
  const [msg, setMsg] = useState(null)
  const [ok, setOk] = useState(false)

  const affordable = balance >= perk.pts
  const withinCap = tierCap > 0 && redeemedThisYear + perk.pts <= tierCap
  const canRedeem = affordable && withinCap

  const handle = () => {
    const res = onRedeem(perk.id)
    setOk(Boolean(res?.ok))
    setMsg(res?.ok ? `Redeemed · code ${res.code}` : res?.reason ?? 'Could not redeem')
    setTimeout(() => setMsg(null), 4000)
  }

  const label = !affordable
    ? `Need ${(perk.pts - balance).toLocaleString()} more`
    : tierCap === 0
      ? 'Upgrade to redeem'
      : !withinCap
        ? 'Annual cap reached'
        : 'Redeem'

  return (
    <div className={`bg-white border border-line rounded-2xl p-5 flex flex-col gap-2.5 transition ${canRedeem ? 'hover:border-forest/60 hover:-translate-y-0.5' : 'opacity-60'}`}>
      <div className="flex items-center justify-between">
        <Icon size={26} strokeWidth={1.75} className="text-forest" />
        <span className="text-[0.72rem] text-ink-soft">{perk.costKsh === 0 ? 'Zero-cost' : `KSh ${perk.costKsh}`}</span>
      </div>
      <h3 className="font-display font-semibold text-navy text-base leading-snug">{perk.name}</h3>
      <p className="text-[0.86rem] text-ink-soft leading-relaxed">{perk.desc}</p>
      <div className="flex items-center gap-1.5 font-mono text-[0.84rem] text-navy mt-1">
        <Coins size={14} strokeWidth={2} />
        {perk.pts.toLocaleString()} pts
      </div>
      <button
        disabled={!canRedeem}
        onClick={handle}
        className={`mt-auto py-2.5 rounded-xl font-semibold text-sm transition ${canRedeem ? 'bg-forest text-white hover:bg-forest-dark' : 'bg-transparent border border-line text-ink-soft cursor-not-allowed'}`}
      >
        {label}
      </button>
      {msg && (
        <div className={`text-[0.78rem] px-2 py-1.5 rounded-md ${ok ? 'bg-emerald/10 text-forest' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}
    </div>
  )
}
