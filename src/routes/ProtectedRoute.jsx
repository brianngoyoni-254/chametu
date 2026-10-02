// import { Navigate, Outlet, useLocation } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// export default function ProtectedRoute() {
//   const { isAuthenticated, loading } = useAuth()
//   const location = useLocation()

//   if (loading) {
//     return <div className="grid place-items-center min-h-screen text-ink-soft text-sm">Loading…</div>
//   }
//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} replace />
//   }
//   return <Outlet />
// }

import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="grid place-items-center min-h-screen text-ink-soft text-sm">Loading…</div>
  }

  // DEV BYPASS — remove before shipping
  return <Outlet />

  /* Production version:
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return <Outlet />
  */
}