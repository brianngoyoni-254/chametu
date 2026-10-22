import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  UserPlus, Search, MoreVertical, Download, X, Mail, Send,
  CheckCircle2, AlertCircle, Eye, ShieldCheck, Bell, Wallet,
  UserMinus, Trash2, Link2, XCircle, UserCheck, Pencil, Save,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { useTier } from '../../context/TierContext'

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
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function buildCSV(members) {
  const headers = ['Name', 'Email', 'Phone', 'Role', 'Savings (KSh)', 'Status']
  const rows = members.map((m) => [m.name, m.email, m.phone || '—', m.role, m.savings, m.status])
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

/* ---------- sub-components ---------- */

function MemberAvatar({ member, size = 'md' }) {
  const dim = size === 'lg' ? 'w-11 h-11 text-[0.9rem]' : 'w-8 h-8 text-[0.72rem]'
  if (member?.avatar) {
    return <img src={member.avatar} alt={member.name} className={`${dim} rounded-lg object-cover shrink-0`} />
  }
  return (
    <span className={`${dim} rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold shrink-0`}>
      {initials(member?.name)}
    </span>
  )
}

function RowMenu({ member, onAction }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const onEsc = (e) => e.key === 'Escape' && setOpen(false)
    const onScroll = () => setOpen(false)

    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    window.addEventListener('scroll', onScroll, true)

    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  const handleOpen = (e) => {
    e.stopPropagation()
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = 220
      const spaceBelow = window.innerHeight - rect.bottom
      const top = spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom
      setCoords({ top: top, left: rect.right - 224 })
    }
    setOpen(!open)
  }

  const items = getMenuItems(member)

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`p-1.5 rounded-lg transition ${open ? 'bg-forest/10 text-navy' : 'text-ink-soft hover:text-navy hover:bg-forest/10'}`}
      >
        <MoreVertical size={15} strokeWidth={2} />
      </button>

      {open && createPortal(
        <div ref={menuRef} style={{ top: coords.top, left: coords.left }} className="fixed z-[100] w-56 bg-white border border-line rounded-xl shadow-lg overflow-hidden py-1">
          {items.map((item, i) =>
            item.divider ? (
              <div key={`d${i}`} className="h-px bg-line my-1" />
            ) : (
              <button
                key={item.key}
                onClick={() => { setOpen(false); onAction(item.key, member) }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[0.86rem] transition ${item.danger ? 'text-red-600 hover:bg-red-50' : 'text-navy hover:bg-forest/[0.06]'}`}
              >
                <item.icon size={14} strokeWidth={2} className={item.danger ? 'text-red-500 shrink-0' : 'text-ink-soft shrink-0'} />
                {item.label}
              </button>
            )
          )}
        </div>,
        document.body
      )}
    </>
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

function ProfileModal({ member, open, onClose, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)

  useEffect(() => {
    if (open && member) {
      setEditing(false)
      setDraft({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
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
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-line">
          <div className="flex items-center gap-3">
            <MemberAvatar member={member} size="lg" />
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-navy text-[1.05rem] truncate">{editing ? 'Edit member' : member.name}</h3>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[0.66rem] font-bold uppercase tracking-wide ${STATUS_STYLE[member.status] || STATUS_STYLE.active}`}>{member.status}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition"><X size={16} strokeWidth={2} /></button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-3">
          {editing ? (
            <>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Full name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition" /></label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Email<input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition" /></label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Phone<input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition" /></label>
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Role<select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
            </>
          ) : (
            <>
              <Field label="Email" value={member.email} mono />
              <Field label="Phone" value={member.phone || '—'} mono />
              <Field label="Role"  value={member.role} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Savings" value={`KSh ${Number(member.savings || 0).toLocaleString()}`} mono />
                <Field label="Status" value={member.status} />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition">Cancel</button>
              <button onClick={save} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"><Save size={14} strokeWidth={2} />Save changes</button>
            </>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition">Close</button>
              <button onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"><Pencil size={14} strokeWidth={2} />Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function RoleModal({ member, open, onClose, onSave }) {
  const [role, setRole] = useState('Member')
  useEffect(() => { if (open && member) setRole(member.role) }, [open, member])
  if (!open || !member) return null

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-navy text-[1.05rem]">Change role</h3>
          <p className="mt-0.5 text-[0.82rem] text-ink-soft">What should {member.name.split(' ')[0]} be in this chama?</p>
        </div>
        <div className="px-5 py-4">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] text-navy outline-none focus:border-forest transition">
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition">Cancel</button>
          <button onClick={() => onSave(role)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition"><ShieldCheck size={14} strokeWidth={2} />Save</button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDialog({ open, title, body, confirmLabel, danger, onClose, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4">
          <h3 className="font-display font-semibold text-navy text-[1.05rem]">{title}</h3>
          <p className="mt-1.5 text-[0.86rem] text-ink-soft">{body}</p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2.5 rounded-xl text-white text-[0.86rem] font-semibold transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-forest hover:bg-forest-dark'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function InviteModal({ open, onClose, onInvite, existingEmails, atCap, capInfo }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('Member')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) { setName(''); setEmail(''); setRole('Member'); setError(''); setBusy(false) }
  }, [open])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    
    if (!trimmedName) return setError('Enter the member’s name.')
    if (!isValidEmail(trimmedEmail)) return setError('Enter a valid email address.')
    if (existingEmails.includes(trimmedEmail)) return setError('That email is already on this chama.')

    setBusy(true)
    const success = await onInvite({ name: trimmedName, email: trimmedEmail, role })
    setBusy(false)
    if (success) onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <div className="flex items-start justify-between px-5 py-4 border-b border-line">
            <div>
              <h3 className="font-display font-semibold text-navy text-[1.05rem]">Invite a member</h3>
              <p className="mt-0.5 text-[0.82rem] text-ink-soft">{atCap ? `You've reached the ${capInfo.maxMembers}-member cap on ${capInfo.tier}.` : "They'll receive an email with a join link."}</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition"><X size={16} strokeWidth={2} /></button>
          </div>
          <div className="px-5 py-4 flex flex-col gap-3">
            {atCap ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gold/15 text-[#8A6112] text-[0.84rem]"><AlertCircle size={14} strokeWidth={2} className="shrink-0" /><span>Your <b>{capInfo.tier}</b> plan allows up to <b>{capInfo.maxMembers}</b> members.</span></div>
            ) : (
              <>
                <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anne Wanjiku" autoFocus disabled={busy} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition disabled:opacity-50" /></label>
                <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Email address<div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white focus-within:border-forest transition"><Mail size={15} strokeWidth={2} className="text-ink-soft shrink-0" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" disabled={busy} className="w-full outline-none text-[0.92rem] font-normal text-navy bg-transparent disabled:opacity-50" /></div></label>
                <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">Role<select value={role} onChange={(e) => setRole(e.target.value)} disabled={busy} className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition disabled:opacity-50">{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
                {error && <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-[0.82rem]"><AlertCircle size={14} strokeWidth={2} className="shrink-0" />{error}</div>}
              </>
            )}
          </div>
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
            <button type="button" onClick={onClose} disabled={busy} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition disabled:opacity-50">{atCap ? 'Close' : 'Cancel'}</button>
            {!atCap && (
              <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition disabled:opacity-50"><Send size={14} strokeWidth={2} />{busy ? 'Sending…' : 'Send invite'}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------- main page ---------- */

export default function Members() {
  const { members, setMembers, refetchMembers, recordContribution } = useChama()
  const { tier, config } = useTier()

  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [profileTarget, setProfileTarget] = useState(null)
  const [roleTarget, setRoleTarget] = useState(null)
  const [confirm, setConfirm] = useState(null)
  
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const rows = useMemo(() => {
    return members.filter((m) => {
      if (filter !== 'all' && m.status !== filter) return false
      if (query) {
        const q = query.toLowerCase()
        if (!m.name.toLowerCase().includes(q) && !m.email.toLowerCase().includes(q) && !(m.phone || '').includes(q)) return false
      }
      return true
    })
  }, [members, filter, query])

  useEffect(() => { setCurrentPage(1) }, [filter, query])

  const totalPages = Math.ceil(rows.length / itemsPerPage) || 1
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem)

  const counts = useMemo(() => ({
    all: members.length,
    active: members.filter((m) => m.status === 'active').length,
    invited: members.filter((m) => m.status === 'invited').length,
    arrears: members.filter((m) => m.status === 'arrears').length,
    inactive: members.filter((m) => m.status === 'inactive').length,
  }), [members])

  const capUsed = useMemo(() => members.filter((m) => m.status !== 'inactive').length, [members])
  const atCap = capUsed >= (config?.maxMembers || 10)
  const existingEmails = useMemo(() => members.map((m) => m.email.toLowerCase()), [members])

  const updateMember = (id, patch) => setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  const removeMember = (id) => setMembers((prev) => prev.filter((m) => m.id !== id))

  const handleExport = () => {
    if (rows.length === 0) return toast.error('Nothing to export for this filter.')
    downloadCSV(rows)
    toast.success(`Exported ${rows.length} members to CSV.`)
  }

  const handleInvite = async ({ name, email, role }) => {
    if (atCap) {
      toast.error(`Your ${tier} plan allows up to ${config.maxMembers} members.`)
      return false
    }

    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch('http://localhost:5000/api/chama/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name, email, role })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to invite')
      toast.success(`Invite sent to ${email}.`)
      refetchMembers()
      return true
    } catch (err) {
      toast.error(err.message)
      return false
    }
  }

  const handleMenuAction = async (key, member) => {
    switch (key) {
      case 'view': setProfileTarget(member); break
      case 'role': setRoleTarget(member); break
      case 'remind': toast.info(`Reminder queued for ${member.email}`); break
      case 'record': {
        const amount = 5000
        const res = await recordContribution(member.id, amount, 'CASH')
        if (res.ok) toast.success(`Recorded KSh ${amount.toLocaleString()} for ${member.name.split(' ')[0]}`)
        else toast.error(res.message)
        break
      }
      case 'resend': toast.success(`Invite resent to ${member.email}`); break
      case 'copy': {
        const link = `${window.location.origin}/join?email=${encodeURIComponent(member.email)}`
        navigator.clipboard?.writeText(link).then(() => toast.success('Invite link copied'))
        break
      }
      case 'reactivate': updateMember(member.id, { status: 'active' }); toast.success(`${member.name.split(' ')[0]} reactivated`); break
      case 'deactivate':
        setConfirm({
          title: `Deactivate ${member.name}?`, body: 'They will lose access.', confirmLabel: 'Deactivate',
          onConfirm: () => { updateMember(member.id, { status: 'inactive' }); toast.success(`${member.name.split(' ')[0]} deactivated`); setConfirm(null) },
        })
        break
      case 'cancel':
        setConfirm({
          title: `Cancel invite for ${member.name}?`, body: 'Their link will stop working.', confirmLabel: 'Cancel invite', danger: true,
          onConfirm: () => { removeMember(member.id); toast.success(`Invite cancelled`); setConfirm(null) },
        })
        break
      case 'remove':
        setConfirm({
          title: `Remove ${member.name}?`, body: 'This cannot be undone.', confirmLabel: 'Remove', danger: true,
          onConfirm: () => { removeMember(member.id); toast.success(`${member.name.split(' ')[0]} removed`); setConfirm(null) },
        })
        break
      default: break
    }
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Members</h1>
          <p className="mt-1.5 text-ink-soft">
            {counts.active} active · {counts.invited} invited · {counts.arrears} in arrears
            {' · '}
            <span className={atCap ? 'text-[#8A6112] font-semibold' : ''}>{capUsed}/{config?.maxMembers || 10} on {tier}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-sm font-semibold hover:border-forest transition"><Download size={15} strokeWidth={2} />Export CSV</button>
          <button onClick={() => setInviteOpen(true)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${atCap ? 'bg-paper text-ink-soft border border-line hover:border-gold cursor-pointer' : 'bg-forest text-white hover:bg-forest-dark'}`}><UserPlus size={15} strokeWidth={2} />Add member</button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-3.5 py-2 rounded-xl text-[0.82rem] font-semibold transition ${filter === f.key ? 'bg-navy text-white' : 'bg-white border border-line text-ink-soft hover:border-navy'}`}>
              {f.label}<span className="ml-1.5 opacity-60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-white max-w-[260px]">
          <Search size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone…" className="outline-none text-sm bg-transparent w-full" />
        </div>
      </div>

      <div className="bg-white border border-line rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.88rem]">
            <thead>
              <tr className="text-ink-soft text-[0.72rem] uppercase tracking-wider">
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Member</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Role</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Phone</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold">Savings</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Status</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((m) => (
                <tr key={m.id} className="hover:bg-forest/[0.03] transition">
                  <td className="px-5 py-3.5 border-b border-line">
                    <div className="flex items-center gap-3">
                      <MemberAvatar member={m} />
                      <span className="min-w-0">
                        <span className="block font-medium text-navy truncate">{m.name}</span>
                        <span className="block text-[0.76rem] text-ink-soft truncate">{m.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 border-b border-line text-ink-soft">{m.role}</td>
                  <td className="px-5 py-3.5 border-b border-line font-mono text-[0.82rem] text-ink-soft">{m.phone || '—'}</td>
                  <td className="px-5 py-3.5 border-b border-line text-right font-mono text-navy">{Number(m.savings || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5 border-b border-line">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide ${STATUS_STYLE[m.status] || STATUS_STYLE.active}`}>{m.status}</span>
                  </td>
                  <td className="px-5 py-3.5 border-b border-line text-right">
                    <RowMenu member={m} onAction={handleMenuAction} />
                  </td>
                </tr>
              ))}
              {currentRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-soft">
                    {members.length === 0 ? 'Loading members from database…' : 'No members match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {rows.length > itemsPerPage && (
          <div className="flex items-center justify-between border-t border-line bg-paper/50 px-5 py-3">
            <span className="text-[0.82rem] text-ink-soft">Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, rows.length)}</b> of <b>{rows.length}</b> members</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-line bg-white text-navy hover:bg-paper disabled:opacity-50 transition"><ChevronLeft size={16} /></button>
              <span className="text-[0.82rem] font-semibold text-navy px-2">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-line bg-white text-navy hover:bg-paper disabled:opacity-50 transition"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvite={handleInvite} existingEmails={existingEmails} atCap={atCap} capInfo={{ tier, maxMembers: config?.maxMembers || 10 }} />
      <ProfileModal open={!!profileTarget} member={profileTarget} onClose={() => setProfileTarget(null)} onSave={(next) => { updateMember(next.id, next); setProfileTarget(null); toast.success(`${next.name.split(' ')[0]} updated`) }} />
      <RoleModal open={!!roleTarget} member={roleTarget} onClose={() => setRoleTarget(null)} onSave={(role) => { updateMember(roleTarget.id, { role }); toast.success(`${roleTarget.name.split(' ')[0]} is now ${role}`); setRoleTarget(null) }} />
      <ConfirmDialog open={!!confirm} title={confirm?.title} body={confirm?.body} confirmLabel={confirm?.confirmLabel} danger={confirm?.danger} onClose={() => setConfirm(null)} onConfirm={confirm?.onConfirm} />
    </div>
  )
}