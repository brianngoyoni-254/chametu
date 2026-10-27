// src/member/MemberSupport.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, X, Send, Search,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useMember } from '../context/MemberContext'
import { api } from '../lib/api'

const CATEGORIES = [
  { key: 'billing', label: 'Billing & payments' },
  { key: 'technical', label: 'Technical issue' },
  { key: 'account', label: 'Account access' },
  { key: 'feature', label: 'Feature request' },
  { key: 'other', label: 'Something else' },
]
const PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'normal', label: 'Normal' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
]
const STATUS_META = {
  open: { label: 'Open', cls: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Pending', cls: 'bg-amber-100 text-[#8A6417]' },
  resolved: { label: 'Resolved', cls: 'bg-emerald/15 text-forest' },
  closed: { label: 'Closed', cls: 'bg-line text-ink-soft' },
}
const PRIORITY_META = {
  low: 'bg-line text-ink-soft',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-[#8A6417]',
  urgent: 'bg-red-100 text-red-700',
}

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
const fmtRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
const initials = (name) =>
  (name || '??').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function MemberSupport() {
  const { profile, isLoading: isMemberLoading } = useMember()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const refresh = async () => {
    try {
      const data = await api('/api/support/me')
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Failed to load your tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false
      if (!query) return true
      const q = query.toLowerCase()
      return (t.id + t.subject + t.description).toLowerCase().includes(q)
    })
  }, [tickets, filter, query])

  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
  }), [tickets])

  const submit = async ({ subject, description, category, priority }) => {
    try {
      await api('/api/support/me', {
        method: 'POST',
        body: { subject, description, category, priority },
      })
      toast.success('Ticket submitted — the Chametu team will reply soon')
      setOpen(false)
      await refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const addReply = async (ticket, body) => {
    if (!body.trim()) return
    try {
      await api(`/api/support/me/${ticket.id}/messages`, {
        method: 'POST',
        body: { body: body.trim() },
      })
      toast.success('Reply sent')
      await refresh()
      const freshList = await api('/api/support/me')
      setViewing((freshList || []).find((t) => t.id === ticket.id) || null)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (isMemberLoading && !profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={26} className="animate-spin text-forest" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Support</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Reach the Chametu team directly. Every ticket goes to the Chametu support team.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Plus size={15} /> New ticket
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Open" value={counts.open} tone="bg-blue-100 text-blue-700" Icon={LifeBuoy} />
        <Kpi label="Pending" value={counts.pending} tone="bg-amber-100 text-[#8A6417]" Icon={Clock} />
        <Kpi label="Resolved" value={counts.resolved} tone="bg-emerald/15 text-forest" Icon={CheckCircle2} />
        <Kpi label="Total" value={counts.all} tone="bg-line text-ink-soft" Icon={MessageSquare} />
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: 'All' },
              { key: 'open', label: 'Open' },
              { key: 'pending', label: 'Pending' },
              { key: 'resolved', label: 'Resolved' },
              { key: 'closed', label: 'Closed' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  filter === f.key
                    ? 'bg-navy text-white'
                    : 'bg-paper border border-line text-ink-soft hover:border-navy'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex max-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line px-3 py-2">
            <Search size={14} className="text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto animate-spin text-forest" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <LifeBuoy size={28} className="mx-auto mb-2 text-ink-soft/40" />
            <p className="text-sm font-semibold text-navy">No tickets yet</p>
            <p className="mt-0.5 text-xs text-ink-soft">Click "New ticket" to raise your first issue.</p>
          </div>
        ) : (
          <div className="divide-y divide-line">
            {filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => setViewing(t)}
                className="flex w-full items-start gap-3 p-4 text-left hover:bg-forest/[0.03] transition"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-forest/10 text-forest">
                  <LifeBuoy size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[0.7rem] text-ink-soft">{t.id.slice(0, 8)}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${STATUS_META[t.status].cls}`}>
                      {STATUS_META[t.status].label}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${PRIORITY_META[t.priority]}`}>
                      {t.priority}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-semibold text-navy">{t.subject}</p>
                  <p className="mt-0.5 truncate text-[0.76rem] text-ink-soft">{t.description}</p>
                  <p className="mt-1 text-[0.7rem] text-ink-soft">Updated {fmtRelative(t.updatedAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && <NewTicketModal onClose={() => setOpen(false)} onSubmit={submit} />}
      {viewing && (
        <TicketModal
          ticket={viewing}
          onClose={() => setViewing(null)}
          onReply={(body) => addReply(viewing, body)}
        />
      )}
    </div>
  )
}

function Kpi({ label, value, tone, Icon }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-ink-soft">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
          <Icon size={13} />
        </span>
      </div>
      <div className="mt-2 font-display text-xl font-bold text-navy">{value}</div>
    </div>
  )
}

function NewTicketModal({ onClose, onSubmit }) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('technical')
  const [priority, setPriority] = useState('normal')

  const submit = (e) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      return toast.error('Fill in subject and description')
    }
    onSubmit({ subject: subject.trim(), description: description.trim(), category, priority })
  }

  const inputCls =
    'w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest transition'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <LifeBuoy className="text-forest" size={18} />
            <h3 className="font-display font-semibold text-navy">Raise a support ticket</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-navy">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-navy">Description</span>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Steps, error messages…" className={inputCls} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">Category</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                {PRIORITIES.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:text-navy">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark">
              <Send size={13} /> Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TicketModal({ ticket, onClose, onReply }) {
  const [reply, setReply] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    onReply(reply)
    setReply('')
  }

  const inputCls =
    'w-full rounded-xl border border-line px-3 py-2 text-sm text-navy outline-none focus:border-forest'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[0.7rem] text-ink-soft">{ticket.id.slice(0, 8)}</span>
              <span className={`rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${STATUS_META[ticket.status].cls}`}>
                {STATUS_META[ticket.status].label}
              </span>
              <span className={`rounded-md px-2 py-0.5 text-[0.66rem] font-bold ${PRIORITY_META[ticket.priority]}`}>
                {ticket.priority}
              </span>
            </div>
            <h3 className="mt-1 truncate font-display font-semibold text-navy">{ticket.subject}</h3>
          </div>
          <button onClick={onClose} className="ml-3 rounded-lg p-1.5 text-ink-soft hover:bg-paper">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {ticket.messages.map((m) => {
            const isAgent = m.role === 'agent'
            return (
              <div key={m.id} className={`rounded-xl border p-3 ${isAgent ? 'border-line bg-white' : 'border-line bg-paper/60'}`}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.72rem]">
                  <span className="grid h-6 w-6 place-items-center rounded bg-navy/10 text-[0.6rem] font-bold text-navy">
                    {initials(m.author)}
                  </span>
                  <span className="font-semibold text-navy">{m.author}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase ${
                    isAgent ? 'bg-forest/10 text-forest' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isAgent ? 'Chametu' : 'You'}
                  </span>
                  <span className="ml-auto text-ink-soft">{fmtDate(m.at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-navy">{m.body}</p>
              </div>
            )
          })}
        </div>

        <form onSubmit={submit} className="border-t border-line p-3">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Add a reply…" className={inputCls} />
          <div className="mt-2 flex justify-end">
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-dark">
              <Send size={12} /> Send reply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}