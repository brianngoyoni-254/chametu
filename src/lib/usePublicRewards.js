// src/lib/usePublicRewards.js
import { useEffect, useState } from 'react'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function fetchJson(path) {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return res.json()
}

export function usePublicRewards() {
  const [catalog, setCatalog] = useState([])
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [c, t] = await Promise.all([
          fetchJson('/api/rewards/public/catalog'),
          fetchJson('/api/rewards/public/tiers'),
        ])
        if (cancelled) return
        setCatalog(c)
        setTiers(t)
      } catch {
        // Marketing pages fail silently — layout still renders
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return { catalog, tiers, loading }
}