import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { current, canEarn as canEarnFn, ORDER, TRIAL_DAYS, DAY } from '../lib/tiers'

const KEY = 'chametu_tier_v1'
const TierContext = createContext(null)

export function TierProvider({ children }) {
  // baseTier: what the chama pays for (set at signup / upgrade).
  // tier:     effective tier (baseTier, or 'Gold' while the trial is active).
  const [baseTier, setBaseTierState] = useState(ORDER[0])
  const [tier, setTier] = useState(ORDER[0])
  const [trialExpiresAt, setTrialExpiresAt] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from storage, resolve trial expiry
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY))
      if (raw) {
        const storedBase = ORDER.includes(raw.baseTier)
          ? raw.baseTier
          : ORDER.includes(raw.tier)
            ? raw.tier
            : ORDER[0]
        const trialActive = raw.trialExpiresAt && Date.now() < raw.trialExpiresAt

        setBaseTierState(storedBase)
        setTier(trialActive ? 'Gold' : storedBase)
        setTrialExpiresAt(trialActive ? raw.trialExpiresAt : null)
      }
    } catch {}
    setHydrated(true)
  }, [])

  // Persist
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ baseTier, tier, trialExpiresAt }))
    } catch {}
  }, [baseTier, tier, trialExpiresAt, hydrated])

  /** Set the base tier (called from Register and from the Upgrade page). */
  const setBaseTier = useCallback(
    (next) => {
      if (!ORDER.includes(next)) return
      setBaseTierState(next)
      // If not on an active trial, effective tier jumps immediately
      setTier((t) =>
        t === 'Gold' && trialExpiresAt && Date.now() < trialExpiresAt ? t : next
      )
    },
    [trialExpiresAt]
  )

  /** Start a 14-day Gold trial on top of the base tier. */
  const startTrial = useCallback(() => {
    setTier('Gold')
    setTrialExpiresAt(Date.now() + TRIAL_DAYS * DAY)
  }, [])

  /** Legacy upgrade — used by the rewards marketplace. Ends trial and sets base. */
  const upgrade = useCallback((to) => {
    if (!ORDER.includes(to)) return
    setBaseTierState(to)
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
      tier,               // effective
      baseTier,           // what they pay for
      trialExpiresAt,
      isTrial,
      canEarn,
      config: current(tier),
      baseConfig: current(baseTier),
      order: ORDER,
      setBaseTier,
      startTrial,
      upgrade,
    }),
    [tier, baseTier, trialExpiresAt, isTrial, canEarn, setBaseTier, startTrial, upgrade]
  )

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

export function useTier() {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useTier must be used inside <TierProvider>')
  return ctx
}

export default TierContext