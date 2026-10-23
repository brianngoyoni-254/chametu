import { useEffect, useMemo, useState } from 'react'
import { Search, Smartphone, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { ledgerApi } from '../../lib/ledgerApi'

const statusStyle = {
  matched: 'bg-[#E9F5EF] text-forest',
  unmatched: 'bg-[#FBF1E0] text-[#8A6417]',
}

const fmt = (n) => 'KSh ' + Number(n).toLocaleString('en-KE')

export default function Payments() {
  const { members } = useChama()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const refresh = async () => {
    setLoading(true)
    try {
      const data = await ledgerApi.getPayments(query.trim() || undefined)
      setPayments(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() /* eslint-disable-line react-hooks/exhaustive-deps */ }, [])

  const filtered = useMemo(() => payments, [payments])

  const todayTotal = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
  const matchedCount = payments.filter((p) => p.status === 'matched').length
  const unmatchedCount = payments.filter((p) => p.status === 'unmatched').length

  const handleMatch = async (paymentId, memberId) => {
    if (!memberId) return
    try {
      await ledgerApi.matchPayment(paymentId, memberId)
      toast.success('Payment matched')
      refresh()
    } catch (err) {
      toast.error(err.message)
    }
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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && refresh()}
              placeholder="Search name, phone or reference…"
              className="w-56 bg-transparent outline-none placeholder:text-ink-soft"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-xl border border-line bg-white p-4.5">
          <div className="text-xs text-ink-soft">Total recorded</div>
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
        {loading ? (
          <div className="py-12 text-center text-ink-soft">
            <Loader2 className="mx-auto animate-spin text-forest" size={22} />
          </div>
        ) : filtered.length === 0 ? (
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
                  <td className="py-2.5 text-ink-soft">
                    {p.time ? new Date(p.time).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-2.5">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={13} className="text-ink-soft" />
                      {p.name || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-ink-soft">{p.phone || '—'}</td>
                  <td className="py-2.5 font-mono">{fmt(p.amount)}</td>
                  <td className="py-2.5 font-mono text-ink-soft">{p.ref || '—'}</td>
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
                          onChange={(e) => handleMatch(p.id, e.target.value)}
                          className="rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink"
                        >
                          <option value="" disabled>Match to…</option>
                          {members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
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