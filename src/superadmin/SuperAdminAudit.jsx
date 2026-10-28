import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Search, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../lib/api'

const TONE_MAP = {
  green: 'bg-emerald/15 text-emerald-700 dark:text-emerald-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  gray: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
}
const fmtTime = (t) => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [toneFilter, setToneFilter] = useState('all')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('superadmin_token')
      const data = await api('/api/superadmin/audit', { token })
      setLogs(data)
    } catch (err) {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filtered = useMemo(() => logs.filter((l) => {
    if (toneFilter !== 'all' && l.tone !== toneFilter) return false
    const q = query.trim().toLowerCase()
    return !q || (l.actor + l.action + l.target).toLowerCase().includes(q)
  }), [logs, query, toneFilter])

  const handleExport = () => {
    const headers = ['Time', 'Actor', 'Action', 'Target', 'IP']
    const rows = filtered.map((l) => [fmtTime(l.time), l.actor, l.action, l.target, l.ip])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `chametu-audit-${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete')
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Audit log</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">Live actions from the admin dashboard · {logs.length} entries</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button onClick={fetchLogs} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-navy dark:text-white">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-navy dark:text-white">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-line p-3 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {[{ key: 'all', label: 'All' }, { key: 'green', label: 'Positive' }, { key: 'amber', label: 'Warnings' }, { key: 'red', label: 'Critical' }, { key: 'blue', label: 'Config' }, { key: 'gray', label: 'Other' }].map((f) => (
              <button key={f.key} onClick={() => setToneFilter(f.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold ${toneFilter === f.key ? 'bg-navy text-white dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-white dark:border-white/10 dark:bg-white/5 text-navy dark:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor, action, target…"
              className="w-full rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-navy dark:text-white outline-none focus:border-forest" />
          </div>
        </div>

        <div className="divide-y divide-line dark:divide-white/5">
          {loading ? (
            <div className="px-4 py-10 text-center text-[0.82rem] text-ink-soft">Loading audit logs...</div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[0.82rem] text-ink-soft"><ShieldCheck size={28} className="mx-auto mb-2 opacity-40" />No audit entries match.</div>
          ) : filtered.map((l) => (
            <div key={l.id} className="flex items-start gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 ${TONE_MAP[l.tone] || TONE_MAP.gray}`}><ShieldCheck size={12} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                  <span className="text-[0.82rem] font-bold text-navy dark:text-white">{l.actor}</span>
                  <span className="text-[0.72rem] text-ink-soft">·</span>
                  <span className="text-[0.78rem] font-medium text-navy dark:text-white">{l.action}</span>
                </div>
                <p className="mt-0.5 truncate text-[0.76rem] text-ink-soft">{l.target}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[0.66rem] text-ink-soft/80">
                  <span>{fmtTime(l.time)}</span>
                  <span className="font-mono">IP: {l.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}