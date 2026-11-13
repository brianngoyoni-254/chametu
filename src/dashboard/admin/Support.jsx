// src/dashboard/admin/Support.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, X, Send, Search,
  Loader2, Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../lib/api'
import { fmtDate, fmtRelative } from '../../lib/time'

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

const initials = (name) =>
  (name || '??').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export default function Support() {
  const { chama, currentMember } = useChama()
  const { user } = useAuth()

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const refresh = async () => {
    try {
      const data = await api('/api/support/')
      setTickets(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Failed to load tickets')
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
      await api('/api/support/', {
        method: 'POST',
        body: {
          subject, description, category, priority,
          requesterName: currentMember?.name || user?.name || 'Admin',
        },
      })
      toast.success('Ticket created')
      setOpen(false)
      await refresh()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const addReply = async (ticket, body, internal = false) => {
    if (!body.trim()) return
    try {
      await api(`/api/support/${ticket.id}/messages`, {
        method: 'POST',
        body: { body: body.trim(), role: 'agent', internal },
      })
      toast.success(internal ? 'Internal note added' : 'Reply sent')
      await refresh()
      // Re-fetch just this ticket's latest state
      const fresh = await api(`/api/support/${ticket.id}`)
      setViewing(fresh)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const changeStatus = async (ticket, status) => {
    try {
      await api(`/api/support/${ticket.id}/status`, {
        method: 'PATCH',
        body: { status },
      })
      toast.success(`Marked as ${status}`)
      await refresh()
      const fresh = await api(`/api/support/${ticket.id}`)
      setViewing(fresh)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Support</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {chama?.name ? `Tickets from ${chama.name}` : 'All tickets'} — every issue raised by members of this chama
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forest-dark"
        >
          <Plus size={15} /> New ticket
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
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
          <div className="py-12 text-center text-ink-soft">
            <LifeBuoy size={26} className="mx-auto mb-2 opacity-40" />
            {tickets.length === 0 ? 'No tickets yet.' : 'No tickets match your filters.'}
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
                  <p className="mt-1 text-[0.7rem] text-ink-soft">
                    {t.requester ? `${t.requester} · ` : ''}Updated {fmtRelative(t.updatedAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <NewTicketModal
          onClose={() => setOpen(false)}
          onSubmit={submit}
          requesterName={currentMember?.name || user?.name || 'Admin'}
        />
      )}
      {viewing && (
        <TicketModal
          ticket={viewing}
          onClose={() => setViewing(null)}
          onReply={addReply}
          onStatus={changeStatus}
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

function NewTicketModal({ onClose, onSubmit, requesterName }) {
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
                <option value="technical">Technical issue</option>
                <option value="billing">Billing & payments</option>
                <option value="account">Account access</option>
                <option value="feature">Feature request</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">Priority</span>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
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

function TicketModal({ ticket, onClose, onReply, onStatus }) {
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (!reply.trim()) return
    onReply(ticket, reply, isInternal)
    setReply('')
    setIsInternal(false)
  }

  const inputCls =
    'w-full rounded-xl border border-line px-3 py-2 text-sm text-navy outline-none focus:border-forest'

  const statusOptions = ['open', 'pending', 'resolved', 'closed']

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
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
            {ticket.requester && (
              <p className="mt-0.5 text-[0.76rem] text-ink-soft">Raised by {ticket.requester}</p>
            )}
          </div>
          <button onClick={onClose} className="ml-3 rounded-lg p-1.5 text-ink-soft hover:bg-paper">
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper/40 px-5 py-2.5">
          <span className="text-[0.72rem] font-semibold text-ink-soft">Status:</span>
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => onStatus(ticket, s)}
              disabled={ticket.status === s}
              className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide transition ${
                ticket.status === s
                  ? STATUS_META[s].cls
                  : 'bg-white text-ink-soft border border-line hover:border-navy'
              }`}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {ticket.messages.map((m) => {
            const isAgent = m.role === 'agent'
            const internal = m.internal
            return (
              <div
                key={m.id}
                className={`rounded-xl border p-3 ${
                  internal
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : isAgent
                    ? 'border-line bg-white'
                    : 'border-line bg-paper/60'
                }`}
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.72rem]">
                  <span className="grid h-6 w-6 place-items-center rounded bg-navy/10 text-[0.6rem] font-bold text-navy">
                    {initials(m.author)}
                  </span>
                  <span className="font-semibold text-navy">{m.author}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[0.6rem] font-bold uppercase ${
                    isAgent ? 'bg-forest/10 text-forest' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isAgent ? 'Agent' : 'Requester'}
                  </span>
                  {internal && (
                    <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-[#8A6417]">
                      <Lock size={9} /> Internal
                    </span>
                  )}
                  <span className="ml-auto text-ink-soft">{fmtDate(m.at)}</span>
                </div>
                <p className="whitespace-pre-wrap text-[0.84rem] leading-relaxed text-navy">{m.body}</p>
              </div>
            )
          })}
        </div>

        <form onSubmit={submit} className="border-t border-line p-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            placeholder={isInternal ? 'Internal note (only agents see this)…' : 'Reply to the requester…'}
            className={inputCls}
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="h-3.5 w-3.5 rounded accent-forest"
              />
              Internal note
            </label>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-dark">
              <Send size={12} /> {isInternal ? 'Add internal note' : 'Send reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}