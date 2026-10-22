import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useChama } from '../../context/ChamaContext'

const badge = { done: 'bg-[#E9F5EF] text-forest', pending: 'bg-[#FBF1E0] text-[#8A6417]', overdue: 'bg-[#FBEAE8] text-red-600' }

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

export default function Contributions() {
  const { members, chama, recordContribution } = useChama()
  const [query, setQuery] = useState('')
  
  const expectedPerMember = chama?.monthly_contribution || 5000

  const rows = useMemo(() => {
    return members.filter(m => m.status === 'active').map((m) => {
      const paid = Number(m.savings || 0)
      let status = 'pending'
      if (paid >= expectedPerMember) status = 'done'
      else if (chama?.due_day && new Date().getDate() > chama.due_day) status = 'overdue'

      return {
        id: m.id,
        name: m.name,
        expected: expectedPerMember,
        paid,
        status,
      }
    })
  }, [members, expectedPerMember, chama?.due_day])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
  }, [rows, query])

  const collected = rows.reduce((s, r) => s + Math.min(r.paid, r.expected), 0)
  const expected = rows.length * expectedPerMember
  const pct = expected > 0 ? Math.round((collected / expected) * 100) : 0

  const handleMarkPaid = async (id, name) => {
    const res = await recordContribution(id, expectedPerMember, 'CASH')
    if (res.ok) {
      toast.success(`Marked contribution for ${name.split(' ')[0]}`)
    } else {
      toast.error(res.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Contributions</h1>
          <p className="mt-1 text-sm text-ink-soft">
            This month — {fmt(collected)} of {fmt(expected)} ({pct}%)
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
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-line last:border-none">
                <td className="py-2.5">{r.name}</td>
                <td className="py-2.5 font-mono">{r.expected.toLocaleString()}</td>
                <td className="py-2.5 font-mono">{r.paid.toLocaleString()}</td>
                <td className="py-2.5 font-mono">{Math.max(0, r.expected - r.paid).toLocaleString()}</td>
                <td className="py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge[r.status]}`}>
                    {r.status === 'done' ? 'Paid' : r.status}
                  </span>
                </td>
                <td className="py-2.5 text-right">
                  {r.status !== 'done' && (
                    <button onClick={() => handleMarkPaid(r.id, r.name)} className="text-xs font-semibold text-forest">
                      Record payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-soft">
                  No members match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}