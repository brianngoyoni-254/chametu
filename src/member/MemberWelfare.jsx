import { useState } from 'react'
import { Heart, Info, X } from 'lucide-react'

const badge = {
  paid: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
  pending: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
}
const label = { paid: 'Paid', pending: 'Awaiting approval' }

export default function MemberWelfare() {
  const [claims, setClaims] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ reason: '', amount: '' })
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!form.reason.trim()) return setError('Tell us the reason for your claim.')
    if (!amount || amount <= 0) return setError('Enter a valid amount.')
    setClaims((c) => [
      { id: Date.now(), reason: form.reason.trim(), amount, status: 'pending' },
      ...c,
    ])
    setForm({ reason: '', amount: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Welfare</h1>
          <p className="mt-1 text-[0.86rem] text-ink-soft">
            Submit a claim if you need support from the welfare fund
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Heart size={15} /> New claim
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">
              Welfare claim
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-ink-soft transition hover:bg-paper hover:text-navy"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3.5">
            <label className="block text-[0.78rem] font-semibold text-navy">
              Reason
              <input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Medical"
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
              />
            </label>
            <label className="block text-[0.78rem] font-semibold text-navy">
              Amount (KSh)
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.78rem] font-medium text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Submit claim
            </button>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-navy">
          My claims
        </h3>
        {claims.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line py-10 text-center">
            <Heart size={22} className="mx-auto text-ink-soft/50" />
            <p className="mt-2 text-[0.86rem] text-ink-soft">
              You haven't submitted any welfare claims.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Reason</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-line last:border-none transition hover:bg-forest/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-navy">{c.reason}</td>
                    <td className="px-4 py-3 font-mono text-navy">
                      {c.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${
                          badge[c.status]
                        }`}
                      >
                        {label[c.status]}
                      </span>
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
          Welfare claims are reviewed by the committee. You'll be notified once a decision is made.
        </span>
      </div>
    </div>
  )
}