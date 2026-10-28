import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-ink-soft">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    // Save the intended destination (e.g., /dashboard/upgrade) before redirecting to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // A member account hitting an admin route → bounce to the member portal.
  if (user?.portal === 'member' && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/member" replace />
  }

  return <Outlet />
}