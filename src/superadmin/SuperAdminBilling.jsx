import { useEffect, useState } from 'react'
import { Download, Ban, Bell, Smartphone, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { readUnpaidInvoices, readChamaSummary } from '../lib/superadminBridge'

export default function SuperAdminBilling() {
  const [invoices, setInvoices] = useState(() => readUnpaidInvoices())
  const [summary, setSummary] = useState(() => readChamaSummary())

  const refresh = () => { setInvoices(readUnpaidInvoices()); setSummary(readChamaSummary()) }
  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const eligible = invoices.filter((i) => i.daysOverdue >= 14 && i.status !== 'Blocked').length

  const handleBulkBlock = () => {
    if (eligible === 0) return toast.info('No eligible invoices')
    setInvoices((prev) => prev.map((i) => (i.daysOverdue >= 14 && i.status !== 'Blocked' ? { ...i, status: 'Blocked' } : i)))
    toast.error('Bulk Block Executed', { description: `Blocked ${eligible} chama(s).` })
  }
  const handleAction = (id, action, name) => {
    if (action === 'Mark paid') {
      setInvoices((prev) => prev.filter((i) => i.id !== id))
      toast.success('Invoice Cleared', { description: `${name} marked as paid.` })
    } else if (action === 'Block') {
      setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'Blocked' } : i)))
      toast.error('Chama Blocked', { description: `${name} blocked.` })
    }
  }
  const handleReminder = (name) => toast.success('Reminder Sent', { description: `SMS + Email sent to ${name}.` })
  const handleMpesa = (name) => toast.info('STK Push Sent', { description: `Awaiting PIN for ${name}.` })

  const handleExport = () => {
    const headers = ['Chama', 'Owner', 'Tier', 'Days Overdue', 'Amount (KSh)', 'Status']
    const rows = invoices.map((i) => [i.name, i.owner, i.tier, i.daysOverdue, i.amount, i.status])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url; a.download = `chametu-invoices-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete')
  }

  const tierBadge = (t) => t === 'Starter' ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    : t === 'Growth' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    : t === 'Business' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
  const statusBadge = (s) => s === 'Blocked' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    : s === 'Overdue' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Billing & tiers</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">Tier payments and enforcement (live from admin data)</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={refresh} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={handleBulkBlock} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${eligible > 0 ? 'bg-red-500 hover:bg-red-600' : 'cursor-not-allowed bg-red-400/50'}`}>
            <Ban size={15} /> Block {eligible} overdue
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
          <div className="text-[0.78rem] font-medium text-ink-soft sm:text-[0.85rem]">Collected this month</div>
          <div className="mt-1.5 font-display text-xl font-bold text-navy dark:text-white sm:mt-2 sm:text-2xl">KSh {summary.tierPrice?.toLocaleString() ?? '—'}</div>
          <div className="mt-1 text-[0.72rem] font-semibold text-forest dark:text-emerald-400 sm:text-[0.78rem]">{summary.tier} tier · {summary.memberCounts?.active} active</div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
          <div className="text-[0.78rem] font-medium text-ink-soft sm:text-[0.85rem]">Outstanding</div>
          <div className="mt-1.5 font-display text-xl font-bold text-navy dark:text-white sm:mt-2 sm:text-2xl">KSh {invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</div>
          <div className="mt-1 text-[0.72rem] font-semibold text-red-600 dark:text-red-400 sm:text-[0.78rem]">{invoices.length} chama(s) owe tier fees</div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
          <div className="text-[0.78rem] font-medium text-ink-soft sm:text-[0.85rem]">Tier prices</div>
          <div className="mt-1.5 font-mono text-base font-bold text-navy dark:text-white sm:mt-2 sm:text-lg">S:1.5k · G:3k · B:5k · Au:10k</div>
          <div className="mt-1 text-[0.72rem] text-ink-soft sm:text-[0.78rem]">per month</div>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-sm dark:border-white/10">
        <div className="border-b border-line p-4 dark:border-white/10 sm:p-5"><h2 className="font-display text-base font-bold text-navy dark:text-white sm:text-[1.05rem]">Unpaid tier invoices</h2></div>

        <ul className="divide-y divide-line md:hidden dark:divide-white/5">
          {invoices.length === 0 ? (
            <li className="px-4 py-10 text-center text-[0.82rem] text-ink-soft"><CheckCircle2 size={28} className="mx-auto mb-2 text-emerald opacity-50" /> All invoices are paid.</li>
          ) : invoices.map((inv) => (
            <li key={inv.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[0.9rem] font-bold text-navy dark:text-white">{inv.name}</p>
                  <p className="truncate text-[0.72rem] text-ink-soft">{inv.owner}</p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${statusBadge(inv.status)}`}>{inv.status}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-[0.72rem]">
                <div><span className="block text-ink-soft">Tier</span><span className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[0.66rem] font-bold ${tierBadge(inv.tier)}`}>{inv.tier}</span></div>
                <div><span className="block text-ink-soft">Days</span><span className="font-mono font-semibold text-navy dark:text-white">{inv.daysOverdue}d</span></div>
                <div><span className="block text-ink-soft">Amount</span><span className="font-mono font-semibold text-navy dark:text-white">KSh {inv.amount.toLocaleString()}</span></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button onClick={() => handleReminder(inv.name)} className="flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[0.7rem] font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white"><Bell size={11} /> Remind</button>
                <button onClick={() => handleMpesa(inv.name)} className="flex items-center gap-1 rounded-lg bg-[#0B1F33] px-2.5 py-1.5 text-[0.7rem] font-semibold text-white dark:bg-emerald dark:text-[#06331F]"><Smartphone size={11} /> M-Pesa</button>
                <button onClick={() => handleAction(inv.id, 'Mark paid', inv.name)} className="rounded-lg bg-forest px-2.5 py-1.5 text-[0.7rem] font-semibold text-white dark:bg-emerald dark:text-[#06331F]">Paid</button>
                {inv.status !== 'Blocked' && <button onClick={() => handleAction(inv.id, 'Block', inv.name)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[0.7rem] font-semibold text-white">Block</button>}
              </div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/50 text-[0.7rem] uppercase tracking-wider text-ink-soft dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-semibold lg:px-5">Chama</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Tier</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Days overdue</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Amount due</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Status</th>
                <th className="px-4 py-3 text-right font-semibold lg:px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-white/5">
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-ink-soft"><CheckCircle2 size={28} className="mx-auto mb-2 text-emerald opacity-50" /> All invoices are paid.</td></tr>
              ) : invoices.map((inv) => (
                <tr key={inv.id} className="transition hover:bg-paper/40 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><div className="font-medium text-navy dark:text-white">{inv.name}</div><div className="text-[0.72rem] text-ink-soft">{inv.owner}</div></td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`inline-flex rounded-md px-2 py-1 text-[0.68rem] font-bold ${tierBadge(inv.tier)}`}>{inv.tier}</span></td>
                  <td className="px-4 py-3 font-mono text-ink-soft lg:px-5 lg:py-4">{inv.daysOverdue}</td>
                  <td className="px-4 py-3 font-mono text-navy dark:text-white lg:px-5 lg:py-4">KSh {inv.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`inline-flex rounded-md px-2 py-1 text-[0.68rem] font-bold ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => handleReminder(inv.name)} className="flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1.5 text-[0.72rem] font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white"><Bell size={11} /> Remind</button>
                      <button onClick={() => handleMpesa(inv.name)} className="flex items-center gap-1 rounded-lg bg-[#0B1F33] px-2.5 py-1.5 text-[0.72rem] font-semibold text-white dark:bg-emerald dark:text-[#06331F]"><Smartphone size={11} /> M-Pesa</button>
                      <button onClick={() => handleAction(inv.id, 'Mark paid', inv.name)} className="rounded-lg bg-forest px-2.5 py-1.5 text-[0.72rem] font-semibold text-white dark:bg-emerald dark:text-[#06331F]">Paid</button>
                      {inv.status !== 'Blocked' && <button onClick={() => handleAction(inv.id, 'Block', inv.name)} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[0.72rem] font-semibold text-white">Block</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}