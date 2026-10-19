import { Outlet } from 'react-router-dom'
import SuperAdminSidebar from './SuperAdminSidebar'

export default function SuperAdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#F7F9FB] dark:bg-paper">
      <SuperAdminSidebar />
      <main className="min-w-0 flex-1 p-8">
        <Outlet />
      </main>
    </div>
  )
}