import { useMemo, useState } from 'react'
import { Search, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react'

const MEMBERS = ['Brian N.', 'Jane W.', 'Kevin M.', 'Mary N.', 'David O.', 'Alice K.']

const INITIAL = [
  { id: 1, time: '09:14 AM', phone: '07XX XX5 412', name: 'JANE W', amount: 5000, ref: 'QFT8K2LMNO', status: 'matched', matchedTo: 'Jane W.' },
  { id: 2, time: '10:02 AM', phone: '07XX XX1 087', name: 'D OKOTH', amount: 9167, ref: 'QFT8K2LP44', status: 'matched', matchedTo: 'David O.' },
  { id: 3, time: '11:46 AM', phone: '07XX XX9 230', name: 'UNKNOWN SENDER', amount: 5000, ref: 'QFT8K2LR19', status: 'unmatched', matchedTo: null },
  { id: 4, time: '1:18 PM', phone: '07XX XX3 664', name: 'A KAMAU', amount: 4500, ref: 'QFT8K2LS02', status: 'unmatched', matchedTo: null },
  { id: 5, time: '2:40 PM', phone: '07XX XX7 821', name: 'M NJOROGE', amount: 5000, ref: 'QFT8K2LT77', status: 'matched', matchedTo: 'Mary N.' },
]

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

const statusStyle = {
  matched: 'bg-[#E9F5EF] text-forest',
  unmatched: 'bg-[#FBF1E0] text-[#8A6417]',
}

export default function Payments() {
  const [payments, setPayments] = useState(INITIAL)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return payments
    return payments.filter((p) => p.name.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q) || p.phone.includes(q))
  }, [payments, query])

  const todayTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const matchedCount = payments.filter((p) => p.status === 'matched').length
  const unmatchedCount = payments.length - matchedCount

  function matchTo(id, member) {
    if (!member) return
    setPayments((rows) => rows.map((p) => (p.id === id ? { ...p, status: 'matched', matchedTo: member } : p)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Payments Tracker</h1>
          <p className="mt-1 text-sm text-ink-soft">Incoming M‑Pesa payments to your Paybill, reconciled automatically</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink-soft">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone or reference…"
            className="w-56 bg-transparent outline-none placeholder:text-ink-soft"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Today&rsquo;s total</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">{fmt(todayTotal)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft"><CheckCircle2 size={14} className="text-emerald" />Reconciled</div>
          <div className="mt-2.5 font-display text-xl font-bold text-navy">{matchedCount}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="flex items-center gap-1.5 text-xs text-ink-soft"><AlertCircle size={14} className="text-[#8A6417]" />Unmatched</div>
          <div className="mt-2.5 font-display text-xl font-bold text-navy">{unmatchedCount}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        <table className="w-full min-w-150 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Time</th>
              <th className="py-2">M‑Pesa sender</th>
              <th className="py-2">Phone</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Reference</th>
              <th className="py-2">Status / Matched to</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-none">
                <td className="py-2.5 text-ink-soft">{p.time}</td>
                <td className="py-2.5">
                  <span className="flex items-center gap-1.5">
                    <Smartphone size={13} className="text-ink-soft" />
                    {p.name}
                  </span>
                </td>
                <td className="py-2.5 font-mono text-ink-soft">{p.phone}</td>
                <td className="py-2.5 font-mono">{fmt(p.amount)}</td>
                <td className="py-2.5 font-mono text-ink-soft">{p.ref}</td>
                <td className="py-2.5">
                  {p.status === 'matched' ? (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.matched}`}>
                      ✓ {p.matchedTo}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle.unmatched}`}>Unmatched</span>
                      <select
                        defaultValue=""
                        onChange={(e) => matchTo(p.id, e.target.value)}
                        className="rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink"
                      >
                        <option value="" disabled>
                          Match to…
                        </option>
                        {MEMBERS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-soft">
                  No payments match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}