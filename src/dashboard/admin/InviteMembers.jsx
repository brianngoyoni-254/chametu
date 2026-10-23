import { useEffect, useState } from 'react'
import { Copy, Check, Send, Mail, Phone, MessageCircle, ExternalLink, Loader2, Trash2 } from 'lucide-react'
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
const badgeLabel = { pending: 'PENDING', joined: 'JOINED', expired: 'EXPIRED', cancelled: 'CANCELLED' }

// Custom Confirm Modal that handles both Cancel and Delete actions
function ConfirmModal({ open, title, body, confirmLabel, onClose, onConfirm, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4">
          <h3 className="font-display font-semibold text-navy text-[1.05rem]">{title}</h3>
          <p className="mt-1.5 text-[0.86rem] text-ink-soft">{body}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button onClick={onClose} disabled={loading} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold disabled:opacity-50">
            Keep it
          </button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2.5 rounded-xl text-white text-[0.86rem] font-semibold bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InviteMembers() {
  const navigate = useNavigate()
  const { chama, roles } = useChama() 
  
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  
  // Tracks which invite is being cancelled/deleted
  const [actionTarget, setActionTarget] = useState(null) 
  const [isProcessing, setIsProcessing] = useState(false) 
  
  const roleNames = roles?.length > 0 ? roles.map(r => r.name) : ['Member', 'Secretary', 'Treasurer', 'Chairman']
  
  const [form, setForm] = useState({ contact: '', role: roleNames[0] })
  const [copiedId, setCopiedId] = useState(null)

  const fetchInvites = async () => {
    try {
      const data = await api('/api/chama/invites')
      setInvites(data)
    } catch (err) {
      toast.error('Failed to load invites')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvites()
  }, [])

  async function sendInvite(e) {
    e.preventDefault()
    const contact = form.contact.trim()
    if (!contact) return
    setBusy(true)

    try {
      const newInvite = await api('/api/chama/invites', {
        method: 'POST',
        body: { contact, role: form.role }
      })
      setInvites((prev) => [newInvite, ...prev])
      setForm({ contact: '', role: roleNames[0] })
      
      if (contact.includes('@')) {
        toast.success('Invite generated and email sent!')
      } else {
        toast.success('Invite generated! Copy the link to share via WhatsApp/SMS.')
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
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
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  function previewInvite(invite) {
    navigate(`/join/${chama?.code}/${invite.token}`)
  }

  // Handles deleting/cancelling the invite
  async function executeAction() {
    if (!actionTarget) return
    setIsProcessing(true)
    try {
      await api(`/api/chama/invites/${actionTarget.id}`, { method: 'DELETE' })
      setInvites((prev) => prev.filter((i) => i.id !== actionTarget.id))
      toast.success('Invite deleted successfully')
      setActionTarget(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Invite Members</h1>
        <p className="mt-1 text-sm text-ink-soft">Add people to {chama?.name || 'your chama'}</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-semibold text-navy">
          Invite by email or phone
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Enter an email to automatically send an invite via Brevo. For phone numbers, copy the link and share it manually.
        </p>
        <form onSubmit={sendInvite} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-55 flex-1 text-xs font-semibold text-ink">
            Email or phone number
            <input
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              placeholder="jane@email.com or 07XX XXX XXX"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest focus:ring-4 focus:ring-emerald/10"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Role
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="mt-1.5 block rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            >
              {roleNames.map(r => <option key={r}>{r}</option>)}
            </select>
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {busy ? 'Generating...' : 'Generate invite'}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-3.5 font-display text-sm font-semibold text-navy">Recent Invites</h3>
        
        {loading ? (
          <div className="py-8 text-center text-ink-soft">Loading invites...</div>
        ) : invites.length === 0 ? (
          <p className="text-sm text-ink-soft">No invites sent yet — generate one above.</p>
        ) : (
          <div className="space-y-2.5">
            {invites.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-line p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-navy">
                    {inv.contact.includes('@') ? (
                      <Mail size={13} className="text-ink-soft" />
                    ) : (
                      <Phone size={13} className="text-ink-soft" />
                    )}
                    {inv.contact}
                    <span className="text-ink-soft">· {inv.role}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                      badge[inv.status] || badge.expired
                    }`}
                  >
                    {badgeLabel[inv.status] || 'EXPIRED'}
                  </span>
                </div>

                {/* Pending Invites: Show Links & Actions */}
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
                        {copiedId === inv.id ? <Check size={13} /> : <Copy size={13} />}
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
                        onClick={() => setActionTarget(inv)}
                        className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {/* Expired / Cancelled Invites: Show Delete Option */}
                {(inv.status === 'expired' || inv.status === 'cancelled' || (inv.status !== 'pending' && inv.status !== 'joined')) && (
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => setActionTarget(inv)}
                      className="flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={13} /> Delete invite
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Confirm Modal for both Cancel and Delete */}
      <ConfirmModal
        open={!!actionTarget}
        title={actionTarget?.status === 'pending' ? 'Cancel this invite?' : 'Delete this invite?'}
        body={
          actionTarget?.status === 'pending'
            ? `Are you sure you want to cancel the invite for ${actionTarget?.contact}? They will no longer be able to use this link to join.`
            : `Are you sure you want to permanently delete the expired invite for ${actionTarget?.contact}?`
        }
        confirmLabel={actionTarget?.status === 'pending' ? 'Cancel Invite' : 'Delete permanently'}
        loading={isProcessing}
        onClose={() => setActionTarget(null)}
        onConfirm={executeAction}
      />
    </div>
  )
}