import { useState } from 'react'
import { Copy, Check, Send, Mail, Phone } from 'lucide-react'

const CHAMA_CODE = 'CHM-7F3K9Q'
const INVITE_LINK = `https://app.chametu.co.ke/join/${CHAMA_CODE}`

const INITIAL = [
  { id: 1, contact: 'faith@chametu.co.ke', method: 'email', role: 'Member', sent: 'Sep 20', status: 'pending' },
  { id: 2, contact: '0799 222 111', method: 'phone', role: 'Member', sent: 'Sep 12', status: 'expired' },
]

const badge = {
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  expired: 'bg-line text-ink-soft',
  joined: 'bg-[#E9F5EF] text-forest',
}
const badgeLabel = { pending: 'PENDING', expired: 'EXPIRED', joined: 'JOINED' }

export default function InviteMembers() {
  const [copied, setCopied] = useState(false)
  const [invites, setInvites] = useState(INITIAL)
  const [form, setForm] = useState({ contact: '', role: 'Member' })

  function copyLink() {
    navigator.clipboard?.writeText(INVITE_LINK).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function sendInvite(e) {
    e.preventDefault()
    const contact = form.contact.trim()
    if (!contact) return
    const method = contact.includes('@') ? 'email' : 'phone'
    const today = new Date()
    const label = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    setInvites((inv) => [{ id: Date.now(), contact, method, role: form.role, sent: label, status: 'pending' }, ...inv])
    setForm({ contact: '', role: 'Member' })
  }

  function resend(id) {
    setInvites((inv) => inv.map((i) => (i.id === id ? { ...i, status: 'pending' } : i)))
  }
  function cancel(id) {
    setInvites((inv) => inv.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Invite Members</h1>
        <p className="mt-1 text-sm text-ink-soft">Add people to Umoja Investment Chama</p>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="font-display text-sm font-semibold text-navy">Share your chama code</h3>
        <p className="mt-1 text-sm text-ink-soft">Anyone with this link or code can request to join — you still approve each member.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-62.5 rounded-lg border border-line bg-paper px-4 py-3 font-mono text-sm text-ink">
            {INVITE_LINK}
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-3 text-sm font-semibold text-white"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="mt-2 text-xs text-ink-soft">
          Chama code: <span className="font-mono font-semibold text-navy">{CHAMA_CODE}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-display text-sm font-semibold text-navy">Invite by email or phone</h3>
        <form onSubmit={sendInvite} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-55 text-xs font-semibold text-ink">
            Email or phone number
            <input
              value={form.contact}
              onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
              placeholder="jane@email.com or 07XX XXX XXX"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Role
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
            >
              <option>Member</option>
              <option>Secretary</option>
              <option>Treasurer</option>
              <option>Chairperson</option>
            </select>
          </label>
          <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2.5 text-sm font-semibold text-white">
            <Send size={15} /> Send invite
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-3.5 font-display text-sm font-semibold text-navy">Pending invites</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-ink-soft">No invites sent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                <th className="py-2">Contact</th>
                <th className="py-2">Role</th>
                <th className="py-2">Sent</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.id} className="border-b border-line last:border-none">
                  <td className="py-2.5">
                    <span className="flex items-center gap-1.5">
                      {inv.method === 'email' ? <Mail size={13} className="text-ink-soft" /> : <Phone size={13} className="text-ink-soft" />}
                      {inv.contact}
                    </span>
                  </td>
                  <td className="py-2.5">{inv.role}</td>
                  <td className="py-2.5 text-ink-soft">{inv.sent}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${badge[inv.status]}`}>
                      {badgeLabel[inv.status]}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex justify-end gap-2.5">
                      {inv.status === 'expired' && (
                        <button onClick={() => resend(inv.id)} className="text-xs font-semibold text-forest">
                          Resend
                        </button>
                      )}
                      <button onClick={() => cancel(inv.id)} className="text-xs font-semibold text-red-600">
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}