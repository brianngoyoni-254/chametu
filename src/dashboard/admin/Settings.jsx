import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  User, Bell, Building2, ShieldCheck, Save, AlertTriangle, CheckCircle2,
  Check, Volume2, Clock, Mail, Smartphone, Lock, Globe, Palette,
  LogOut, KeyRound, Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { getChama, saveChama, getMembers } from '../../lib/chametuStorage'
import {
  useAdminNotifications,
  DEFAULT_ADMIN_PREFS,
} from '../../lib/adminNotifications'

const TABS = [
  { key: 'profile',       label: 'Profile',       icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'chama',         label: 'My Chama',      icon: Building2 },
  { key: 'security',      label: 'Security',      icon: ShieldCheck },
]

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10'

function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <label
      className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-line bg-white p-3.5 transition ${
        disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-forest/40'
      }`}
    >
      <div className="min-w-0">
        <p className="text-[0.85rem] font-semibold text-navy">{label}</p>
        {description && (
          <p className="mt-0.5 text-[0.73rem] text-ink-soft">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? 'bg-forest' : 'bg-line'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

function Field({ label, icon: Icon, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[0.75rem] font-semibold text-navy">
        {Icon && <Icon size={12} className="text-ink-soft" />} {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[0.68rem] text-ink-soft">{hint}</span>}
    </label>
  )
}

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const initialTab = TABS.some((t) => t.key === params.get('tab'))
    ? params.get('tab')
    : 'profile'
  const [tab, setTab] = useState(initialTab)

  useEffect(() => {
    if (params.get('tab') && TABS.some((t) => t.key === params.get('tab'))) {
      setTab(params.get('tab'))
    }
  }, [params])

  const switchTab = (key) => {
    setTab(key)
    params.set('tab', key)
    setParams(params, { replace: true })
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Manage your account, notifications, chama rules and security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_1fr]">
        <nav className="-mx-1 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 shadow-sm lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[0.82rem] font-semibold transition lg:px-3.5 lg:py-2.5 ${
                  active
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-navy/70 hover:bg-paper hover:text-navy'
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </nav>

        <div className="space-y-4">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'chama' && <ChamaTab />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  const currentUser = useMemo(() => {
    try {
      const raw =
        localStorage.getItem('chametu_auth_session') ||
        localStorage.getItem('superadmin_session')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])

  const [name, setName] = useState(currentUser?.name || '')
  const [email, setEmail] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [dirty, setDirty] = useState(false)

  const save = () => {
    if (!name.trim()) return toast.error('Name cannot be empty')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      return toast.error('Enter a valid email')

    try {
      const nextUser = { ...(currentUser || {}), name, email, phone }
      localStorage.setItem('chametu_auth_session', JSON.stringify(nextUser))
    } catch {}

    try {
      const members = getMembers()
      const idx = members.findIndex(
        (m) => m.email === currentUser?.email || m.id === currentUser?.id
      )
      if (idx !== -1) {
        const nextMembers = [...members]
        nextMembers[idx] = { ...nextMembers[idx], name, email, phone }
        localStorage.setItem('chametu_members_v2', JSON.stringify(nextMembers))
      }
    } catch {}

    setDirty(false)
    toast.success('Profile updated')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <User size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Your profile
          </h2>
        </div>

        <div className="flex items-center gap-4 mb-5">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-forest to-emerald text-white font-display text-xl font-bold">
            {(name || '··')
              .split(' ')
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <div>
            <div className="text-[0.95rem] font-semibold text-navy">{name || 'Your name'}</div>
            <div className="text-[0.78rem] text-ink-soft">{email || 'your@email.com'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setDirty(true) }}
              className={inputCls}
            />
          </Field>
          <Field label="Email" icon={Mail}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setDirty(true) }}
              className={inputCls}
            />
          </Field>
          <Field label="Phone" icon={Smartphone}>
            <input
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setDirty(true) }}
              className={inputCls}
              placeholder="07XX XXX XXX"
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={save}
            disabled={!dirty}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              dirty ? 'bg-forest hover:bg-forest-dark' : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            <Save size={15} /> Save changes
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const { prefs, savePrefs } = useAdminNotifications()
  const [local, setLocal] = useState(prefs)
  const [dirty, setDirty] = useState(false)

  const update = (path, value) => {
    setLocal((p) => ({ ...p, [path]: { ...p[path], ...value } }))
    setDirty(true)
  }

  const save = () => {
    savePrefs(local)
    setDirty(false)
    toast.success('Notification preferences saved', {
      description: 'The bell will update immediately.',
    })
  }

  const reset = () => {
    setLocal(DEFAULT_ADMIN_PREFS)
    savePrefs(DEFAULT_ADMIN_PREFS)
    setDirty(false)
    toast.info('Notification preferences reset to defaults')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-[1.05rem] font-bold text-navy">
            Notifications
          </h2>
          <p className="mt-0.5 text-[0.8rem] text-ink-soft">
            Control what appears in your bell and when.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            className="rounded-xl border border-line bg-white px-3.5 py-2 text-[0.82rem] font-semibold text-navy hover:border-navy"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[0.82rem] font-semibold text-white ${
              dirty ? 'bg-forest hover:bg-forest-dark' : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-3.5 py-2.5 text-[0.8rem] font-semibold text-[#8A6417]">
          <AlertTriangle size={14} /> You have unsaved changes.
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Bell size={15} className="text-forest" />
          <h3 className="font-display text-[0.98rem] font-bold text-navy">
            Events to notify me about
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle
            checked={local.events.loanApplications}
            onChange={(v) => update('events', { loanApplications: v })}
            label="Loan applications"
            description="Members applying for loans"
          />
          <Toggle
            checked={local.events.loanApprovals}
            onChange={(v) => update('events', { loanApprovals: v })}
            label="Loan status changes"
            description="Approvals, rejections and overdue"
          />
          <Toggle
            checked={local.events.payments}
            onChange={(v) => update('events', { payments: v })}
            label="Payments"
            description="M-Pesa and manual payments"
          />
          <Toggle
            checked={local.events.unmatchedPayments}
            onChange={(v) => update('events', { unmatchedPayments: v })}
            label="Unmatched payments"
            description="Payments that need to be matched"
          />
          <Toggle
            checked={local.events.memberChanges}
            onChange={(v) => update('events', { memberChanges: v })}
            label="Member changes"
            description="New members, arrears and deactivations"
          />
          <Toggle
            checked={local.events.welfareClaims}
            onChange={(v) => update('events', { welfareClaims: v })}
            label="Welfare claims"
            description="New welfare fund requests"
          />
          <Toggle
            checked={local.events.system}
            onChange={(v) => update('events', { system: v })}
            label="System alerts"
            description="Platform updates and announcements"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Volume2 size={15} className="text-forest" />
          <h3 className="font-display text-[0.98rem] font-bold text-navy">
            Delivery
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle
            checked={local.delivery.inApp}
            onChange={(v) => update('delivery', { inApp: v })}
            label="In-app bell"
            description="Show alerts in the notification bell"
          />
          <Toggle
            checked={local.delivery.sound}
            onChange={(v) => update('delivery', { sound: v })}
            label="Sound"
            description="Play a soft chime on new alerts"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Clock size={15} className="text-forest" />
          <h3 className="font-display text-[0.98rem] font-bold text-navy">
            Quiet hours
          </h3>
        </div>
        <Toggle
          checked={local.quietHours.enabled}
          onChange={(v) => update('quietHours', { enabled: v })}
          label="Pause non-critical alerts"
          description="Alerts will resume automatically after quiet hours."
        />
        {local.quietHours.enabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="From">
              <input
                type="time"
                value={local.quietHours.from}
                onChange={(e) => update('quietHours', { from: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="To">
              <input
                type="time"
                value={local.quietHours.to}
                onChange={(e) => update('quietHours', { to: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <CheckCircle2 size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Changes take effect immediately — the bell updates without a page reload.
        </span>
      </div>
    </div>
  )
}

function ChamaTab() {
  const [chama, setChama] = useState(() => getChama() || {})
  const [dirty, setDirty] = useState(false)

  const update = (key, value) => {
    setChama((c) => ({ ...c, [key]: value }))
    setDirty(true)
  }

  const save = () => {
    if (!chama.name?.trim()) return toast.error('Chama name is required')
    saveChama(chama)
    setDirty(false)
    toast.success('Chama settings saved')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Chama details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Chama name">
            <input
              value={chama.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Chama code">
            <input
              value={chama.code || ''}
              onChange={(e) => update('code', e.target.value.toUpperCase())}
              className={`${inputCls} font-mono`}
            />
          </Field>
          <Field label="Location" icon={Globe}>
            <input
              value={chama.location || ''}
              onChange={(e) => update('location', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="M-Pesa paybill" icon={Smartphone}>
            <input
              value={chama.paybill || ''}
              onChange={(e) => update('paybill', e.target.value)}
              className={`${inputCls} font-mono`}
            />
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={save}
            disabled={!dirty}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${
              dirty ? 'bg-forest hover:bg-forest-dark' : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            <Save size={15} /> Save changes
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Palette size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Contribution rules
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <Field label="Monthly amount (KSh)">
            <input
              type="number"
              value={chama.amount ?? 5000}
              onChange={(e) => update('amount', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Due day">
            <input
              type="number"
              min={1}
              max={31}
              value={chama.due ?? 30}
              onChange={(e) => update('due', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
          <Field label="Grace period (days)">
            <input
              type="number"
              value={chama.grace ?? 3}
              onChange={(e) => update('grace', Number(e.target.value))}
              className={inputCls}
            />
          </Field>
        </div>
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Lock size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Password
          </h2>
        </div>
        <div className="space-y-2.5">
          <Field label="Current password" icon={KeyRound}>
            <input
              type="password"
              placeholder="••••••••"
              className={inputCls}
              disabled
            />
          </Field>
          <Field label="New password" icon={KeyRound}>
            <input
              type="password"
              placeholder="At least 8 characters"
              className={inputCls}
              disabled
            />
          </Field>
          <p className="text-[0.72rem] text-ink-soft">
            Password changes require a connected backend. This demo is read-only.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Access & security
          </h2>
        </div>
        <div className="space-y-2.5">
          <Toggle
            checked
            onChange={() => toast.info('Managed on the backend')}
            label="Two-factor authentication"
            description="Require a code on sign-in"
            disabled
          />
          <Toggle
            checked
            onChange={() => toast.info('Managed on the backend')}
            label="Session timeout (30 min)"
            description="Auto sign-out on inactivity"
            disabled
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <LogOut size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Recent activity
          </h2>
        </div>
        <ul className="space-y-2 text-[0.82rem]">
          <li className="flex items-center gap-2 text-ink-soft">
            <Check size={13} className="text-emerald" /> Signed in from this device · just now
          </li>
          <li className="flex items-center gap-2 text-ink-soft">
            <Check size={13} className="text-emerald" /> Profile updated · 3 days ago
          </li>
          <li className="flex items-center gap-2 text-ink-soft">
            <Check size={13} className="text-emerald" /> Session started · 5 days ago
          </li>
        </ul>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          For account recovery or unusual access, contact{' '}
          <b className="text-navy">support@chametu.co.ke</b> or raise a ticket from the Support page.
        </span>
      </div>
    </div>
  )
}