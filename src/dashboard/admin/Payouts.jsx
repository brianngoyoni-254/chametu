import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

const ORDER = ['Brian N.', 'Jane W.', 'Kevin M.', 'Mary N.', 'David O.', 'Alice K.']
const CONTRIBUTION_PER_MEMBER = 10000

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

export default function Payouts() {
  const [cursor, setCursor] = useState(0) // index of current recipient
  const [history, setHistory] = useState([]) // completed payouts, newest first

  const payout = CONTRIBUTION_PER_MEMBER * ORDER.length
  const current = ORDER[cursor % ORDER.length]
  const next = ORDER[(cursor + 1) % ORDER.length]
  const cycleComplete = history.length >= ORDER.length

  function completePayout() {
    const today = new Date()
    const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    setHistory((h) => [{ member: current, date: label, amount: payout }, ...h])
    setCursor((c) => c + 1)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl text-navy">Payout Rotation</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Merry‑go‑round · {fmt(CONTRIBUTION_PER_MEMBER)} per member · {ORDER.length} members · monthly cycle
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="text-xs text-ink-soft">Current recipient</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-navy">{current}</div>
          <div className="mt-2 font-mono text-lg text-gold">{fmt(payout)}</div>
          {!cycleComplete ? (
            <button
              onClick={completePayout}
              className="mt-4 flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
            >
              <RefreshCw size={15} /> Mark payout complete &amp; rotate
            </button>
          ) : (
            <p className="mt-4 text-sm font-semibold text-emerald">Every member has received a payout this cycle.</p>
          )}
        </div>

        <div className="rounded-xl border border-line bg-white p-5">
          <div className="text-xs text-ink-soft">Next recipient</div>
          <div className="mt-1.5 font-display text-2xl font-bold text-navy">{cycleComplete ? '—' : next}</div>
          <div className="mt-2 text-xs text-ink-soft">{cycleComplete ? 'Cycle complete — start a new one next month' : 'Due after the next rotation'}</div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <h3 className="mb-3.5 text-sm font-semibold text-navy">Rotation order</h3>
        <div className="flex flex-wrap gap-2">
          {ORDER.map((m, i) => {
            const done = i < cursor
            const isCurrent = i === cursor && !cycleComplete
            return (
              <span
                key={m}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isCurrent
                    ? 'bg-forest text-white'
                    : done
                      ? 'bg-[#E9F5EF] text-forest'
                      : 'bg-paper text-ink-soft'
                }`}
              >
                {m}
              </span>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-line bg-white p-5">
        <h3 className="mb-3.5 text-sm font-semibold text-navy">Payout history</h3>
        {history.length === 0 ? (
          <p className="text-sm text-ink-soft">No payouts recorded yet this cycle.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Member</th>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i} className="border-b border-line last:border-none">
                  <td className="py-2.5">{h.member}</td>
                  <td className="py-2.5 text-ink-soft">{h.date}</td>
                  <td className="py-2.5 font-mono">{fmt(h.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}