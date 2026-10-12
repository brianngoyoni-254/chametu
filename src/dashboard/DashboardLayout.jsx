import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="grid grid-cols-1 hero:grid-cols-[250px_1fr] min-h-screen bg-paper">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-line px-5 py-3.5 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="hero:hidden flex flex-col gap-1 p-1.5"
            aria-label="Open menu"
          >
            <span className="block w-5 h-0.5 bg-navy" />
            <span className="block w-5 h-0.5 bg-navy" />
            <span className="block w-5 h-0.5 bg-navy" />
          </button>
          <h2 className="font-display font-semibold text-navy text-[1.02rem]">Dashboard</h2>
        </header>

        <div className="px-4 sm:px-6 py-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  )
}