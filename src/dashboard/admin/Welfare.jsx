import { useState } from 'react'
import { Plus } from 'lucide-react'

const MEMBERS = ['Brian N.', 'Jane W.', 'Kevin M.', 'Mary N.', 'David O.', 'Alice K.']

const INITIAL = [
  { id: 1, member: 'Alice K.', reason: 'Medical', amount: 4500, status: 'pending' },
  { id: 2, member: 'Kevin M.', reason: 'Bereavement', amount: 15000, status: 'paid' },
  { id: 3, member: 'Jane W.', reason: 'Medical', amount: 6000, status: 'paid' },
]
const STARTING_BALANCE = 340000

const badge = { paid: 'bg-[#E9F5EF] text-forest', pending: 'bg-[#FBF1E0] text-[#8A6417]', rejected: 'bg-line text-ink-soft' }
const label = { paid: 'Paid', pending: 'Awaiting approval', rejected: 'Rejected' }

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

export default function Welfare() {
  const [claims, setClaims] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ member: MEMBERS[0], reason: '', amount: '' })

  const paidTotal = claims.filter((c) => c.status === 'paid').reduce((s, c) => s + c.amount, 0)
  const balance = STARTING_BALANCE - paidTotal

  function submitClaim(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.reason.trim()) return
    setClaims((c) => [{ id: Date.now(), member: form.member, reason: form.reason.trim(), amount, status: 'pending' }, ...c])
    setForm({ member: MEMBERS[0], reason: '', amount: '' })
    setOpen(false)
  }

  function approve(id) {
    setClaims((c) => c.map((claim) => (claim.id === id ? { ...claim, status: 'paid' } : claim)))
  }
  function reject(id) {
    setClaims((c) => c.map((claim) => (claim.id === id ? { ...claim, status: 'rejected' } : claim)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Welfare</h1>
          <p className="mt-1 text-sm text-ink-soft">Community support fund</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> New claim
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Balance</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">{fmt(balance)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Monthly contribution</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">KSh 500</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Claims this year</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">{fmt(paidTotal)}</div>
        </div>
      </div>

      {open && (
        <form onSubmit={submitClaim} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
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
            Reason
            <input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Medical"
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
        <table className="w-full min-w-100 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Member</th>
              <th className="py-2">Reason</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-none">
                <td className="py-2.5">{c.member}</td>
                <td className="py-2.5">{c.reason}</td>
                <td className="py-2.5 font-mono">{c.amount.toLocaleString()}</td>
                <td className="py-2.5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[c.status]}`}>{label[c.status]}</span>
                </td>
                <td className="py-2.5 text-right">
                  {c.status === 'pending' && (
                    <div className="flex justify-end gap-2.5">
                      <button onClick={() => approve(c.id)} className="text-xs font-semibold text-forest">
                        Approve
                      </button>
                      <button onClick={() => reject(c.id)} className="text-xs font-semibold text-red-600">
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