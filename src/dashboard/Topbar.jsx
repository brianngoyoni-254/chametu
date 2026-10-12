import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Menu, Search, Bell, Sun, Moon, UserCircle2,
} from 'lucide-react'
import { useChama } from '../context/ChamaContext'
import { useTier } from '../context/TierContext'

const TITLES = {
  '/dashboard':               'Dashboard',
  '/dashboard/invite':        'Invite Members',
  '/dashboard/chama':         'My Chama',
  '/dashboard/payments':      'Payments Tracker',
  '/dashboard/transactions':  'Transactions',
  '/dashboard/contributions': 'Contributions',
  '/dashboard/savings':       'Savings',
  '/dashboard/loans':         'Loans',
  '/dashboard/welfare':       'Welfare',
  '/dashboard/portfolio':     'Portfolio',
  '/dashboard/assets':        'Assets',
  '/dashboard/payouts':       'Payout Rotation',
  '/dashboard/meetings':      'Meetings',
  '/dashboard/voting':        'Voting',
  '/dashboard/members':       'Members',
  '/dashboard/roles':         'Roles & Permissions',
  '/dashboard/statements':    'Statements',
  '/dashboard/reports':       'Reports',
  '/rewards':                 'Rewards Marketplace',
  '/rewards/points':          'Chametu Points',
  '/rewards/plans':           'Plans & Rewards',
}

export default function Topbar({ onBurger }) {
  const { pathname } = useLocation()
  const { currentMember } = useChama()
  const { tier } = useTier()

  const title = useMemo(() => TITLES[pathname] || 'Dashboard', [pathname])
  const initials = useMemo(() => {
    if (!currentMember) return '··'
    return currentMember.name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [currentMember])

  const toggleTheme = () => {
    const html = document.documentElement
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    html.setAttribute('data-theme', next)
    try { localStorage.setItem('chametu_theme', next) } catch {}
  }

  return (
    <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-line px-4 sm:px-5 py-3 flex items-center gap-3">
      <button
        onClick={onBurger}
        className="hero:hidden p-1.5 rounded-lg hover:bg-forest/10 text-navy"
        aria-label="Open menu"
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      <h2 className="font-display font-semibold text-navy text-[1.02rem] truncate">
        {title}
      </h2>

      <div className="hidden md:flex items-center gap-2 flex-1 max-w-[360px] ml-4 border border-line rounded-xl px-3 py-2 bg-white text-ink-soft">
        <Search size={14} strokeWidth={2} className="shrink-0 opacity-60" />
        <span className="text-[0.82rem] truncate">Search or ask Chametu…</span>
        <span className="ml-auto text-[0.68rem] border border-line rounded-md px-1.5 py-0.5 text-ink-soft">
          ⌘K
        </span>
      </div>

      <div className="flex-1 md:hidden" />

      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-xl border border-line bg-white text-navy grid place-items-center hover:border-forest transition"
        aria-label="Toggle theme"
      >
        <Sun size={15} strokeWidth={2} className="hidden [html[data-theme='dark']_&]:block" />
        <Moon size={15} strokeWidth={2} className="block [html[data-theme='dark']_&]:hidden" />
      </button>

      <button
        className="relative w-9 h-9 rounded-xl border border-line bg-white text-navy grid place-items-center hover:border-forest transition"
        aria-label="Notifications"
      >
        <Bell size={15} strokeWidth={2} />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
      </button>

      <div className="flex items-center gap-2.5 pl-2 ml-1 border-l border-line">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-[0.72rem] shrink-0">
          {initials}
        </span>
        <div className="hidden sm:block leading-tight">
          <div className="text-[0.82rem] font-semibold text-navy truncate max-w-[140px]">
            {currentMember?.name || 'Not signed in'}
          </div>
          <div className="text-[0.7rem] text-ink-soft">
            {currentMember?.role || '—'} · {tier}
          </div>
        </div>
      </div>
    </header>
  )
}