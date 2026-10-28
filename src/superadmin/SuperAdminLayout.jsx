import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import SuperAdminSidebar from './SuperAdminSidebar'
import SuperAdminNavbar from './SuperAdminNavbar'

export default function SuperAdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    // FIXED: Changed dark:bg-paper to dark:bg-[#071625] so the background is dark in dark mode
    <div className="flex min-h-screen bg-[#F7F9FB] dark:bg-[#071625]">
      <SuperAdminSidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <SuperAdminNavbar onMenuClick={() => setDrawerOpen(true)} />

        <main className="flex-1 px-3 py-4 sm:px-5 sm:py-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}