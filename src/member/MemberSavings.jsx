// src/member/MemberSavings.jsx
import { PiggyBank, TrendingUp, Info, Loader2, Clock } from 'lucide-react'
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

export default function MemberSavings() {
  const { savings, savingsHistory, isLoading } = useMember()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">My Savings</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Your accumulated balance in the chama
        </p>
      </div>

      {/* Hero balance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg sm:p-7">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(380px 220px at 95% -10%, rgba(16,185,129,0.4), transparent)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest text-emerald/80">
            <PiggyBank size={12} />
            Total savings
          </div>
          <div className="mt-3 font-display font-mono text-3xl font-bold tracking-tight sm:text-4xl">
            {fmt(savings)}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[0.8rem] text-white/70">
            <TrendingUp size={13} className="text-emerald" />
            Grows automatically with every contribution
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Your savings form the base for your loan limit. Withdrawals require approval from the
          chama committee.
        </span>
      </div>

      {/* History */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-navy">
          Savings history
        </h3>

        {isLoading && savingsHistory.length === 0 ? (
          <div className="py-10 text-center">
            <Loader2 className="mx-auto animate-spin text-forest" size={22} />
          </div>
        ) : savingsHistory.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <Clock size={20} className="mx-auto text-ink-soft/60" />
            <p className="mt-2 text-sm text-ink-soft">No savings activity yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Note</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  <th className="px-4 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {savingsHistory.map((h) => {
                  const isWithdrawal = h.kind === 'withdrawal'
                  return (
                    <tr
                      key={h.id}
                      className="border-b border-line last:border-none transition hover:bg-forest/[0.02]"
                    >
                      <td className="px-4 py-3 text-ink-soft">{fmtDate(h.createdAt)}</td>
                      <td className="px-4 py-3 capitalize font-medium text-navy">{h.kind}</td>
                      <td className="px-4 py-3 text-ink-soft">{h.note || '—'}</td>
                      <td
                        className={`px-4 py-3 text-right font-mono font-semibold ${
                          isWithdrawal ? 'text-red-600' : 'text-emerald'
                        }`}
                      >
                        {isWithdrawal ? '−' : '+'}
                        {Number(h.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-navy">
                        {Number(h.balanceAfter || 0).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}