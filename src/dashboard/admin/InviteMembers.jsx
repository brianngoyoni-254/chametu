import { useEffect, useState } from 'react'
import { Copy, Check, Send, Mail, Phone, MessageCircle, ExternalLink, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'

const badge = {
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  joined: 'bg-[#E9F5EF] text-forest',
  expired: 'bg-line text-ink-soft',
}
const badgeLabel = { pending: 'PENDING', joined: 'JOINED', expired: 'EXPIRED' }

export default function InviteMembers() {
  const navigate = useNavigate()
  const { chama } = useChama() 
  
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ contact: '', role: 'Member' })
  const [copiedId, setCopiedId] = useState(null)

  const fetchInvites = async () => {
    try {
      const data = await api('/api/chama/invites', { token: localStorage.getItem('auth_token') })
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
        token: localStorage.getItem('auth_token'),
        body: { contact, role: form.role }
      })
      setInvites((prev) => [newInvite, ...prev])
      setForm({ contact: '', role: 'Member' })
      toast.success('Invite generated successfully')
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

  async function cancelInvite(id) {
    if (!confirm('Cancel this invite?')) return
    try {
      await api(`/api/chama/invites/${id}`, { method: 'DELETE', token: localStorage.getItem('auth_token') })
      setInvites((prev) => prev.filter((i) => i.id !== id))
      toast.success('Invite cancelled')
    } catch (err) {
      toast.error(err.message)
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
          Each invite gets its own link, tied to <b className="text-navy">{chama?.name || 'this chama'}</b> only — it won't work for any other chama.
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
              <option>Member</option>
              <option>Secretary</option>
              <option>Treasurer</option>
              <option>Chairman</option>
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
                        onClick={() => cancelInvite(inv.id)}
                        className="ml-auto text-xs font-semibold text-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}