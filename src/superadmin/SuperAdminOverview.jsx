import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, X, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'

const fmt = (n) => 'KSh ' + Math.round(n).toLocaleString('en-KE')

export default function SuperAdminOverview() {
  const [summary, setSummary] = useState({
    totalChamas: 0,
    totalMembers: 0,
    unmatchedPayments: 0,
    mrr: 0
  })
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('superadmin_token')
      const data = await api('/api/superadmin/overview', { token })
      setSummary(data)
    } catch (err) {
      toast.error('Failed to load platform overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const kpis = [
    { label: 'Monthly recurring revenue', value: fmt(summary.mrr), sub: 'All active tiers', tone: 'text-ink-soft', link: '/superadmin/billing' },
    { label: 'Active members', value: summary.totalMembers, sub: `Across ${summary.totalChamas} chamas`, tone: 'text-ink-soft', link: '/superadmin/chamas' },
    { label: 'Unmatched payments', value: summary.unmatchedPayments, sub: 'Needs review', tone: summary.unmatchedPayments > 0 ? 'text-red-500' : 'text-ink-soft', link: '/superadmin/payments' },
    { label: 'Platform Chamas', value: summary.totalChamas, sub: 'Registered on Chametu', tone: 'text-emerald', link: '/superadmin/chamas' },
  ]

  const handleDownload = () => {
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Chamas', summary.totalChamas],
      ['Active Members', summary.totalMembers],
      ['MRR', summary.mrr],
      ['Unmatched Payments', summary.unmatchedPayments]
    ]
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `chametu-overview-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    setOpen(false); toast.success('Export Complete')
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Platform overview</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">Live metrics · {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white dark:bg-emerald dark:text-[#06331F]"><Download size={16} /> Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} to={k.link} className="group rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md dark:border-white/10 dark:bg-white/5 sm:p-5">
            <div className="text-[0.78rem] font-medium text-ink-soft">{k.label}</div>
            <div className="mt-1.5 font-display text-[1.55rem] font-bold text-navy dark:text-white sm:mt-2 sm:text-[1.8rem]">{k.value}</div>
            <div className={`mt-1 text-[0.74rem] font-semibold ${k.tone}`}>{k.sub}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
        <h3 className="font-display text-[0.98rem] font-bold text-navy dark:text-white">System Health</h3>
        <p className="mt-1 text-[0.78rem] text-ink-soft">Global status across all registered chamas.</p>
        <div className="mt-4 space-y-2 text-[0.82rem]">
          <div className="rounded-lg border border-line px-3 py-2 dark:border-white/10"><b className="text-navy dark:text-white">Total Chamas:</b> {summary.totalChamas} registered</div>
          <div className="rounded-lg border border-line px-3 py-2 dark:border-white/10"><b className="text-navy dark:text-white">Active Members:</b> {summary.totalMembers} across all groups</div>
          <div className="rounded-lg border border-line px-3 py-2 dark:border-white/10"><b className="text-navy dark:text-white">Payment Gateway:</b> {summary.unmatchedPayments} unmatched transactions require review</div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#071625]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-display text-lg font-bold text-navy dark:text-white">Export overview</h3><button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10"><X size={18} /></button></div>
            <p className="mt-2 text-sm text-ink-soft">Downloads a CSV snapshot of the current platform metrics.</p>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft">Cancel</button><button onClick={handleDownload} className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white dark:bg-emerald dark:text-[#06331F]">Download CSV</button></div>
          </div>
        </div>
      )}
    </div>
  )
}