import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import { getChama } from '../lib/chametuStorage'

const TITLES = {
  '': 'Dashboard',
  invite: 'Invite Members',
  chama: 'My Chama',
  payments: 'Payments Tracker',
  transactions: 'Transactions',
  contributions: 'Contributions',
  savings: 'Savings',
  loans: 'Loans',
  welfare: 'Welfare',
  portfolio: 'Investment Portfolio',
  assets: 'Asset Register',
  payouts: 'Payout Rotation',
  meetings: 'Meetings',
  voting: 'Voting and Governance',
  members: 'Members',
  roles: 'Roles and Permissions',
  statements: 'Statements',
  reports: 'Reports',
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const chama = getChama()
  const chamaName = chama?.name || 'My Chama'
  const segment = location.pathname.split('/dashboard/')[1]?.split('/')[0] || ''
  const pageTitle = TITLES[segment] || 'Dashboard'

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper hero:grid-cols-[250px_1fr]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-paper/85 px-5 py-3.5 backdrop-blur">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col gap-1 p-1.5 hero:hidden"
            aria-label="Open menu"
          >
            <span className="block h-0.5 w-5 bg-navy" />
            <span className="block h-0.5 w-5 bg-navy" />
            <span className="block h-0.5 w-5 bg-navy" />
          </button>

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[1.02rem] font-semibold text-navy">
              {pageTitle}
            </h2>
            <p className="truncate text-[0.72rem] text-ink-soft">{chamaName}</p>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}