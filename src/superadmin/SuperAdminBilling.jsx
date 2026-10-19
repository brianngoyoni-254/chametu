import { useState } from 'react'
import { Download, Ban, Bell, Smartphone, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const INITIAL_INVOICES = [
  {
    id: 1,
    name: 'Wanjiku Merry-go-round',
    owner: 'R. Wanjiku',
    tier: 'Starter',
    daysOverdue: 14,
    amount: 1500,
    status: 'Blocked',
  },
  {
    id: 2,
    name: 'Mama Mboga Welfare',
    owner: 'A. Achieng',
    tier: 'Growth',
    daysOverdue: 32,
    amount: 6000,
    status: 'Blocked',
  },
  {
    id: 3,
    name: 'Amani Savers',
    owner: 'L. Njeri',
    tier: 'Starter',
    daysOverdue: 5,
    amount: 1500,
    status: 'Overdue',
  },
  {
    id: 4,
    name: 'Mwangaza Youth Group',
    owner: 'T. Mutua',
    tier: 'Growth',
    daysOverdue: 21,
    amount: 3000,
    status: 'Blocked',
  },
]

export default function SuperAdminBilling() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES)

  // Calculate invoices that are 14+ days overdue and NOT already blocked
  const eligibleForBulkBlock = invoices.filter(
    (inv) => inv.daysOverdue >= 14 && inv.status !== 'Blocked'
  ).length

  // --- Actions ---
  const handleAction = (id, action, name) => {
    if (action === 'Mark paid') {
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
      toast.success('Invoice Cleared', { description: `${name} has been marked as paid.` })
    } 
    else if (action === 'Block') {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: 'Blocked' } : inv))
      )
      toast.error('Chama Blocked', { description: `${name} has been blocked due to non-payment.` })
    }
  }

  const handleBulkBlock = () => {
    if (eligibleForBulkBlock === 0) {
      toast.info('No eligible invoices', { description: 'All 14+ day overdue chamas are already blocked.' })
      return
    }
    
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.daysOverdue >= 14 && inv.status !== 'Blocked' ? { ...inv, status: 'Blocked' } : inv
      )
    )
    toast.error('Bulk Block Executed', { description: `Blocked ${eligibleForBulkBlock} chamas for non-payment.` })
  }

  const handleReminder = (name) => {
    toast.success('Reminder Sent', { description: `SMS and Email sent to the chairperson of ${name}.` })
  }

  const handleMpesa = (name) => {
    toast.info('STK Push Sent', { description: `Awaiting M-Pesa PIN for ${name}.` })
  }

  // --- CSV Export ---
  const handleExport = () => {
    const headers = ['Chama Name', 'Owner', 'Tier', 'Days Overdue', 'Amount Due (KSh)', 'Status']
    const rows = invoices.map(inv => [
      inv.name, inv.owner, inv.tier, inv.daysOverdue, inv.amount, inv.status
    ])

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-unpaid-invoices-${new Date().toISOString().slice(0, 10)}.csv`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Export Complete', { description: `Downloaded ${invoices.length} unpaid invoices.` })
  }

  // --- Badge Helpers ---
  const tierBadge = (tier) => {
    if (tier === 'Starter') return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    if (tier === 'Growth') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    if (tier === 'Business') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
  }

  const statusBadge = (status) => {
    if (status === 'Blocked') return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    if (status === 'Overdue') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Billing & tiers</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Tier payments, reminders and enforcement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-paper dark:hover:bg-white/5"
          >
            <Download size={16} />
            Export CSV
          </button>
          <button 
            onClick={handleBulkBlock}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
              eligibleForBulkBlock > 0 
                ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                : 'bg-red-400/50 cursor-not-allowed dark:bg-red-900/50'
            }`}
          >
            <Ban size={16} />
            Block all 14+ days overdue ({eligibleForBulkBlock})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
          <div className="text-[0.85rem] font-medium text-ink-soft">Collected this month</div>
          <div className="mt-2 font-display text-2xl font-bold text-navy">KSh 33,000</div>
          <div className="mt-1 text-[0.78rem] font-semibold text-forest dark:text-emerald-400">
            Active, fully paid chamas
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
          <div className="text-[0.85rem] font-medium text-ink-soft">Outstanding</div>
          <div className="mt-2 font-display text-2xl font-bold text-navy">
            KSh {invoices.reduce((sum, inv) => sum + inv.amount, 0).toLocaleString()}
          </div>
          <div className="mt-1 text-[0.78rem] font-semibold text-red-600 dark:text-red-400">
            {invoices.length} chamas owe tier fees
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
          <div className="text-[0.85rem] font-medium text-ink-soft">Tier prices</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">
            S: 1.5k &middot; G: 3k &middot; B: 5k &middot; G: 10k
          </div>
          <div className="mt-1 text-[0.78rem] text-ink-soft">per month</div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-line bg-card shadow-sm">
        <div className="border-b border-line p-5">
          <h2 className="font-display text-[1.05rem] font-bold text-navy">Unpaid tier invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-line bg-paper/50 text-[0.72rem] uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-5 py-3 font-semibold">Chama</th>
                <th className="px-5 py-3 font-semibold">Tier</th>
                <th className="px-5 py-3 font-semibold">Days overdue</th>
                <th className="px-5 py-3 font-semibold">Amount due</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-soft">
                    <CheckCircle2 size={32} className="mx-auto text-emerald mb-2 opacity-50" />
                    All invoices are paid. Great job!
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="transition hover:bg-paper/40 dark:hover:bg-white/[0.02]">
                    <td className="px-5 py-4">
                      <div className="font-medium text-navy">{inv.name}</div>
                      <div className="text-[0.75rem] text-ink-soft">{inv.owner}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-[0.7rem] font-bold ${tierBadge(inv.tier)}`}>
                        {inv.tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-ink-soft">{inv.daysOverdue}</td>
                    <td className="px-5 py-4 font-mono text-navy">
                      KSh {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-md px-2 py-1 text-[0.7rem] font-bold ${statusBadge(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button 
                          onClick={() => handleReminder(inv.name)}
                          className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-1.5 text-[0.75rem] font-semibold text-navy transition hover:border-forest"
                        >
                          <Bell size={12} />
                          Send reminder
                        </button>
                        <button 
                          onClick={() => handleMpesa(inv.name)}
                          className="flex items-center gap-1.5 rounded-lg bg-[#0B1F33] px-3 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-[#0B1F33]/90 dark:bg-emerald dark:text-[#06331F] dark:hover:bg-emerald/90"
                        >
                          <Smartphone size={12} />
                          Pay with M-Pesa
                        </button>
                        <button
                          onClick={() => handleAction(inv.id, 'Mark paid', inv.name)}
                          className="rounded-lg bg-forest px-3 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]"
                        >
                          Mark paid
                        </button>
                        {inv.status !== 'Blocked' && (
                          <button
                            onClick={() => handleAction(inv.id, 'Block', inv.name)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-red-700"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}