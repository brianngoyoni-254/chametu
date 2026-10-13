import { RefreshCw, Users, Trophy, Calendar, History } from 'lucide-react'
import { useSharedState, SHARED_KEYS, DEFAULT_PAYOUT } from '../../lib/chametuShared'

function fmt(n) {
  return 'KSh ' + Number(n).toLocaleString('en-KE')
}

export default function Payouts() {
  const [state, setState] = useSharedState(SHARED_KEYS.payout, DEFAULT_PAYOUT)
  const { order, cursor, contributionPerMember, history } = state

  const payout = contributionPerMember * order.length
  const current = order[cursor % order.length]
  const next = order[(cursor + 1) % order.length]
  const cycleComplete = history.length >= order.length

  function completePayout() {
    const today = new Date()
    const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    setState((s) => ({
      ...s,
      cursor: s.cursor + 1,
      history: [
        { member: current, date: label, amount: payout, ts: Date.now() },
        ...s.history,
      ],
    }))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Payout Rotation</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Merry-go-round · {fmt(contributionPerMember)} per member · {order.length} members · monthly
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3.5 md:grid-cols-1">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-5 text-white shadow-md">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(300px 200px at 100% 0%, rgba(16,185,129,0.35), transparent)',
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-emerald/80">
              <Trophy size={12} />
              Current recipient
            </div>
            <div className="mt-2 font-display text-2xl font-bold">{current}</div>
            <div className="mt-1 font-mono text-lg text-gold">{fmt(payout)}</div>
            {!cycleComplete ? (
              <button
                onClick={completePayout}
                className="mt-4 flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                <RefreshCw size={15} /> Mark paid &amp; rotate
              </button>
            ) : (
              <p className="mt-4 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-semibold">
                Every member received a payout this cycle.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-ink-soft">
            <Users size={12} />
            Next recipient
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-navy">
            {cycleComplete ? '—' : next}
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            {cycleComplete
              ? 'Cycle complete — start a new one next month'
              : 'Due after the next rotation'}
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-navy">Rotation order</h3>
        <div className="flex flex-wrap gap-2">
          {order.map((m, i) => {
            const done = i < cursor
            const isCurrent = i === cursor && !cycleComplete
            return (
              <span
                key={m + i}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  isCurrent
                    ? 'bg-gradient-to-br from-forest to-emerald text-white shadow-sm'
                    : done
                      ? 'bg-emerald/10 text-forest ring-1 ring-emerald/20'
                      : 'bg-paper text-ink-soft'
                }`}
              >
                {isCurrent && '▶ '}
                {m}
                {done && ' ✓'}
              </span>
            )
          })}
        </div>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <History size={14} className="text-ink-soft" />
          Payout history
        </h3>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <Calendar size={20} className="mx-auto text-ink-soft/60" />
            <p className="mt-2 text-sm text-ink-soft">No payouts recorded yet this cycle.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Member</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i} className="border-b border-line last:border-none">
                    <td className="px-4 py-3 font-medium text-navy">{h.member}</td>
                    <td className="px-4 py-3 text-ink-soft">{h.date}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-navy">
                      {fmt(h.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}