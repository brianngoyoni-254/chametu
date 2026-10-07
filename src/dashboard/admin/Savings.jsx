import { useState } from 'react'
import { Plus } from 'lucide-react'

const MEMBERS = ['Brian N.', 'Jane W.', 'Kevin M.', 'Mary N.', 'David O.', 'Alice K.']

const INITIAL = [
  { date: 'Sep 24', member: 'Jane W.', deposit: 5000, withdrawal: 0, balance: 165000 },
  { date: 'Sep 20', member: 'Kevin M.', deposit: 0, withdrawal: 10000, balance: 45000 },
  { date: 'Sep 12', member: 'Brian N.', deposit: 5000, withdrawal: 0, balance: 165000 },
  { date: 'Sep 05', member: 'Mary N.', deposit: 5000, withdrawal: 0, balance: 120000 },
]
const GROUP_RESERVE = 600000

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

export default function Savings() {
  const [rows, setRows] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ member: MEMBERS[0], type: 'deposit', amount: '' })

  const memberSavings = rows.reduce((s, r) => s + r.deposit - r.withdrawal, 0) + 165000 // seeded base for members not in the ledger yet
  const totalSavings = memberSavings + GROUP_RESERVE

  function lastBalanceFor(member) {
    const row = rows.find((r) => r.member === member)
    return row ? row.balance : 0
  }

  function addEntry(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    const prevBalance = lastBalanceFor(form.member)
    const nextBalance = form.type === 'deposit' ? prevBalance + amount : Math.max(0, prevBalance - amount)
    const today = new Date()
    const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    setRows((r) => [
      {
        date: label,
        member: form.member,
        deposit: form.type === 'deposit' ? amount : 0,
        withdrawal: form.type === 'withdrawal' ? amount : 0,
        balance: nextBalance,
      },
      ...r,
    ])
    setForm({ member: MEMBERS[0], type: 'deposit', amount: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Savings</h1>
          <p className="mt-1 text-sm text-ink-soft">Member savings &amp; group reserve</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Deposit / withdraw
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Total savings</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">{fmt(totalSavings)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Member savings</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">{fmt(memberSavings)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Group reserve</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">{fmt(GROUP_RESERVE)}</div>
        </div>
      </div>

      {open && (
        <form onSubmit={addEntry} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="text-xs font-semibold text-ink">
            Member
            <select
              value={form.member}
              onChange={(e) => setForm((f) => ({ ...f, member: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              {MEMBERS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
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
        <table className="w-full min-w-115 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Date</th>
              <th className="py-2">Member</th>
              <th className="py-2">Deposit</th>
              <th className="py-2">Withdrawal</th>
              <th className="py-2">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-none">
                <td className="py-2.5">{r.date}</td>
                <td className="py-2.5">{r.member}</td>
                <td className="py-2.5 font-mono">{r.deposit ? r.deposit.toLocaleString() : '—'}</td>
                <td className="py-2.5 font-mono">{r.withdrawal ? r.withdrawal.toLocaleString() : '—'}</td>
                <td className="py-2.5 font-mono">{r.balance.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}