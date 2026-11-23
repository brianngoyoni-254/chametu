// src/context/TrialContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../lib/api'

const TrialContext = createContext(null)

const TRIAL_LENGTH_DAYS = 7
const REMINDER_KEY = 'chametu_trial_reminders_v1'

// Thresholds (days left) at which we show a reminder modal.
// 7 = first login during trial, 3 = mid-trial nudge, 1 = last day.
const REMINDER_THRESHOLDS = [7, 3, 1]

function readShownReminders() {
  try {
    const raw = localStorage.getItem(REMINDER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeShownReminders(map) {
  try {
    localStorage.setItem(REMINDER_KEY, JSON.stringify(map))
  } catch {}
}

export function TrialProvider({ children }) {
  const { user } = useAuth()

  const [trial, setTrial] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderDays, setReminderDays] = useState(null)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  // Only warn once per session if the endpoint isn't there yet.
  const warnedRef = useRef(false)

  const isLocked = !!trial && trial.status === 'expired'
  const isTrial = !!trial && trial.status === 'trialing'
  const daysLeft = trial?.daysLeft ?? null

  /**
   * Fetch trial status from the backend. Called on login, on mount,
   * and after any upgrade. Safe to call repeatedly.
   *
   * If the backend endpoint does not exist yet (404/405) or the network
   * is unreachable, we treat the user as "no trial info" and leave them
   * unlocked. This keeps the frontend usable while the backend is being built.
   */
  const refreshTrial = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !user) {
      setTrial(null)
      return null
    }

    setLoading(true)
    setError('')
    try {
      const data = await api('/api/billing/trial/status', { method: 'GET' })
      // Expected shape:
      // { trial: { status: 'trialing'|'active'|'expired'|'none',
      //            startedAt, endsAt, daysLeft, tier, plan } }
      const next = data?.trial || null
      setTrial(next)

      // Decide whether to show a reminder modal.
      if (next && next.status === 'trialing' && typeof next.daysLeft === 'number') {
        const shown = readShownReminders()
        const key = `${user.id || user.email}:${next.endsAt || next.startedAt}`
        const already = shown[key] || []

        // Find the highest threshold we've crossed and haven't shown yet.
        const crossed = REMINDER_THRESHOLDS.filter((t) => next.daysLeft <= t)
        const pending = crossed.find((t) => !already.includes(t))

        if (pending && next.daysLeft > 0) {
          setReminderDays(next.daysLeft)
          setReminderOpen(true)
          const updated = { ...shown, [key]: [...already, pending] }
          writeShownReminders(updated)
        }
      }

      return next
    } catch (err) {
      // A 402/403 from the backend means the trial expired and the account
      // is locked. We still want to surface that.
      const status = err?.status || err?.statusCode
      if (status === 402 || status === 403) {
        const locked = {
          status: 'expired',
          daysLeft: 0,
          endsAt: err?.data?.endsAt || null,
          tier: err?.data?.tier || null,
        }
        setTrial(locked)
        return locked
      }

      // Backend endpoint not implemented yet (404 / 405) or network down:
      // leave the user unlocked so they can still use the app while the
      // backend trial system is being built. Warn once.
      if (status === 404 || status === 405 || !status) {
        if (!warnedRef.current) {
          warnedRef.current = true
          // eslint-disable-next-line no-console
          console.warn(
            '[TrialContext] Trial status endpoint is not available yet. ' +
            'The app will run without trial enforcement until the backend is ready.',
          )
        }
        setTrial(null)
        return null
      }

      setError(err?.message || 'Could not load trial status.')
      return null
    } finally {
      setLoading(false)
    }
  }, [user])

  // Refresh whenever the logged-in user changes.
  useEffect(() => {
    if (user) {
      refreshTrial()
    } else {
      setTrial(null)
      setReminderOpen(false)
      setUpgradeOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.email])

  const dismissReminder = useCallback(() => {
    setReminderOpen(false)
    setReminderDays(null)
  }, [])

  const openUpgrade = useCallback(() => {
    setReminderOpen(false)
    setUpgradeOpen(true)
  }, [])

  const closeUpgrade = useCallback(() => setUpgradeOpen(false), [])

  /**
   * Call after a successful plan purchase so the lock lifts immediately
   * without needing a full page reload.
   */
  const markPaid = useCallback(
    (plan) => {
      setTrial((prev) => ({
        ...(prev || {}),
        status: 'active',
        plan: plan || prev?.plan || null,
        daysLeft: null,
        endsAt: null,
      }))
      setReminderOpen(false)
      setUpgradeOpen(false)
      // Re-sync with backend in case the plan has a different expiry.
      refreshTrial()
    },
    [refreshTrial],
  )

  const value = useMemo(
    () => ({
      trial,
      loading,
      error,
      isLocked,
      isTrial,
      daysLeft,
      trialLengthDays: TRIAL_LENGTH_DAYS,
      reminderOpen,
      reminderDays,
      upgradeOpen,
      refreshTrial,
      dismissReminder,
      openUpgrade,
      closeUpgrade,
      markPaid,
    }),
    [
      trial, loading, error, isLocked, isTrial, daysLeft,
      reminderOpen, reminderDays, upgradeOpen,
      refreshTrial, dismissReminder, openUpgrade, closeUpgrade, markPaid,
    ],
  )

  return <TrialContext.Provider value={value}>{children}</TrialContext.Provider>
}

export function useTrial() {
  const ctx = useContext(TrialContext)
  if (!ctx) throw new Error('useTrial must be used inside TrialProvider')
  return ctx
}