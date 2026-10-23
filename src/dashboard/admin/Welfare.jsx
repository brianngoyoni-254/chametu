import { useEffect, useState } from 'react'
import { Plus, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { ledgerApi } from '../../lib/ledgerApi'

const fmt = (n) => 'KSh ' + Number(n).toLocaleString('en-KE')

const STATUS_META = {
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  paid: 'bg-[#E9F5EF] text-forest',
  rejected: 'bg-red-50 text-red-600',
}

export default function Welfare() {
  const { members, refetchMembers } = useChama()
  const [data, setData] = useState({ summary: null, claims: [] })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ member_id: '', reason: '', amount: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await ledgerApi.getWelfare()
      setData(res)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.member_id || !form.reason.trim() || !amount || amount <= 0) {
      toast.error('Fill member, reason and amount')
      return
    }
    setBusy(true)
    try {
      // Uses the existing chama route (unchanged)
      const token = localStorage.getItem('auth_token')
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chama/welfare/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, reason: form.reason.trim() }),
      }).then((r) => { if (!r.ok) throw new Error('Failed'); return r.json() })

      toast.success('Claim submitted')
      setForm({ member_id: '', reason: '', amount: '' })
      setOpen(false)
      load()
      refetchMembers?.()
    } catch (err) {
      toast.error(err.message || 'Could not submit')
    } finally {
      setBusy(false)
    }
  }

  const review = async (claimId, status) => {
    try {
      await ledgerApi.reviewWelfare(claimId, { status })
      toast.success(`Claim ${status}`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const s = data.summary || {}

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Welfare</h1>
          <p className="mt-1 text-sm text-ink-soft">Community support fund</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus size={15} /> New claim
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3.5 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="text-xs text-ink-soft">Fund balance</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">{fmt(s.balance || 0)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="text-xs text-ink-soft">Collected</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">{fmt(s.collected || 0)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="text-xs text-ink-soft">Pending</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">{fmt(s.pending || 0)}</div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <div className="text-xs text-ink-soft">Paid out</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">{fmt(s.paid || 0)}</div>
        </div>
      </div>

      {open && (
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
          <label className="text-xs font-semibold text-ink">
            Member
            <select
              value={form.member_id}
              onChange={(e) => setForm((f) => ({ ...f, member_id: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label className="flex-1 min-w-40 text-xs font-semibold text-ink">
            Reason
            <input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount (KSh)
            <input
              type="number" min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1.5 block w-32 rounded-lg border border-line px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Submit'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center"><Loader2 className="mx-auto animate-spin text-forest" size={22} /></div>
        ) : data.claims.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-line bg-white p-10 text-center text-ink-soft text-sm">
            No welfare claims yet.
          </div>
        ) : (
          data.claims.map((c) => (
            <div key={c.id} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-navy">{c.member}</h4>
                  <p className="text-sm text-ink-soft">{c.reason}</p>
                </div>
                <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${STATUS_META[c.status]}`}>
                  {c.status}
                </span>
              </div>
              <p className="font-mono text-lg font-bold text-navy mt-3">KSh {Number(c.amount).toLocaleString()}</p>
              {c.status === 'pending' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => review(c.id, 'paid')}
                    className="flex-1 flex items-center justify-center gap-1 bg-forest text-white rounded py-1.5 text-xs font-bold"
                  >
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button
                    onClick={() => review(c.id, 'rejected')}
                    className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white rounded py-1.5 text-xs font-bold"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}