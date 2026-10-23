// src/rewards/components/PerkCard.jsx
import { useState } from 'react'
import {
  BadgeCheck, FileText, Sparkles, Ticket, Gift, Loader2, Check, X, Copy,
} from 'lucide-react'
import { toast } from 'sonner'

const ICONS = { BadgeCheck, FileText, Sparkles, Ticket, Gift }

export default function PerkCard({ perk, balance, tierCap, redeemedThisYear, onRedeem }) {
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState(null)

  const Icon = ICONS[perk.icon] || Gift
  const room = Math.max(0, tierCap - redeemedThisYear)
  const affordable = perk.pts <= balance && perk.pts <= room

  const handle = async () => {
    if (!affordable) {
      if (tierCap === 0) toast.error('Upgrade to redeem rewards')
      else if (perk.pts > room) toast.error(`Annual cap reached — ${room} pts left`)
      else toast.error('Not enough points')
      return
    }
    setBusy(true)
    const res = await onRedeem(perk.id)
    setBusy(false)
    if (res?.ok) {
      setReceipt({ perk: res.perk, code: res.code })
      toast.success(`Redeemed ${perk.name}`)
    } else {
      toast.error(res?.reason || 'Redemption failed')
    }
  }

  const copy = (code) => {
    navigator.clipboard?.writeText(code).then(() => toast.success('Code copied'))
  }

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald/10 text-forest">
            <Icon size={18} />
          </span>
          <span className="font-mono text-sm font-semibold text-navy">
            {perk.pts.toLocaleString()} pts
          </span>
        </div>
        <h3 className="mt-3 font-display text-[1rem] font-semibold text-navy">
          {perk.name}
        </h3>
        <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
          {perk.desc}
        </p>
        {perk.cashKsh > 0 && (
          <p className="mt-2 text-[0.74rem] font-semibold text-[#8A6417]">
            Worth KSh {perk.cashKsh.toLocaleString()}
          </p>
        )}
        <button
          onClick={handle}
          disabled={busy}
          className={`mt-4 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
            affordable
              ? 'bg-forest text-white hover:bg-forest-dark disabled:opacity-55'
              : 'cursor-not-allowed bg-paper text-ink-soft'
          }`}
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {affordable ? 'Redeem' : 'Not enough points'}
        </button>
      </div>

      {receipt && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setReceipt(null)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h3 className="font-display font-semibold text-navy">Reward redeemed</h3>
              <button
                onClick={() => setReceipt(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald/15 text-forest">
                <Check size={22} />
              </div>
              <p className="mt-3 font-semibold text-navy">{receipt.perk.name}</p>
              <p className="text-[0.82rem] text-ink-soft">
                {receipt.perk.pts.toLocaleString()} points deducted
              </p>
              <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-line bg-paper px-3.5 py-2.5">
                <span className="font-mono text-sm text-navy">{receipt.code}</span>
                <button
                  onClick={() => copy(receipt.code)}
                  className="flex items-center gap-1 text-xs font-semibold text-forest"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>
            <div className="border-t border-line bg-paper/40 px-5 py-3 text-right">
              <button
                onClick={() => setReceipt(null)}
                className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}