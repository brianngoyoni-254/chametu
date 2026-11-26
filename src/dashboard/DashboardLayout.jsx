// src/dashboard/DashboardLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import Seo from '../components/Seo'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-paper">
      <Seo title="Dashboard" path="/dashboard" noindex />
      {/* Sidebar is fixed on mobile, sticky on desktop (lg breakpoint) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content takes up the remaining space */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-0 h-screen overflow-hidden">
        <Topbar onBurger={() => setSidebarOpen(true)} />

        {/* The actual page content is scrollable here */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}