import { Navigate, Outlet } from 'react-router-dom'

export default function RequireSuperAdmin() {
  // Check for the real JWT token
  const token = localStorage.getItem('superadmin_token')

  // If no token exists, redirect to the SuperAdminLogin page
  if (!token) {
    return <Navigate to="/superadmin/login" replace />
  }

  // If token exists, render the child routes (SuperAdminLayout)
  return <Outlet />
}