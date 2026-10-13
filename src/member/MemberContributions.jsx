import { useState } from 'react'
import { Smartphone, Check, Clock, Info } from 'lucide-react'
import { getMemberSession, getChama, getMemberFinance } from '../lib/chametuStorage'

function fmt(n) {
  return 'KSh ' + Math.round(n).toLocaleString('en-KE')
}

const badge = {
  done: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
  pending: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
  overdue: 'bg-red-50 text-red-600 ring-1 ring-red-100',
}
const label = { done: 'Paid', pending: 'Pending', overdue: 'Overdue' }

const HISTORY = [
  { month: 'August 2026', amount: 5000, status: 'done' },
  { month: 'July 2026', amount: 5000, status: 'done' },
  { month: 'June 2026', amount: 5000, status: 'done' },
]

export default function MemberContributions() {
  const session = getMemberSession()
  const chama = getChama()
  const [finance, setFinance] = useState(getMemberFinance(session))
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(finance.contributions.status === 'done')

  const pct = Math.min(
    100,
    Math.round((finance.contributions.paid / finance.contributions.expected) * 100)
  )

  function payNow() {
    setPaying(true)
    setTimeout(() => {
      setFinance((f) => ({
        ...f,
        contributions: {
          ...f.contributions,
          paid: f.contributions.expected,
          status: 'done',
        },
      }))
      setPaid(true)
      setPaying(false)
    }, 1200)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Contributions</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          {chama.name} · due on the {chama.due}th each month
        </p>
      </div>

      {/* Hero card */}
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
              {fmt(finance.contributions.expected)}
            </div>
            <div className="mt-1 text-[0.78rem] text-ink-soft">
              {paid ? 'Fully settled ✓' : `${fmt(finance.contributions.paid)} paid so far`}
            </div>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-widest ${
              badge[finance.contributions.status]
            }`}
          >
            {label[finance.contributions.status]}
          </span>
        </div>

        {/* Progress */}
        <div className="relative mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[0.7rem] text-ink-soft">
            <span>{pct}% complete</span>
            <span>
              Balance {fmt(Math.max(0, finance.contributions.expected - finance.contributions.paid))}
            </span>
          </div>
        </div>

        {!paid ? (
          <button
            onClick={payNow}
            disabled={paying}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,122,90,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Smartphone size={15} />
            {paying ? 'Sending STK push…' : `Pay ${fmt(finance.contributions.expected)} via M-Pesa`}
          </button>
        ) : (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald/10 py-3.5 text-sm font-semibold text-forest ring-1 ring-emerald/20">
            <Check size={16} />
            Paid for this month
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Payments made after the due date attract a small late fee, as agreed by your chama. If
          you've already paid and this hasn't updated, contact your treasurer.
        </span>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <Clock size={14} className="text-ink-soft" />
          Payment history
        </h3>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-2.5">Month</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr
                  key={h.month}
                  className="border-b border-line last:border-none transition hover:bg-forest/[0.02]"
                >
                  <td className="px-4 py-3 font-medium text-navy">{h.month}</td>
                  <td className="px-4 py-3 font-mono text-navy">
                    {h.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${
                        badge[h.status]
                      }`}
                    >
                      {label[h.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}