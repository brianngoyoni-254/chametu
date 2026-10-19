import { useMemo, useState } from 'react'
import {
  Smartphone, Building2, Banknote, Search, Download, CheckCircle2,
  Clock, XCircle, Send, TrendingUp, Wallet, Receipt, Landmark, X
} from 'lucide-react'
import { toast } from 'sonner'

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

const INITIAL_TXNS = [
  { id: 1, channel: 'mpesa', ref: 'Q8F2K9L1M', chama: 'Umoja Investment Group', payer: 'J. Mwangi', phone: '0712345678', amount: 10000, time: '2026-10-19T09:42:00', status: 'paid', tier: 'Gold' },
  { id: 2, channel: 'bank', ref: 'KCB-8842-01', chama: 'Eldoret Farmers SACCO', payer: 'K. Rotich', account: 'KCB 1102…3847', amount: 10000, time: '2026-10-19T08:15:00', status: 'paid', tier: 'Gold' },
  { id: 3, channel: 'cash', ref: 'RCPT-2041', chama: 'Nyota Ladies Circle', payer: 'C. Wambui', receivedBy: 'Danny (Lead Dev)', amount: 5000, time: '2026-10-19T07:20:00', status: 'paid', tier: 'Business' },
  { id: 4, channel: 'mpesa', ref: 'Q7A3B8C2N', chama: 'Mama Mboga Welfare', payer: 'A. Achieng', phone: '0734567890', amount: 6000, time: '2026-10-18T17:30:00', status: 'pending', tier: 'Growth' },
  { id: 5, channel: 'mpesa', ref: 'Q5G5H1J4R', chama: 'Mwangaza Youth Group', payer: 'T. Mutua', phone: '0745678901', amount: 3000, time: '2026-10-18T14:05:00', status: 'failed', tier: 'Growth' },
  { id: 6, channel: 'bank', ref: 'EQT-5591-02', chama: 'Kiambu Land Chama', payer: 'P. Kariuki', account: 'Equity 0170…9123', amount: 5000, time: '2026-10-18T11:22:00', status: 'paid', tier: 'Business' },
  { id: 7, channel: 'cash', ref: 'RCPT-2038', chama: 'Amani Savers', payer: 'L. Njeri', receivedBy: 'Brian (Dev 2)', amount: 1500, time: '2026-10-17T16:48:00', status: 'paid', tier: 'Starter' },
  { id: 8, channel: 'mpesa', ref: 'Q2R8S4T7U', chama: 'Pwani Builders', payer: 'H. Said', phone: '0778901234', amount: 3000, time: '2026-10-17T10:12:00', status: 'paid', tier: 'Growth' },
  { id: 9, channel: 'bank', ref: 'COOP-3308-04', chama: 'Tujenge Circle', payer: 'S. Kiprono', account: 'Co-op 0112…4488', amount: 5000, time: '2026-10-16T15:30:00', status: 'paid', tier: 'Business' },
  { id: 10, channel: 'cash', ref: 'RCPT-2032', chama: 'Wanjiku Merry-go-round', payer: 'R. Wanjiku', receivedBy: 'Danny (Lead Dev)', amount: 1500, time: '2026-10-16T09:05:00', status: 'paid', tier: 'Starter' },
]

const CHAMA_OPTIONS = [
  { id: 1, name: 'Umoja Investment Group', owes: 0 },
  { id: 2, name: 'Wanjiku Merry-go-round', owes: 1500 },
  { id: 3, name: 'Kiambu Land Chama', owes: 0 },
  { id: 4, name: 'Mama Mboga Welfare', owes: 6000 },
  { id: 5, name: 'Tujenge Circle', owes: 0 },
  { id: 6, name: 'Pwani Builders', owes: 0 },
  { id: 7, name: 'Eldoret Farmers SACCO', owes: 0 },
  { id: 8, name: 'Amani Savers', owes: 1500 },
  { id: 9, name: 'Mwangaza Youth Group', owes: 3000 },
  { id: 10, name: 'Nyota Ladies Circle', owes: 0 },
]

const fmt = (n) => 'KSh ' + Math.round(n).toLocaleString('en-KE')
const timeFmt = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function SuperAdminPayments() {
  const [txns, setTxns] = useState(INITIAL_TXNS)
  const [query, setQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modal, setModal] = useState(null)

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
    const headers = ['Channel', 'Reference', 'Chama', 'Payer', 'Contact', 'Amount (KSh)', 'Time', 'Status']
    const rows = filtered.map((t) => [
      CHANNELS[t.channel].label, t.ref, t.chama, t.payer || '',
      t.phone || t.account || t.receivedBy || '',
      t.amount, new Date(t.time).toLocaleString('en-GB'), STATUS[t.status].label,
    ])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-payments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete', { description: `Downloaded ${filtered.length} transactions.` })
  }

  const recordBank = (form) => {
    const newTxn = { id: Date.now(), channel: 'bank', ref: form.ref || `BANK-${Date.now().toString().slice(-6)}`, chama: form.chama, payer: form.payer, account: form.account || '—', amount: Number(form.amount), time: new Date().toISOString(), status: 'paid', tier: '—' }
    setTxns((prev) => [newTxn, ...prev])
    toast.success('Bank payment recorded', { description: `${fmt(newTxn.amount)} from ${newTxn.chama}` })
    setModal(null)
  }

  const recordCash = (form) => {
    const newTxn = { id: Date.now(), channel: 'cash', ref: form.ref || `RCPT-${Date.now().toString().slice(-4)}`, chama: form.chama, payer: form.payer, receivedBy: form.receivedBy || 'Super Admin', amount: Number(form.amount), time: new Date().toISOString(), status: 'paid', tier: '—' }
    setTxns((prev) => [newTxn, ...prev])
    toast.success('Cash payment recorded', { description: `${fmt(newTxn.amount)} from ${newTxn.chama}` })
    setModal(null)
  }

  const sendMpesaStk = (form) => {
    const phone = form.phone.replace(/\s/g, '')
    if (!/^(07|01)\d{8}$|^254[17]\d{8}$/.test(phone)) return toast.error('Enter a valid Safaricom number')
    const amt = Number(form.amount)
    if (!(amt > 0)) return toast.error('Enter a valid amount')
    const chama = CHAMA_OPTIONS.find((c) => String(c.id) === String(form.chamaId))
    if (!chama) return toast.error('Select a chama')

    const ref = 'Q' + Math.random().toString(36).slice(2, 11).toUpperCase()
    const newTxn = { id: Date.now(), channel: 'mpesa', ref, chama: chama.name, payer: chama.name, phone, amount: amt, time: new Date().toISOString(), status: 'pending', tier: '—' }
    setTxns((prev) => [newTxn, ...prev])
    setModal(null)
    toast.info('STK Push Sent', { description: `Awaiting PIN for ${chama.name}.` })
    setTimeout(() => {
      setTxns((prev) => prev.map((t) => (t.id === newTxn.id ? { ...t, status: 'paid' } : t)))
      toast.success('Payment received', { description: `${fmt(amt)} from ${chama.name}` })
    }, 3200)
  }

  return (
    <div className="mx-auto max-w-[1280px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Payments</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">
            Multi-channel ledger · M-Pesa <span className="font-mono font-semibold text-navy dark:text-white">400200</span> · acct <span className="font-mono font-semibold text-navy dark:text-white">CHAMETU</span>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setModal('mpesa')} className="flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]">
            <Smartphone size={15} /> Request via M-Pesa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-navy to-[#0B6B45] p-4 text-white shadow-lg dark:border-white/10 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] font-medium text-white/70 sm:text-[0.8rem]">Total received</span>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15"><Wallet size={15} /></span>
          </div>
          <div className="mt-2 font-display text-xl font-bold sm:text-2xl">{fmt(totals.total)}</div>
          <div className="mt-1 flex items-center gap-1 text-[0.7rem] font-semibold text-emerald-300 sm:text-[0.74rem]">
            <TrendingUp size={12} /> {totals.count} settled payments
          </div>
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
          <div className="flex-1 min-w-0">
            <p className="text-[0.68rem] text-ink-soft sm:text-[0.72rem]">Settled</p>
            <p className="truncate text-[0.82rem] font-bold text-navy dark:text-white sm:text-[0.88rem]">{txns.filter((t) => t.status === 'paid').length} transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 dark:border-white/10 sm:px-4 sm:py-3">
          <Clock size={16} className="text-amber-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[0.68rem] text-ink-soft sm:text-[0.72rem]">Pending PIN</p>
            <p className="truncate text-[0.82rem] font-bold text-navy dark:text-white sm:text-[0.88rem]">{totals.pending} STK prompts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5 dark:border-white/10 sm:px-4 sm:py-3">
          <XCircle size={16} className="text-red-500" />
          <div className="flex-1 min-w-0">
            <p className="text-[0.68rem] text-ink-soft sm:text-[0.72rem]">Failed</p>
            <p className="truncate text-[0.82rem] font-bold text-navy dark:text-white sm:text-[0.88rem]">{totals.failed} need follow-up</p>
          </div>
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
              <button
                key={f.key}
                onClick={() => setChannelFilter(f.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition sm:px-3.5 sm:text-[0.78rem] ${channelFilter === f.key ? 'bg-navy text-white dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-card text-navy hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'}`}
              >
                {f.Icon && <f.Icon size={11} />} {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-[260px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ref, chama or payer…"
              className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-forest dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <ul className="divide-y divide-line md:hidden dark:divide-white/5">
          {filtered.length === 0 ? (
            <li className="px-4 py-10 text-center text-[0.82rem] text-ink-soft">
              <Receipt size={26} className="mx-auto mb-2 opacity-40" />
              No transactions match.
            </li>
          ) : filtered.map((t) => {
            const cfg = CHANNELS[t.channel]
            const ChIcon = cfg.icon
            const st = STATUS[t.status]
            const StIcon = st.icon
            return (
              <li key={t.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[0.9rem] font-bold text-navy dark:text-white">{t.chama}</p>
                    <p className="truncate font-mono text-[0.7rem] text-ink-soft">{t.ref}</p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[0.64rem] font-bold ${st.cls}`}>
                    <StIcon size={10} /> {st.label}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${cfg.bg} ${cfg.color}`}>
                    <ChIcon size={10} /> {cfg.label}
                  </span>
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
              <tr>
                <th className="px-4 py-3 font-semibold lg:px-5">Channel</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Reference</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Chama</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Payer / detail</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Amount</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Time</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Status</th>
              </tr>
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
                    <td className="px-4 py-3 lg:px-5 lg:py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.72rem] font-bold ${cfg.bg} ${cfg.color}`}><ChIcon size={12} /> {cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[0.78rem] text-navy dark:text-white lg:px-5 lg:py-4">{t.ref}</td>
                    <td className="px-4 py-3 lg:px-5 lg:py-4">
                      <div className="font-semibold text-navy dark:text-white">{t.chama}</div>
                      <div className="text-[0.72rem] text-ink-soft">{t.tier} tier</div>
                    </td>
                    <td className="px-4 py-3 text-[0.8rem] text-ink-soft lg:px-5 lg:py-4">
                      {t.channel === 'mpesa' && (<><div className="font-medium text-navy dark:text-white">{t.payer}</div><div className="font-mono">{t.phone.slice(0, 4)}XXX{t.phone.slice(-3)}</div></>)}
                      {t.channel === 'bank' && (<><div className="font-medium text-navy dark:text-white">{t.payer}</div><div className="font-mono">{t.account}</div></>)}
                      {t.channel === 'cash' && (<><div className="font-medium text-navy dark:text-white">{t.payer}</div><div>Recv. by {t.receivedBy}</div></>)}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-navy dark:text-white lg:px-5 lg:py-4">{fmt(t.amount)}</td>
                    <td className="px-4 py-3 text-[0.78rem] text-ink-soft lg:px-5 lg:py-4">{timeFmt(t.time)}</td>
                    <td className="px-4 py-3 lg:px-5 lg:py-4">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-bold ${st.cls}`}><StIcon size={11} /> {st.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'mpesa' && <ModalShell title="Request payment via M-Pesa" icon={Smartphone} onClose={() => setModal(null)}><MpesaForm onCancel={() => setModal(null)} onSubmit={sendMpesaStk} /></ModalShell>}
      {modal === 'bank' && <ModalShell title="Record bank payment" icon={Landmark} onClose={() => setModal(null)}><BankForm onCancel={() => setModal(null)} onSubmit={recordBank} /></ModalShell>}
      {modal === 'cash' && <ModalShell title="Record cash payment" icon={Banknote} onClose={() => setModal(null)}><CashForm onCancel={() => setModal(null)} onSubmit={recordCash} /></ModalShell>}
    </div>
  )
}

function ModalShell({ title, icon: Icon, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-white/10 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <Icon className="text-forest dark:text-emerald" size={18} />
            <h3 className="font-display text-base font-bold text-navy dark:text-white sm:text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-navy outline-none focus:border-forest focus:ring-4 focus:ring-forest/10 dark:border-white/10 dark:bg-white/5 dark:text-white'
const labelCls = 'mb-1.5 block text-[0.75rem] font-semibold text-navy dark:text-white'

function MpesaForm({ onCancel, onSubmit }) {
  const [chamaId, setChamaId] = useState('')
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const changeChama = (id) => {
    setChamaId(id)
    const c = CHAMA_OPTIONS.find((x) => String(x.id) === id)
    if (c?.owes) setAmount(String(c.owes))
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ chamaId, phone, amount }) }} className="space-y-3 p-4 sm:space-y-4 sm:p-5">
      <label className="block">
        <span className={labelCls}>Chama</span>
        <select value={chamaId} onChange={(e) => changeChama(e.target.value)} className={inputCls}>
          <option value="">Select chama…</option>
          {CHAMA_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}{c.owes ? ` — owes ${fmt(c.owes)}` : ''}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={labelCls}>Safaricom phone</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" className={`${inputCls} font-mono`} />
      </label>
      <label className="block">
        <span className={labelCls}>Amount (KSh)</span>
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} font-mono`} />
      </label>
      <div className="flex justify-end gap-2 pt-1 sm:gap-3 sm:pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:text-navy dark:hover:text-white sm:px-4">Cancel</button>
        <button type="submit" className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-4">Send STK push</button>
      </div>
    </form>
  )
}

function BankForm({ onCancel, onSubmit }) {
  const [chamaId, setChamaId] = useState('')
  const [payer, setPayer] = useState('')
  const [account, setAccount] = useState('')
  const [ref, setRef] = useState('')
  const [amount, setAmount] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); const c = CHAMA_OPTIONS.find((x) => String(x.id) === chamaId); onSubmit({ chama: c?.name || '', payer, account, ref, amount }) }} className="space-y-3 p-4 sm:space-y-4 sm:p-5">
      <label className="block">
        <span className={labelCls}>Chama</span>
        <select value={chamaId} onChange={(e) => setChamaId(e.target.value)} className={inputCls}>
          <option value="">Select chama…</option>
          {CHAMA_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <label className="block"><span className={labelCls}>Depositor</span><input value={payer} onChange={(e) => setPayer(e.target.value)} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Bank / account</span><input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="KCB 1102…3847" className={inputCls} /></label>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <label className="block"><span className={labelCls}>Bank reference</span><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Auto if blank" className={`${inputCls} font-mono`} /></label>
        <label className="block"><span className={labelCls}>Amount (KSh)</span><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} font-mono`} /></label>
      </div>
      <div className="flex justify-end gap-2 pt-1 sm:gap-3 sm:pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:text-navy dark:hover:text-white sm:px-4">Cancel</button>
        <button type="submit" className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-4">Record payment</button>
      </div>
    </form>
  )
}

function CashForm({ onCancel, onSubmit }) {
  const [chamaId, setChamaId] = useState('')
  const [payer, setPayer] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [ref, setRef] = useState('')
  const [amount, setAmount] = useState('')
  return (
    <form onSubmit={(e) => { e.preventDefault(); const c = CHAMA_OPTIONS.find((x) => String(x.id) === chamaId); onSubmit({ chama: c?.name || '', payer, receivedBy, ref, amount }) }} className="space-y-3 p-4 sm:space-y-4 sm:p-5">
      <label className="block">
        <span className={labelCls}>Chama</span>
        <select value={chamaId} onChange={(e) => setChamaId(e.target.value)} className={inputCls}>
          <option value="">Select chama…</option>
          {CHAMA_OPTIONS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <label className="block"><span className={labelCls}>Payer</span><input value={payer} onChange={(e) => setPayer(e.target.value)} className={inputCls} /></label>
        <label className="block"><span className={labelCls}>Received by</span><input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} placeholder="Staff name" className={inputCls} /></label>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        <label className="block"><span className={labelCls}>Receipt no.</span><input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Auto if blank" className={`${inputCls} font-mono`} /></label>
        <label className="block"><span className={labelCls}>Amount (KSh)</span><input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputCls} font-mono`} /></label>
      </div>
      <div className="flex justify-end gap-2 pt-1 sm:gap-3 sm:pt-2">
        <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:text-navy dark:hover:text-white sm:px-4">Cancel</button>
        <button type="submit" className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-4">Record payment</button>
      </div>
    </form>
  )
}