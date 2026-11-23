import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTrial } from '../context/TrialContext'   // ADDED

export default function ProtectedRoute() {
  const { isAuthenticated, loading, user } = useAuth()
  const { refreshTrial } = useTrial()                // ADDED
  const location = useLocation()

  // ADDED: whenever we land on a protected route as an authenticated user,
  // re-sync trial status. This is what flips `isLocked` to true the moment
  // the trial expires, so TrialGate (rendered at the layout level in
  // AppRoutes.jsx) immediately shows the lock screen.
  //
  // Note: ProtectedRoute intentionally does NOT render TrialGate itself.
  // TrialGate lives on the DashboardLayout route in AppRoutes.jsx so that
  // /billing/upgrade (also under ProtectedRoute) stays reachable for a
  // locked user who needs to pay.
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshTrial()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, location.pathname])

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