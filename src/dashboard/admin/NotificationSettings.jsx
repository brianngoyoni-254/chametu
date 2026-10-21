import { useState } from 'react'
import { Bell, Save, CheckCircle2, AlertTriangle, Volume2, Clock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminNotifications, DEFAULT_ADMIN_PREFS } from '../../lib/adminNotifications'

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-line bg-white p-3.5 transition hover:border-forest/40">
      <div className="min-w-0">
        <p className="text-[0.85rem] font-semibold text-navy">{label}</p>
        {description && <p className="mt-0.5 text-[0.73rem] text-ink-soft">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-forest' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export default function NotificationSettings() {
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
    toast.success('Notification preferences saved')
  }

  const reset = () => {
    setLocal(DEFAULT_ADMIN_PREFS)
    savePrefs(DEFAULT_ADMIN_PREFS)
    setDirty(false)
    toast.info('Reset to defaults')
  }

  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Notification settings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Control what shows in the bell and when.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy">
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${
              dirty ? 'bg-forest hover:bg-forest-dark' : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            <Save size={15} /> Save
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
          <h2 className="font-display text-[1.02rem] font-bold text-navy">Events to notify me about</h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle checked={local.events.loanApplications} onChange={(v) => update('events', { loanApplications: v })} label="Loan applications" description="Members applying for loans" />
          <Toggle checked={local.events.loanApprovals} onChange={(v) => update('events', { loanApprovals: v })} label="Loan status changes" description="Approvals, rejections and overdue" />
          <Toggle checked={local.events.payments} onChange={(v) => update('events', { payments: v })} label="Payments" description="M-Pesa and manual payments" />
          <Toggle checked={local.events.unmatchedPayments} onChange={(v) => update('events', { unmatchedPayments: v })} label="Unmatched payments" description="Payments that need to be matched" />
          <Toggle checked={local.events.memberChanges} onChange={(v) => update('events', { memberChanges: v })} label="Member changes" description="New members, arrears and deactivations" />
          <Toggle checked={local.events.welfareClaims} onChange={(v) => update('events', { welfareClaims: v })} label="Welfare claims" description="New welfare fund requests" />
          <Toggle checked={local.events.system} onChange={(v) => update('events', { system: v })} label="System alerts" description="Platform updates and announcements" />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Volume2 size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">Delivery</h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Toggle checked={local.delivery.inApp} onChange={(v) => update('delivery', { inApp: v })} label="In-app bell" description="Show alerts in the notification bell" />
          <Toggle checked={local.delivery.sound} onChange={(v) => update('delivery', { sound: v })} label="Sound" description="Play a soft chime on new alerts" />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Clock size={15} className="text-forest" />
          <h2 className="font-display text-[1.02rem] font-bold text-navy">Quiet hours</h2>
        </div>
        <Toggle
          checked={local.quietHours.enabled}
          onChange={(v) => update('quietHours', { enabled: v })}
          label="Pause non-critical alerts"
          description="Alerts will resume automatically after quiet hours."
        />
        {local.quietHours.enabled && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">From</span>
              <input type="time" value={local.quietHours.from} onChange={(e) => update('quietHours', { from: e.target.value })} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-navy">To</span>
              <input type="time" value={local.quietHours.to} onChange={(e) => update('quietHours', { to: e.target.value })} className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-forest" />
            </label>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <CheckCircle2 size={15} className="shrink-0 text-forest" />
        Changes take effect immediately — the bell updates without a page reload.
      </div>
    </div>
  )
}