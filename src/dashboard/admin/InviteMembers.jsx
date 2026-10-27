// src/dashboard/admin/InviteMembers.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Copy,
  Check,
  Send,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Loader2,
  Trash2,
  RefreshCw,
  Square,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'

const badge = {
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  joined: 'bg-[#E9F5EF] text-forest',
  expired: 'bg-line text-ink-soft',
  cancelled: 'bg-red-50 text-red-600',
}

const badgeLabel = {
  pending: 'PENDING',
  joined: 'JOINED',
  expired: 'EXPIRED',
  cancelled: 'CANCELLED',
}

/* ------------------------------------------------------------------ */
/* Confirmation modal                                                 */
/* ------------------------------------------------------------------ */
function ConfirmModal({
  open,
  title,
  description,
  invites = [],
  confirmLabel = 'Clear',
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null

  const previewList = invites.slice(0, 5)
  const moreCount = invites.length - previewList.length

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-line bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5 px-6 pt-6">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
            <AlertTriangle size={20} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-title"
              className="font-display text-[1.08rem] font-bold text-navy"
            >
              {title}
            </h3>
            <p className="mt-1 text-[0.85rem] leading-relaxed text-ink-soft">
              {description}
            </p>
          </div>
        </div>

        {invites.length > 0 && (
          <div className="mx-6 mt-4 max-h-[180px] overflow-y-auto rounded-2xl border border-line bg-paper/50">
            {previewList.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-2 border-b border-line px-3.5 py-2.5 text-[0.82rem] last:border-b-0"
              >
                {inv.contact.includes('@') ? (
                  <Mail size={13} className="shrink-0 text-ink-soft" />
                ) : (
                  <Phone size={13} className="shrink-0 text-ink-soft" />
                )}
                <span className="min-w-0 flex-1 truncate text-navy">
                  {inv.contact}
                </span>
                <span className="shrink-0 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-soft">
                  {inv.status}
                </span>
              </div>
            ))}
            {moreCount > 0 && (
              <div className="px-3.5 py-2 text-center text-[0.78rem] font-medium text-ink-soft">
                + {moreCount} more
              </div>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t border-line bg-paper/40 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-[0.86rem] font-semibold text-navy transition hover:border-navy disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-[0.86rem] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Clearing…
              </>
            ) : (
              <>
                <Trash2 size={14} />
                {confirmLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */
export default function InviteMembers() {
  const navigate = useNavigate()
  const { chama, roles, invites, inviteMember, refetchInvites } = useChama()

  const [busy, setBusy] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [modal, setModal] = useState(null)
  const [isClearing, setIsClearing] = useState(false)

  const roleNames =
    roles?.length > 0
      ? roles.map((r) => r.name)
      : ['Member', 'Secretary', 'Treasurer', 'Chairman']

  const [form, setForm] = useState({ contact: '', role: roleNames[0] })

  useEffect(() => {
    if (roleNames.length > 0) {
      setForm((f) =>
        roleNames.includes(f.role) ? f : { ...f, role: roleNames[0] },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles])

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(invites.map((i) => i.id))
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [invites])

  const allIds = useMemo(() => invites.map((i) => i.id), [invites])
  const allSelected = invites.length > 0 && selectedIds.size === invites.length
  const someSelected = selectedIds.size > 0 && !allSelected

  const selectedInvites = useMemo(
    () => invites.filter((i) => selectedIds.has(i.id)),
    [invites, selectedIds],
  )

  /* -------------------------- actions -------------------------- */

  async function sendInvite(e) {
    e.preventDefault()
    const contact = form.contact.trim()
    if (!contact) return
    setBusy(true)
    const res = await inviteMember({ contact, role: form.role })
    setBusy(false)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    setForm((f) => ({ ...f, contact: '' }))
    if (contact.includes('@')) {
      toast.success('Invite generated and email sent!')
    } else {
      toast.success('Invite generated! Copy the link to share via WhatsApp/SMS.')
    }
  }

  async function refresh() {
    setRefreshing(true)
    await refetchInvites()
    setRefreshing(false)
  }

  function copy(invite) {
    const link = `${window.location.origin}/join/${chama?.code}/${invite.token}`
    navigator.clipboard?.writeText(link).catch(() => {})
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function shareWhatsapp(invite) {
    const link = `${window.location.origin}/join/${chama?.code}/${invite.token}`
    const text = `You're invited to join ${chama?.name} on Chametu: ${link}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      '_blank',
      'noopener',
    )
  }

  function previewInvite(invite) {
    navigate(`/join/${chama?.code}/${invite.token}`)
  }

  /* -------------------------- selection -------------------------- */

  function toggleOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((prev) =>
      prev.size === invites.length ? new Set() : new Set(allIds),
    )
  }

  /* -------------------------- clearing -------------------------- */

  function askClearOne(invite) {
    setModal({ mode: 'single', invites: [invite] })
  }

  function askClearSelected() {
    if (selectedIds.size === 0) return
    setModal({ mode: 'selected', invites: selectedInvites })
  }

  function askClearAll() {
    if (invites.length === 0) return
    setModal({ mode: 'all', invites: invites })
  }

  async function confirmClear() {
    if (!modal) return
    setIsClearing(true)
    try {
      const ids = modal.invites.map((i) => i.id)

      // Bulk delete in one transaction via the backend route added below.
      // Falls back to per-id DELETEs if the endpoint isn't available.
      let failed = 0
      try {
        await api('/api/chama/invites', {
          method: 'DELETE',
          body: { ids },
        })
      } catch {
        const results = await Promise.allSettled(
          ids.map((id) =>
            api(`/api/chama/invites/${id}`, { method: 'DELETE' }),
          ),
        )
        failed = results.filter((r) => r.status === 'rejected').length
      }

      await refetchInvites()
      setSelectedIds(new Set())

      if (failed > 0) {
        toast.warning(
          `Cleared ${ids.length - failed} invite(s). ${failed} failed.`,
        )
      } else {
        toast.success(
          `Cleared ${ids.length} invite${ids.length > 1 ? 's' : ''}.`,
        )
      }
      setModal(null)
    } catch (err) {
      toast.error(err.message || 'Could not clear invites.')
    } finally {
      setIsClearing(false)
    }
  }

  const modalCopy = {
    single: {
      title: 'Clear this invite?',
      description:
        'The invite link will stop working immediately. This cannot be undone.',
      confirmLabel: 'Clear invite',
    },
    selected: {
      title: `Clear ${selectedIds.size} selected invite${
        selectedIds.size > 1 ? 's' : ''
      }?`,
      description:
        'These invite links will stop working. This cannot be undone.',
      confirmLabel: `Clear ${selectedIds.size}`,
    },
    all: {
      title: `Clear all ${invites.length} invites?`,
      description:
        'Every invite in this chama will be permanently removed — including ones already used to join. This cannot be undone.',
      confirmLabel: 'Clear all',
    },
  }[modal?.mode] || {}

  /* -------------------------- render -------------------------- */

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">
            Invite Members
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Add people to {chama?.name || 'your chama'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-navy hover:border-forest disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          {invites.length > 0 && (
            <button
              onClick={askClearAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Invite form */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-semibold text-navy">
          Invite by email or phone
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Enter an email to automatically send an invite via Brevo. For phone
          numbers, copy the link and share it manually.
        </p>
        <form
          onSubmit={sendInvite}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="min-w-55 flex-1 text-xs font-semibold text-ink">
            Email or phone number
            <input
              value={form.contact}
              onChange={(e) =>
                setForm((f) => ({ ...f, contact: e.target.value }))
              }
              placeholder="jane@email.com or 07XX XXX XXX"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-emerald/10"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Role
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value }))
              }
              className="mt-1.5 block rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            >
              {roleNames.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {busy ? 'Generating...' : 'Generate invite'}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {invites.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                aria-pressed={allSelected}
                className="grid h-6 w-6 place-items-center rounded-md text-ink-soft transition hover:bg-paper hover:text-forest"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? (
                  <CheckSquare
                    size={18}
                    strokeWidth={2}
                    className="text-forest"
                  />
                ) : someSelected ? (
                  <span className="grid h-[18px] w-[18px] place-items-center rounded-[5px] border-2 border-forest bg-white">
                    <span className="h-[2px] w-2 rounded-full bg-forest" />
                  </span>
                ) : (
                  <Square size={18} strokeWidth={2} />
                )}
              </button>
            )}
            <h3 className="font-display text-sm font-semibold text-navy">
              Recent Invites{' '}
              <span className="ml-1 font-normal text-ink-soft">
                ({invites.length})
              </span>
            </h3>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[0.78rem] font-medium text-ink-soft">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[0.78rem] font-semibold text-ink-soft hover:text-navy"
              >
                Clear
              </button>
              <button
                onClick={askClearSelected}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                <Trash2 size={12} />
                Clear selected
              </button>
            </div>
          )}
        </div>

        {invites.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No invites sent yet — generate one above.
          </p>
        ) : (
          <div className="space-y-2.5">
            {invites.map((inv) => {
              const isSelected = selectedIds.has(inv.id)
              return (
                <div
                  key={inv.id}
                  className={`rounded-xl border p-3.5 transition ${
                    isSelected
                      ? 'border-forest bg-forest/[0.04] ring-1 ring-forest/20'
                      : 'border-line hover:border-forest/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleOne(inv.id)}
                        aria-pressed={isSelected}
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-md text-ink-soft transition hover:text-forest"
                        title={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected ? (
                          <CheckSquare
                            size={17}
                            strokeWidth={2.2}
                            className="text-forest"
                          />
                        ) : (
                          <Square size={17} strokeWidth={2} />
                        )}
                      </button>
                      <span className="flex min-w-0 items-center gap-1.5 text-sm text-navy">
                        {inv.contact.includes('@') ? (
                          <Mail size={13} className="shrink-0 text-ink-soft" />
                        ) : (
                          <Phone size={13} className="shrink-0 text-ink-soft" />
                        )}
                        <span className="truncate">{inv.contact}</span>
                        <span className="shrink-0 text-ink-soft">
                          · {inv.role}
                        </span>
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                        badge[inv.status] || badge.expired
                      }`}
                    >
                      {badgeLabel[inv.status] || 'EXPIRED'}
                    </span>
                  </div>

                  {inv.status === 'pending' && (
                    <>
                      <div className="mt-2 truncate rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink">
                        {window.location.origin}/join/{chama?.code}/{inv.token}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => copy(inv)}
                          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-forest"
                        >
                          {copiedId === inv.id ? (
                            <Check size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                          {copiedId === inv.id ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => previewInvite(inv)}
                          className="flex items-center gap-1.5 rounded-md border border-forest bg-forest/[0.05] px-3 py-1.5 text-xs font-semibold text-forest transition hover:bg-forest/10"
                        >
                          <ExternalLink size={13} /> Preview as invitee
                        </button>
                        <button
                          onClick={() => shareWhatsapp(inv)}
                          className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-emerald transition hover:border-emerald"
                        >
                          <MessageCircle size={13} /> WhatsApp
                        </button>
                        <button
                          onClick={() => askClearOne(inv)}
                          className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    </>
                  )}

                  {inv.status !== 'pending' && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => askClearOne(inv)}
                        className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <Trash2 size={13} /> Clear invite
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!modal}
        title={modalCopy.title}
        description={modalCopy.description}
        invites={modal?.invites || []}
        confirmLabel={modalCopy.confirmLabel}
        loading={isClearing}
        onClose={() => setModal(null)}
        onConfirm={confirmClear}
      />
    </div>
  )
}