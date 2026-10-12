import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useChama } from '../context/ChamaContext'
import { ROUTE_PERMISSIONS } from '../lib/permissions'

export default function RequirePermission() {
  const { can, currentMember } = useChama()
  const location = useLocation()

  // No member selected yet — let the page itself handle it
  if (!currentMember) return <Outlet />

  const required = ROUTE_PERMISSIONS[location.pathname]

  // Unknown route → let it fall through
  if (required === undefined) return <Outlet />
  // Open to all authenticated members
  if (required === null) return <Outlet />
  // Permission check
  if (can(required)) return <Outlet />

  return <Navigate to="/dashboard/no-access" replace state={{ needed: required }} />
}