import { useEffect, useMemo, useState } from 'react'
import { Search, Smartphone, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { readMembers } from '../../lib/superadminBridge'
import { publishMemberNotification } from '../../lib/memberNotifications'

const PAYMENTS_KEY = 'chametu_payments_v1'
const EVENT = 'chametu:storage-updated'

function read(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
}
function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

const statusStyle = {
  matched: 'bg-[#E9F5EF] text-forest',
  unmatched: 'bg-[#FBF1E0] text-[#8A6417]',
}

export default function Payments() {
  const members = readMembers()
  const [payments, setPayments] = useState(() => read(PAYMENTS_KEY, []))
  const [query, setQuery] = useState('')

  const refresh = () => setPayments(read(PAYMENTS_KEY, []))
  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener(EVENT, onStorage)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onStorage)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return payments
    return payments.filter((p) => (p.name || '').toLowerCase().includes(q) || (p.ref || '').toLowerCase().includes(q) || (p.phone || '').includes(q))
  }, [payments, query])

  const todayTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const matchedCount = payments.filter((p) => p.status === 'matched').length
  const unmatchedCount = payments.length - matchedCount

  function matchTo(id, memberName) {
    if (!memberName) return
    const target = payments.find((p) => p.id === id)
    const next = payments.map((p) => (p.id === id ? { ...p, status: 'matched', matchedTo: memberName } : p))
    write(PAYMENTS_KEY, next)
    setPayments(next)
    if (target) {
      const member = members.find((m) => m.name === memberName)
      publishMemberNotification({
        memberId: member?.id || memberName,
        type: 'success',
        event: 'paymentConfirmations',
        title: 'Payment received ✅',
        desc: `We've matched ${fmt(Number(target.amount))} from M-Pesa ${target.ref || ''} to your account.`,
        link: '/member/contributions',
      })
    }
    toast.success(`Matched to ${memberName}`)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Payments Tracker</h1>
          <p className="mt-1 text-sm text-ink-soft">Incoming M-Pesa payments, reconciled automatically</p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-forest">
            <RefreshCw size={14} /> Refresh
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink-soft">
            <Search size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone or reference…" className="w-56 bg-transparent outline-none placeholder:text-ink-soft" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Today's total</div>
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
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Smartphone size={26} className="mx-auto text-ink-soft/40" />
            <p className="mt-2 text-sm text-ink-soft">No payments recorded yet.</p>
          </div>
        ) : (
          <table className="w-full min-w-150 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Time</th>
                <th className="py-2">M-Pesa sender</th>
                <th className="py-2">Phone</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Reference</th>
                <th className="py-2">Status / Matched to</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-none">
                  <td className="py-2.5 text-ink-soft">{p.time ? new Date(p.time).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={13} className="text-ink-soft" />
                      {p.name}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-ink-soft">{p.phone}</td>
                  <td className="py-2.5 font-mono">{fmt(Number(p.amount))}</td>
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
                          <option value="" disabled>Match to…</option>
                          {members.map((m) => (
                            <option key={m.id || m.name} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
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