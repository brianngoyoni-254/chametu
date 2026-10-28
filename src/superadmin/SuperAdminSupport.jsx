import { useMemo, useState } from 'react'
import {
  LifeBuoy, Search, Plus, Download, X, Clock, AlertTriangle,
  Send, Paperclip, Lock, ArrowLeft, Inbox, Users, Trash2, Eye,
  CreditCard, Building2, User as UserIcon, Tag, ChevronRight,
  CheckCircle2, Circle, Timer, Filter, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { useTickets, TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from './useTickets'

const AGENTS = ['Danny (Lead Dev)', 'Brian (Dev 2)']

const fmtDate = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
const fmtRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}
const slaState = (dueIso, resolved) => {
  if (resolved) return { label: 'Met', tone: 'text-emerald', Icon: CheckCircle2, bg: 'bg-emerald/10' }
  const due = new Date(dueIso).getTime()
  const now = Date.now()
  if (due < now) return { label: 'Breached', tone: 'text-red-600 dark:text-red-400', Icon: AlertTriangle, bg: 'bg-red-500/10' }
  const hours = Math.round((due - now) / 3600000)
  if (hours < 4) return { label: `${hours}h left`, tone: 'text-amber-600 dark:text-amber-400', Icon: Timer, bg: 'bg-amber-500/10' }
  return { label: `${hours}h left`, tone: 'text-ink-soft', Icon: Timer, bg: 'bg-line/40 dark:bg-white/10' }
}
const initialsOf = (name) => name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'

export default function SuperAdminSupport() {
  const { tickets, create, update, addMessage, bulkUpdate, remove, stats } = useTickets()
  const [view, setView] = useState('list')
  const [activeId, setActiveId] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [selected, setSelected] = useState(new Set())
  const [newModalOpen, setNewModalOpen] = useState(false)

  const filtered = useMemo(() => tickets.filter((t) => {
    const q = query.trim().toLowerCase()
    const matchQuery = !q || (t.id + t.subject + t.requester.name + t.requester.chama + t.tags.join(' ')).toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter
    const matchCategory = categoryFilter === 'all' || t.category === categoryFilter
    const matchAssignee = assigneeFilter === 'all' || (assigneeFilter === 'unassigned' ? !t.assignee : t.assignee === assigneeFilter)
    return matchQuery && matchStatus && matchPriority && matchCategory && matchAssignee
  }), [tickets, query, statusFilter, priorityFilter, categoryFilter, assigneeFilter])

  const active = tickets.find((t) => t.id === activeId) || null

  const handleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const handleBulkStatus = (status) => {
    if (selected.size === 0) return
    bulkUpdate(Array.from(selected), { status })
    toast.success(`${selected.size} ticket(s) marked as ${TICKET_STATUSES[status].label}`)
    clearSelection()
  }

  const handleBulkAssign = (assignee) => {
    if (selected.size === 0 || !assignee) return
    bulkUpdate(Array.from(selected), { assignee })
    toast.success(`${selected.size} ticket(s) assigned to ${assignee}`)
    clearSelection()
  }

  const handleExport = () => {
    const headers = ['ID', 'Subject', 'Requester', 'Chama', 'Category', 'Priority', 'Status', 'Assignee', 'Created', 'SLA Response Due']
    const rows = filtered.map((t) => [t.id, t.subject, t.requester.name, t.requester.chama, TICKET_CATEGORIES[t.category].label, TICKET_PRIORITIES[t.priority].label, TICKET_STATUSES[t.status].label, t.assignee || '—', fmtDate(t.createdAt), fmtDate(t.slaResponseDue)])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-tickets-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete', { description: `Downloaded ${filtered.length} tickets.` })
  }

  if (view === 'detail' && active) {
    return (
      <TicketDetail
        ticket={active}
        onBack={() => { setView('list'); setActiveId(null) }}
        onUpdate={(patch) => update(active.id, patch)}
        onMessage={(msg) => addMessage(active.id, msg)}
        onRemove={() => { remove(active.id); setView('list'); setActiveId(null); toast.success('Ticket deleted') }}
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Support tickets</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">
            {stats.open + stats.pending} active · {stats.urgent} urgent · {stats.slaBreached} SLA breach{stats.slaBreached === 1 ? '' : 'es'}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 px-4 py-2.5 text-sm font-semibold text-navy dark:text-white shadow-sm transition hover:bg-paper dark:hover:bg-white/10">
            <Download size={15} /> Export
          </button>
          <button onClick={() => setNewModalOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]">
            <Plus size={15} /> New ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <KpiCard label="Open" value={stats.open} tone="blue" Icon={Inbox} />
        <KpiCard label="Pending" value={stats.pending} tone="amber" Icon={Clock} />
        <KpiCard label="Unassigned" value={stats.unassigned} tone="purple" Icon={Users} />
        <KpiCard label="SLA breached" value={stats.slaBreached} tone="red" Icon={AlertTriangle} />
      </div>

      <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-line p-3 dark:border-white/10 sm:p-4">
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {[{ key: 'all', label: 'All' }, ...Object.entries(TICKET_STATUSES).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.75rem] font-semibold transition sm:text-[0.78rem] ${statusFilter === f.key ? 'bg-navy text-white shadow-sm dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-white text-navy/70 hover:border-forest/40 hover:text-navy dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by ID, subject, requester, tag…"
                className="w-full rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-navy dark:text-white outline-none focus:border-forest focus:ring-4 focus:ring-forest/10"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:flex sm:gap-2">
              <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5 px-2 py-2 text-[0.75rem] text-navy dark:text-white outline-none focus:border-forest sm:px-2.5 sm:text-[0.78rem]">
                <option value="all">Priority</option>
                {Object.entries(TICKET_PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5 px-2 py-2 text-[0.75rem] text-navy dark:text-white outline-none focus:border-forest sm:px-2.5 sm:text-[0.78rem]">
                <option value="all">Category</option>
                {Object.entries(TICKET_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className="rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5 px-2 py-2 text-[0.75rem] text-navy dark:text-white outline-none focus:border-forest sm:px-2.5 sm:text-[0.78rem]">
                <option value="all">Assignee</option>
                <option value="unassigned">Unassigned</option>
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-forest/30 bg-forest/[0.04] px-3 py-2 dark:border-emerald/30 dark:bg-emerald/5">
              <span className="inline-flex items-center gap-1 rounded-md bg-forest/10 px-2 py-0.5 text-[0.72rem] font-bold text-forest dark:text-emerald">
                {selected.size} selected
              </span>
              <button onClick={() => handleBulkStatus('resolved')} className="flex items-center gap-1 rounded-lg bg-forest px-2.5 py-1 text-[0.72rem] font-semibold text-white hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]">
                <CheckCircle2 size={11} /> Resolve
              </button>
              <button onClick={() => handleBulkStatus('closed')} className="rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5 px-2.5 py-1 text-[0.72rem] font-semibold text-navy dark:text-white hover:bg-paper dark:hover:bg-white/10">
                Close
              </button>
              <select onChange={(e) => handleBulkAssign(e.target.value)} className="rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5 px-2 py-1 text-[0.72rem] text-navy dark:text-white outline-none">
                <option value="">Assign to…</option>
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <button onClick={clearSelection} className="ml-auto text-[0.72rem] font-semibold text-ink-soft hover:text-navy dark:hover:text-white">Clear</button>
            </div>
          )}
        </div>

        <div className="hidden md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/40 text-[0.68rem] uppercase tracking-wider text-ink-soft dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="w-10 px-3 py-3"></th>
                <th className="px-3 py-3 font-semibold">Ticket</th>
                <th className="px-3 py-3 font-semibold">Requester</th>
                <th className="px-3 py-3 font-semibold">Priority</th>
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 font-semibold">Assignee</th>
                <th className="px-3 py-3 font-semibold">SLA</th>
                <th className="px-3 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <LifeBuoy size={32} className="mx-auto mb-2 text-ink-soft/40" />
                    <p className="text-[0.85rem] font-semibold text-navy dark:text-white">No tickets match your filters</p>
                    <p className="mt-0.5 text-[0.75rem] text-ink-soft">Try clearing filters or search a different term.</p>
                  </td>
                </tr>
              ) : filtered.map((t) => {
                const st = TICKET_STATUSES[t.status]
                const pr = TICKET_PRIORITIES[t.priority]
                const Cat = TICKET_CATEGORIES[t.category]
                const CatIcon = Cat.Icon
                const sla = slaState(t.slaResponseDue, t.status === 'resolved' || t.status === 'closed')
                const SlaIcon = sla.Icon
                return (
                  <tr key={t.id} onClick={() => { setView('detail'); setActiveId(t.id) }} className="group cursor-pointer transition hover:bg-paper/50 dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(t.id)} onChange={() => handleSelect(t.id)} className="h-4 w-4 accent-forest" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${pr.dot}`} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy group-hover:text-forest dark:text-white dark:group-hover:text-emerald">{t.subject}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
                            <span className="font-mono">{t.id}</span>
                            <span>·</span>
                            <CatIcon size={11} />
                            <span>{Cat.label}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy/10 text-[0.62rem] font-bold text-navy dark:bg-white/10 dark:text-white">
                          {initialsOf(t.requester.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[0.82rem] font-medium text-navy dark:text-white">{t.requester.name}</p>
                          <p className="truncate text-[0.7rem] text-ink-soft">{t.requester.chama}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[0.68rem] font-bold ${pr.cls}`}>{pr.label}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[0.68rem] font-bold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-3 py-3 text-[0.8rem] text-ink-soft">
                      {t.assignee || <span className="italic text-red-500">Unassigned</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${sla.tone} ${sla.bg}`}>
                        <SlaIcon size={10} /> {sla.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[0.78rem] text-ink-soft">{fmtRelative(t.updatedAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-line md:hidden dark:divide-white/5">
          {filtered.length === 0 ? (
            <li className="px-4 py-12 text-center">
              <LifeBuoy size={28} className="mx-auto mb-2 text-ink-soft/40" />
              <p className="text-[0.82rem] font-semibold text-navy dark:text-white">No tickets match</p>
            </li>
          ) : filtered.map((t) => {
            const st = TICKET_STATUSES[t.status]
            const pr = TICKET_PRIORITIES[t.priority]
            const Cat = TICKET_CATEGORIES[t.category]
            const CatIcon = Cat.Icon
            const sla = slaState(t.slaResponseDue, t.status === 'resolved' || t.status === 'closed')
            const SlaIcon = sla.Icon
            return (
              <li key={t.id} onClick={() => { setView('detail'); setActiveId(t.id) }} className="cursor-pointer p-3 transition hover:bg-paper/40 dark:hover:bg-white/[0.02]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.9rem] font-bold text-navy dark:text-white">{t.subject}</p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[0.68rem] text-ink-soft">
                      <span className="font-mono">{t.id}</span>
                      <span>·</span>
                      <CatIcon size={10} />
                      <span>{Cat.label}</span>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[0.62rem] font-bold ${st.cls}`}>{st.label}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[0.72rem]">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.62rem] font-bold ${pr.cls}`}>{pr.label}</span>
                  <span className="truncate text-ink-soft">{t.requester.name} · {t.requester.chama}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.66rem] font-semibold ${sla.tone} ${sla.bg}`}>
                    <SlaIcon size={9} /> SLA: {sla.label}
                  </span>
                  <span className="text-[0.66rem] text-ink-soft">{fmtRelative(t.updatedAt)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {newModalOpen && (
        <NewTicketModal
          onClose={() => setNewModalOpen(false)}
          onCreate={(draft) => { create(draft); setNewModalOpen(false); toast.success('Ticket created') }}
        />
      )}
    </div>
  )
}

/* ============ KPI CARD ============ */
function KpiCard({ label, value, tone, Icon }) {
  const tones = {
    blue: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    purple: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    red: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  }
  const t = tones[tone] || tones.blue
  return (
    <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-3.5 shadow-sm sm:p-4">
      <div className="flex items-center justify-between">
        <span className="text-[0.72rem] font-medium text-ink-soft sm:text-[0.78rem]">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${t.bg} ${t.text}`}>
          <Icon size={13} />
        </span>
      </div>
      <div className={`mt-1.5 font-display text-xl font-bold sm:text-2xl ${t.text}`}>{value}</div>
    </div>
  )
}

/* ============ NEW TICKET MODAL ============ */
function NewTicketModal({ onClose, onCreate }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [requesterName, setRequesterName] = useState('')
  const [requesterEmail, setRequesterEmail] = useState('')
  const [requesterPhone, setRequesterPhone] = useState('')
  const [requesterChama, setRequesterChama] = useState('')
  const [category, setCategory] = useState('technical')
  const [priority, setPriority] = useState('normal')
  const [assignee, setAssignee] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState([])

  const submit = (e) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim() || !requesterName.trim()) return toast.error('Fill in subject, description and requester name')
    onCreate({
      subject: subject.trim(),
      description: description.trim(),
      requester: { name: requesterName.trim(), email: requesterEmail.trim(), phone: requesterPhone.trim(), chama: requesterChama.trim() },
      category, priority, assignee: assignee || null, tags,
    })
  }

  const addTag = () => {
    const v = tagInput.trim().toLowerCase()
    if (!v || tags.includes(v)) return
    setTags([...tags, v])
    setTagInput('')
  }

  const inputCls = 'w-full rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 px-3 py-2.5 text-sm text-navy dark:text-white outline-none focus:border-forest focus:ring-4 focus:ring-forest/10'
  const labelCls = 'mb-1.5 flex items-center gap-1.5 text-[0.74rem] font-semibold text-navy dark:text-white'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-[#071625] shadow-2xl animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-white/10 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest/10 text-forest dark:text-emerald">
              <LifeBuoy size={16} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-navy dark:text-white sm:text-lg">New support ticket</h3>
              <p className="text-[0.7rem] text-ink-soft">Fill in the details to create a ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          <label className="block"><span className={labelCls}>Subject <span className="text-red-500">*</span></span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of the issue" className={inputCls} />
          </label>
          <label className="block"><span className={labelCls}>Description <span className="text-red-500">*</span></span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Steps to reproduce, expected vs actual behaviour, error messages…" className={inputCls} />
          </label>

          <div className="rounded-xl border border-line p-3 dark:border-white/10">
            <p className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
              <UserIcon size={11} /> Requester
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <label className="block"><span className={labelCls}>Full name <span className="text-red-500">*</span></span>
                <input value={requesterName} onChange={(e) => setRequesterName(e.target.value)} className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>Chama</span>
                <input value={requesterChama} onChange={(e) => setRequesterChama(e.target.value)} className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>Email</span>
                <input type="email" value={requesterEmail} onChange={(e) => setRequesterEmail(e.target.value)} className={inputCls} />
              </label>
              <label className="block"><span className={labelCls}>Phone</span>
                <input value={requesterPhone} onChange={(e) => setRequesterPhone(e.target.value)} placeholder="07XX XXX XXX" className={`${inputCls} font-mono`} />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <label className="block"><span className={labelCls}>Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {Object.entries(TICKET_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="block"><span className={labelCls}>Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                {Object.entries(TICKET_PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="block"><span className={labelCls}>Assign to</span>
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={inputCls}>
                <option value="">Unassigned</option>
                {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </div>

          <div>
            <span className={labelCls}><Tag size={11} /> Tags</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-forest/10 px-2 py-0.5 text-[0.72rem] font-semibold text-forest dark:text-emerald">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-600"><X size={10} /></button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add tag and press Enter…"
                className="min-w-[140px] flex-1 rounded-lg border border-line bg-white dark:border-white/10 dark:bg-white/5 px-2 py-1 text-[0.72rem] text-navy dark:text-white outline-none focus:border-forest"
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 border-t border-line bg-paper/50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:gap-3 sm:px-5 sm:py-4">
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-soft hover:text-navy dark:hover:text-white sm:px-4">Cancel</button>
          <button type="submit" onClick={submit} className="rounded-xl bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-4">Create ticket</button>
        </div>
      </div>
    </div>
  )
}

/* ============ TICKET DETAIL ============ */
function TicketDetail({ ticket, onBack, onUpdate, onMessage, onRemove }) {
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const st = TICKET_STATUSES[ticket.status]
  const pr = TICKET_PRIORITIES[ticket.priority]
  const Cat = TICKET_CATEGORIES[ticket.category]
  const CatIcon = Cat.Icon
  const sla = slaState(ticket.slaResponseDue, ticket.status === 'resolved' || ticket.status === 'closed')
  const SlaIcon = sla.Icon

  const send = (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    onMessage({ author: 'You (Super Admin)', role: 'agent', body: reply.trim(), internal: isInternal })
    setReply('')
    toast.success(isInternal ? 'Internal note added' : 'Reply sent to requester')
  }

  const inputCls = 'w-full rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 px-3 py-2 text-[0.82rem] text-navy dark:text-white outline-none focus:border-forest'

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onBack} className="flex items-center gap-2 rounded-xl border border-line bg-white dark:border-white/10 dark:bg-white/5 px-3 py-2 text-[0.8rem] font-semibold text-navy dark:text-white shadow-sm hover:bg-paper dark:hover:bg-white/10">
          <ArrowLeft size={14} /> Back to tickets
        </button>
        <button onClick={onRemove} className="rounded-lg p-2 text-red-600 hover:bg-red-500/10 dark:text-red-400" aria-label="Delete ticket"><Trash2 size={16} /></button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-md px-2 py-0.5 text-[0.68rem] font-bold ${st.cls}`}>{st.label}</span>
              <span className={`inline-flex rounded-md px-2 py-0.5 text-[0.68rem] font-bold ${pr.cls}`}>{pr.label}</span>
              <span className="inline-flex items-center gap-1 text-[0.72rem] text-ink-soft"><CatIcon size={11} />{Cat.label}</span>
              <span className={`ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.7rem] font-semibold ${sla.tone} ${sla.bg}`}>
                <SlaIcon size={10} /> SLA: {sla.label}
              </span>
            </div>
            <h1 className="mt-2 font-display text-lg font-bold text-navy dark:text-white sm:text-xl">{ticket.subject}</h1>
            <p className="mt-1 text-[0.78rem] text-ink-soft">
              <span className="font-mono">{ticket.id}</span> · opened {fmtRelative(ticket.createdAt)} by <b className="text-navy dark:text-white">{ticket.requester.name}</b> ({ticket.requester.chama})
            </p>
            {ticket.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ticket.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-forest/10 px-2 py-0.5 text-[0.68rem] font-semibold text-forest dark:text-emerald"><Tag size={9} />{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {ticket.messages.map((m) => {
              const isAgent = m.role === 'agent'
              return (
                <div key={m.id} className={`rounded-2xl border p-3.5 shadow-sm sm:p-4 ${m.internal ? 'border-amber-500/30 bg-amber-500/5 dark:border-amber-400/20' : isAgent ? 'border-line bg-white dark:border-white/10 dark:bg-white/5' : 'border-line bg-paper/60 dark:border-white/10 dark:bg-white/[0.02]'}`}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[0.72rem]">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-navy/10 text-[0.6rem] font-bold text-navy dark:bg-white/10 dark:text-white">
                      {initialsOf(m.author)}
                    </span>
                    <span className="font-bold text-navy dark:text-white">{m.author}</span>
                    <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider ${isAgent ? 'bg-forest/10 text-forest dark:text-emerald' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                      {isAgent ? 'Agent' : 'Requester'}
                    </span>
                    {m.internal && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-amber-700 dark:text-amber-400">
                        <Lock size={9} /> Internal
                      </span>
                    )}
                    <span className="ml-auto text-ink-soft">{fmtDate(m.at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-navy dark:text-white">{m.body}</p>
                </div>
              )
            })}
          </div>

          <form onSubmit={send} className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-3 shadow-sm sm:p-4">
            <div className="mb-2 flex items-center gap-1.5">
              <button type="button" onClick={() => setIsInternal(false)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold transition ${!isInternal ? 'bg-forest text-white dark:bg-emerald dark:text-[#06331F]' : 'text-ink-soft hover:text-navy dark:hover:text-white'}`}>
                <Send size={10} /> Reply to requester
              </button>
              <button type="button" onClick={() => setIsInternal(true)} className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[0.72rem] font-semibold transition ${isInternal ? 'bg-amber-500 text-white' : 'text-ink-soft hover:text-navy dark:hover:text-white'}`}>
                <Lock size={10} /> Internal note
              </button>
            </div>
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={3} placeholder={isInternal ? 'Internal note (not visible to requester)…' : 'Type your reply…'} className={inputCls} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <button type="button" className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10" aria-label="Attach"><Paperclip size={15} /></button>
              <button type="submit" className="flex items-center gap-1.5 rounded-xl bg-forest px-3 py-1.5 text-[0.78rem] font-semibold text-white hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-4 sm:py-2">
                <Send size={13} /> Send
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
              <Filter size={11} /> Status & priority
            </h3>
            <div className="space-y-2.5">
              <label className="block"><span className="mb-1 block text-[0.7rem] font-semibold text-ink-soft">Status</span>
                <select value={ticket.status} onChange={(e) => onUpdate({ status: e.target.value })} className={inputCls}>
                  {Object.entries(TICKET_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>
              <label className="block"><span className="mb-1 block text-[0.7rem] font-semibold text-ink-soft">Priority</span>
                <select value={ticket.priority} onChange={(e) => onUpdate({ priority: e.target.value })} className={inputCls}>
                  {Object.entries(TICKET_PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </label>
              <label className="block"><span className="mb-1 block text-[0.7rem] font-semibold text-ink-soft">Assignee</span>
                <select value={ticket.assignee || ''} onChange={(e) => onUpdate({ assignee: e.target.value || null })} className={inputCls}>
                  <option value="">Unassigned</option>
                  {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
              <UserIcon size={11} /> Requester
            </h3>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy/10 text-[0.72rem] font-bold text-navy dark:bg-white/10 dark:text-white">
                {initialsOf(ticket.requester.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.85rem] font-semibold text-navy dark:text-white">{ticket.requester.name}</p>
                {ticket.requester.chama && (
                  <p className="flex items-center gap-1 truncate text-[0.72rem] text-ink-soft"><Building2 size={10} />{ticket.requester.chama}</p>
                )}
              </div>
            </div>
            <div className="mt-2.5 space-y-1 text-[0.76rem] text-ink-soft">
              {ticket.requester.email && <p className="truncate">{ticket.requester.email}</p>}
              {ticket.requester.phone && <p className="font-mono">{ticket.requester.phone}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
              <Timer size={11} /> SLA tracking
            </h3>
            <div className="space-y-2 text-[0.78rem]">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">First response</span>
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.7rem] font-bold ${sla.tone} ${sla.bg}`}>
                  <SlaIcon size={10} /> {sla.label}
                </span>
              </div>
              <div className="flex items-center justify-between"><span className="text-ink-soft">Response due</span><span className="font-medium text-navy dark:text-white">{fmtDate(ticket.slaResponseDue)}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-soft">Resolution due</span><span className="font-medium text-navy dark:text-white">{fmtDate(ticket.slaResolveDue)}</span></div>
            </div>
          </div>

          {ticket.watchers.length > 0 && (
            <div className="rounded-2xl border border-line bg-white dark:border-white/10 dark:bg-white/5 p-4 shadow-sm">
              <h3 className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
                <Eye size={11} /> Watchers
              </h3>
              <ul className="space-y-1.5 text-[0.78rem] text-navy dark:text-white">
                {ticket.watchers.map((w) => <li key={w} className="flex items-center gap-2"><Circle size={6} className="fill-current text-emerald" />{w}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}