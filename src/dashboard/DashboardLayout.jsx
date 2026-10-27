// src/dashboard/DashboardLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper hero:grid-cols-[250px_1fr]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-w-0 flex-col">
        <Topbar onBurger={() => setSidebarOpen(true)} />

        <div className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}