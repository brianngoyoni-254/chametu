import { Trophy, Users, RefreshCw, Clock, History, Info, Sparkles } from 'lucide-react'
import { useSharedState, SHARED_KEYS, DEFAULT_PAYOUT } from '../lib/chametuShared'
import { getMemberSession } from '../lib/chametuStorage'

function fmt(n) {
  return 'KSh ' + Number(n).toLocaleString('en-KE')
}

function shortName(full) {
  if (!full) return ''
  const parts = full.trim().split(' ')
  return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : full
}

export default function MemberRotation() {
  const session = getMemberSession()
  const [state] = useSharedState(SHARED_KEYS.payout, DEFAULT_PAYOUT)
  const { order, cursor, contributionPerMember, history } = state

  const payout = contributionPerMember * order.length
  const current = order[cursor % order.length]
  const next = order[(cursor + 1) % order.length]
  const cycleComplete = history.length >= order.length
  const myName = shortName(session?.name || '')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Payout Rotation</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Merry-go-round order · {fmt(contributionPerMember)} per member · monthly cycle
        </p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(400px 250px at 95% -10%, rgba(16,185,129,0.35), transparent)',
          }}
        />
        <div className="relative grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-emerald/80">
              <Trophy size={12} />
              Receiving this cycle
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight">
              {cycleComplete ? 'Cycle complete' : current}
            </div>
            {!cycleComplete && (
              <div className="mt-1 font-mono text-lg text-gold">{fmt(payout)}</div>
            )}
          </div>

          <div className="sm:border-l sm:border-white/15 sm:pl-5">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-white/50">
              <Users size={12} />
              Up next
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight text-white/90">
              {cycleComplete ? '—' : next}
            </div>
            <div className="mt-1 text-[0.74rem] text-white/60">
              {cycleComplete ? 'New cycle starts next month' : 'After the current payout'}
            </div>
          </div>
        </div>
      </div>

      {/* My position callout */}
      {myName && order.includes(myName) && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald/30 bg-emerald/[0.06] p-4 ring-1 ring-emerald/10">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-emerald/15 text-forest">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0">
            <div className="text-[0.86rem] font-semibold text-navy">
              Your position in the rotation
            </div>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              You're <b className="text-navy">#{order.indexOf(myName) + 1}</b> of {order.length}.
              {order.indexOf(myName) === cursor && !cycleComplete && (
                <>
                  {' '}
                  <b className="text-forest">It's your turn this cycle.</b>
                </>
              )}
              {order.indexOf(myName) > cursor && (
                <>
                  {' '}
                  You'll receive after {order.indexOf(myName) - cursor} more payout
                  {order.indexOf(myName) - cursor > 1 ? 's' : ''}.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Roster */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-navy">
          Rotation roster
        </h3>
        <div className="space-y-2">
          {order.map((m, i) => {
            const done = i < cursor
            const isCurrent = i === cursor && !cycleComplete
            const isMe = m === myName
            return (
              <div
                key={m + i}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  isCurrent
                    ? 'border-forest/40 bg-gradient-to-r from-forest/[0.08] to-transparent'
                    : 'border-line'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-full font-mono text-[0.72rem] font-bold ${
                      isCurrent
                        ? 'bg-gradient-to-br from-forest to-emerald text-white'
                        : done
                          ? 'bg-emerald/10 text-forest'
                          : 'bg-paper text-ink-soft'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 text-[0.88rem] font-medium text-navy">
                      {m}
                      {isMe && (
                        <span className="rounded-full bg-navy px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[0.72rem] text-ink-soft">
                      {isCurrent
                        ? 'Receiving this cycle'
                        : done
                          ? 'Already received'
                          : 'Awaiting turn'}
                    </div>
                  </div>
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${
                    isCurrent
                      ? 'bg-forest text-white'
                      : done
                        ? 'bg-emerald/10 text-forest'
                        : 'bg-paper text-ink-soft'
                  }`}
                >
                  {isCurrent ? 'Current' : done ? '✓ Paid' : 'Pending'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payout history */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <History size={14} className="text-ink-soft" />
          Payout history
        </h3>
        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <Clock size={20} className="mx-auto text-ink-soft/60" />
            <p className="mt-2 text-sm text-ink-soft">
              No payouts yet this cycle.
            </p>
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

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          The rotation order is set by the committee. Contact your treasurer if you have questions
          about your position.
        </span>
      </div>
    </div>
  )
}