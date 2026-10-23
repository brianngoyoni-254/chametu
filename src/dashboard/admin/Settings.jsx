// src/dashboard/admin/Settings.jsx
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  User, Bell, Building2, ShieldCheck, Save, Loader2, Camera,
  Mail, Smartphone, Lock, Globe, Check, AlertCircle,
  BadgeCheck, Building, MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../context/AuthContext'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'

const TABS = [
  { key: 'profile',       label: 'My Profile',     icon: User },
  { key: 'chama',         label: 'Chama Settings', icon: Building2 },
  { key: 'security',      label: 'Security',       icon: ShieldCheck },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
]

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none transition focus:border-forest focus:ring-4 focus:ring-forest/10 disabled:bg-paper disabled:text-ink-soft'
const labelCls = 'mb-1.5 block text-[0.74rem] font-semibold uppercase tracking-wide text-ink-soft'

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || '').trim())
const isValidPhone = (v) => {
  const digits = (v || '').replace(/\s/g, '')
  return !digits || /^0[17]\d{8}$/.test(digits)
}

function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('tab') || 'profile')

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
          Manage your account, chama rules, and security.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr]">
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-white p-1.5 shadow-sm lg:flex-col lg:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[0.85rem] font-semibold transition ${
                tab === t.key
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-navy/70 hover:bg-paper'
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
          {tab === 'profile'       && <ProfileTab />}
          {tab === 'chama'         && <ChamaTab />}
          {tab === 'security'      && <SecurityTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </div>
  )
}

/* ==========================================================
   PROFILE TAB — fixed + redesigned
   ========================================================== */
function ProfileTab() {
  const { user, refreshProfile, updateUser } = useAuth()
  const { chama } = useChama()

  const [form, setForm] = useState({ name: '', phone: '' })
  const [initial, setInitial] = useState({ name: '', phone: '' })
  const [touched, setTouched] = useState({ name: false, phone: false })
  const [hydrating, setHydrating] = useState(true)
  const [saving, setSaving] = useState(false)

  // 1) Hydrate from whatever we already have in AuthContext — instant, no spinner trap
  useEffect(() => {
    if (!user) return
    const seed = { name: user.name || '', phone: user.phone || '' }
    setForm(seed)
    setInitial(seed)
    setHydrating(false)
  }, [user])

  // 2) Then, in the background, quietly refresh from the backend (best effort)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const fresh = await refreshProfile()
      if (cancelled || !fresh) return
      const seed = { name: fresh.name || '', phone: fresh.phone || '' }
      setForm(seed)
      setInitial(seed)
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dirty =
    form.name.trim() !== initial.name.trim() || form.phone.trim() !== initial.phone.trim()

  const errors = useMemo(() => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required.'
    else if (form.name.trim().length < 2) e.name = 'Use at least 2 characters.'
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Enter a valid Kenyan phone (07XX XXX XXX).'
    return e
  }, [form])

  const handleSave = async (e) => {
    e?.preventDefault()
    setTouched({ name: true, phone: true })
    if (Object.keys(errors).length) return

    setSaving(true)
    try {
      const payload = { name: form.name.trim(), phone: form.phone.trim() || null }
      await api('/api/auth/profile', {
        method: 'PUT',
        token: localStorage.getItem('auth_token'),
        body: payload,
      })
      setInitial({ name: form.name.trim(), phone: form.phone.trim() })
      updateUser(payload)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message || 'Could not update profile')
    } finally {
      setSaving(false)
    }
  }

  if (hydrating && !user) {
    return <ProfileSkeleton />
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
      {/* ---------- Main card ---------- */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {/* Gradient banner */}
        <div className="relative h-28 bg-gradient-to-br from-navy via-[#0A2A3E] to-forest">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(400px 200px at 100% 0%, rgba(16,185,129,0.6), transparent 60%), radial-gradient(300px 200px at 0% 100%, rgba(245,185,66,0.35), transparent 60%)',
            }}
          />
        </div>

        {/* Avatar + identity */}
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex items-end justify-between gap-4">
            <div className="relative">
              <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-forest to-emerald font-display text-2xl font-bold text-white shadow-lg ring-4 ring-white">
                {initials(form.name || user?.name)}
              </div>
              <button
                type="button"
                onClick={() => toast.info('Avatar upload coming soon')}
                className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-ink-soft shadow-sm transition hover:text-forest"
                aria-label="Change avatar"
              >
                <Camera size={14} />
              </button>
            </div>

            <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-forest ring-1 ring-emerald/20">
              <BadgeCheck size={12} /> {user?.role || 'Member'}
            </span>
          </div>

          <div className="mt-3">
            <h2 className="font-display text-lg font-bold text-navy">
              {form.name || 'Your name'}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
              <Mail size={12} /> {user?.email || '—'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                icon={<User size={15} />}
                error={touched.name && errors.name}
              >
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                  placeholder="e.g. Brian Ngoyoni"
                  className={inputCls}
                  autoComplete="name"
                />
              </Field>

              <Field
                label="Phone number"
                icon={<Smartphone size={15} />}
                error={touched.phone && errors.phone}
              >
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                  placeholder="07XX XXX XXX"
                  className={inputCls}
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Field>

              <Field
                label="Email address"
                icon={<Mail size={15} />}
                hint="Email is used to sign in and can't be changed here."
                className="sm:col-span-2"
              >
                <input
                  value={user?.email || ''}
                  disabled
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-[0.78rem] text-ink-soft">
                {dirty ? (
                  <span className="inline-flex items-center gap-1.5 text-[#8A6417]">
                    <AlertCircle size={13} /> Unsaved changes
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-ink-soft">
                    <Check size={13} className="text-forest" /> All changes saved
                  </span>
                )}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm(initial)
                    setTouched({ name: false, phone: false })
                  }}
                  disabled={!dirty || saving}
                  className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={!dirty || saving}
                  className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ---------- Side: account card ---------- */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h3 className="font-display text-sm font-bold text-navy">Account</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <InfoRow icon={<Mail size={13} />} label="Email" value={user?.email || '—'} />
            <InfoRow
              icon={<ShieldCheck size={13} />}
              label="Role"
              value={user?.role || '—'}
            />
            <InfoRow
              icon={<Building size={13} />}
              label="Chama"
              value={chama?.name || '—'}
            />
            <InfoRow
              icon={<MapPin size={13} />}
              label="Chama code"
              value={chama?.code || '—'}
              mono
            />
          </dl>
        </div>

        <div className="rounded-2xl border border-dashed border-line bg-paper/40 p-4 text-[0.78rem] leading-relaxed text-ink-soft">
          <p className="font-semibold text-navy">Need to change your email?</p>
          <p className="mt-1">
            Contact your chairman — email changes affect login and chama records.
          </p>
        </div>
      </aside>
    </div>
  )
}

/* ---------- small building blocks ---------- */

function Field({ label, icon, error, hint, className = '', children }) {
  return (
    <div className={className}>
      <label className={labelCls}>{label}</label>
      <div
        className={`group flex items-center gap-2.5 rounded-xl border ${
          error ? 'border-red-300 bg-red-50/30' : 'border-line bg-white'
        } px-3.5 transition focus-within:border-forest focus-within:ring-4 focus-within:ring-forest/10 has-[input:disabled]:bg-paper`}
      >
        {icon && <span className="shrink-0 text-ink-soft">{icon}</span>}
        <div className="flex-1 [&>input]:border-0 [&>input]:bg-transparent [&>input]:px-0 [&>input]:py-2.5 [&>input]:outline-none">
          {children}
        </div>
      </div>
      {error ? (
        <p className="mt-1.5 flex items-center gap-1 text-[0.74rem] font-medium text-red-600">
          <AlertCircle size={11} /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.74rem] text-ink-soft">{hint}</p>
      ) : null}
    </div>
  )
}

function InfoRow({ icon, label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-ink-soft">
        {icon}
        {label}
      </span>
      <span className={`text-right font-medium text-navy ${mono ? 'font-mono text-[0.82rem]' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="h-28 bg-line/60" />
        <div className="p-6">
          <div className="-mt-10 flex items-end justify-between">
            <div className="h-20 w-20 rounded-2xl bg-line/70 ring-4 ring-white" />
            <div className="h-6 w-24 rounded-full bg-line/60" />
          </div>
          <div className="mt-4 h-5 w-40 rounded bg-line/70" />
          <div className="mt-2 h-4 w-56 rounded bg-line/60" />
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="h-16 rounded-xl bg-line/50" />
            <div className="h-16 rounded-xl bg-line/50" />
            <div className="h-16 rounded-xl bg-line/50 sm:col-span-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ==========================================================
   CHAMA TAB (unchanged behaviour, minor polish)
   ========================================================== */
function ChamaTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api('/api/settings/', {
          token: localStorage.getItem('auth_token'),
        })
        setData(res)
      } catch {
        toast.error('Failed to load chama settings')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api('/api/settings/', {
        method: 'PUT',
        token: localStorage.getItem('auth_token'),
        body: {
          name: data.chama.name,
          location: data.chama.location,
          platformName: data.settings.platformName,
          supportEmail: data.settings.supportEmail,
          timezone: data.settings.timezone,
          gracePeriod: data.settings.gracePeriod,
          autoBlockDays: data.settings.autoBlockDays,
          paybill: data.settings.paybill,
          accountRef: data.settings.accountRef,
        },
      })
      toast.success('Chama settings saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !data)
    return <div className="p-8 text-center text-ink-soft">Loading chama settings…</div>

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Building2 size={18} className="text-forest" />
          <h2 className="font-display text-lg font-bold text-navy">Chama Details</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelCls}>Chama Name</span>
            <input
              value={data.chama.name}
              onChange={(e) =>
                setData({ ...data, chama: { ...data.chama, name: e.target.value } })
              }
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Location</span>
            <input
              value={data.chama.location || ''}
              onChange={(e) =>
                setData({ ...data, chama: { ...data.chama, location: e.target.value } })
              }
              className={inputCls}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Globe size={18} className="text-forest" />
          <h2 className="font-display text-lg font-bold text-navy">Workspace &amp; Contact</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelCls}>Platform Name</span>
            <input
              value={data.settings.platformName}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, platformName: e.target.value } })
              }
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Support Email</span>
            <input
              value={data.settings.supportEmail}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, supportEmail: e.target.value } })
              }
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Timezone</span>
            <select
              value={data.settings.timezone}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, timezone: e.target.value } })
              }
              className={inputCls}
            >
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <ShieldCheck size={18} className="text-forest" />
          <h2 className="font-display text-lg font-bold text-navy">Enforcement Rules</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelCls}>Grace Period (Days)</span>
            <input
              type="number"
              value={data.settings.gracePeriod}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, gracePeriod: e.target.value } })
              }
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Auto-block after (Days Overdue)</span>
            <input
              type="number"
              value={data.settings.autoBlockDays}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, autoBlockDays: e.target.value } })
              }
              className={inputCls}
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Smartphone size={18} className="text-forest" />
          <h2 className="font-display text-lg font-bold text-navy">M-Pesa Collection</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className={labelCls}>Paybill / Till Number</span>
            <input
              value={data.settings.paybill}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, paybill: e.target.value } })
              }
              className={inputCls}
            />
          </label>
          <label>
            <span className={labelCls}>Account Reference</span>
            <input
              value={data.settings.accountRef}
              onChange={(e) =>
                setData({ ...data, settings: { ...data.settings, accountRef: e.target.value } })
              }
              className={inputCls}
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-dark disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Chama Settings'}
        </button>
      </div>
    </form>
  )
}

/* ==========================================================
   SECURITY TAB (unchanged)
   ========================================================== */
function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      return toast.error('New passwords do not match')
    }
    if (form.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }

    setSaving(true)
    try {
      await api('/api/auth/password', {
        method: 'PUT',
        token: localStorage.getItem('auth_token'),
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      })
      toast.success('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Lock size={18} className="text-forest" />
        <h2 className="font-display text-lg font-bold text-navy">Change Password</h2>
      </div>

      <form onSubmit={handleSave} className="max-w-md space-y-4">
        <label className="block">
          <span className={labelCls}>Current Password</span>
          <input
            type="password"
            required
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>New Password</span>
          <input
            type="password"
            required
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className={labelCls}>Confirm New Password</span>
          <input
            type="password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className={inputCls}
          />
        </label>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-forest px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-dark disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            {saving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ==========================================================
   NOTIFICATIONS TAB (unchanged)
   ========================================================== */
function NotificationsTab() {
  const [enabled, setEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <Bell size={18} className="text-forest" />
        <h2 className="font-display text-lg font-bold text-navy">Notification Preferences</h2>
      </div>

      <div className="space-y-4">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line p-4 transition hover:bg-paper/50">
          <div>
            <div className="text-sm font-semibold text-navy">In-App Notifications</div>
            <div className="text-xs text-ink-soft">Show alerts in the notification bell.</div>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 accent-forest focus:ring-forest"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line p-4 transition hover:bg-paper/50">
          <div>
            <div className="text-sm font-semibold text-navy">Email Digests</div>
            <div className="text-xs text-ink-soft">Receive weekly summary emails.</div>
          </div>
          <input
            type="checkbox"
            checked={emailEnabled}
            onChange={(e) => setEmailEnabled(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 accent-forest focus:ring-forest"
          />
        </label>
      </div>
    </div>
  )
}