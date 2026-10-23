import { useEffect, useMemo, useState } from 'react'
import {
  Plus, Shield, ShieldCheck, UserCog, Wallet, FileText, User, Users, Crown,
  Trash2, X, AlertCircle, Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { PERMISSIONS, emptyPerms } from '../../lib/permissions'

const ICONS = { ShieldCheck, Shield, UserCog, Wallet, FileText, User, Users, Crown }

function AddRoleModal({ open, onClose, onCreate, existingNames }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) { setName(''); setDescription(''); setError(''); setLoading(false) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter a role name.')
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return setError('A role with that name already exists.')
    }
    
    setLoading(true)
    const res = await onCreate({ name: trimmed, description: description.trim() })
    setLoading(false)
    
    if (res && !res.ok) {
      setError(res.message || 'Failed to create role.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={submit}>
          <div className="flex items-start justify-between px-5 py-4 border-b border-line">
            <div>
              <h3 className="font-display font-semibold text-navy text-[1.05rem]">Add role</h3>
              <p className="mt-0.5 text-[0.82rem] text-ink-soft">Create a custom role for your chama.</p>
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
              Role name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Auditor, Youth Rep, Investment Lead"
                autoFocus
                className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this role do?"
                rows={2}
                className="px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] font-normal text-navy outline-none focus:border-forest transition resize-none"
              />
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
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold hover:bg-forest-dark transition disabled:opacity-50"
            >
              <Plus size={14} strokeWidth={2} />
              {loading ? 'Adding...' : 'Add role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmDialog({ open, title, body, confirmLabel, danger, onClose, onConfirm, loading }) {
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
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-white text-[0.86rem] font-semibold transition disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-forest hover:bg-forest-dark'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RolesPermissions() {
  // NEW: Destructured updateRole, addRole, deleteRole from context
  const { roles, updateRole, addRole, deleteRole, members } = useChama()
  const [selectedId, setSelectedId] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!selectedId && roles && roles.length > 0) setSelectedId(roles[0].id)
  }, [selectedId, roles])

  const selected = roles?.find((r) => r.id === selectedId) || roles?.[0] || null
  const existingNames = useMemo(() => (roles || []).map((r) => r.name), [roles])
  const enabledCount = useMemo(
    () => (selected ? Object.values(selected.perms || {}).filter(Boolean).length : 0),
    [selected]
  )

  const memberCountFor = (roleName) =>
    (members || []).filter(
      (m) => m.role?.toLowerCase() === roleName.toLowerCase() && m.status !== 'inactive'
    ).length

  const handleToggle = async (key) => {
    if (!selected) return
    const newPerms = { ...selected.perms, [key]: !selected.perms[key] }
    
    // Optimistic Update (UI changes instantly)
    // If the API fails, ChamaContext handles rolling back via the next fetch.
    await updateRole(selected.id, { perms: newPerms })
    toast.success(`Permission updated`)
  }

  const handleAddRole = async ({ name, description }) => {
    const next = {
      name,
      description: description || 'Custom role',
      icon: 'UserCog',
      system: false,
      perms: emptyPerms(false),
    }
    const res = await addRole(next)
    if (res.ok) {
      setSelectedId(res.role.id)
      setAddOpen(false)
      toast.success(`Role "${name}" created`)
    }
    return res
  }

  const handleDelete = (role) => {
    setConfirm({
      title: `Delete "${role.name}"?`,
      body: 'This cannot be undone. Members with this role will lose access to anything it granted.',
      confirmLabel: 'Delete role',
      danger: true,
      onConfirm: async () => {
        setIsDeleting(true)
        const res = await deleteRole(role.id)
        setIsDeleting(false)
        
        if (res.ok) {
          if (selectedId === role.id) {
            const fallback = (roles || []).find((r) => r.id !== role.id)
            setSelectedId(fallback?.id || null)
          }
          toast.success(`Role "${role.name}" deleted`)
          setConfirm(null)
        } else {
          toast.error(res.message || 'Failed to delete role')
        }
      },
    })
  }

  const handleRename = async (role, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (
      (roles || []).some(
        (r) => r.id !== role.id && r.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      toast.error('Another role already has that name.')
      return
    }
    await updateRole(role.id, { name: trimmed })
  }

  const handleDescription = async (role, description) => {
    await updateRole(role.id, { description })
  }

  if (!selected) {
    return (
      <div className="max-w-[1180px] mx-auto">
        <h1 className="font-display font-bold text-2xl text-navy">Roles &amp; Permissions</h1>
        <p className="mt-2 text-ink-soft">No roles yet. Add one to get started.</p>
        <button
          onClick={() => setAddOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition"
        >
          <Plus size={15} strokeWidth={2} />
          Add role
        </button>
        <AddRoleModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreate={handleAddRole}
          existingNames={existingNames}
        />
      </div>
    )
  }

  return (
    <div className="max-w-[1180px] mx-auto">
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Roles &amp; Permissions</h1>
          <p className="mt-1.5 text-ink-soft max-w-[60ch]">
            Select a role to view or change what it can access. Changes apply immediately to every member with that role.
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition"
        >
          <Plus size={15} strokeWidth={2} />
          Add role
        </button>
      </header>

      <div className="grid grid-cols-1 hero:grid-cols-[320px_1fr] gap-4">
        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-line text-[0.72rem] uppercase tracking-wider font-semibold text-ink-soft">
            Roles ({roles.length})
          </div>
          <div className="flex flex-col">
            {roles.map((r) => {
              const Icon = ICONS[r.icon] || Shield
              const active = r.id === selected.id
              const count = memberCountFor(r.name)
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`flex items-center gap-3 px-5 py-3.5 text-left border-b border-line last:border-b-0 transition ${
                    active ? 'bg-emerald/10' : 'hover:bg-forest/[0.03]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
                      active ? 'bg-forest text-white' : 'bg-emerald/10 text-forest'
                    }`}
                  >
                    <Icon size={15} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-medium truncate ${
                        active ? 'text-forest font-semibold' : 'text-navy'
                      }`}
                    >
                      {r.name}
                    </span>
                    <span className="block text-[0.76rem] text-ink-soft">
                      {count} {count === 1 ? 'person' : 'people'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-line rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-line">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {selected.system ? (
                  <h3 className="font-display font-semibold text-navy text-[1.05rem] truncate">
                    {selected.name}
                  </h3>
                ) : (
                  <input
                    value={selected.name}
                    onChange={(e) => handleRename(selected, e.target.value)}
                    className="w-full font-display font-semibold text-navy text-[1.05rem] bg-transparent border-b border-transparent hover:border-line focus:border-forest outline-none transition pb-0.5"
                  />
                )}
                <input
                  value={selected.description || ''}
                  onChange={(e) => handleDescription(selected, e.target.value)}
                  placeholder="What does this role do?"
                  className="w-full mt-1 text-[0.82rem] text-ink-soft bg-transparent border-b border-transparent hover:border-line focus:border-forest outline-none transition pb-0.5"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {selected.system ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-paper text-ink-soft text-[0.68rem] font-bold uppercase tracking-wide">
                    <Lock size={11} strokeWidth={2.5} />
                    System
                  </span>
                ) : (
                  <button
                    onClick={() => handleDelete(selected)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-ink-soft hover:text-red-600 transition"
                    aria-label="Delete role"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2 text-[0.78rem] text-ink-soft">
              <b className="text-forest">{enabledCount}</b> of {PERMISSIONS.length} permissions enabled
            </div>
          </div>

          <div>
            {PERMISSIONS.map((p) => {
              const on = selected.perms?.[p.key]
              return (
                <div
                  key={p.key}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-line last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="text-[0.9rem] text-navy font-medium">{p.label}</div>
                    <div className="text-[0.76rem] text-ink-soft">{p.desc}</div>
                  </div>
                  <button
                    role="switch"
                    aria-checked={on}
                    onClick={() => handleToggle(p.key)}
                    className={`relative w-10 h-6 rounded-full transition shrink-0 ${
                      on ? 'bg-emerald' : 'bg-line'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        on ? 'translate-x-4' : ''
                      }`}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AddRoleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreate={handleAddRole}
        existingNames={existingNames}
      />

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        confirmLabel={confirm?.confirmLabel}
        danger={confirm?.danger}
        loading={isDeleting}
        onClose={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />
    </div>
  )
}