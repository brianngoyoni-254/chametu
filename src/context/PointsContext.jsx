// src/context/PointsContext.jsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import {
  fetchState, fetchCatalog, redeemReward as apiRedeem,
} from '../lib/catalog'

const PointsContext = createContext(null)

const TOKEN_KEY = 'auth_token'
export const AUTH_CHANGED_EVENT = 'auth-changed'

const DEFAULT_STATE = {
  balance: 0, redeemedThisYear: 0, ledger: [], lots: [],
  redemptions: [], tier: 'Starter', baseTier: 'Starter',
  config: { annualRedeemCap: 1000 },
  baseConfig: { annualRedeemCap: 1000 },
}

export function PointsProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE)
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    // These endpoints require a JWT. Without one they would just return 401,
    // so skip the calls and reset to defaults (e.g. after logout).
    if (!localStorage.getItem(TOKEN_KEY)) {
      setState(DEFAULT_STATE)
      setCatalog([])
      setLoading(false)
      return
    }

    try {
      const [s, c] = await Promise.all([fetchState(), fetchCatalog()])
      setState(s)
      setCatalog(c)
    } catch {
      // leave defaults
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { refresh() }, [refresh])

  // Re-run when the user logs in, registers or logs out (AuthContext fires this)
  useEffect(() => {
    const onAuthChanged = () => { refresh() }
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
  }, [refresh])

  const redeem = useCallback(async (rewardId) => {
    try {
      const res = await apiRedeem(rewardId)
      await refresh()
      return { ok: true, perk: res.reward, code: res.code }
    } catch (err) {
      return { ok: false, reason: err.message }
    }
  }, [refresh])

  const byId = useCallback(
    (id) => catalog.find((c) => c.id === id) || null,
    [catalog],
  )

  const value = useMemo(
    () => ({
      state,
      catalog,
      balance: state.balance,
      redeemedThisYear: state.redeemedThisYear,
      loading,
      redeem,
      refresh,
      byId,
      // legacy no-ops so old callers don't crash
      grant: () => {},
      emit: () => {},
      sweep: () => refresh(),
    }),
    [state, catalog, loading, redeem, refresh, byId],
  )

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
}

export function usePoints() {
  const ctx = useContext(PointsContext)
  if (!ctx) throw new Error('usePoints must be used inside <PointsProvider>')
  return ctx
}

export default PointsContext