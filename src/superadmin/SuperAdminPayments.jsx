import { useEffect, useMemo, useState } from 'react'
import {
  Smartphone, Search, Download, CheckCircle2, Clock, XCircle,
  TrendingUp, Wallet, Receipt, Landmark, Banknote, X, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { readPaymentLedger, readChamaSummary, readChama } from '../lib/superadminBridge'

const CHANNELS = {
  mpesa: { label: 'M-Pesa', icon: Smartphone, color: 'text-emerald', bg: 'bg-emerald/10', bar: 'bg-emerald' },
  bank: { label: 'Bank', icon: Landmark, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', bar: 'bg-blue-500' },
  cash: { label: 'Cash', icon: Banknote, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-500' },
}
const STATUS = {
  paid: { label: 'Settled', icon: CheckCircle2, cls: 'bg-emerald/15 text-emerald-700 dark:text-emerald-400' },
  pending: { label: 'Pending', icon: Clock, cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  failed: { label: 'Failed', icon: XCircle, cls: 'bg-red-500/15 text-red-600 dark:text-red-400' },
}

const fmt = (n) => 'KSh ' + Math.round(n).toLocaleString('en-KE')
const timeFmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function SuperAdminPayments() {
  const [txns, setTxns] = useState(() => readPaymentLedger())
  const [summary, setSummary] = useState(() => readChamaSummary())
  const [chama] = useState(() => readChama())
  const [query, setQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const refresh = () => { setTxns(readPaymentLedger()); setSummary(readChamaSummary()) }
  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const filtered = useMemo(() => txns.filter((t) => {
    const matchChannel = channelFilter === 'all' || t.channel === channelFilter
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const q = query.trim().toLowerCase()
    const matchQuery = !q || (t.chama + t.ref + (t.payer || '') + (t.phone || '')).toLowerCase().includes(q)
    return matchChannel && matchStatus && matchQuery
  }), [txns, channelFilter, statusFilter, query])

  const totals = useMemo(() => {
    const byChannel = { mpesa: 0, bank: 0, cash: 0 }
    let total = 0, pending = 0, failed = 0, count = 0
    for (const t of txns) {
      if (t.status === 'paid') { byChannel[t.channel] += t.amount; total += t.amount; count++ }
      if (t.status === 'pending') pending++
      if (t.status === 'failed') failed++
    }
    return { byChannel, total, pending, failed, count }
  }, [txns])

  const handleExport = () => {
    const headers = ['Channel', 'Reference', 'Chama', 'Payer', 'Contact', 'Amount', 'Time', 'Status']
    const rows = filtered.map((t) => [CHANNELS[t.channel].label, t.ref, t.chama, t.payer || '', t.phone || t.account || t.receivedBy || '', t.amount, new Date(t.time).toLocaleString('en-GB'), STATUS[t.status].label])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `chametu-payments-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete', { description: `Downloaded ${filtered.length} transactions.` })
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Payments</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">
            Live ledger from <b className="text-navy dark:text-white">{chama.name}</b> · paybill <span className="font-mono">{chama.paybill}</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={refresh} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white"><RefreshCw size={14} /> Refresh</button>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white"><Download size={15} /> Export</button>
          <button onClick={() => setModal('mpesa')} className="flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white dark:bg-emerald dark:text-[#06331F]"><Smartphone size={15} /> Request via M-Pesa</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-navy to-[#0B6B45] p-4 text-white shadow-lg sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] font-medium text-white/70">Total received</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15"><Wallet size={15} /></span>
          </div>
          <div className="mt-2 font-display text-xl font-bold sm:text-2xl">{fmt(totals.total)}</div>
          <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-300"><TrendingUp size={12} /> {totals.count} settled payments</div>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="bg-emerald" style={{ width: `${(totals.byChannel.mpesa / (totals.total || 1)) * 100}%` }} />
            <div className="bg-blue-400" style={{ width: `${(totals.byChannel.bank / (totals.total || 1)) * 100}%` }} />
            <div className="bg-amber-400" style={{ width: `${(totals.byChannel.cash / (totals.total || 1)) * 100}%` }} />
          </div>
        </div>
        {Object.entries(CHANNELS).map(([key, cfg]) => {
          const Icon = cfg.icon
          const val = totals.byChannel[key]
          const pct = totals.total ? (val / totals.total) * 100 : 0
          return (
            <div key={key} className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] font-medium text-ink-soft sm:text-[0.82rem]">Via {cfg.label}</span>
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${cfg.bg} ${cfg.color}`}><Icon size={15} /></span>
              </div>
              <div className="mt-2 font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">{fmt(val)}</div>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-line/50 dark:bg-white/10">
                  <div className={`h-full rounded-full ${cfg.bar}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[0.7rem] font-semibold text-ink-soft">{pct.toFixed(0)}%</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 dark:border-white/10 sm:px-4 sm:py-3">
          <CheckCircle2 size={16} className="text-emerald" />
          <div className="flex-1 min-w-0"><p className="text-[0.68rem] text-ink-soft">Settled</p><p className="truncate text-[0.82rem] font-bold text-navy dark:text-white">{txns.filter((t) => t.status === 'paid').length} transactions</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 dark:border-white/10 sm:px-4 sm:py-3">
          <Clock size={16} className="text-amber-500" />
          <div className="flex-1 min-w-0"><p className="text-[0.68rem] text-ink-soft">Pending PIN</p><p className="truncate text-[0.82rem] font-bold text-navy dark:text-white">{totals.pending} STK prompts</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 dark:border-white/10 sm:px-4 sm:py-3">
          <XCircle size={16} className="text-red-500" />
          <div className="flex-1 min-w-0"><p className="text-[0.68rem] text-ink-soft">Unmatched</p><p className="truncate text-[0.82rem] font-bold text-navy dark:text-white">{summary.unmatchedPayments} need matching</p></div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-sm dark:border-white/10">
        <div className="flex flex-col gap-2 border-b border-line p-3 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {[
              { key: 'all', label: 'All channels' },
              { key: 'mpesa', label: 'M-Pesa', Icon: Smartphone },
              { key: 'bank', label: 'Bank', Icon: Landmark },
              { key: 'cash', label: 'Cash', Icon: Banknote },
            ].map((f) => (
              <button key={f.key} onClick={() => setChannelFilter(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold ${channelFilter === f.key ? 'bg-navy text-white dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-card text-navy dark:border-white/10 dark:bg-white/5 dark:text-white'}`}>
                {f.Icon && <f.Icon size={11} />} {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ref, chama or payer…"
              className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-forest dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </div>
        </div>

        <ul className="divide-y divide-line md:hidden dark:divide-white/5">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-[0.82rem] text-ink-soft"><Receipt size={26} className="mx-auto mb-2 opacity-40" />No transactions match.</li>
          ) : filtered.map((t) => {
            const cfg = CHANNELS[t.channel]
            const ChIcon = cfg.icon
            const st = STATUS[t.status]
            const StIcon = st.icon
            return (
              <li key={t.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><p className="truncate text-[0.9rem] font-bold text-navy dark:text-white">{t.chama}</p><p className="truncate font-mono text-[0.7rem] text-ink-soft">{t.ref}</p></div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[0.64rem] font-bold ${st.cls}`}><StIcon size={10} /> {st.label}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${cfg.bg} ${cfg.color}`}><ChIcon size={10} /> {cfg.label}</span>
                  <span className="font-mono text-[0.9rem] font-bold text-navy dark:text-white">{fmt(t.amount)}</span>
                </div>
                <p className="mt-1 truncate text-[0.68rem] text-ink-soft">{timeFmt(t.time)} · {t.payer || '—'}</p>
              </li>
            )
          })}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/40 text-[0.68rem] uppercase tracking-wider text-ink-soft dark:border-white/10 dark:bg-white/5">
              <tr><th className="px-4 py-3 font-semibold lg:px-5">Channel</th><th className="px-4 py-3 font-semibold lg:px-5">Reference</th><th className="px-4 py-3 font-semibold lg:px-5">Chama</th><th className="px-4 py-3 font-semibold lg:px-5">Payer</th><th className="px-4 py-3 font-semibold lg:px-5">Amount</th><th className="px-4 py-3 font-semibold lg:px-5">Time</th><th className="px-4 py-3 font-semibold lg:px-5">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-14 text-center text-ink-soft"><Receipt size={30} className="mx-auto mb-2 opacity-40" /> No transactions match.</td></tr>
              ) : filtered.map((t) => {
                const cfg = CHANNELS[t.channel]
                const ChIcon = cfg.icon
                const st = STATUS[t.status]
                const StIcon = st.icon
                return (
                  <tr key={t.id} className="transition hover:bg-paper/40 dark:hover:bg-white/[0.02]">
                    <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.72rem] font-bold ${cfg.bg} ${cfg.color}`}><ChIcon size={12} /> {cfg.label}</span></td>
                    <td className="px-4 py-3 font-mono text-[0.78rem] text-navy dark:text-white lg:px-5 lg:py-4">{t.ref}</td>
                    <td className="px-4 py-3 lg:px-5 lg:py-4"><div className="font-semibold text-navy dark:text-white">{t.chama}</div><div className="text-[0.72rem] text-ink-soft">{t.tier} tier</div></td>
                    <td className="px-4 py-3 text-[0.8rem] text-ink-soft lg:px-5 lg:py-4">{t.payer || '—'}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-navy dark:text-white lg:px-5 lg:py-4">{fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-[0.78rem] text-ink-soft lg:px-5 lg:py-4">{timeFmt(t.time)}</td>
                    <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-bold ${st.cls}`}><StIcon size={11} /> {st.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'mpesa' && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setModal(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-white/10"><h3 className="font-display text-base font-bold text-navy dark:text-white">Request payment</h3><button onClick={() => setModal(null)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10"><X size={18} /></button></div>
            <div className="p-4 text-sm text-ink-soft">
              STK push flow uses the backend Daraja integration. In this demo, sending the form simply closes the modal.
              <div className="mt-3 flex justify-end"><button onClick={() => { setModal(null); toast.info('STK flow requires backend integration') }} className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white dark:bg-emerald dark:text-[#06331F]">OK</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}