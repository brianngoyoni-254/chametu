import { useState, useMemo } from 'react'
import { ShieldCheck, Search, Download, Trash2, RefreshCw, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

const SEED_LOG = [
  { id: 1, actor: 'Danny (Lead Dev)', action: 'Bulk block executed', target: '2 chamas (14+ days overdue)', tone: 'red', time: '2026-10-19T09:42:00', ip: '196.201.214.8' },
  { id: 2, actor: 'Danny (Lead Dev)', action: 'Payment recorded', target: 'Umoja Investment Group — KSh 10,000', tone: 'green', time: '2026-10-19T09:15:00', ip: '196.201.214.8' },
  { id: 3, actor: 'Brian (Dev 2)', action: 'Chama reactivated', target: 'Amani Savers', tone: 'green', time: '2026-10-19T08:30:00', ip: '41.90.64.12' },
  { id: 4, actor: 'System', action: 'Reminder auto-sent', target: '3 chamas overdue 7+ days', tone: 'amber', time: '2026-10-19T07:00:00', ip: '—' },
  { id: 5, actor: 'Danny (Lead Dev)', action: 'Chama blocked', target: 'Wanjiku Merry-go-round', tone: 'red', time: '2026-10-18T18:22:00', ip: '196.201.214.8' },
  { id: 6, actor: 'Brian (Dev 2)', action: 'Settings updated', target: 'Grace period: 7 → 10 days', tone: 'blue', time: '2026-10-18T16:45:00', ip: '41.90.64.12' },
  { id: 7, actor: 'Danny (Lead Dev)', action: 'Chama deactivated', target: 'Tujenge Circle', tone: 'gray', time: '2026-10-18T14:10:00', ip: '196.201.214.8' },
  { id: 8, actor: 'System', action: 'Tier price updated', target: 'Gold: KSh 10,000/mo', tone: 'blue', time: '2026-10-17T11:30:00', ip: '—' },
  { id: 9, actor: 'Brian (Dev 2)', action: 'CSV exported', target: 'All chamas report', tone: 'gray', time: '2026-10-17T10:05:00', ip: '41.90.64.12' },
  { id: 10, actor: 'Danny (Lead Dev)', action: 'STK push sent', target: 'Mama Mboga Welfare — KSh 6,000', tone: 'green', time: '2026-10-17T09:20:00', ip: '196.201.214.8' },
  { id: 11, actor: 'System', action: 'Payment failed', target: 'Mwangaza Youth Group — insufficient funds', tone: 'red', time: '2026-10-16T19:45:00', ip: '—' },
  { id: 12, actor: 'Brian (Dev 2)', action: 'Chama removed', target: 'Test Group Alpha', tone: 'red', time: '2026-10-16T15:12:00', ip: '41.90.64.12' },
]

const TONE_MAP = {
  green: 'bg-emerald/15 text-emerald-700 dark:text-emerald-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  blue: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  gray: 'bg-gray-500/15 text-gray-600 dark:text-gray-400',
}

const fmtTime = (t) => new Date(t).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState(SEED_LOG)
  const [query, setQuery] = useState('')
  const [toneFilter, setToneFilter] = useState('all')
  const [confirmReset, setConfirmReset] = useState(false)

  const filtered = useMemo(() => logs.filter((l) => {
    const matchesTone = toneFilter === 'all' || l.tone === toneFilter
    const q = query.trim().toLowerCase()
    const matchesQuery = !q || (l.actor + l.action + l.target).toLowerCase().includes(q)
    return matchesTone && matchesQuery
  }), [logs, query, toneFilter])

  const handleExport = () => {
    const headers = ['Time', 'Actor', 'Action', 'Target', 'IP']
    const rows = filtered.map((l) => [fmtTime(l.time), l.actor, l.action, l.target, l.ip])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-audit-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete', { description: `Downloaded ${filtered.length} audit entries.` })
  }

  const handleReset = () => {
    setLogs(SEED_LOG.slice(0, 1))
    setConfirmReset(false)
    toast.success('Audit log cleared', { description: 'Demo data has been reset.' })
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Audit log</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">Every superadmin action, timestamped · {logs.length} entries</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setConfirmReset(true)} className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400">
            <Trash2 size={15} /> Reset log
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 dark:border-blue-400/20 sm:p-4">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="min-w-0">
          <p className="text-[0.82rem] font-semibold text-navy dark:text-white sm:text-[0.85rem]">Immutable audit trail</p>
          <p className="mt-0.5 text-[0.72rem] text-ink-soft sm:text-[0.78rem]">
            In production, this log is append-only and backed by your server. Entries cannot be edited or deleted by admins.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-sm dark:border-white/10">
        <div className="flex flex-col gap-2 border-b border-line p-3 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {[
              { key: 'all', label: 'All' },
              { key: 'green', label: 'Positive' },
              { key: 'amber', label: 'Warnings' },
              { key: 'red', label: 'Critical' },
              { key: 'blue', label: 'Config' },
              { key: 'gray', label: 'Other' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setToneFilter(f.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold transition sm:px-4 sm:text-[0.8rem] ${toneFilter === f.key ? 'bg-navy text-white dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-card text-navy hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actor, action or target…"
              className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-forest dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div className="divide-y divide-line dark:divide-white/5">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-[0.82rem] text-ink-soft sm:px-5 sm:py-12">
              <ShieldCheck size={28} className="mx-auto mb-2 opacity-40" />
              No audit entries match your filters.
            </div>
          ) : filtered.map((l) => (
            <div key={l.id} className="flex items-start gap-3 px-3 py-3 transition hover:bg-paper/40 dark:hover:bg-white/[0.02] sm:gap-4 sm:px-5 sm:py-4">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 ${TONE_MAP[l.tone]}`}>
                <ShieldCheck size={12} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 sm:gap-x-2">
                  <span className="text-[0.82rem] font-bold text-navy dark:text-white sm:text-[0.85rem]">{l.actor}</span>
                  <span className="text-[0.72rem] text-ink-soft sm:text-[0.8rem]">·</span>
                  <span className="text-[0.78rem] font-medium text-navy dark:text-white sm:text-[0.82rem]">{l.action}</span>
                </div>
                <p className="mt-0.5 truncate text-[0.76rem] text-ink-soft sm:text-[0.8rem]">{l.target}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.66rem] text-ink-soft/80 sm:gap-x-3 sm:text-[0.7rem]">
                  <span>{fmtTime(l.time)}</span>
                  <span className="font-mono">IP: {l.ip}</span>
                </div>
              </div>
              <span className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider sm:inline sm:text-[0.65rem] ${TONE_MAP[l.tone]}`}>
                {l.tone === 'green' ? 'Positive' : l.tone === 'red' ? 'Critical' : l.tone === 'amber' ? 'Warning' : l.tone === 'blue' ? 'Config' : 'Other'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-white/10">
            <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-white/10 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600 dark:text-red-400" size={18} />
                <h3 className="font-display text-base font-bold text-navy dark:text-white sm:text-lg">Reset audit log?</h3>
              </div>
              <button onClick={() => setConfirmReset(false)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[0.82rem] text-ink-soft sm:text-sm">
                This will clear all demo audit entries except the seed marker. In production, audit logs are <b>never</b> deleted this way.
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-line bg-paper/50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:gap-3 sm:px-5 sm:py-4">
              <button onClick={() => setConfirmReset(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:text-navy dark:hover:text-white sm:px-4">Cancel</button>
              <button onClick={handleReset} className="flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 sm:px-4">
                <RefreshCw size={13} /> Reset now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}