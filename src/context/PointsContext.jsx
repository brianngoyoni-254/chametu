// src/context/PointsContext.jsx
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react'
import {
  fetchState, fetchCatalog, redeemReward as apiRedeem,
} from '../lib/catalog'

const PointsContext = createContext(null)

export function PointsProvider({ children }) {
  const [state, setState] = useState({
    balance: 0, redeemedThisYear: 0, ledger: [], lots: [],
    redemptions: [], tier: 'Starter', baseTier: 'Starter',
    config: { annualRedeemCap: 1000 },
    baseConfig: { annualRedeemCap: 1000 },
  })
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
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

  useEffect(() => { refresh() }, [refresh])

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