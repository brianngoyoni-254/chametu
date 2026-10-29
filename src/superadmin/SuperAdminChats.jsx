// src/superadmin/SuperAdminChats.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  MessageCircle, Search, Loader2, Trash2, Square, CheckSquare,
  AlertTriangle, User, Bot, X, Building2,
} from 'lucide-react'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'superadmin_token'

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function saApi(path, opts = {}) {
  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...opts, headers: authHeaders() })
  } catch {
    throw new Error(`Cannot reach the server at ${BASE_URL}`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || data.detail || `Request failed (${res.status})`)
  }
  return data
}

function fmtRelative(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

/* ---------- Confirm modal ---------- */
function ConfirmModal({ open, title, description, sessions = [], confirmLabel = 'Clear', loading = false, onClose, onConfirm }) {
  if (!open) return null
  const preview = sessions.slice(0, 5)
  const moreCount = sessions.length - preview.length

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0B1B2B] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3.5 px-6 pt-6">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-red-500/15 text-red-400 ring-1 ring-red-500/20">
            <AlertTriangle size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[1.05rem] font-bold">{title}</h3>
            <p className="mt-1 text-[0.84rem] leading-relaxed text-white/60">{description}</p>
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="mx-6 mt-4 max-h-[180px] overflow-y-auto rounded-xl border border-white/10 bg-white/[0.03]">
            {preview.map((s) => (
              <div key={s.id} className="flex items-center gap-2 border-b border-white/5 px-3.5 py-2.5 text-[0.8rem] last:border-b-0">
                <MessageCircle size={13} className="shrink-0 text-white/40" />
                <span className="min-w-0 flex-1 truncate">
                  {s.user?.name || 'Unknown'} · {s.chama?.name || '—'}
                </span>
                <span className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-wide text-white/40">
                  {s.messages.length} msg
                </span>
              </div>
            ))}
            {moreCount > 0 && (
              <div className="px-3.5 py-2 text-center text-[0.75rem] font-medium text-white/50">
                + {moreCount} more
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t border-white/10 bg-white/[0.02] px-6 py-4">
          <button onClick={onClose} disabled={loading} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[0.85rem] font-semibold text-white/80 transition hover:bg-white/[0.06] disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-[0.85rem] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50">
            {loading ? (<><Loader2 size={14} className="animate-spin" />Clearing…</>) : (<><Trash2 size={14} />{confirmLabel}</>)}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Session viewer ---------- */
function SessionViewer({ session, onClose }) {
  if (!session) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0B1B2B] text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${session.status === 'ended' ? 'bg-white/10 text-white/60' : 'bg-emerald/15 text-emerald'}`}>
                {session.status}
              </span>
              <span className="text-[0.72rem] text-white/50">{session.messages.length} messages</span>
            </div>
            <h3 className="mt-1 truncate font-display font-semibold">{session.user?.name || 'Unknown user'} · {session.chama?.name || 'Unknown chama'}</h3>
            <p className="mt-0.5 text-[0.72rem] text-white/50">Started {fmtDateTime(session.startedAt)} · last activity {fmtRelative(session.lastActivityAt)}</p>
          </div>
          <button onClick={onClose} className="ml-3 rounded-lg p-1.5 text-white/40 hover:bg-white/10" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {session.messages.map((m) => {
            const isUser = m.sender === 'user'
            const isEnd = m.matchedEntry === '__end__'
            return (
              <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className="flex max-w-[80%] items-start gap-2">
                  {!isUser && (
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-emerald/15 text-emerald">
                      <Bot size={13} />
                    </span>
                  )}
                  <div className={`rounded-2xl px-3.5 py-2 text-[0.82rem] whitespace-pre-wrap ${isUser ? 'rounded-tr-md bg-[#0B7A5A] text-white' : isEnd ? 'rounded-tl-md bg-white/5 text-white/50 italic' : 'rounded-tl-md bg-white/[0.06] text-white/90'}`}>
                    {m.body}
                    {m.feedback && (
                      <span className="ml-2 text-[0.65rem] opacity-60">({m.feedback === 'up' ? '👍' : '👎'})</span>
                    )}
                  </div>
                  {isUser && (
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full bg-white/10 text-white/70">
                      <User size={13} />
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------- Main page ---------- */
export default function SuperAdminChats() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [modal, setModal] = useState(null)
  const [isClearing, setIsClearing] = useState(false)

  const refresh = async () => {
    try {
      const data = await saApi('/api/superadmin/chat/sessions')
      setSessions(Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(err.message || 'Failed to load chats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, []) // eslint-disable-line

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(sessions.map((s) => s.id))
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [sessions])

  const filtered = useMemo(() => {
    if (!query.trim()) return sessions
    const q = query.trim().toLowerCase()
    return sessions.filter((s) =>
      s.user?.name?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.chama?.name?.toLowerCase().includes(q) ||
      s.messages.some((m) => m.body.toLowerCase().includes(q))
    )
  }, [sessions, query])

  const allIds = useMemo(() => sessions.map((s) => s.id), [sessions])
  const allSelected = sessions.length > 0 && selectedIds.size === sessions.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const selectedSessions = useMemo(
    () => sessions.filter((s) => selectedIds.has(s.id)),
    [sessions, selectedIds]
  )

  const toggleOne = (id) => setSelectedIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  const toggleAll = () => setSelectedIds((prev) =>
    prev.size === sessions.length ? new Set() : new Set(allIds)
  )

  const askClearOne = (session) => setModal({ mode: 'single', sessions: [session] })
  const askClearSelected = () => selectedIds.size > 0 && setModal({ mode: 'selected', sessions: selectedSessions })
  const askClearAll = () => sessions.length > 0 && setModal({ mode: 'all', sessions })

  const confirmClear = async () => {
    if (!modal) return
    setIsClearing(true)
    try {
      if (modal.mode === 'all') {
        await saApi('/api/superadmin/chat/sessions', { method: 'DELETE', body: JSON.stringify({ all: true }) })
      } else {
        await saApi('/api/superadmin/chat/sessions', { method: 'DELETE', body: JSON.stringify({ ids: modal.sessions.map((s) => s.id) }) })
      }
      await refresh()
      setSelectedIds(new Set())
      toast.success(`Cleared ${modal.sessions.length} session${modal.sessions.length > 1 ? 's' : ''}.`)
      setModal(null)
    } catch (err) {
      toast.error(err.message || 'Could not clear sessions.')
    } finally {
      setIsClearing(false)
    }
  }

  const modalCopy = {
    single: { title: 'Clear this chat?', description: 'The full conversation and all messages will be permanently removed. This cannot be undone.', confirmLabel: 'Clear chat' },
    selected: { title: `Clear ${selectedIds.size} selected chat${selectedIds.size > 1 ? 's' : ''}?`, description: 'These conversations and all their messages will be permanently removed.', confirmLabel: `Clear ${selectedIds.size}` },
    all: { title: `Clear all ${sessions.length} chat${sessions.length > 1 ? 's' : ''}?`, description: 'Every conversation on the platform will be permanently removed.', confirmLabel: 'Clear all' },
  }[modal?.mode] || {}

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-emerald" size={26} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Chat Sessions</h1>
          <p className="mt-1 text-sm text-white/50">Every conversation across all chamas on the platform</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={refresh} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/[0.06]">
            <Loader2 size={13} /> Refresh
          </button>
          {sessions.length > 0 && (
            <button onClick={askClearAll} className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20">
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {sessions.length > 0 && (
            <button onClick={toggleAll} aria-pressed={allSelected} className="grid h-6 w-6 place-items-center rounded-md text-white/40 transition hover:bg-white/10 hover:text-emerald" title={allSelected ? 'Deselect all' : 'Select all'}>
              {allSelected ? <CheckSquare size={18} strokeWidth={2} className="text-emerald" /> :
               someSelected ? <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border-2 border-emerald bg-transparent"><span className="h-[2px] w-2 rounded-full bg-emerald" /></span> :
               <Square size={18} strokeWidth={2} />}
            </button>
          )}
          <span className="text-sm text-white/50">{filtered.length} session{filtered.length === 1 ? '' : 's'}</span>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[0.78rem] font-medium text-white/50">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-[0.78rem] font-semibold text-white/50 hover:text-white">Clear</button>
            <button onClick={askClearSelected} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
              <Trash2 size={12} /> Clear selected
            </button>
          </div>
        )}

        <div className="ml-auto flex max-w-[280px] flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <Search size={14} className="text-white/40" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search user, chama or message…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-14 text-center">
          <MessageCircle size={26} className="mx-auto text-white/20" />
          <p className="mt-2 text-sm text-white/40">{sessions.length === 0 ? 'No chats yet on the platform.' : 'No chats match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((s) => {
            const isSelected = selectedIds.has(s.id)
            const firstMsg = s.messages[0]?.body || 'New session'
            return (
              <div key={s.id} className={`rounded-2xl border bg-white/[0.02] p-4 transition ${isSelected ? 'border-emerald/40 bg-emerald/[0.05] ring-1 ring-emerald/20' : 'border-white/10 hover:border-emerald/30'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <button onClick={() => toggleOne(s.id)} aria-pressed={isSelected} className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md text-white/40 transition hover:text-emerald" title={isSelected ? 'Deselect' : 'Select'}>
                      {isSelected ? <CheckSquare size={17} strokeWidth={2.2} className="text-emerald" /> : <Square size={17} strokeWidth={2} />}
                    </button>
                    <button onClick={() => setViewing(s)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald/15 text-emerald"><MessageCircle size={14} /></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[0.88rem] font-semibold">
                            <span className="truncate">{s.user?.name || 'Unknown'}</span>
                            <Building2 size={11} className="text-white/30 shrink-0" />
                            <span className="truncate text-white/50 text-[0.78rem] font-normal">{s.chama?.name || '—'}</span>
                          </div>
                          <div className="truncate text-[0.74rem] text-white/40">{firstMsg.slice(0, 60)}…</div>
                          <div className="mt-0.5 text-[0.7rem] text-white/30">
                            {s.messages.length} message{s.messages.length === 1 ? '' : 's'} · {fmtRelative(s.lastActivityAt)}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase ${s.status === 'ended' ? 'bg-white/10 text-white/50' : 'bg-emerald/15 text-emerald'}`}>{s.status}</span>
                    <button onClick={() => askClearOne(s)} className="rounded-md p-1 text-white/30 transition hover:bg-red-500/10 hover:text-red-400" aria-label="Clear this chat" title="Clear this chat">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewing && <SessionViewer session={viewing} onClose={() => setViewing(null)} />}
      <ConfirmModal open={!!modal} title={modalCopy.title} description={modalCopy.description} sessions={modal?.sessions || []} confirmLabel={modalCopy.confirmLabel} loading={isClearing} onClose={() => setModal(null)} onConfirm={confirmClear} />
    </div>
  )
}