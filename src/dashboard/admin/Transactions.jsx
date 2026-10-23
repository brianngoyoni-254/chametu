import { useEffect, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ledgerApi } from '../../lib/ledgerApi'

const fmt = (n) => Number(n).toLocaleString('en-KE')

const TYPE_LABEL = {
  contribution: 'Contribution',
  loan_disbursement: 'Loan disbursed',
  loan_repayment: 'Loan repayment',
  credit: 'Money in',
  debit: 'Money out',
}

export default function Transactions() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ desc: '', type: 'credit', amount: '' })

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await ledgerApi.getTransactions()
      setRows(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const add = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.desc.trim() || !amount || amount <= 0) {
      toast.error('Enter a description and a positive amount')
      return
    }
    setBusy(true)
    try {
      await ledgerApi.addTransaction({
        kind: form.type,
        description: form.desc.trim(),
        amount,
      })
      toast.success('Transaction added')
      setForm({ desc: '', type: 'credit', amount: '' })
      setOpen(false)
      refresh()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
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
        <form onSubmit={add} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
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
          <button type="submit" disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        {loading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-forest" size={22} /></div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-ink-soft text-sm">No transactions yet.</div>
        ) : (
          <table className="w-full min-w-135 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Date</th>
                <th className="py-2">Type</th>
                <th className="py-2">Reference</th>
                <th className="py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-none">
                  <td className="py-2.5 text-ink-soft">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-2.5">{TYPE_LABEL[r.type] || r.type}</td>
                  <td className="py-2.5 text-ink-soft">{r.reference || '—'}</td>
                  <td className={`py-2.5 font-mono ${r.type === 'debit' ? 'text-red-600' : 'text-forest'}`}>
                    {r.type === 'debit' ? '−' : '+'}{fmt(r.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}