import { useEffect, useState } from 'react'

/* ---------------- keys & defaults ---------------- */

export const SHARED_KEYS = {
  assets: 'chametu_shared_assets_v1',
  meetings: 'chametu_shared_meetings_v1',
  payout: 'chametu_shared_payout_v1',
  proposals: 'chametu_shared_proposals_v1',
}

export const DEFAULT_ASSETS = [
  { id: 1, name: 'Kiambu Land Project', type: 'Land', price: 1200000, value: 1500000, ownership: 100, acquired: 'Jan 2026' },
  { id: 2, name: 'Office equipment', type: 'Equipment', price: 85000, value: 60000, ownership: 100, acquired: 'Mar 2026' },
  { id: 3, name: 'Tent & chairs set', type: 'Equipment', price: 45000, value: 45000, ownership: 100, acquired: 'Jul 2026' },
]

export const DEFAULT_MEETINGS = [
  {
    id: 1,
    date: '2026-09-28',
    time: '2:00 PM',
    title: 'Monthly General Meeting',
    agenda: 'Financial report · Loan applications · Investment proposal · Welfare',
    location: 'Chama office, Nairobi',
    locked: false,
  },
  {
    id: 2,
    date: '2026-08-24',
    time: '2:00 PM',
    title: 'Monthly General Meeting',
    agenda: 'Approved Kiambu land valuation update; 3 loans disbursed',
    location: 'Chama office, Nairobi',
    locked: true,
  },
]

export const DEFAULT_PAYOUT = {
  order: ['Brian N.', 'Jane W.', 'Kevin M.', 'Mary N.', 'David O.', 'Alice K.'],
  cursor: 0,
  contributionPerMember: 10000,
  history: [],
}

export const DEFAULT_PROPOSALS = [
  {
    id: 'kilifi',
    title: 'Kilifi Property Purchase',
    amount: 'KSh 4,500,000',
    closes: 'Oct 2',
    yes: 14,
    no: 2,
    abs: 2,
    votes: {},
  },
  {
    id: 'raise',
    title: 'Increase monthly contribution',
    amount: 'KSh 5,000 → KSh 6,000',
    closes: 'Oct 10',
    yes: 9,
    no: 6,
    abs: 2,
    votes: {},
  },
]

/* ---------------- internals ---------------- */

const listeners = new Map() // key -> Set<fn>

function emit(key) {
  const set = listeners.get(key)
  if (set) set.forEach((fn) => fn())
}

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
  emit(key)
}

/* ---------------- hook ---------------- */

export function useSharedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const existing = load(key)
    if (existing === null) {
      try {
        localStorage.setItem(key, JSON.stringify(initialValue))
      } catch {}
      return initialValue
    }
    return existing
  })

  useEffect(() => {
    const fn = () => setValue(load(key) ?? initialValue)
    if (!listeners.has(key)) listeners.set(key, new Set())
    listeners.get(key).add(fn)

    const onStorage = (e) => {
      if (e.key === key) setValue(load(key) ?? initialValue)
    }
    window.addEventListener('storage', onStorage)

    return () => {
      listeners.get(key)?.delete(fn)
      window.removeEventListener('storage', onStorage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = (next) => {
    const resolved = typeof next === 'function' ? next(load(key) ?? initialValue) : next
    save(key, resolved)
    setValue(resolved)
  }

  return [value, update]
}