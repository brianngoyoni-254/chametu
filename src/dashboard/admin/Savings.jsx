import { useEffect, useMemo, useState } from 'react'
import { Plus, Loader2, Target, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { ledgerApi } from '../../lib/ledgerApi'

const fmt = (n) => 'KSh ' + Number(n).toLocaleString('en-KE')

export default function Savings() {
  const { members, refetchMembers } = useChama()
  const [data, setData] = useState({ summary: null, entries: [] })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ member_id: '', kind: 'deposit', amount: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await ledgerApi.getSavings()
      setData(res)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const memberNames = useMemo(() => {
    const map = {}
    members.forEach((m) => { map[m.id] = m.name })
    return map
  }, [members])

  const save = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.member_id || !amount || amount <= 0) {
      toast.error('Pick a member and enter an amount')
      return
    }
    setBusy(true)
    try {
      await ledgerApi.addSavings({
        member_id: form.member_id,
        kind: form.kind,
        amount,
      })
      toast.success('Savings recorded')
      setForm({ member_id: '', kind: 'deposit', amount: '' })
      setOpen(false)
      load()
      refetchMembers?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const s = data.summary || {
    totalSavings: 0, memberSavings: 0, monthNet: 0,
    monthlyProfitTarget: 0, progressPct: 0,
  }
  const hasTarget = s.monthlyProfitTarget > 0
  const isPositive = s.monthNet >= 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Savings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Member savings · tracked automatically from deposits, contributions and matched M-Pesa
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark"
        >
          <Plus size={15} /> Deposit / withdraw
        </button>
      </div>

      {/* ---------- KPI row ---------- */}
      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Total savings</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">
            {fmt(s.totalSavings)}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">This month's net</div>
          <div className={`mt-2.5 font-display font-mono text-xl font-bold flex items-center gap-1.5 ${isPositive ? 'text-forest' : 'text-red-600'}`}>
            {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {isPositive ? '+' : '−'}{fmt(Math.abs(s.monthNet))}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Total deposits</div>
          <div className="mt-2.5 font-display font-mono text-xl font-bold text-navy">
            {fmt(s.totalDeposits ?? 0)}
          </div>
        </div>
      </div>

      {/* ---------- Target progress ---------- */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <Target size={15} className="text-forest" />
              Target profit progress
            </h3>
            <p className="mt-1 text-[0.82rem] text-ink-soft">
              {hasTarget
                ? `Aiming for ${fmt(s.monthlyProfitTarget)} this month.`
                : 'No target set yet — configure one in Settings to track progress.'}
            </p>
          </div>
          <Link
            to="/dashboard/settings?tab=chama"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:border-forest"
          >
            <Sparkles size={12} />
            {hasTarget ? 'Adjust target' : 'Set target'}
          </Link>
        </div>

        {hasTarget ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[0.82rem]">
              <span className="text-ink-soft">
                <b className="font-mono text-navy">{fmt(s.monthNet)}</b> of{' '}
                <b className="font-mono text-navy">{fmt(s.monthlyProfitTarget)}</b>
              </span>
              <b className={`font-mono ${s.progressPct >= 100 ? 'text-forest' : 'text-navy'}`}>
                {s.progressPct}%
              </b>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className={`h-full rounded-full transition-all ${
                  s.progressPct >= 100
                    ? 'bg-gradient-to-r from-forest to-emerald'
                    : 'bg-gradient-to-r from-forest to-emerald/70'
                }`}
                style={{ width: `${Math.min(100, s.progressPct)}%` }}
              />
            </div>
            {s.progressPct >= 100 && (
              <p className="mt-2 inline-flex items-center gap-1 text-[0.78rem] font-semibold text-forest">
                ✓ Target reached this month
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-line bg-paper/40 px-4 py-6 text-center text-sm text-ink-soft">
            Start by setting a monthly profit target from Settings → Chama.
          </div>
        )}
      </div>

      {open && (
        <form onSubmit={save} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="text-xs font-semibold text-ink">
            Member
            <select
              value={form.member_id}
              onChange={(e) => setForm((f) => ({ ...f, member_id: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              <option value="">Select…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Type
            <select
              value={form.kind}
              onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount (KSh)
            <input
              type="number" min="1"
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
          <div className="py-12 text-center">
            <Loader2 className="mx-auto animate-spin text-forest" size={22} />
          </div>
        ) : data.entries.length === 0 ? (
          <div className="py-12 text-center text-ink-soft text-sm">
            No savings activity yet. Every deposit, contribution and matched M-Pesa payment will appear here.
          </div>
        ) : (
          <table className="w-full min-w-115 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Date</th>
                <th className="py-2">Member</th>
                <th className="py-2">Type</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Balance after</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-none">
                  <td className="py-2.5 text-ink-soft">
                    {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </td>
                  <td className="py-2.5">{memberNames[r.memberId] || '—'}</td>
                  <td className="py-2.5 capitalize">{r.kind}</td>
                  <td className={`py-2.5 font-mono ${r.kind === 'withdrawal' ? 'text-red-600' : 'text-forest'}`}>
                    {r.kind === 'withdrawal' ? '−' : '+'}{Number(r.amount).toLocaleString()}
                  </td>
                  <td className="py-2.5 font-mono">{Number(r.balanceAfter).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}