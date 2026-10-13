import { ArrowRightLeft, Info } from 'lucide-react'
import { getMemberSession, getMemberTransactions } from '../lib/chametuStorage'

export default function MemberTransactions() {
  const session = getMemberSession()
  const tx = getMemberTransactions(session)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Transactions</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Everything that has happened on your account
        </p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        {tx.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <ArrowRightLeft size={22} className="mx-auto text-ink-soft/50" />
            <p className="mt-2 text-[0.86rem] text-ink-soft">
              No transactions recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {tx.map((t, i) => (
                  <tr
                    key={i}
                    className="border-b border-line last:border-none transition hover:bg-forest/[0.02]"
                  >
                    <td className="px-4 py-3 text-ink-soft">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-navy">{t.desc}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-semibold ${
                        t.amount > 0 ? 'text-emerald' : 'text-red-600'
                      }`}
                    >
                      {t.amount > 0 ? '+' : ''}
                      {t.amount.toLocaleString()}
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
          This is a read-only view of your own transactions. Contact your treasurer if something
          looks wrong.
        </span>
      </div>
    </div>
  )
}