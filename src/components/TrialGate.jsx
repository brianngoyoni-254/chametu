// src/components/TrialGate.jsx
import { useEffect } from 'react'
import { useTrial } from '../context/TrialContext'
import TrialBanner from './TrialBanner'
import TrialReminderModal from './TrialReminderModal'
import TrialLockScreen from './TrialLockScreen'

/**
 * Wrap any authenticated layout with this component.
 *
 *   <TrialGate>
 *     <Outlet />
 *   </TrialGate>
 *
 * - On mount it refreshes trial status.
 * - If locked -> full-screen TrialLockScreen (no children rendered).
 * - Otherwise -> trial banner + reminder modal + children.
 */
export default function TrialGate({ children }) {
  const { isLocked, refreshTrial } = useTrial()

  useEffect(() => {
    refreshTrial()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (isLocked) return <TrialLockScreen />

  return (
    <>
      <TrialBanner />
      <TrialReminderModal />
      {children}
    </>
  )
}