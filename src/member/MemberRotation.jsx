// src/member/MemberRotation.jsx
import {
  Trophy, Users, RefreshCw, Clock, History, Info, Sparkles, Loader2,
} from 'lucide-react'
import { useMember } from '../context/MemberContext'

function fmt(n) {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE')
}

/**
 * Match names the backend returns (full name) against the logged-in member.
 * We compare case-insensitively and also accept "First Last" vs "First L." forms.
 */
function matchesMe(candidateName, myName) {
  if (!candidateName || !myName) return false
  const a = candidateName.trim().toLowerCase()
  const b = myName.trim().toLowerCase()
  if (a === b) return true

  // Compare first name + first letter of last name
  const [firstA, ...restA] = a.split(' ')
  const [firstB, ...restB] = b.split(' ')
  if (firstA !== firstB) return false
  if (!restA.length || !restB.length) return firstA === firstB
  return restA[0][0] === restB[0][0]
}

export default function MemberRotation() {
  const { profile, chama, shared, isLoading } = useMember()
  const payout = shared?.payout

  const order = payout?.order || []
  const cursor = payout?.cursor || 0
  const contributionPerMember =
    payout?.contributionPerMember ?? chama?.monthly_contribution ?? 0
  const history = payout?.history || []

  const cycleComplete = order.length > 0 && history.length >= order.length
  const currentMemberName = cycleComplete ? null : order[cursor % Math.max(order.length, 1)]
  const nextMemberName = cycleComplete
    ? null
    : order[(cursor + 1) % Math.max(order.length, 1)]

  const totalPayout = contributionPerMember * order.length
  const myName = profile?.name || ''
  const myIndex = order.findIndex((n) => matchesMe(n, myName))
  const isMyTurn = myIndex >= 0 && myIndex === cursor && !cycleComplete
  const positionsAhead = myIndex >= 0 && myIndex > cursor ? myIndex - cursor : 0

  if (isLoading && !payout) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={26} className="animate-spin text-forest" />
      </div>
    )
  }

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
              {cycleComplete
                ? 'Cycle complete'
                : currentMemberName || 'Not configured'}
            </div>
            {!cycleComplete && totalPayout > 0 && (
              <div className="mt-1 font-mono text-lg text-gold">
                {fmt(totalPayout)}
              </div>
            )}
          </div>

          <div className="sm:border-l sm:border-white/15 sm:pl-5">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-white/50">
              <Users size={12} />
              Up next
            </div>
            <div className="mt-2 font-display text-2xl font-bold tracking-tight text-white/90">
              {cycleComplete ? '—' : nextMemberName || '—'}
            </div>
            <div className="mt-1 text-[0.74rem] text-white/60">
              {cycleComplete
                ? 'New cycle starts next month'
                : nextMemberName
                ? 'After the current payout'
                : 'Rotation not yet set up'}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state — no rotation configured */}
      {order.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <RefreshCw size={26} className="mx-auto text-ink-soft/40" />
          <p className="mt-3 text-sm font-semibold text-navy">
            Payout rotation not set up yet
          </p>
          <p className="mt-1 text-[0.82rem] text-ink-soft">
            Your committee hasn't configured the rotation order. Ask your
            treasurer to set it up.
          </p>
        </div>
      )}

      {/* My position callout */}
      {myIndex >= 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald/30 bg-emerald/[0.06] p-4 ring-1 ring-emerald/10">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-emerald/15 text-forest">
            <Sparkles size={15} />
          </span>
          <div className="min-w-0">
            <div className="text-[0.86rem] font-semibold text-navy">
              Your position in the rotation
            </div>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              You're <b className="text-navy">#{myIndex + 1}</b> of {order.length}.
              {isMyTurn && (
                <>
                  {' '}
                  <b className="text-forest">It's your turn this cycle.</b>
                </>
              )}
              {positionsAhead > 0 && (
                <>
                  {' '}
                  You'll receive after {positionsAhead} more payout
                  {positionsAhead > 1 ? 's' : ''}.
                </>
              )}
              {cycleComplete && (
                <>
                  {' '}
                  This cycle is complete — a new one will start soon.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Roster */}
      {order.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-display text-sm font-semibold text-navy">
            Rotation roster
          </h3>
          <div className="space-y-2">
            {order.map((name, i) => {
              const done = i < cursor
              const isCurrent = i === cursor && !cycleComplete
              const isMe = matchesMe(name, myName)
              return (
                <div
                  key={`${name}-${i}`}
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
                        {name}
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
      )}

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
                    <td className="px-4 py-3 font-medium text-navy">
                      {h.member}
                    </td>
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
          The rotation order is set by the committee. Contact your treasurer if
          you have questions about your position.
        </span>
      </div>
    </div>
  )
}