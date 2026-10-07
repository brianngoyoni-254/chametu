import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'

const INITIAL = [
  { name: 'Brian N.', expected: 5000, paid: 5000, status: 'done' },
  { name: 'Jane W.', expected: 5000, paid: 5000, status: 'done' },
  { name: 'Kevin M.', expected: 5000, paid: 0, status: 'pending' },
  { name: 'Mary N.', expected: 5000, paid: 5000, status: 'done' },
  { name: 'David O.', expected: 5000, paid: 0, status: 'overdue' },
]

const badge = { done: 'bg-[#E9F5EF] text-forest', pending: 'bg-[#FBF1E0] text-[#8A6417]', overdue: 'bg-[#FBEAE8] text-red-600' }
const label = { done: 'Paid', pending: 'Pending', overdue: 'Overdue' }

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

export default function Contributions() {
  const [rows, setRows] = useState(INITIAL)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
  }, [rows, query])

  const collected = rows.reduce((s, r) => s + r.paid, 0)
  const expected = rows.reduce((s, r) => s + r.expected, 0)
  const pct = Math.round((collected / expected) * 100)

  function markPaid(name) {
    setRows((r) => r.map((row) => (row.name === name ? { ...row, paid: row.expected, status: 'done' } : row)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Contributions</h1>
          <p className="mt-1 text-sm text-ink-soft">
            September collection — {fmt(collected)} of {fmt(expected)} ({pct}%)
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
        <table className="w-full min-w-115 text-sm">
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
              <tr key={r.name} className="border-b border-line last:border-none">
                <td className="py-2.5">{r.name}</td>
                <td className="py-2.5 font-mono">{r.expected.toLocaleString()}</td>
                <td className="py-2.5 font-mono">{r.paid.toLocaleString()}</td>
                <td className="py-2.5 font-mono">{(r.expected - r.paid).toLocaleString()}</td>
                <td className="py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[r.status]}`}>{label[r.status]}</span>
                </td>
                <td className="py-2.5 text-right">
                  {r.status !== 'done' && (
                    <button onClick={() => markPaid(r.name)} className="text-xs font-semibold text-forest">
                      Mark as paid
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