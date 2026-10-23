import { useEffect, useState } from 'react'
import {
  LifeBuoy, Plus, MessageSquare, Clock, CheckCircle2, X, Send, Search, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'

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

const fmtRelative = (iso) => {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function Support() {
  const { currentMember } = useChama()
  
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const fetchTickets = async () => {
    try {
      const data = await api('/api/support/', { token: localStorage.getItem('auth_token') })
      setTickets(data)
    } catch (err) {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const filtered = tickets.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false
    if (!query) return true
    const q = query.toLowerCase()
    return (t.id + t.subject + t.description).toLowerCase().includes(q)
  })

  const counts = {
    open: tickets.filter((t) => t.status === 'open').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    total: tickets.length,
  }

  const submit = async ({ subject, description, category, priority }) => {
    try {
      await api('/api/support/', {
        method: 'POST',
        token: localStorage.getItem('auth_token'),
        body: { subject, description, category, priority, requesterName: currentMember?.name || 'Admin' }
      })
      toast.success('Ticket created')
      setOpen(false)
      fetchTickets()
    } catch (err) { toast.error(err.message) }
  }

  const addReply = async (ticket, body) => {
    if (!body.trim()) return
    try {
      await api(`/api/support/${ticket.id}/messages`, {
        method: 'POST',
        token: localStorage.getItem('auth_token'),
        body: { author: currentMember?.name || 'Admin', role: 'requester', body }
      })
      toast.success('Reply added')
      fetchTickets()
      
      // Update the local viewing state to reflect the new message immediately
      setViewing((prev) => ({
        ...prev,
        messages: [...prev.messages, { id: Date.now().toString(), author: currentMember?.name || 'Admin', body, at: new Date().toISOString() }]
      }))
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Support</h1>
          <p className="mt-1 text-sm text-ink-soft">Raise issues with Chametu and track responses.</p>
        </div>
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={15} /> New ticket
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <Kpi label="Open" value={counts.open} tone="bg-blue-100 text-blue-700" Icon={LifeBuoy} />
        <Kpi label="Pending" value={counts.pending} tone="bg-amber-100 text-[#8A6417]" Icon={Clock} />
        <Kpi label="Resolved" value={counts.resolved} tone="bg-emerald/15 text-forest" Icon={CheckCircle2} />
        <Kpi label="Total" value={counts.total} tone="bg-line text-ink-soft" Icon={MessageSquare} />
      </div>

      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
          <div className="flex flex-wrap gap-1.5">
            {['all', 'open', 'pending', 'resolved', 'closed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === f ? 'bg-navy text-white' : 'bg-paper border border-line text-ink-soft'
                }`}
              >
                {f === 'all' ? 'All' : STATUS_META[f].label}
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
          <div className="py-12 text-center text-ink-soft">
            <Loader2 className="mx-auto animate-spin text-forest" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-ink-soft">
            <LifeBuoy size={26} className="mx-auto mb-2 opacity-40" />
            No tickets found.
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
    if (!subject.trim() || !description.trim()) return toast.error('Fill in subject and description')
    onSubmit({ subject: subject.trim(), description: description.trim(), category, priority })
  }

  const inputCls = 'w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest transition'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display font-semibold text-navy">Raise a support ticket</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-3 p-5">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className={inputCls} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Description…" className={inputCls} />
          <div className="grid grid-cols-2 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="technical">Technical issue</option>
              <option value="billing">Billing & payments</option>
              <option value="account">Account access</option>
              <option value="feature">Feature request</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-ink-soft">Cancel</button>
            <button type="submit" className="rounded-xl bg-forest px-4 py-2 text-sm text-white">Submit</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TicketModal({ ticket, onClose, onReply }) {
  const [reply, setReply] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <h3 className="font-display font-semibold text-navy">{ticket.subject}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ticket.messages?.map((m, i) => (
            <div key={i} className="rounded-xl border border-line p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm text-navy">{m.author}</span>
                <span className="text-xs text-ink-soft">{new Date(m.at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-ink-soft">{m.body}</p>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onReply(reply); setReply('') }} className="border-t p-3">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Reply…" className="w-full rounded-xl border p-2 text-sm" />
          <div className="mt-2 flex justify-end">
            <button type="submit" className="bg-forest text-white px-3 py-1.5 rounded-lg text-xs font-semibold">Send reply</button>
          </div>
        </form>
      </div>
    </div>
  )
}