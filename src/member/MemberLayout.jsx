import { useState, useRef, useEffect, useMemo } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  LogOut, Bell, Menu, CheckCheck, Trash2, X,
  AlertTriangle, Info, CheckCircle2, ArrowRight,
} from 'lucide-react'
import MemberSidebar from './MemberSidebar'
import {
  getMemberSession, clearMemberSession, getMemberChama,
} from '../lib/chametuStorage'
import { useMemberNotifications } from '../lib/memberNotifications'

const TITLES = {
  '': 'Overview',
  contributions: 'Contributions',
  savings: 'My Savings',
  loans: 'My Loan',
  transactions: 'Transactions',
  assets: 'Chama Assets',
  meetings: 'Meetings',
  rotation: 'Payout Rotation',
  voting: 'Voting',
  welfare: 'Welfare',
  profile: 'My Profile',
  support: 'Support',
}

const SUBTITLES = {
  assets: 'What the chama has acquired together',
  meetings: 'Schedules, agendas and records',
  rotation: 'Who receives next in the merry-go-round',
  voting: 'Your say in chama decisions',
  support: 'Reach the Chametu team directly',
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

export default function MemberLayout() {
  const session = getMemberSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  const { items, unread, markAllRead, markRead, dismiss, clearAll } = useMemberNotifications(session?.id)

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

  if (!session) return <Navigate to="/" replace />

  const chama = getMemberChama(session)
  const segment = location.pathname.split('/member/')[1] || ''
  const title = TITLES[segment] || 'Overview'
  const subtitle = SUBTITLES[segment] || `${chama.name} / member account`

  function logout() {
    clearMemberSession()
    window.location.href = '/'
  }

  function initials(name) {
    return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
  }

  const openNotif = (n) => {
    markRead(n.id)
    setBellOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <MemberSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chamaName={chama.name}
      />

      <main className="min-w-0 flex-1">
        <div className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-line bg-card text-navy transition hover:border-forest hover:bg-forest/[0.04] lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={16} />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-base font-bold text-navy">
                {title}
              </h2>
              <p className="truncate text-[0.72rem] text-ink-soft">{subtitle}</p>
            </div>

            {/* NOTIFICATIONS BELL */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-navy transition hover:border-forest"
                aria-label="Notifications"
                aria-expanded={bellOpen}
              >
                <Bell size={15} />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[0.58rem] font-bold text-white ring-2 ring-card">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-1rem)] max-w-[380px] origin-top-right overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-[0.9rem] font-bold text-navy">Notifications</h3>
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
                        <p className="text-[0.85rem] font-semibold text-navy">You're all caught up</p>
                        <p className="mt-0.5 text-[0.72rem] text-ink-soft">New alerts will appear here.</p>
                      </div>
                    ) : (
                      items.map((n) => {
                        const { cls, Icon } = TONE[n.type] || TONE.info
                        return (
                          <button
                            key={n.id}
                            onClick={() => openNotif(n)}
                            className={`group flex w-full items-start gap-3 border-b border-line/60 px-4 py-3 text-left transition last:border-0 ${
                              n.read ? 'hover:bg-paper/60' : 'bg-emerald/[0.03] hover:bg-emerald/[0.06]'
                            }`}
                          >
                            <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${cls}`}>
                              <Icon size={12} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-[0.82rem] font-semibold text-navy">
                                  {n.title}
                                </p>
                                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[0.73rem] text-ink-soft">{n.desc}</p>
                              <p className="mt-0.5 text-[0.66rem] text-ink-soft/70">{ago(n.time)}</p>
                            </div>
                            <span
                              onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
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
                      onClick={() => { setBellOpen(false); navigate('/member/profile') }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.75rem] font-semibold text-navy transition hover:bg-white"
                    >
                      <Bell size={12} /> Manage notifications <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-card py-1.5 pl-1.5 pr-3">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-forest to-emerald font-display text-[0.7rem] font-bold text-white shadow-sm">
                {initials(session.name)}
              </span>
              <div className="hidden min-w-0 sm:block">
                <div className="truncate text-[0.78rem] font-semibold leading-tight text-navy">
                  {session.name}
                </div>
                <div className="text-[0.65rem] capitalize text-ink-soft">
                  {session.role}
                </div>
              </div>
              <button
                onClick={logout}
                className="ml-1 flex items-center gap-1 rounded-lg px-2 py-1 text-[0.68rem] font-semibold text-ink-soft transition hover:bg-red-500/10 hover:text-red-600"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">Log out</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-[1000px]">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}