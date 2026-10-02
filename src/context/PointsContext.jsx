import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as store from '../lib/pointsStore'
import { byId } from '../lib/catalog'
import { current, POINTS_PER_KSH, POINT_LOT_DAYS, INACTIVITY_DAYS, DAY } from '../lib/tiers'
import { useTier } from './TierContext'

const PointsContext = createContext(null)

const prependLedger = (state, entry) => ({
  ...state,
  ledger: [entry, ...state.ledger].slice(0, 40),
})

export function PointsProvider({ children }) {
  const { tier, canEarn } = useTier()
  const [state, setState] = useState(() => store.load() ?? store.initial())
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])
  useEffect(() => { store.save(state) }, [state])

  const balance = useMemo(() => state.lots.reduce((a, l) => a + l.amt, 0), [state.lots])

  const redeemedThisYear = useMemo(() => {
    const y = new Date().getFullYear()
    return state.ledger
      .filter((l) => l.ev === 'redeem' && new Date(l.t).getFullYear() === y)
      .reduce((a, l) => a + Math.abs(l.pts), 0)
  }, [state.ledger])

  const sweep = useCallback(() => {
    setState((s) => {
      const now = Date.now()
      if (s.last && now - s.last > INACTIVITY_DAYS * DAY && s.lots.length) {
        const total = s.lots.reduce((a, l) => a + l.amt, 0)
        return prependLedger({ ...s, lots: [] }, { t: now, ev: 'expiry', pts: -total, note: '12 months inactive — all points expired' })
      }
      const expired = s.lots.filter((l) => now >= l.exp)
      if (!expired.length) return s
      const total = expired.reduce((a, l) => a + l.amt, 0)
      return prependLedger({ ...s, lots: s.lots.filter((l) => now < l.exp) }, { t: now, ev: 'expiry', pts: -total, note: 'Batches older than 12 months expired' })
    })
  }, [])

  const grant = useCallback((ev, amt, note) => {
    if (!canEarn) return
    const finalAmt = Math.round(amt * current(tier).pointsMultiplier)
    const now = Date.now()
    setState((s) => prependLedger(
      { ...s, last: now, lots: [...s.lots, { amt: finalAmt, exp: now + POINT_LOT_DAYS * DAY }] },
      { t: now, ev, pts: finalAmt, note }
    ))
  }, [canEarn, tier])

  const once = useCallback((key, days) => {
    const t = stateRef.current.keys?.[key]
    if (t && Date.now() - t < days * DAY) return false
    setState((s) => ({ ...s, keys: { ...s.keys, [key]: Date.now() } }))
    return true
  }, [])

  const emit = useCallback((type, payload = {}) => {
    sweep()
    if (type === 'subscription_paid') {
      if (!payload.onTime) return
      const ym = new Date().toISOString().slice(0, 7)
      if (!once('pay:' + ym, 28)) return
      const ksh = Number(payload.amountKsh) || 0
      grant(type, Math.round(ksh * POINTS_PER_KSH), `Paid KSh ${ksh.toLocaleString()}`)
    }
    if (type === 'tier_upgraded') {
      if (!once('up:' + payload.to, 365)) return
      grant(type, 500, `Upgraded ${payload.from} → ${payload.to}`)
    }
    if (type === 'annual_prepay') {
      const y = new Date().getFullYear()
      if (!once('annual:' + y, 365)) return
      grant(type, 1000, 'Annual subscription prepaid')
    }
    if (type === 'referral_paid') {
      grant(type, 2000, `Referral paid: ${payload.phone ?? '—'}`)
    }
  }, [grant, once, sweep])

  const redeem = useCallback((perkId) => {
    sweep()
    const it = byId(perkId)
    if (!it) return { ok: false, reason: 'Unknown reward' }

    const s = stateRef.current
    const bal = s.lots.reduce((a, l) => a + l.amt, 0)
    if (bal < it.pts) return { ok: false, reason: `Need ${(it.pts - bal).toLocaleString()} more points` }

    const cfg = current(tier)
    if (cfg.annualRedeemCap === 0) return { ok: false, reason: 'Free groups cannot redeem. Upgrade first.' }

    const y = new Date().getFullYear()
    const redeemed = s.ledger
      .filter((l) => l.ev === 'redeem' && new Date(l.t).getFullYear() === y)
      .reduce((a, l) => a + Math.abs(l.pts), 0)

    if (redeemed + it.pts > cfg.annualRedeemCap) {
      const room = Math.max(0, cfg.annualRedeemCap - redeemed)
      return { ok: false, reason: `Annual cap for ${tier} is ${cfg.annualRedeemCap.toLocaleString()} pts (${room.toLocaleString()} left)` }
    }

    const rid = (s.rid || 0) + 1
    const code = `CHM-${1000 + rid}-${perkId.toUpperCase()}`

    setState((prev) => {
      let need = it.pts
      const lots = [...prev.lots]
        .sort((a, b) => a.exp - b.exp)
        .map((l) => { const use = Math.min(l.amt, need); need -= use; return { ...l, amt: l.amt - use } })
        .filter((l) => l.amt > 0)

      return prependLedger(
        { ...prev, lots, rid, last: Date.now(), red: { ...prev.red, [perkId]: Date.now() } },
        { t: Date.now(), ev: 'redeem', pts: -it.pts, note: `${it.name} · ${code}` }
      )
    })

    return { ok: true, perk: it, code }
  }, [sweep, tier])

  const value = useMemo(
    () => ({ state, balance, redeemedThisYear, grant, emit, redeem, sweep }),
    [state, balance, redeemedThisYear, grant, emit, redeem, sweep]
  )

  return <PointsContext.Provider value={value}>{children}</PointsContext.Provider>
}

export function usePoints() {
  const ctx = useContext(PointsContext)
  if (!ctx) throw new Error('usePoints must be used inside <PointsProvider>')
  return ctx
}

export default PointsContext
