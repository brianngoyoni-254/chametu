// src/dashboard/admin/NotificationSettings.jsx
import { useEffect, useState } from 'react'
import {
  Bell, Save, CheckCircle2, AlertTriangle, Volume2, Clock, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useNotifications,
  DEFAULT_NOTIFICATION_PREFS,
} from '../../lib/notifications'

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-line bg-white p-3.5 transition hover:border-forest/40">
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
        onClick={() => onChange(!checked)}
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

export default function NotificationSettings() {
  const { prefs: savedPrefs, loading, savePrefs } = useNotifications()

  const [local, setLocal] = useState(savedPrefs)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!dirty && savedPrefs) setLocal(savedPrefs)
  }, [savedPrefs, dirty])

  const update = (section, value) => {
    setLocal((p) => ({
      ...p,
      [section]: { ...(p?.[section] || {}), ...value },
    }))
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    const res = await savePrefs(local)
    setSaving(false)
    if (!res.ok) return toast.error(res.message)
    setDirty(false)
    toast.success('Notification preferences saved')
  }

  const reset = async () => {
    setSaving(true)
    const res = await savePrefs(DEFAULT_NOTIFICATION_PREFS)
    setSaving(false)
    if (!res.ok) return toast.error(res.message)
    setLocal(DEFAULT_NOTIFICATION_PREFS)
    setDirty(false)
    toast.info('Reset to defaults')
  }

  if (loading && !local) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={26} className="animate-spin text-forest" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">
            Notification settings
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Control what shows in the bell and when.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reset}
            disabled={saving}
            className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy disabled:opacity-50"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
              dirty && !saving
                ? 'bg-forest hover:bg-forest-dark'
                : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Save size={15} />
            )}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {dirty && (
        <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-[0.82rem] font-semibold text-[#8A6417]">
          <AlertTriangle size={15} /> You have unsaved changes.
        </div>
      )}

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Bell size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Events to notify me about
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle
            checked={local?.events?.loanApplications ?? true}
            onChange={(v) => update('events', { loanApplications: v })}
            label="Loan applications"
            description="Members applying for loans"
          />
          <Toggle
            checked={local?.events?.loanApprovals ?? true}
            onChange={(v) => update('events', { loanApprovals: v })}
            label="Loan status changes"
            description="Approvals, rejections and overdue"
          />
          <Toggle
            checked={local?.events?.payments ?? true}
            onChange={(v) => update('events', { payments: v })}
            label="Payments"
            description="M-Pesa and manual payments"
          />
          <Toggle
            checked={local?.events?.unmatchedPayments ?? true}
            onChange={(v) => update('events', { unmatchedPayments: v })}
            label="Unmatched payments"
            description="Payments that need to be matched"
          />
          <Toggle
            checked={local?.events?.memberChanges ?? true}
            onChange={(v) => update('events', { memberChanges: v })}
            label="Member changes"
            description="New members, arrears and deactivations"
          />
          <Toggle
            checked={local?.events?.welfareClaims ?? true}
            onChange={(v) => update('events', { welfareClaims: v })}
            label="Welfare claims"
            description="New welfare fund requests"
          />
          <Toggle
            checked={local?.events?.system ?? true}
            onChange={(v) => update('events', { system: v })}
            label="System alerts"
            description="Platform updates and announcements"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Volume2 size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Delivery
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle
            checked={local?.delivery?.inApp ?? true}
            onChange={(v) => update('delivery', { inApp: v })}
            label="In-app bell"
            description="Show alerts in the notification bell"
          />
          <Toggle
            checked={local?.delivery?.sound ?? false}
            onChange={(v) => update('delivery', { sound: v })}
            label="Sound"
            description="Play a soft chime on new alerts"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">
            Quiet hours
          </h2>
        </div>
        <Toggle
          checked={local?.quietHours?.enabled ?? false}
          onChange={(v) => update('quietHours', { enabled: v })}
          label="Pause non-critical alerts"
          description="Alerts will resume automatically after quiet hours."
        />
        {local?.quietHours?.enabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">
                From
              </span>
              <input
                type="time"
                value={local.quietHours.from || '22:00'}
                onChange={(e) => update('quietHours', { from: e.target.value })}
                className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">
                To
              </span>
              <input
                type="time"
                value={local.quietHours.to || '07:00'}
                onChange={(e) => update('quietHours', { to: e.target.value })}
                className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest"
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <CheckCircle2 size={15} className="shrink-0 text-forest" />
        Changes are saved to your account and follow you across devices.
      </div>
    </div>
  )
}