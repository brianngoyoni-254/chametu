import { useEffect, useMemo, useState } from 'react'
import { ShieldCheck, Search, Download, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { readAuditLog, readDerivedAudit, appendAuditLog, writeAuditLog } from '../lib/superadminBridge'

const TONE_MAP = {
  green: 'bg-emerald/15 text-emerald-700 dark:text-emerald-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  gray: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
}
const fmtTime = (t) => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function SuperAdminAudit() {
  const [derived, setDerived] = useState(() => readDerivedAudit())
  const [manual, setManual] = useState(() => readAuditLog())
  const [query, setQuery] = useState('')
  const [toneFilter, setToneFilter] = useState('all')
  const [confirmReset, setConfirmReset] = useState(false)

  const refresh = () => { setDerived(readDerivedAudit()); setManual(readAuditLog()) }
  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener('storage', onStorage)
    window.addEventListener('chametu:audit-updated', onStorage)
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('chametu:audit-updated', onStorage) }
  }, [])

  const logs = useMemo(() => [...manual, ...derived].sort((a, b) => (a.time < b.time ? 1 : -1)), [manual, derived])

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

  const handleReset = () => {
    writeAuditLog([])
    appendAuditLog({ actor: 'Super Admin', action: 'Audit log reset', target: 'Manual entries cleared', tone: 'amber', ip: '—' })
    setManual(readAuditLog())
    setConfirmReset(false)
    toast.success('Manual audit entries cleared')
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Audit log</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">Live actions from the admin dashboard · {logs.length} entries</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button onClick={refresh} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white"><RefreshCw size={14} /> Refresh</button>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy dark:border-white/10 dark:bg-white/5 dark:text-white"><Download size={15} /> Export</button>
          <button onClick={() => setConfirmReset(true)} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400"><Trash2 size={15} /> Reset manual entries</button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-sm dark:border-white/10">
        <div className="flex flex-col gap-2 border-b border-line p-3 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {[{ key: 'all', label: 'All' }, { key: 'green', label: 'Positive' }, { key: 'amber', label: 'Warnings' }, { key: 'red', label: 'Critical' }, { key: 'blue', label: 'Config' }, { key: 'gray', label: 'Other' }].map((f) => (
              <button key={f.key} onClick={() => setToneFilter(f.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold ${toneFilter === f.key ? 'bg-navy text-white dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-card text-navy dark:border-white/10 dark:bg-white/5 dark:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor, action, target…"
              className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-forest dark:border-white/10 dark:bg-white/5 dark:text-white" />
          </div>
        </div>

        <div className="divide-y divide-line dark:divide-white/5">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[0.82rem] text-ink-soft"><ShieldCheck size={28} className="mx-auto mb-2 opacity-40" />No audit entries match.</div>
          ) : filtered.map((l) => (
            <div key={l.id} className="flex items-start gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 ${TONE_MAP[l.tone]}`}><ShieldCheck size={12} /></span>
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

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-5 shadow-2xl dark:border-white/10">
            <div className="flex items-center gap-2"><AlertTriangle className="text-red-600" size={18} /><h3 className="font-display text-base font-bold text-navy dark:text-white">Reset manual audit entries?</h3></div>
            <p className="mt-2 text-sm text-ink-soft">Derived entries (member/payment/loan events) will still show — only superadmin-written entries are cleared.</p>
            <div className="mt-4 flex justify-end gap-2"><button onClick={() => setConfirmReset(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft">Cancel</button><button onClick={handleReset} className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"><RefreshCw size={13} /> Reset</button></div>
          </div>
        </div>
      )}
    </div>
  )
}