import { useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { LogOut, Bell, Menu } from 'lucide-react'
import MemberSidebar from './MemberSidebar'
import { getMemberSession, clearMemberSession, getMemberChama } from '../lib/chametuStorage'

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
}

const SUBTITLES = {
  assets: 'What the chama has acquired together',
  meetings: 'Schedules, agendas and records',
  rotation: 'Who receives next in the merry-go-round',
  voting: 'Your say in chama decisions',
}

export default function MemberLayout() {
  const session = getMemberSession()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

            <button
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-ink-soft transition hover:border-forest hover:text-navy sm:flex"
              aria-label="Notifications"
            >
              <Bell size={15} />
            </button>

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