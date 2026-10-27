// src/member/MemberContributions.jsx
import { Smartphone, Check, Clock, Info, Loader2 } from 'lucide-react'
import { useMember } from '../context/MemberContext'

function fmt(n) {
  return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE')
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const badge = {
  done: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
  pending: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
  overdue: 'bg-red-50 text-red-600 ring-1 ring-red-100',
}
const label = { done: 'Paid', pending: 'Pending', overdue: 'Overdue' }

export default function MemberContributions() {
  const { chama, contributions, isLoading } = useMember()

  const expected = Number(chama?.monthly_contribution || 0)
  const paid = contributions.reduce((s, c) => s + Number(c.amount || 0), 0)
  const pct = expected ? Math.min(100, Math.round((paid / expected) * 100)) : 0
  const isPaid = expected > 0 && paid >= expected
  const balance = Math.max(0, expected - paid)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Contributions</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          {chama?.name || 'Your chama'} / due on the {chama?.due_day || 30}th each month
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full opacity-50"
          style={{
            background:
              'radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[0.7rem] font-semibold uppercase tracking-widest text-ink-soft">
              This month
            </div>
            <div className="mt-1.5 font-display font-mono text-3xl font-bold tracking-tight text-navy">
              {fmt(expected)}
            </div>
            <div className="mt-1 text-[0.78rem] text-ink-soft">
              {isPaid ? 'Fully settled' : `${fmt(paid)} paid so far`}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest ${
              isPaid ? badge.done : badge.pending
            }`}
          >
            {isPaid ? label.done : label.pending}
          </span>
        </div>

        <div className="relative mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-soft">
            <span>{pct}% complete</span>
            <span>Balance {fmt(balance)}</span>
          </div>
        </div>

        {!isPaid && expected > 0 ? (
          <button
            onClick={() =>
              // TODO: replace with real STK push endpoint when M-Pesa is wired
              alert('M-Pesa payment coming soon. For now, contact your treasurer.')
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,122,90,0.25)] transition hover:-translate-y-0.5"
          >
            <Smartphone size={15} />
            Pay {fmt(balance)} via M-Pesa
          </button>
        ) : isPaid ? (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald/10 py-3.5 text-sm font-semibold text-forest ring-1 ring-emerald/20">
            <Check size={16} />
            Paid for this month
          </div>
        ) : (
          <div className="mt-5 flex items-center justify-center rounded-2xl bg-paper py-3.5 text-sm text-ink-soft">
            No contribution schedule configured
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Payments made after the due date attract a small late fee, as agreed by your chama. If
          you have already paid and this has not updated, contact your treasurer.
        </span>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <Clock size={14} className="text-ink-soft" />
          Payment history
        </h3>

        {isLoading && contributions.length === 0 ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto animate-spin text-forest" size={22} />
          </div>
        ) : contributions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <Clock size={20} className="mx-auto text-ink-soft/60" />
            <p className="mt-2 text-sm text-ink-soft">No payments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-none transition hover:bg-forest/[0.02]"
                  >
                    <td className="px-4 py-3 text-ink-soft">{fmtDate(c.created_at)}</td>
                    <td className="px-4 py-3 text-navy">{c.reference || '—'}</td>
                    <td className="px-4 py-3 font-mono text-navy">
                      {Number(c.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block rounded-full bg-emerald/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-forest">
                        Paid
                      </span>
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