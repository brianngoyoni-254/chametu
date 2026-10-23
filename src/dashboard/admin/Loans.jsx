import { useMemo, useState } from 'react'
import { Plus, CheckCircle2, XCircle, Clock, Search, RefreshCw, FileText, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'

const badge = {
  disbursed: 'bg-[#E9F5EF] text-forest',
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  approved: 'bg-[#EAF1F7] text-navy',
  rejected: 'bg-red-50 text-red-600',
  repaid: 'bg-line text-ink-soft',
}

export default function Loans() {
  const { loans, applyForLoan, updateLoanStatus, repayLoan, refetchLoans } = useChama()
  
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', purpose: '' })
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [busy, setBusy] = useState(false)
  const [repayTarget, setRepayTarget] = useState(null) // For the repay modal

  const filtered = useMemo(() => {
    return loans.filter((l) => tab === 'all' || l.status === tab).filter((l) => {
      if (!query) return true
      const q = query.toLowerCase()
      return (l.member + (l.purpose || '') + (l.status || '')).toLowerCase().includes(q)
    })
  }, [loans, tab, query])

  const counts = useMemo(() => ({
    all: loans.length,
    disbursed: loans.filter((l) => l.status === 'disbursed').length,
    pending: loans.filter((l) => l.status === 'pending').length,
    rejected: loans.filter((l) => l.status === 'rejected').length,
  }), [loans])

  const outstanding = loans.filter((l) => l.status === 'disbursed').reduce((s, l) => s + Number(l.balance || 0), 0)

  async function submitApplication(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    
    setBusy(true)
    const res = await applyForLoan(amount, form.purpose)
    setBusy(false)
    
    if (res.ok) {
      setForm({ amount: '', purpose: '' })
      setOpen(false)
      toast.success('Application submitted to backend')
    } else {
      toast.error(res.message)
    }
  }

  async function handleStatus(id, status) {
    const res = await updateLoanStatus(id, status)
    if (res.ok) toast.success(`Loan marked as ${status}`)
    else toast.error(res.message)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Loans</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {counts.disbursed} active · KSh {outstanding.toLocaleString()} outstanding
            {counts.pending > 0 && ` · ${counts.pending} pending review`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetchLoans()} className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-forest">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark">
            <Plus size={15} /> New application
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submitApplication} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
          <label className="flex-1 min-w-[200px] text-xs font-semibold text-ink">
            Purpose
            <input value={form.purpose} onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Business expansion" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest" />
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount (KSh)
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="mt-1.5 block w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest" />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-50">
            {busy ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'disbursed', label: `Active (${counts.disbursed})` },
            { key: 'repaid', label: `Repaid` },
          ].map((f) => (
            <button key={f.key} onClick={() => setTab(f.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${tab === f.key ? 'bg-navy text-white' : 'border border-line bg-white text-ink-soft hover:border-navy'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex max-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <Search size={14} className="text-ink-soft" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search member, purpose or status…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={26} className="mx-auto text-ink-soft/40" />
            <p className="mt-2 text-sm text-ink-soft">No loan applications match.</p>
          </div>
        ) : (
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Member</th>
                <th className="py-2">Purpose</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Balance</th>
                <th className="py-2">Status</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-none">
                  <td className="py-2.5 font-medium text-navy">{l.member}</td>
                  <td className="py-2.5 text-ink-soft">{l.purpose || '—'}</td>
                  <td className="py-2.5 font-mono">{Number(l.amount).toLocaleString()}</td>
                  <td className="py-2.5 font-mono">{Number(l.balance).toLocaleString()}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge[l.status] || badge.pending}`}>{l.status}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    {l.status === 'pending' && (
                      <div className="flex justify-end gap-2.5">
                        <button onClick={() => handleStatus(l.id, 'approved')} className="flex items-center gap-1 text-xs font-semibold text-forest"><CheckCircle2 size={12} /> Approve</button>
                        <button onClick={() => handleStatus(l.id, 'rejected')} className="flex items-center gap-1 text-xs font-semibold text-red-600"><XCircle size={12} /> Reject</button>
                      </div>
                    )}
                    {l.status === 'approved' && (
                      <button onClick={() => handleStatus(l.id, 'disbursed')} className="text-xs font-semibold text-forest">Mark Disbursed</button>
                    )}
                    {l.status === 'disbursed' && (
                      <div className="flex items-center justify-end gap-3">
                        <span className="inline-flex items-center gap-1 text-[0.68rem] text-ink-soft"><Clock size={10} /> Active</span>
                        <button onClick={() => setRepayTarget(l)} className="text-xs font-semibold text-forest hover:underline">Repay</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {repayTarget && (
        <RepayModal
          loan={repayTarget}
          onClose={() => setRepayTarget(null)}
          onSave={async (amount) => {
            const res = await repayLoan(repayTarget.id, amount)
            if (res.ok) {
              toast.success(`Repayment recorded. Remaining: KSh ${res.remaining.toLocaleString()}`)
              setRepayTarget(null)
            } else {
              toast.error(res.message)
            }
          }}
        />
      )}
    </div>
  )
}

function RepayModal({ loan, onClose, onSave }) {
  const [amount, setAmount] = useState(String(loan.balance))
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const val = Number(amount)
    if (!val || val <= 0) return
    setBusy(true)
    await onSave(val)
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-display font-semibold text-navy">Record Repayment</h3>
              <p className="mt-0.5 text-[0.82rem] text-ink-soft">For {loan.member}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-paper text-ink-soft">
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-4">
            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-navy">Amount (KSh)</span>
              <input
                type="number" min="1" max={loan.balance} step="1" required
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
              />
            </label>
            <p className="mt-2 text-[0.74rem] text-ink-soft">
              Current balance: <b className="text-navy">KSh {Number(loan.balance).toLocaleString()}</b>
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-line bg-paper/40 px-5 py-3.5">
            <button type="button" onClick={onClose} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? 'Saving…' : 'Record Repayment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}