// src/lib/chametuShared.js
//
// NOTE: All seed data has been removed. Every dashboard page now reads
// from the backend. The helpers below are kept as thin pass-throughs
// for any legacy call site that hasn't been migrated yet.
import { useEffect, useState } from 'react'

export const SHARED_KEYS = {
  assets: 'chametu_shared_assets_v1',
  meetings: 'chametu_shared_meetings_v1',
  payout: 'chametu_shared_payout_v1',
  proposals: 'chametu_shared_proposals_v1',
}

// Empty starting state for the three page-level caches. Nothing is seeded.
export const DEFAULT_ASSETS = []
export const DEFAULT_MEETINGS = []
export const DEFAULT_PROPOSALS = []
export const DEFAULT_PAYOUT = {
  order: [],
  cursor: 0,
  contributionPerMember: 0,
  history: [],
}

const listeners = new Map()

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
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  emit(key)
}

export function useSharedState(key, initialValue) {
  const [value, setValue] = useState(() => {
    const existing = load(key)
    if (existing === null) {
      try { localStorage.setItem(key, JSON.stringify(initialValue)) } catch {}
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