import { useEffect, useMemo, useRef, useState } from 'react'
import {
  UserPlus, Search, MoreVertical, Download, X, Mail, Send,
  CheckCircle2, AlertCircle, Eye, ShieldCheck, Bell, Wallet,
  UserMinus, Trash2, Link2, XCircle, UserCheck, Pencil, Save,
} from 'lucide-react'
import { toast } from 'sonner'

const STORAGE_KEY = 'chametu_members_v2'

const SEED_MEMBERS = [
  { id: 'm1', name: 'Daniel Muthui',  email: 'daniel@chametu.co.ke',  phone: '0712 345 678', role: 'Chairman',    savings: 85000,  loan: 20000, status: 'active'  },
  { id: 'm2', name: 'Brian Ngoyoni',   email: 'brian@chametu.co.ke',   phone: '0722 111 222', role: 'Treasurer',   savings: 60000,  loan: 0,     status: 'active'  },
  { id: 'm3', name: 'Kevin Mwangi',   email: 'kevin@chametu.co.ke',  phone: '0733 555 001', role: 'Secretary',   savings: 45000,  loan: 50000, status: 'active'  },
  { id: 'm4', name: 'Mary Achieng',   email: 'mary@chametu.co.ke',   phone: '0722 900 123', role: 'Member',      savings: 120000, loan: 40000, status: 'active'  },
  { id: 'm5', name: 'David Otieno',   email: 'david@chametu.co.ke',  phone: '0711 888 234', role: 'Member',      savings: 30000,  loan: 18000, status: 'arrears' },
  { id: 'm6', name: 'Grace Wanjiru',  email: 'grace@chametu.co.ke',  phone: '0722 333 444', role: 'Member',      savings: 380000, loan: 0,     status: 'active'  },
  { id: 'm7', name: 'Peter Otieno',   email: 'peter@chametu.co.ke',  phone: '0711 222 333', role: 'Member',      savings: 310000, loan: 0,     status: 'active'  },
  { id: 'm8', name: 'Faith Mwende',   email: 'faith@chametu.co.ke',  phone: '0700 444 555', role: 'Member',      savings: 120000, loan: 0,     status: 'invited' },
]

const FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'invited',  label: 'Invited' },
  { key: 'arrears',  label: 'Arrears' },
  { key: 'inactive', label: 'Inactive' },
]

const ROLES = ['Member', 'Chairman', 'Treasurer', 'Secretary']

const STATUS_STYLE = {
  active:   'bg-emerald/10 text-forest',
  invited:  'bg-gold/15 text-[#8A6112]',
  arrears:  'bg-red-50 text-red-700',
  inactive: 'bg-paper text-ink-soft',
}

/* ---------- helpers ---------- */

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function loadMembers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return SEED_MEMBERS
}

function saveMembers(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
}

function buildCSV(members) {
  const headers = ['Name', 'Email', 'Phone', 'Role', 'Savings (KSh)', 'Loan (KSh)', 'Status']
  const rows = members.map((m) => [m.name, m.email, m.phone, m.role, m.savings, m.loan, m.status])
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

function downloadCSV(members) {
  const csv = buildCSV(members)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chametu-members-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}


function getMenuItems(member) {
  if (member.status === 'invited') {
    return [
      { key: 'view',   label: 'View invite',      icon: Eye },
      { key: 'resend', label: 'Resend invite',    icon: Send },
      { key: 'copy',   label: 'Copy invite link', icon: Link2 },
      { divider: true },
      { key: 'cancel', label: 'Cancel invite',    icon: XCircle, danger: true },
    ]
  }
  if (member.status === 'inactive') {
    return [
      { key: 'view',       label: 'View profile',       icon: Eye },
      { key: 'role',       label: 'Change role',        icon: ShieldCheck },
      { divider: true },
      { key: 'reactivate', label: 'Reactivate',         icon: UserCheck },
      { divider: true },
      { key: 'remove',     label: 'Remove from chama',  icon: Trash2, danger: true },
    ]
  }
  return [
    { key: 'view',       label: 'View profile',       icon: Eye },
    { key: 'role',       label: 'Change role',        icon: ShieldCheck },
    { divider: true },
    { key: 'remind',     label: 'Send reminder',      icon: Bell },
    { key: 'record',     label: 'Record payment',     icon: Wallet },
    { divider: true },
    { key: 'deactivate', label: 'Deactivate',         icon: UserMinus },
    { key: 'remove',     label: 'Remove from chama',  icon: Trash2, danger: true },
  ]
}

function RowMenu({ member, onAction }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const items = getMenuItems(member)

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
        className={`p-1.5 rounded-lg transition ${
          open
            ? 'bg-forest/10 text-navy'
            : 'text-ink-soft hover:text-navy hover:bg-forest/10'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${member.name}`}
      >
        <MoreVertical size={15} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 w-56 bg-white border border-line rounded-xl shadow-lg overflow-hidden py-1"
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={`d${i}`} className="h-px bg-line my-1" />
            ) : (
              <button
                key={item.key}
                role="menuitem"
                onClick={() => { setOpen(false); onAction(item.key, member) }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[0.86rem] transition ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-navy hover:bg-forest/[0.06]'
                }`}
              >
                <item.icon
                  size={14}
                  strokeWidth={2}
                  className={item.danger ? 'text-red-500 shrink-0' : 'text-ink-soft shrink-0'}
                />
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}

function ProfileModal({ member, open, onClose, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (open && member) {
      setEditing(false)
      setDraft({
        name: member.name,
        email: member.email,
        phone: member.phone,
        role: member.role,
      })
    }
  }, [open, member])

  if (!open || !member || !draft) return null

  const save = () => {
    if (!draft.name.trim()) return toast.error('Name cannot be empty.')
    if (!isValidEmail(draft.email)) return toast.error('Enter a valid email.')
    onSave({ ...member, ...draft, name: draft.name.trim(), email: draft.email.trim().toLowerCase() })
    setEditing(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-[0.9rem] shrink-0">
              {initials(member.name)}
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-navy text-[1.05rem] truncate">
                {editing ? 'Edit member' : member.name}
              </h3>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[0.66rem] font-bold uppercase tracking-wide ${STATUS_STYLE[member.status]}`}>
                {member.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {editing ? (
            <>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Full name
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Email
                <input
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Phone
                <input
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Role
                <select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
            </>
          ) : (
            <>
              <Field label="Email" value={member.email} mono />
              <Field label="Phone" value={member.phone} mono />
              <Field label="Role"  value={member.role} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Savings" value={`KSh ${member.savings.toLocaleString()}`} mono />
                <Field label="Loan"    value={member.loan > 0 ? `KSh ${member.loan.toLocaleString()}` : '—'} mono />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"
              >
                <Save size={14} strokeWidth={2} />
                Save changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
              >
                Close
              </button>
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"
              >
                <Pencil size={14} strokeWidth={2} />
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div>
      <div className="text-[0.72rem] uppercase tracking-wider font-semibold text-ink-soft">{label}</div>
      <div className={`mt-0.5 text-[0.92rem] text-navy ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

function RoleModal({ member, open, onClose, onSave }) {
  const [role, setRole] = useState('Member')

  useEffect(() => {
    if (open && member) setRole(member.role)
  }, [open, member])

  if (!open || !member) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-navy text-[1.05rem]">Change role</h3>
          <p className="mt-0.5 text-[0.82rem] text-ink-soft">
            What should {member.name.split(' ')[0]} be in this chama?
          </p>
        </div>
        <div className="px-5 py-4">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] text-navy outline-none focus:border-forest transition"
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(role)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"
          >
            <ShieldCheck size={14} strokeWidth={2} />
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ open, title, body, confirmLabel, danger, onClose, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4">
          <h3 className="font-display font-semibold text-navy text-[1.05rem]">{title}</h3>
          <p className="mt-1.5 text-[0.86rem] text-ink-soft">{body}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2.5 rounded-xl text-white text-[0.86rem] font-semibold transition ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-forest hover:bg-forest-dark'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function InviteModal({ open, onClose, onInvite, existingEmails }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Member')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    if (open) { setName(''); setEmail(''); setRole('Member'); setError(''); setSent(false) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) return setError('Enter the member\u2019s name.')
    if (!isValidEmail(trimmedEmail)) return setError('Enter a valid email address.')
    if (existingEmails.includes(trimmedEmail)) return setError('That email is already on this chama.')
    onInvite({ name: trimmedName, email: trimmedEmail, role })
    setSent(true)
    setTimeout(() => onClose(), 1400)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="p-7 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald/15 text-forest grid place-items-center mb-3">
              <CheckCircle2 size={22} strokeWidth={2} />
            </div>
            <h3 className="font-display font-semibold text-navy text-lg">Invite sent</h3>
            <p className="mt-1 text-[0.86rem] text-ink-soft">
              We emailed <b className="text-navy">{email}</b> an invite link to join the chama.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-start justify-between px-5 py-4 border-b border-line">
              <div>
                <h3 className="font-display font-semibold text-navy text-[1.05rem]">Invite a member</h3>
                <p className="mt-0.5 text-[0.82rem] text-ink-soft">They'll receive an email with a join link.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition"
                aria-label="Close"
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Anne Wanjiku"
                  autoFocus
                  className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Email address
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white focus-within:border-forest transition">
                  <Mail size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full outline-none text-[0.92rem] font-normal text-navy bg-transparent"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                Role
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
                >
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </label>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[0.82rem]">
                  <AlertCircle size={14} strokeWidth={2} className="shrink-0" />
                  {error}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"
              >
                <Send size={14} strokeWidth={2} />
                Send invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Members() {
  const [members, setMembers] = useState(() => loadMembers())
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [profileTarget, setProfileTarget] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => { saveMembers(members) }, [members])

  const rows = useMemo(() => {
    return members.filter((m) => {
      if (filter !== 'all' && m.status !== filter) return false
      if (query) {
        const q = query.toLowerCase()
        if (
          !m.name.toLowerCase().includes(q) &&
          !m.email.toLowerCase().includes(q) &&
          !m.phone.includes(q)
        ) {
          return false
        }
      }
      return true
    })
  }, [members, filter, query])

  const counts = useMemo(
    () => ({
      all: members.length,
      active: members.filter((m) => m.status === 'active').length,
      invited: members.filter((m) => m.status === 'invited').length,
      arrears: members.filter((m) => m.status === 'arrears').length,
      inactive: members.filter((m) => m.status === 'inactive').length,
    }),
    [members]
  )

  const existingEmails = useMemo(() => members.map((m) => m.email.toLowerCase()), [members])

  const updateMember = (id, patch) =>
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))

  const removeMember = (id) => setMembers((prev) => prev.filter((m) => m.id !== id))

  const handleExport = () => {
    if (rows.length === 0) return toast.error('Nothing to export for this filter.')
    downloadCSV(rows)
    toast.success(`Exported ${rows.length} ${rows.length === 1 ? 'member' : 'members'} to CSV.`)
  }

  const handleInvite = ({ name, email, role }) => {
    const next = {
      id: `m${Date.now()}`,
      name,
      email,
      phone: '—',
      role,
      savings: 0,
      loan: 0,
      status: 'invited',
    }
    setMembers((prev) => [next, ...prev])
    toast.success(`Invite sent to ${email}.`)
  }

  const handleMenuAction = (key, member) => {
    switch (key) {
      case 'view':
        setProfileTarget(member)
        break

      case 'role':
        setRoleTarget(member)
        break

      case 'remind':
        toast.info(`Reminder queued for ${member.email} (backend not connected)`)
        break

      case 'record': {
        const amount = 5000
        updateMember(member.id, { savings: member.savings + amount, status: 'active' })
        toast.success(`Recorded KSh ${amount.toLocaleString()} for ${member.name.split(' ')[0]}`)
        break
      }

      case 'resend':
        toast.success(`Invite resent to ${member.email}`)
        break

      case 'copy': {
        const link = `${window.location.origin}/join?email=${encodeURIComponent(member.email)}`
        navigator.clipboard?.writeText(link).then(
          () => toast.success('Invite link copied to clipboard'),
          () => toast.error('Could not copy — check browser permissions')
        )
        break
      }

      case 'reactivate':
        updateMember(member.id, { status: 'active' })
        toast.success(`${member.name.split(' ')[0]} reactivated`)
        break

      case 'deactivate':
        setConfirm({
          title: `Deactivate ${member.name}?`,
          body: 'They will lose access to the chama app. Their data and history are preserved.',
          confirmLabel: 'Deactivate',
          onConfirm: () => {
            updateMember(member.id, { status: 'inactive' })
            toast.success(`${member.name.split(' ')[0]} deactivated`)
            setConfirm(null)
          },
        })
        break

      case 'cancel':
        setConfirm({
          title: `Cancel invite for ${member.name}?`,
          body: 'Their invite link will stop working. You can invite them again later.',
          confirmLabel: 'Cancel invite',
          danger: true,
          onConfirm: () => {
            removeMember(member.id)
            toast.success(`Invite cancelled for ${member.name.split(' ')[0]}`)
            setConfirm(null)
          },
        })
        break

      case 'remove':
        setConfirm({
          title: `Remove ${member.name} from the chama?`,
          body: 'This cannot be undone. Their contribution and loan history will be removed from your records.',
          confirmLabel: 'Remove',
          danger: true,
          onConfirm: () => {
            removeMember(member.id)
            toast.success(`${member.name.split(' ')[0]} removed from chama`)
            setConfirm(null)
          },
        })
        break

      default:
        break
    }
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Members</h1>
          <p className="mt-1.5 text-ink-soft">
            {counts.active} active · {counts.invited} invited · {counts.arrears} in arrears
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-sm font-semibold hover:border-forest transition"
          >
            <Download size={15} strokeWidth={2} />
            Export CSV
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition"
          >
            <UserPlus size={15} strokeWidth={2} />
            Add member
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-[0.82rem] font-semibold transition ${
                filter === f.key
                  ? 'bg-navy text-white'
                  : 'bg-white border border-line text-ink-soft hover:border-navy'
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-60">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-white max-w-[260px]">
          <Search size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone…"
            className="outline-none text-sm bg-transparent w-full"
          />
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.88rem]">
            <thead>
              <tr className="text-ink-soft text-[0.72rem] uppercase tracking-wider">
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Member</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Role</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Phone</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold">Savings</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold">Loan</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Status</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="hover:bg-forest/[0.03] transition">
                  <td className="px-5 py-3.5 border-b border-line">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-[0.72rem] shrink-0">
                        {initials(m.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium text-navy truncate">{m.name}</span>
                        <span className="block text-[0.76rem] text-ink-soft truncate">{m.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 border-b border-line text-ink-soft">{m.role}</td>
                  <td className="px-5 py-3.5 border-b border-line font-mono text-[0.82rem] text-ink-soft">
                    {m.phone}
                  </td>
                  <td className="px-5 py-3.5 border-b border-line text-right font-mono text-navy">
                    {m.savings.toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 border-b border-line text-right font-mono text-navy">
                    {m.loan > 0 ? m.loan.toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-3.5 border-b border-line">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${STATUS_STYLE[m.status]}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-line text-right">
                    <RowMenu member={m} onAction={handleMenuAction} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-ink-soft">
                    No members match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        existingEmails={existingEmails}
      />

      <ProfileModal
        open={!!profileTarget}
        member={profileTarget}
        onClose={() => setProfileTarget(null)}
        onSave={(next) => {
          updateMember(next.id, next)
          setProfileTarget(null)
          toast.success(`${next.name.split(' ')[0]} updated`)
        }}
      />

      <RoleModal
        open={!!roleTarget}
        member={roleTarget}
        onClose={() => setRoleTarget(null)}
        onSave={(role) => {
          updateMember(roleTarget.id, { role })
          toast.success(`${roleTarget.name.split(' ')[0]} is now ${role}`)
          setRoleTarget(null)
        }}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />
    </div>
  )
}