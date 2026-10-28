import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Save, CreditCard, Smartphone, ShieldAlert, Building2, Percent,
  Clock, AlertTriangle, Bell, Lock, Globe, Mail, MessageSquare,
  Check, BellOff, ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { useNotifications, DEFAULT_PREFS } from './useNotifications'
import { api } from '../lib/api'

const DEFAULT_SETTINGS = {
  prices: { Starter: 500, Growth: 1000, Business: 2000, Gold: 3000 },
  paybill: '400200',
  accountRef: 'CHAMETU',
  gracePeriod: 7,
  autoBlockDays: 14,
  platformName: 'Chametu',
  supportEmail: 'support@chametu.co.ke',
  timezone: 'Africa/Nairobi',
}

const TABS = [
  { key: 'general', label: 'General', icon: Globe },
  { key: 'pricing', label: 'Pricing', icon: Percent },
  { key: 'payments', label: 'Payments', icon: CreditCard },
  { key: 'enforcement', label: 'Enforcement', icon: ShieldAlert },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'security', label: 'Security', icon: Lock },
]

const TIER_META = { Starter: 'bg-gray-400', Growth: 'bg-emerald', Business: 'bg-blue-500', Gold: 'bg-gold' }
const inputCls = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-navy outline-none transition focus:border-forest focus:ring-4 focus:ring-forest/10 dark:border-white/10 dark:bg-white/5 dark:text-white'

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-2 rounded-xl border border-line p-2.5 transition hover:border-forest/40 dark:border-white/10 sm:gap-3 sm:p-3.5">
      <div className="min-w-0">
        <p className="text-[0.8rem] font-semibold text-navy dark:text-white sm:text-[0.85rem]">{label}</p>
        {description && <p className="mt-0.5 text-[0.7rem] text-ink-soft sm:text-[0.73rem]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-forest dark:bg-emerald' : 'bg-line dark:bg-white/20'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  )
}

export default function SuperAdminSettings() {
  const [params, setParams] = useSearchParams()
  const initialTab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'general'
  const [tab, setTab] = useState(initialTab)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [dirty, setDirty] = useState(false)
  const [loading, setLoading] = useState(true)

  const { prefs, savePrefs } = useNotifications()
  const [localPrefs, setLocalPrefs] = useState(prefs)
  const [prefsDirty, setPrefsDirty] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('superadmin_token')
        const data = await api('/api/superadmin/settings', { token })
        setSettings(data)
      } catch (err) {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

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

  const update = (patch) => { setSettings((s) => ({ ...s, ...patch })); setDirty(true) }
  const updatePrice = (tier, v) => { update({ prices: { ...settings.prices, [tier]: Number(v) } }) }
  const updatePref = (path, value) => {
    setLocalPrefs((p) => ({ ...p, [path]: { ...p[path], ...value } }))
    setPrefsDirty(true)
  }

  const handleSave = async () => {
    for (const [tier, price] of Object.entries(settings.prices)) {
      if (!(price > 0)) return toast.error(`Invalid price for ${tier}`)
    }
    if (!(settings.gracePeriod >= 0)) return toast.error('Grace period must be ≥ 0')
    if (!(settings.autoBlockDays > 0)) return toast.error('Auto-block days must be > 0')
    
    try {
      const token = localStorage.getItem('superadmin_token')
      await api('/api/superadmin/settings', {
        method: 'PUT',
        token,
        body: settings
      })
      setDirty(false)
      toast.success('Settings saved', { description: 'Platform configuration updated.' })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleSavePrefs = () => {
    savePrefs(localPrefs)
    setPrefsDirty(false)
    toast.success('Notification preferences saved', { description: 'Navbar alerts will follow these rules.' })
  }

  const handleResetAll = () => {
    setSettings(DEFAULT_SETTINGS); setDirty(true)
    setLocalPrefs(DEFAULT_PREFS); savePrefs(DEFAULT_PREFS); setPrefsDirty(false)
    toast.info('Settings reset to defaults (click Save to persist)')
  }

  const Field = ({ label, icon: Icon, hint, children }) => (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[0.72rem] font-semibold text-navy dark:text-white sm:text-[0.75rem]">
        {Icon && <Icon size={12} className="text-ink-soft" />} {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[0.66rem] text-ink-soft sm:text-[0.68rem]">{hint}</span>}
    </label>
  )

  if (loading) {
    return <div className="p-8 text-center text-ink-soft">Loading settings...</div>
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">Platform settings</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">Configuration for pricing, payments, enforcement & notifications</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button onClick={handleResetAll} className="flex items-center justify-center rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
            Reset all
          </button>
          {tab === 'notifications' ? (
            <button onClick={handleSavePrefs} disabled={!prefsDirty} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${prefsDirty ? 'bg-forest hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]' : 'cursor-not-allowed bg-forest/40 dark:bg-emerald/40'}`}>
              <Save size={15} /> Save preferences
            </button>
          ) : (
            <button onClick={handleSave} disabled={!dirty} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${dirty ? 'bg-forest hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]' : 'cursor-not-allowed bg-forest/40 dark:bg-emerald/40'}`}>
              <Save size={15} /> Save settings
            </button>
          )}
        </div>
      </div>

      {dirty && tab !== 'notifications' && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[0.78rem] font-semibold text-amber-700 dark:text-amber-400 sm:px-4 sm:py-3 sm:text-[0.82rem]">
          <AlertTriangle size={14} /> Unsaved changes on this tab.
        </div>
      )}
      {prefsDirty && tab === 'notifications' && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-[0.78rem] font-semibold text-amber-700 dark:text-amber-400 sm:px-4 sm:py-3 sm:text-[0.82rem]">
          <AlertTriangle size={14} /> You have unsaved notification preferences.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[240px_1fr]">
        <nav className="-mx-1 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-card p-1.5 shadow-sm dark:border-white/10 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[0.78rem] font-semibold transition sm:gap-2.5 sm:px-3 sm:py-2.5 sm:text-[0.82rem] ${active ? 'bg-navy text-white shadow-sm dark:bg-emerald dark:text-[#06331F]' : 'text-navy/70 hover:bg-paper hover:text-navy dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white'}`}
              >
                <Icon size={14} className="shrink-0 sm:size-[15px]" /> {t.label}
              </button>
            )
          })}
        </nav>

        <div className="space-y-4 sm:space-y-5">
          {tab === 'general' && (
            <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <Globe size={15} className="text-forest dark:text-emerald" />
                <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Workspace</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Field label="Platform name" icon={Building2}>
                  <input value={settings.platformName} onChange={(e) => update({ platformName: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Support email" icon={Mail}>
                  <input type="email" value={settings.supportEmail} onChange={(e) => update({ supportEmail: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Default timezone" icon={Clock}>
                  <select value={settings.timezone} onChange={(e) => update({ timezone: e.target.value })} className={inputCls}>
                    <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {tab === 'pricing' && (
            <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <Percent size={15} className="text-forest dark:text-emerald" />
                <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Tier pricing</h2>
                <span className="ml-auto text-[0.7rem] text-ink-soft sm:text-[0.72rem]">KSh / month</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                {Object.entries(settings.prices).map(([tier, price]) => (
                  <div key={tier} className="rounded-xl border border-line p-3 dark:border-white/10">
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${TIER_META[tier]}`} />
                      <span className="text-[0.75rem] font-bold text-navy dark:text-white">{tier}</span>
                    </div>
                    <input type="number" min="1" value={price} onChange={(e) => updatePrice(tier, e.target.value)} className={`${inputCls} font-mono`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <Smartphone size={15} className="text-forest dark:text-emerald" />
                <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">M-Pesa collection</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Field label="Paybill / Till number" icon={CreditCard}>
                  <input value={settings.paybill} onChange={(e) => update({ paybill: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Account reference" icon={Building2}>
                  <input value={settings.accountRef} onChange={(e) => update({ accountRef: e.target.value })} className={inputCls} />
                </Field>
              </div>
              <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[0.7rem] leading-relaxed text-amber-700 dark:text-amber-400 sm:mt-4 sm:text-[0.72rem]">
                🔒 Daraja consumer key/secret and passkey belong in your backend environment — never expose them in this page.
              </p>
            </div>
          )}

          {tab === 'enforcement' && (
            <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <ShieldAlert size={15} className="text-forest dark:text-emerald" />
                <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Enforcement rules</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Field label="Grace period (days)" icon={Clock} hint="Days before an overdue chama is flagged.">
                  <input type="number" min="0" value={settings.gracePeriod} onChange={(e) => update({ gracePeriod: Number(e.target.value) })} className={inputCls} />
                </Field>
                <Field label="Auto-block after (days overdue)" icon={ShieldAlert} hint="Threshold for bulk-blocking chamas.">
                  <input type="number" min="1" value={settings.autoBlockDays} onChange={(e) => update({ autoBlockDays: Number(e.target.value) })} className={inputCls} />
                </Field>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <Bell size={15} className="text-forest dark:text-emerald" />
                  <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Events to notify me about</h2>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                  <Toggle checked={localPrefs.events.payments} onChange={(v) => updatePref('events', { payments: v })} label="Payments received" description="M-Pesa, bank and cash settlements" />
                  <Toggle checked={localPrefs.events.chamaChanges} onChange={(v) => updatePref('events', { chamaChanges: v })} label="Chama changes" description="Blocks, deactivations & reactivations" />
                  <Toggle checked={localPrefs.events.enforcement} onChange={(v) => updatePref('events', { enforcement: v })} label="Enforcement actions" description="Bulk block & auto-block events" />
                  <Toggle checked={localPrefs.events.newRegistration} onChange={(v) => updatePref('events', { newRegistration: v })} label="New registrations" description="Chamas joining the platform" />
                  <Toggle checked={localPrefs.events.auditAlerts} onChange={(v) => updatePref('events', { auditAlerts: v })} label="Audit alerts" description="Critical or unusual activity" />
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <CreditCard size={15} className="text-forest dark:text-emerald" />
                  <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Payment channels</h2>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  <Toggle checked={localPrefs.channels.mpesa} onChange={(v) => updatePref('channels', { mpesa: v })} label="M-Pesa" />
                  <Toggle checked={localPrefs.channels.bank} onChange={(v) => updatePref('channels', { bank: v })} label="Bank" />
                  <Toggle checked={localPrefs.channels.cash} onChange={(v) => updatePref('channels', { cash: v })} label="Cash" />
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <MessageSquare size={15} className="text-forest dark:text-emerald" />
                  <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Delivery</h2>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                  <Toggle checked={localPrefs.delivery.inApp} onChange={(v) => updatePref('delivery', { inApp: v })} label="In-app" description="Navbar bell" />
                  <Toggle checked={localPrefs.delivery.email} onChange={(v) => updatePref('delivery', { email: v })} label="Email digest" description="Daily summary" />
                  <Toggle checked={localPrefs.delivery.sms} onChange={(v) => updatePref('delivery', { sms: v })} label="SMS alerts" description="Critical only" />
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <BellOff size={15} className="text-forest dark:text-emerald" />
                  <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Quiet hours</h2>
                </div>
                <Toggle checked={localPrefs.quietHours.enabled} onChange={(v) => updatePref('quietHours', { enabled: v })} label="Pause alerts during quiet hours" description="Non-critical notifications will be held." />
                {localPrefs.quietHours.enabled && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                    <Field label="From"><input type="time" value={localPrefs.quietHours.from} onChange={(e) => updatePref('quietHours', { from: e.target.value })} className={inputCls} /></Field>
                    <Field label="To"><input type="time" value={localPrefs.quietHours.to} onChange={(e) => updatePref('quietHours', { to: e.target.value })} className={inputCls} /></Field>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-4 sm:space-y-5">
              <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
                <div className="mb-3 flex items-center gap-2 sm:mb-4">
                  <ShieldCheck size={15} className="text-forest dark:text-emerald" />
                  <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Access & security</h2>
                </div>
                <div className="space-y-2.5 sm:space-y-3">
                  <Toggle checked={true} onChange={() => toast.info('Managed on the backend')} label="Enforce 2FA on sign-in" description="Required for all superadmin accounts" />
                  <Toggle checked={true} onChange={() => toast.info('Managed on the backend')} label="Session timeout (30 min)" description="Auto sign-out on inactivity" />
                  <Toggle checked={false} onChange={() => toast.info('Managed on the backend')} label="IP allow-list" description="Restrict access to trusted IPs" />
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-card p-4 shadow-sm dark:border-white/10 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Lock size={15} className="text-forest dark:text-emerald" />
                  <h2 className="font-display text-[0.98rem] font-bold text-navy dark:text-white sm:text-[1.02rem]">Recent security events</h2>
                </div>
                <ul className="space-y-2 text-[0.78rem] sm:text-[0.82rem]">
                  <li className="flex items-center gap-2 text-ink-soft"><Check size={13} className="text-emerald" /> Password changed · 2 days ago</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Check size={13} className="text-emerald" /> New device trusted · 5 days ago</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}