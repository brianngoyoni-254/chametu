import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Bell, Search, ChevronDown, Settings, LogOut, User, ShieldCheck,
  Command, X, CheckCheck, Trash2, AlertTriangle, Info, CheckCircle2, Menu
} from 'lucide-react'
import { toast } from 'sonner'
import ThemeToggle from '../components/ThemeToggle'
import { useNotifications } from './useNotifications'

const PAGE_TITLES = {
  '/superadmin': { title: 'Overview', sub: 'Platform health & activity' },
  '/superadmin/chamas': { title: 'All chamas', sub: 'Manage every group on the platform' },
  '/superadmin/billing': { title: 'Billing & tiers', sub: 'Invoices, reminders & enforcement' },
  '/superadmin/payments': { title: 'Payments', sub: 'M-Pesa · bank · cash ledger' },
  '/superadmin/support': { title: 'Support tickets', sub: 'Requester conversations & SLAs' },
  '/superadmin/audit': { title: 'Audit log', sub: 'Every action, traceable' },
  '/superadmin/settings': { title: 'Settings', sub: 'Pricing, enforcement & notifications' },
}

const TONE = {
  critical: { cls: 'bg-red-500/15 text-red-600 dark:text-red-400', Icon: AlertTriangle },
  warning: { cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400', Icon: AlertTriangle },
  success: { cls: 'bg-emerald/15 text-emerald-600 dark:text-emerald-400', Icon: CheckCircle2 },
  info: { cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400', Icon: Info },
}

const ago = (iso) => {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff} min ago`
  if (diff < 1440) return `${Math.round(diff / 60)} h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function SuperAdminNavbar({ onMenuClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const { items, unread, markAllRead, markRead, clearAll } = useNotifications()

  const session = (() => { try { return JSON.parse(localStorage.getItem('superadmin_session')) } catch { return null } })()
  const initials = session?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'SA'
  const page = PAGE_TITLES[location.pathname] || { title: 'Superadmin', sub: '' }

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 40)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setNotifOpen(false); setProfileOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('superadmin_session')
    toast.success('Signed out')
    navigate('/superadmin/login')
  }

  const runSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearchOpen(false)
    navigate(`/superadmin/chamas?q=${encodeURIComponent(query.trim())}`)
    setQuery('')
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2
                   border-b border-line/60 bg-white/85 backdrop-blur-xl
                   supports-[backdrop-filter]:bg-white/70
                   dark:border-white/10 dark:bg-[#0B1B2B]/85 dark:supports-[backdrop-filter]:bg-[#0B1B2B]/65
                   sm:h-16 sm:gap-4 sm:px-5 lg:px-8 px-3"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            onClick={onMenuClick}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy text-white transition hover:bg-navy/90 dark:bg-emerald dark:text-[#06331F] lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="hidden h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-forest to-emerald text-white shadow-sm sm:grid lg:hidden xl:grid">
            <ShieldCheck size={15} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate font-display text-[0.9rem] font-bold leading-tight text-navy dark:text-white sm:text-[0.95rem]">
              {page.title}
            </h2>
            <p className="hidden truncate text-[0.72rem] text-ink-soft sm:block">{page.sub}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 40) }}
            className="group flex h-9 items-center gap-2 rounded-xl border border-line/70 bg-white/70 px-2.5 text-[0.78rem] text-ink-soft transition hover:border-forest/40 hover:text-navy dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white lg:px-3"
            aria-label="Search platform"
          >
            <Search size={14} />
            <span className="hidden lg:inline">Search…</span>
            <kbd className="hidden items-center gap-0.5 rounded-md border border-line/70 bg-paper px-1.5 py-0.5 font-mono text-[0.6rem] text-ink-soft dark:border-white/10 dark:bg-white/10 dark:text-white/60 lg:inline-flex">
              <Command size={9} />K
            </kbd>
          </button>

          <div className="grid h-9 w-9 place-items-center rounded-xl border border-line/70 bg-white/70 transition hover:border-forest/40 dark:border-white/10 dark:bg-white/5">
            <ThemeToggle />
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false) }}
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-line/70 bg-white/70 text-navy transition hover:border-forest/40 dark:border-white/10 dark:bg-white/5 dark:text-white"
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.58rem] font-bold text-white ring-2 ring-white dark:ring-[#0B1B2B]">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1rem)] max-w-[380px] origin-top-right overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 dark:border-white/10">
                <div className="flex items-center justify-between border-b border-line px-3 py-2.5 dark:border-white/10 sm:px-4 sm:py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-[0.88rem] font-bold text-navy dark:text-white sm:text-[0.9rem]">Notifications</h3>
                    {unread > 0 && <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[0.63rem] font-bold text-red-600 dark:text-red-400">{unread} new</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-semibold text-forest transition hover:bg-forest/10 dark:text-emerald">
                        <CheckCheck size={11} /> Read
                      </button>
                    )}
                    {items.length > 0 && (
                      <button onClick={clearAll} className="rounded-lg p-1.5 text-ink-soft transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400" aria-label="Clear all">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto sm:max-h-[380px]">
                  {items.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <CheckCircle2 size={26} className="mx-auto mb-2 text-emerald opacity-60" />
                      <p className="text-[0.85rem] font-semibold text-navy dark:text-white">You're all caught up</p>
                      <p className="mt-0.5 text-[0.72rem] text-ink-soft">New alerts will appear here.</p>
                    </div>
                  ) : items.map((n) => {
                    const { cls, Icon } = TONE[n.type] || TONE.info
                    return (
                      <button
                        key={n.id}
                        onClick={() => { markRead(n.id); setNotifOpen(false) }}
                        className={`group flex w-full items-start gap-3 border-b border-line/60 px-3 py-2.5 text-left transition last:border-0 dark:border-white/5 sm:px-4 sm:py-3 ${n.read ? 'hover:bg-paper/60 dark:hover:bg-white/5' : 'bg-emerald/[0.03] hover:bg-emerald/[0.06] dark:bg-emerald/5'}`}
                      >
                        <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg sm:h-8 sm:w-8 ${cls}`}><Icon size={12} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-[0.8rem] font-semibold text-navy dark:text-white sm:text-[0.82rem]">{n.title}</p>
                            {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[0.72rem] text-ink-soft sm:text-[0.73rem]">{n.desc}</p>
                          <p className="mt-0.5 text-[0.64rem] text-ink-soft/70 sm:text-[0.66rem]">{ago(n.time)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="border-t border-line bg-paper/50 px-3 py-2 dark:border-white/10 dark:bg-white/5 sm:px-4 sm:py-2.5">
                  <button
                    onClick={() => { setNotifOpen(false); navigate('/superadmin/settings?tab=notifications') }}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.73rem] font-semibold text-navy transition hover:bg-white dark:text-white dark:hover:bg-white/10 sm:text-[0.75rem]"
                  >
                    <Settings size={12} /> Notification settings
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false) }}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-line/70 bg-white/70 pl-1 pr-1.5 transition hover:border-forest/40 dark:border-white/10 dark:bg-white/5 sm:pr-2"
              aria-label="Account menu"
              aria-expanded={profileOpen}
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-navy to-[#0B6B45] text-[0.66rem] font-bold text-white sm:text-[0.68rem]">{initials}</span>
              <ChevronDown size={12} className={`hidden text-ink-soft transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1rem)] max-w-[260px] origin-top-right overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 dark:border-white/10">
                <div className="border-b border-line px-4 py-3 dark:border-white/10">
                  <p className="truncate text-[0.85rem] font-bold text-navy dark:text-white">{session?.name || 'Super Admin'}</p>
                  <p className="truncate text-[0.72rem] text-ink-soft">{session?.email || 'admin@chametu.co.ke'}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-forest dark:text-emerald">
                    <ShieldCheck size={9} /> Full access
                  </span>
                </div>
                <div className="p-1.5">
                  <button onClick={() => { setProfileOpen(false); navigate('/superadmin/settings') }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8rem] font-medium text-navy transition hover:bg-paper dark:text-white dark:hover:bg-white/5">
                    <Settings size={14} className="text-ink-soft" /> Platform settings
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate('/superadmin/audit') }} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8rem] font-medium text-navy transition hover:bg-paper dark:text-white dark:hover:bg-white/5">
                    <User size={14} className="text-ink-soft" /> My activity
                  </button>
                  <div className="my-1 h-px bg-line dark:bg-white/10" />
                  <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[0.8rem] font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-3 pt-[10vh] backdrop-blur-sm sm:p-4 sm:pt-[12vh]" onClick={() => setSearchOpen(false)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={runSearch} className="flex items-center gap-2 border-b border-line px-3 dark:border-white/10 sm:gap-3 sm:px-4">
              <Search size={16} className="shrink-0 text-ink-soft sm:size-[18px]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chamas, billing, activity…"
                className="flex-1 border-0 bg-transparent py-3.5 text-[0.88rem] text-navy outline-none placeholder:text-ink-soft/60 dark:text-white sm:py-4 sm:text-[0.92rem]"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="rounded-lg p-1 text-ink-soft hover:bg-paper dark:hover:bg-white/10">
                <X size={16} />
              </button>
            </form>
            <div className="p-2">
              {[
                { label: 'All chamas', hint: 'Search groups', to: '/superadmin/chamas' },
                { label: 'Billing & tiers', hint: 'Invoices', to: '/superadmin/billing' },
                { label: 'Payments', hint: 'M-Pesa, bank & cash', to: '/superadmin/payments' },
                { label: 'Support tickets', hint: 'Conversations & SLAs', to: '/superadmin/support' },
                { label: 'Audit log', hint: 'Recent actions', to: '/superadmin/audit' },
                { label: 'Notification settings', hint: 'Alerts', to: '/superadmin/settings?tab=notifications' },
              ].map((s) => (
                <button key={s.to} type="button" onClick={() => { setSearchOpen(false); navigate(s.to) }} className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left transition hover:bg-paper dark:hover:bg-white/5">
                  <span className="truncate text-[0.85rem] font-medium text-navy dark:text-white">{s.label}</span>
                  <span className="hidden shrink-0 text-[0.7rem] text-ink-soft sm:inline">{s.hint}</span>
                </button>
              ))}
            </div>
            <div className="hidden items-center justify-between border-t border-line px-4 py-2 text-[0.66rem] text-ink-soft dark:border-white/10 sm:flex">
              <span>Press <kbd className="rounded border border-line px-1 font-mono dark:border-white/20">Enter</kbd> to search</span>
              <span><kbd className="rounded border border-line px-1 font-mono dark:border-white/20">Esc</kbd> to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}