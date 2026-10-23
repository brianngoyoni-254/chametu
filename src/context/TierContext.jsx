// src/context/TierContext.jsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { current, ORDER, TRIAL_DAYS, DAY } from '../lib/tiers'
import {
  fetchState, setBaseTier as apiSetBaseTier,
  startTrial as apiStartTrial, upgradeTier as apiUpgradeTier,
} from '../lib/catalog'

const TierContext = createContext(null)

export function TierProvider({ children }) {
  const [baseTier, setBaseTierState] = useState(ORDER[0])
  const [tier, setTier] = useState(ORDER[0])
  const [trialExpiresAt, setTrialExpiresAt] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const s = await fetchState()
      setBaseTierState(s.baseTier || ORDER[0])
      setTier(s.tier || s.baseTier || ORDER[0])
      setTrialExpiresAt(s.trialExpiresAt ? Date.parse(s.trialExpiresAt) : null)
    } catch {
      // not logged in / offline
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const setBaseTier = useCallback(async (next) => {
    if (!ORDER.includes(next)) return
    try {
      const res = await apiSetBaseTier(next)
      setBaseTierState(res.baseTier)
      setTier((t) =>
        t === 'Gold' && trialExpiresAt && Date.now() < trialExpiresAt
          ? t : res.baseTier,
      )
    } catch {
      setBaseTierState(next)
      setTier((t) =>
        t === 'Gold' && trialExpiresAt && Date.now() < trialExpiresAt
          ? t : next,
      )
    }
  }, [trialExpiresAt])

  const startTrial = useCallback(async () => {
    try {
      const res = await apiStartTrial()
      setTier('Gold')
      setTrialExpiresAt(
        res.trialExpiresAt
          ? Date.parse(res.trialExpiresAt)
          : Date.now() + TRIAL_DAYS * DAY,
      )
    } catch {
      setTier('Gold')
      setTrialExpiresAt(Date.now() + TRIAL_DAYS * DAY)
    }
  }, [])

  const upgrade = useCallback(async (to) => {
    if (!ORDER.includes(to)) return
    try {
      const res = await apiUpgradeTier(to)
      setBaseTierState(res.baseTier)
      setTier(res.baseTier)
      setTrialExpiresAt(null)
    } catch {
      setBaseTierState(to)
      setTier(to)
      setTrialExpiresAt(null)
    }
  }, [])

  const isTrial = useMemo(
    () => Boolean(trialExpiresAt) && Date.now() < trialExpiresAt,
    [trialExpiresAt],
  )

  const value = useMemo(
    () => ({
      tier, baseTier, trialExpiresAt, isTrial, canEarn: true,
      config: current(tier), baseConfig: current(baseTier),
      order: ORDER, setBaseTier, startTrial, upgrade, refresh, hydrated,
    }),
    [tier, baseTier, trialExpiresAt, isTrial,
     setBaseTier, startTrial, upgrade, refresh, hydrated],
  )

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

export function useTier() {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useTier must be used inside <TierProvider>')
  return ctx
}

export default TierContext