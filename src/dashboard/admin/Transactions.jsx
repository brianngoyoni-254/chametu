import { useState } from 'react'
import { Plus } from 'lucide-react'

const INITIAL = [
  { date: 'Sep 24', desc: 'Contribution — Jane W.', debit: 0, credit: 5000 },
  { date: 'Sep 23', desc: 'Loan repayment — David O.', debit: 0, credit: 9167 },
  { date: 'Sep 22', desc: 'Expense — meeting venue', debit: 2000, credit: 0 },
  { date: 'Sep 20', desc: 'Loan disbursed — Mary N.', debit: 40000, credit: 0 },
  { date: 'Sep 18', desc: 'Investment income — MMF', debit: 0, credit: 12400 },
  { date: 'Sep 12', desc: 'Contribution — Kevin M.', debit: 0, credit: 5000 },
]
const OPENING_BALANCE = 1415333

function fmt(n) {
  return n.toLocaleString('en-KE')
}

function withBalances(rows) {
  // rows are newest-first; compute balance walking backward from the opening balance
  let balance = OPENING_BALANCE
  const reversed = [...rows].reverse().map((r) => {
    balance = balance + r.credit - r.debit
    return { ...r, balance }
  })
  return reversed.reverse()
}

export default function Transactions() {
  const [rows, setRows] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ desc: '', type: 'credit', amount: '' })

  const withBal = withBalances(rows)

  function addTransaction(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.desc.trim() || !amount || amount <= 0) return
    const today = new Date()
    const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    setRows((r) => [
      { date: label, desc: form.desc.trim(), debit: form.type === 'debit' ? amount : 0, credit: form.type === 'credit' ? amount : 0 },
      ...r,
    ])
    setForm({ desc: '', type: 'credit', amount: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Transactions</h1>
          <p className="mt-1 text-sm text-ink-soft">Every financial event, in one ledger</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Add transaction
        </button>
      </div>

      {open && (
        <form onSubmit={addTransaction} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="flex-1 min-w-50 text-xs font-semibold text-ink">
            Description
            <input
              value={form.desc}
              onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))}
              placeholder="e.g. Office stationery"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              <option value="credit">Money in</option>
              <option value="debit">Money out</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount (KSh)
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1.5 block w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        <table className="w-full min-w-135 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Date</th>
              <th className="py-2">Description</th>
              <th className="py-2">Debit</th>
              <th className="py-2">Credit</th>
              <th className="py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {withBal.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-none">
                <td className="py-2.5">{r.date}</td>
                <td className="py-2.5">{r.desc}</td>
                <td className="py-2.5 font-mono">{r.debit ? fmt(r.debit) : '—'}</td>
                <td className="py-2.5 font-mono">{r.credit ? fmt(r.credit) : '—'}</td>
                <td className="py-2.5 font-mono font-semibold text-navy">{fmt(r.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}