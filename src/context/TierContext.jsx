// src/context/TierContext.jsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import { current, ORDER, TIERS } from '../lib/tiers'
import { fetchState } from '../lib/catalog'
import { api } from '../lib/api'

const TierContext = createContext(null)

const AUTH_CHANGED_EVENT = 'auth-changed'

export function TierProvider({ children }) {
  const [baseTier, setBaseTierState] = useState(ORDER[0])
  const [tier, setTier] = useState(ORDER[0])
  const [trialExpiresAt, setTrialExpiresAt] = useState(null)
  const [hydrated, setHydrated] = useState(false)

  // State for dynamic tiers
  const [dynamicTiers, setDynamicTiers] = useState(TIERS)

  // Fetch dynamic prices on mount
  useEffect(() => {
    api('/api/settings/public-prices')
      .then((prices) => {
        const merged = { ...TIERS }
        Object.keys(prices).forEach((key) => {
          if (merged[key]) {
            merged[key] = { ...merged[key], price: prices[key] }
          }
        })
        setDynamicTiers(merged)
      })
      .catch((err) => {
        console.error('Failed to fetch dynamic prices:', err)
      })
  }, [])

  // The server is the only source of truth for the plan. The browser can
  // never set a tier; it can only ask the server what it currently is.
  const refresh = useCallback(async () => {
    if (!localStorage.getItem('auth_token')) {
      // logged out: back to defaults
      setBaseTierState(ORDER[0])
      setTier(ORDER[0])
      setTrialExpiresAt(null)
      setHydrated(true)
      return
    }
    try {
      const s = await fetchState()
      setBaseTierState(s.baseTier || ORDER[0])
      setTier(s.tier || s.baseTier || ORDER[0])
      setTrialExpiresAt(s.trialExpiresAt ? Date.parse(s.trialExpiresAt) : null)
    } catch {
      // offline / transient error: keep what we have
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Re-read the plan whenever someone logs in, signs up (after paying) or logs out.
  useEffect(() => {
    const onAuthChanged = () => { refresh() }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
  }, [refresh])

  const isTrial = useMemo(
    () => Boolean(trialExpiresAt) && Date.now() < trialExpiresAt,
    [trialExpiresAt],
  )

  const value = useMemo(
    () => ({
      tier, baseTier, trialExpiresAt, isTrial, canEarn: true,
      config: current(tier), baseConfig: current(baseTier),
      order: ORDER, refresh, hydrated,
      tiers: dynamicTiers,
    }),
    [tier, baseTier, trialExpiresAt, isTrial, refresh, hydrated, dynamicTiers],
  )

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>
}

export function useTier() {
  const ctx = useContext(TierContext)
  if (!ctx) throw new Error('useTier must be used inside <TierProvider>')
  return ctx
}

export default TierContext