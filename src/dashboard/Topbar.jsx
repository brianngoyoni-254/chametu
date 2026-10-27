// src/dashboard/Topbar.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, Sun, Moon, CheckCheck, Trash2, X,
  AlertTriangle, Info, CheckCircle2, Settings, ArrowRight,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useChama } from '../context/ChamaContext'
import { useNotifications } from '../lib/notifications'

const TITLES = {
  '/dashboard':                        'Dashboard',
  '/dashboard/invite':                 'Invite Members',
  '/dashboard/chama':                  'My Chama',
  '/dashboard/support':                'Support',
  '/dashboard/settings':               'Settings',
  '/dashboard/payments':               'Payments Tracker',
  '/dashboard/transactions':           'Transactions',
  '/dashboard/contributions':          'Contributions',
  '/dashboard/savings':                'Savings',
  '/dashboard/loans':                  'Loans',
  '/dashboard/welfare':                'Welfare',
  '/dashboard/portfolio':              'Portfolio',
  '/dashboard/assets':                 'Assets',
  '/dashboard/payouts':                'Payout Rotation',
  '/dashboard/meetings':               'Meetings',
  '/dashboard/voting':                 'Voting',
  '/dashboard/members':                'Members',
  '/dashboard/roles':                  'Roles & Permissions',
  '/dashboard/statements':             'Statements',
  '/dashboard/reports':                'Reports',
  '/rewards':                          'Rewards Marketplace',
  '/rewards/points':                   'Chametu Points',
  '/rewards/plans':                    'Plans & Rewards',
}

const TONE = {
  critical: { cls: 'bg-red-500/15 text-red-600', Icon: AlertTriangle },
  warning:  { cls: 'bg-gold/15 text-[#8A6417]', Icon: AlertTriangle },
  success:  { cls: 'bg-emerald/15 text-forest', Icon: CheckCircle2 },
  info:     { cls: 'bg-blue-500/15 text-blue-600', Icon: Info },
}

function ago(iso) {
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function Topbar({ onBurger }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  const { user } = useAuth()
  const { chama, currentMember } = useChama()

  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  const { items, unread, markAllRead, markRead, dismiss, clearAll } = useNotifications()

  const title = useMemo(() => TITLES[pathname] || 'Dashboard', [pathname])
  const chamaName = chama?.name || 'My Chama'

  const activeUser = currentMember || user

  const initials = useMemo(() => {
    if (!activeUser?.name) return '··'
    return activeUser.name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [activeUser])

  useEffect(() => {
    const onClick = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setBellOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    try { localStorage.setItem('chametu_theme', next) } catch {}
  }

  const openNotif = (n) => {
    markRead(n.id)
    setBellOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur sm:px-5">
      <button
        onClick={onBurger}
        className="hero:hidden flex flex-col gap-1 p-1.5"
        aria-label="Open menu"
      >
        <span className="block h-0.5 w-5 bg-navy" />
        <span className="block h-0.5 w-5 bg-navy" />
        <span className="block h-0.5 w-5 bg-navy" />
      </button>

      <div className="min-w-0 flex-1">
        <h2 className="truncate font-display text-[1.02rem] font-semibold text-navy">
          {title}
        </h2>
        <p className="truncate text-[0.72rem] text-ink-soft">{chamaName}</p>
      </div>

      <div className="hidden md:flex items-center gap-2 w-full max-w-[300px] border border-line rounded-xl px-3 py-2 bg-card text-ink-soft">
        <Search size={14} strokeWidth={2} className="shrink-0 opacity-60" />
        <span className="text-[0.82rem] truncate">Search or ask Chametu…</span>
        <span className="ml-auto text-[0.68rem] border border-line rounded-md px-1.5 py-0.5 text-ink-soft">
          ⌘K
        </span>
      </div>

      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-xl border border-line bg-card text-navy grid place-items-center hover:border-forest transition"
        aria-label="Toggle theme"
      >
        <Sun size={15} strokeWidth={2} className="hidden [html[data-theme='dark']_&]:block" />
        <Moon size={15} strokeWidth={2} className="block [html[data-theme='dark']_&]:hidden" />
      </button>

      <div className="relative" ref={bellRef}>
        <button
          onClick={() => setBellOpen((v) => !v)}
          className="relative w-9 h-9 rounded-xl border border-line bg-card text-navy grid place-items-center hover:border-forest transition"
          aria-label="Notifications"
          aria-expanded={bellOpen}
        >
          <Bell size={15} strokeWidth={2} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.58rem] font-bold text-white ring-2 ring-paper">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 mt-2 w-[calc(100vw-1rem)] max-w-[380px] origin-top-right overflow-hidden rounded-2xl border border-line bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-[0.9rem] font-bold text-navy">
                  Notifications
                </h3>
                {unread > 0 && (
                  <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[0.63rem] font-bold text-red-600">
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[0.7rem] font-semibold text-forest hover:bg-forest/10"
                  >
                    <CheckCheck size={11} /> Read
                  </button>
                )}
                {items.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="rounded-lg p-1.5 text-ink-soft hover:bg-red-500/10 hover:text-red-600"
                    aria-label="Clear all"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <CheckCircle2 size={26} className="mx-auto mb-2 text-emerald opacity-60" />
                  <p className="text-[0.85rem] font-semibold text-navy">
                    You're all caught up
                  </p>
                  <p className="mt-0.5 text-[0.72rem] text-ink-soft">
                    New alerts will appear here.
                  </p>
                </div>
              ) : (
                items.map((n) => {
                  const { cls, Icon } = TONE[n.type] || TONE.info
                  return (
                    <button
                      key={n.id}
                      onClick={() => openNotif(n)}
                      className={`group flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition last:border-0 ${
                        n.read
                          ? 'hover:bg-paper/60'
                          : 'bg-emerald/[0.03] hover:bg-emerald/[0.06]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cls}`}
                      >
                        <Icon size={12} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[0.82rem] font-semibold text-navy">
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[0.73rem] text-ink-soft">
                          {n.desc}
                        </p>
                        <p className="mt-0.5 text-[0.66rem] text-ink-soft/70">
                          {ago(n.time)}
                        </p>
                      </div>
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          dismiss(n.id)
                        }}
                        className="rounded-md p-1 text-ink-soft/40 opacity-0 transition group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-600"
                        role="button"
                        aria-label="Dismiss"
                      >
                        <X size={11} />
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            <div className="border-t border-line bg-paper/50 px-4 py-2.5">
              <button
                onClick={() => {
                  setBellOpen(false)
                  navigate('/dashboard/settings?tab=notifications')
                }}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.75rem] font-semibold text-navy transition hover:bg-white"
              >
                <Settings size={12} /> Notification settings <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-line">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-[0.72rem] shrink-0">
          {initials}
        </span>
        <div className="hidden sm:block leading-tight">
          <div className="text-[0.82rem] font-semibold text-navy truncate max-w-[140px]">
            {activeUser?.name || 'Not signed in'}
          </div>
          <div className="text-[0.7rem] text-ink-soft">
            {activeUser?.role || '—'} · {chamaName}
          </div>
        </div>
      </div>
    </header>
  )
}