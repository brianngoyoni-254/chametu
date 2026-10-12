import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTier } from '../context/TierContext'
import { ROUTE_TIERS, tierAtLeast } from '../lib/permissions'

/**
 * Route-level tier guard. Wrap tier-gated dashboard routes with this
 * element. Redirects to /dashboard/upgrade when the current effective
 * tier is lower than the minimum required by ROUTE_TIERS.
 */
export default function RequireTier() {
  const { tier } = useTier()
  const location = useLocation()

  const required = ROUTE_TIERS[location.pathname]

  // Unknown or open route → allow
  if (required === undefined) return <Outlet />
  // Tier check
  if (tierAtLeast(tier, required)) return <Outlet />

  return (
    <Navigate
      to="/dashboard/upgrade"
      replace
      state={{ needed: required, from: location.pathname }}
    />
  )
}