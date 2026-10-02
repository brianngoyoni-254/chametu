import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { current, canEarn as canEarnFn, ORDER, TRIAL_DAYS, DAY } from '../lib/tiers'

const KEY = 'chametu_tier_v1'
const TierContext = createContext(null)

export function TierProvider({ children }) {
  const [tier, setTier] = useState(ORDER[0])
  const [trialExpiresAt, setTrialExpiresAt] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY))
      if (raw) {
        if (raw.trialExpiresAt && Date.now() >= raw.trialExpiresAt) {
          setTier(ORDER[0])
          setTrialExpiresAt(null)
        } else {
          const stored = ORDER.includes(raw.tier) ? raw.tier : ORDER[0]
          setTier(stored)
          setTrialExpiresAt(raw.trialExpiresAt || null)
        }
      }
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ tier, trialExpiresAt }))
    } catch {}
  }, [tier, trialExpiresAt, hydrated])

  const startTrial = useCallback(() => {
    setTier('Gold')
    setTrialExpiresAt(Date.now() + TRIAL_DAYS * DAY)
  }, [])

  const upgrade = useCallback((to) => {
    if (!ORDER.includes(to)) return
    setTier(to)
    setTrialExpiresAt(null)
  }, [])

  const isTrial = useMemo(
    () => Boolean(trialExpiresAt) && Date.now() < trialExpiresAt,
    [trialExpiresAt]
  )
  const canEarn = useMemo(() => canEarnFn(tier), [tier])

  const value = useMemo(
    () => ({
      tier, trialExpiresAt, isTrial, canEarn,
      config: current(tier),
      order: ORDER,
      startTrial, upgrade,
    }),
    [tier, trialExpiresAt, isTrial, canEarn, startTrial, upgrade]
  )

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

export function useTier() {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useTier must be used inside <TierProvider>')
  return ctx
}

export default TierContext