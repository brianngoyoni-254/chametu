import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Copy, Check, Send, Mail, Phone, MessageCircle, ExternalLink } from 'lucide-react'
import {
  getChama,
  getInvites,
  createInvite,
  inviteLink,
  resendInvite,
  cancelInvite,
} from '../../lib/chametuStorage'

const badge = {
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  joined: 'bg-[#E9F5EF] text-forest',
  expired: 'bg-line text-ink-soft',
}
const badgeLabel = { pending: 'PENDING', joined: 'JOINED', expired: 'EXPIRED' }

export default function InviteMembers() {
  const chama = getChama()
  const navigate = useNavigate()
  const [invites, setInvites] = useState(getInvites())
  const [form, setForm] = useState({ contact: '', role: 'Member' })
  const [copiedId, setCopiedId] = useState(null)

  function refresh() {
    setInvites(getInvites())
  }

  function sendInvite(e) {
    e.preventDefault()
    const contact = form.contact.trim()
    if (!contact) return
    const method = contact.includes('@') ? 'email' : 'phone'
    createInvite({ contact, method, role: form.role })
    setForm({ contact: '', role: 'Member' })
    refresh()
  }

  function copy(invite) {
    navigator.clipboard?.writeText(inviteLink(invite)).catch(() => {})
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function shareWhatsapp(invite) {
    const text = `You're invited to join ${chama.name} on Chametu: ${inviteLink(invite)}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }

  /**
   * On localhost, allows the admin to hop into the invitee experience
   * directly without needing a second device. Uses the same token URL.
   */
  function previewInvite(invite) {
    const link = inviteLink(invite)
    try {
      const url = new URL(link)
      navigate(url.pathname + url.search)
    } catch {
      // If inviteLink returns a relative path, navigate directly
      navigate(link)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Invite Members</h1>
        <p className="mt-1 text-sm text-ink-soft">Add people to {chama.name}</p>
      </div>

      {/* Invite form */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-semibold text-navy">
          Invite by email or phone
        </h3>
        <p className="mt-1 text-sm text-ink-soft">
          Each invite gets its own link, tied to <b className="text-navy">{chama.name}</b> only —
          it won't work for any other chama.
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
              <option>Chairperson</option>
            </select>
          </label>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Send size={15} /> Generate invite
          </button>
        </form>
      </div>

      {/* Invites list */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-3.5 font-display text-sm font-semibold text-navy">Invites</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-ink-soft">No invites sent yet — generate one above.</p>
        ) : (
          <div className="space-y-2.5">
            {invites.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-line p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm text-navy">
                    {inv.method === 'email' ? (
                      <Mail size={13} className="text-ink-soft" />
                    ) : (
                      <Phone size={13} className="text-ink-soft" />
                    )}
                    {inv.contact}
                    <span className="text-ink-soft">· {inv.role}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                      badge[inv.status]
                    }`}
                  >
                    {badgeLabel[inv.status]}
                  </span>
                </div>

                {inv.status === 'pending' && (
                  <>
                    <div className="mt-2 truncate rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink">
                      {inviteLink(inv)}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => copy(inv)}
                        className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-forest"
                      >
                        {copiedId === inv.id ? <Check size={13} /> : <Copy size={13} />}
                        {copiedId === inv.id ? 'Copied' : 'Copy link'}
                      </button>

                      {/* Localhost helper — hops into the invitee flow */}
                      <button
                        onClick={() => previewInvite(inv)}
                        className="flex items-center gap-1.5 rounded-md border border-forest bg-forest/[0.05] px-3 py-1.5 text-xs font-semibold text-forest transition hover:bg-forest/10"
                        title="Open the invite as if you were the invited person"
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
                        onClick={() => {
                          cancelInvite(inv.id)
                          refresh()
                        }}
                        className="ml-auto text-xs font-semibold text-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {inv.status === 'expired' && (
                  <button
                    onClick={() => {
                      resendInvite(inv.id)
                      refresh()
                    }}
                    className="mt-2 text-xs font-semibold text-forest"
                  >
                    Resend
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}