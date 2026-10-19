import { Navigate, Outlet } from 'react-router-dom'

export default function RequireSuperAdmin() {
  let session = null
  try {
    session = JSON.parse(localStorage.getItem('superadmin_session'))
  } catch (e) {}

  // If no session exists, redirect to the SuperAdminLogin page
  if (!session) {
    return <Navigate to="/superadmin/login" replace />
  }

  // If session exists, render the child routes (SuperAdminLayout)
  return <Outlet />
}