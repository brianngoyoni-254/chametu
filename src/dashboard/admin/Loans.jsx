import { useState } from 'react'
import { Plus } from 'lucide-react'

const MEMBERS = ['Brian N.', 'Jane W.', 'Kevin M.', 'Mary N.', 'David O.', 'Alice K.']

const INITIAL = [
  { id: 1, member: 'Brian N.', amount: 100000, balance: 72500, status: 'active' },
  { id: 2, member: 'Mary N.', amount: 40000, balance: 40000, status: 'new' },
  { id: 3, member: 'David O.', amount: 60000, balance: 18000, status: 'overdue' },
  { id: 4, member: 'Alice K.', amount: 30000, balance: 9000, status: 'active' },
]

const badge = { active: 'bg-[#E9F5EF] text-forest', new: 'bg-[#FBF1E0] text-[#8A6417]', overdue: 'bg-[#FBEAE8] text-red-600', rejected: 'bg-line text-ink-soft' }
const label = { active: 'Active', new: 'New', overdue: 'Overdue', rejected: 'Rejected' }

function progressOf(amount, balance) {
  return Math.round(((amount - balance) / amount) * 100)
}
function fmt(n) {
  return n.toLocaleString('en-KE')
}

export default function Loans() {
  const [loans, setLoans] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ member: MEMBERS[0], amount: '', purpose: '' })

  const active = loans.filter((l) => l.status !== 'rejected')
  const outstanding = active.reduce((s, l) => s + l.balance, 0)

  function submitApplication(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    setLoans((l) => [{ id: Date.now(), member: form.member, amount, balance: amount, status: 'new', purpose: form.purpose }, ...l])
    setForm({ member: MEMBERS[0], amount: '', purpose: '' })
    setOpen(false)
  }

  function approve(id) {
    setLoans((l) => l.map((loan) => (loan.id === id ? { ...loan, status: 'active' } : loan)))
  }
  function reject(id) {
    setLoans((l) => l.map((loan) => (loan.id === id ? { ...loan, status: 'rejected' } : loan)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Loans</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {active.length} active · KSh {fmt(outstanding)} outstanding
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> New application
        </button>
      </div>

      {open && (
        <form onSubmit={submitApplication} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
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
          <label className="flex-1 min-w-37.5 text-xs font-semibold text-ink">
            Purpose
            <input
              value={form.purpose}
              onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              placeholder="e.g. Business expansion"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
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
            Submit
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        <table className="w-full min-w-130 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Member</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Balance</th>
              <th className="py-2">Progress</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-none">
                <td className="py-2.5">{l.member}</td>
                <td className="py-2.5 font-mono">{fmt(l.amount)}</td>
                <td className="py-2.5 font-mono">{fmt(l.balance)}</td>
                <td className="py-2.5">
                  <div className="h-1.5 w-27.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full rounded-full bg-emerald" style={{ width: `${progressOf(l.amount, l.balance)}%` }} />
                  </div>
                </td>
                <td className="py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[l.status]}`}>{label[l.status]}</span>
                </td>
                <td className="py-2.5 text-right">
                  {l.status === 'new' && (
                    <div className="flex justify-end gap-2.5">
                      <button onClick={() => approve(l.id)} className="text-xs font-semibold text-forest">
                        Approve
                      </button>
                      <button onClick={() => reject(l.id)} className="text-xs font-semibold text-red-600">
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}