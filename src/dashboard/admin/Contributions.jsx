import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'

const badge = {
  done: 'bg-[#E9F5EF] text-forest',
  partial: 'bg-[#FBF1E0] text-[#8A6417]',
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  overdue: 'bg-[#FBEAE8] text-red-600',
}

const fmt = (n) => 'KSh ' + Number(n).toLocaleString('en-KE')

export default function Contributions() {
  const { contributions, recordContribution, isLoadingMembers } = useChama()
  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)

  const rows = contributions?.members || []

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
  }, [rows, query])

  const collected = contributions?.totalCollected || 0
  const expected = contributions?.totalExpected || 0
  const pct = contributions?.pct || 0

  const handleMarkPaid = async (memberId, name, amount) => {
    setBusyId(memberId)
    const res = await recordContribution(memberId, amount, 'cash')
    setBusyId(null)
    if (res.ok) toast.success(`Recorded ${fmt(amount)} for ${name.split(' ')[0]}`)
    else toast.error(res.message)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Contributions</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {fmt(collected)} of {fmt(expected)} this month ({pct}%)
            {contributions?.period && (
              <span className="ml-2 text-[0.78rem] text-ink-soft">
                · {contributions.period}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-soft">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member…"
            className="w-44 bg-transparent outline-none placeholder:text-ink-soft"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Member</th>
              <th className="py-2">Expected</th>
              <th className="py-2">Paid</th>
              <th className="py-2">Balance</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoadingMembers ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-soft">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-ink-soft">
                {rows.length === 0 ? 'No active members yet.' : 'No members match your search.'}
              </td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.memberId} className="border-b border-line last:border-none">
                  <td className="py-2.5">
                    <div className="font-medium text-navy">{r.name}</div>
                    <div className="text-[0.72rem] text-ink-soft">{r.role}</div>
                  </td>
                  <td className="py-2.5 font-mono">{r.expected.toLocaleString()}</td>
                  <td className="py-2.5 font-mono">{r.paid.toLocaleString()}</td>
                  <td className="py-2.5 font-mono">{r.balance.toLocaleString()}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge[r.status]}`}>
                      {r.status === 'done' ? 'Paid' : r.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {r.status !== 'done' && r.balance > 0 && (
                      <button
                        onClick={() => handleMarkPaid(r.memberId, r.name, r.balance)}
                        disabled={busyId === r.memberId}
                        className="text-xs font-semibold text-forest disabled:opacity-50"
                      >
                        {busyId === r.memberId ? 'Recording…' : `Record ${fmt(r.balance)}`}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}