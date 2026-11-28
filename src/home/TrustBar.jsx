// src/home/TrustBar.jsx
import { useEffect, useRef, useState } from 'react'
import { FiUsers, FiUserCheck, FiTrendingUp, FiActivity } from 'react-icons/fi'
import Reveal from './Reveal'
import { api } from '../lib/api' // Adjust path if your api file is elsewhere

// Helper: strips commas/letters from strings like "1,284" to get a number
const parseNum = (val) => {
  if (typeof val === 'number') return val
  if (!val) return 0
  return Number(String(val).replace(/[^\d.-]/g, '')) || 0
}

// Helper: parses strings like "KSh 1.4B" into { target: 1.4, prefix: 'KSh ', suffix: 'B', decimals: 1 }
const parseManaged = (str) => {
  if (!str) return { target: 0, prefix: 'KSh ', suffix: '', decimals: 0 }
  const match = String(str).match(/([\d.]+)\s*([KMBT]?)/i)
  if (match) {
    const target = parseFloat(match[1]) || 0
    const suffix = match[2] ? match[2].toUpperCase() : ''
    return {
      target,
      prefix: 'KSh ',
      suffix,
      decimals: match[1].includes('.') ? 1 : 0
    }
  }
  return { target: 0, prefix: 'KSh ', suffix: '', decimals: 0 }
}

function useCountUp(target, active) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active || target === undefined) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setValue(target)
      return
    }
    const start = performance.now()
    const duration = 1100
    let frame

    function step(now) {
      const p = Math.min(1, (now - start) / duration)
      setValue(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return value
}

function Stat({ icon: Icon, target, decimals = 0, prefix = '', suffix = '', label, active }) {
  const value = useCountUp(target, active)
  const text = value.toLocaleString('en-KE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <div className="group relative flex items-center gap-3 px-4 py-4 sm:gap-3.5 sm:px-5 sm:py-5 lg:px-6 lg:py-6">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-forest/10 text-forest transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11">
        <Icon size={18} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <b className="block font-display text-[1.15rem] font-bold leading-none tracking-tight tabular-nums text-navy sm:text-[1.45rem] lg:text-[1.6rem]">
          {prefix}
          {text}
          {suffix}
        </b>
        <span className="mt-1.5 block text-[0.72rem] leading-tight text-ink-soft sm:text-[.78rem]">
          {label}
        </span>
      </div>
    </div>
  )
}

export default function TrustBar() {
  const ref = useRef(null)
  const [active, setActive] = useState(false)
  const [statsData, setStatsData] = useState(null)

  // Fetch live data from the backend
  useEffect(() => {
    let isMounted = true
    const fetchStats = async () => {
      try {
        const data = await api(`/api/settings/public-stats?_t=${Date.now()}`)
        if (isMounted) setStatsData(data)
      } catch (err) {
        console.error('Failed to load live stats', err)
        // Fallback so the layout doesn't collapse if the API is unreachable
        if (isMounted) setStatsData({ chamas: 0, members: 0, managed: 'KSh 0', uptime: '0%' })
      }
    }
    fetchStats()
    return () => { isMounted = false }
  }, [])

  // Intersection Observer for the count-up animation
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setActive(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true)
            io.disconnect()
          }
        })
      },
      { threshold: 0.1 } // Lowered threshold so it triggers easily
    )
    io.observe(el)
    return () => io.disconnect()
  }, [statsData]) // <--- FIX: Added statsData here so the observer attaches AFTER the div renders

  // If data hasn't loaded yet, render nothing
  if (!statsData) return null

  const managed = parseManaged(statsData.managed)
  const uptimeTarget = parseNum(statsData.uptime) || 99.98

  const liveStats = [
    { icon: FiUsers, target: parseNum(statsData.chamas), label: 'Chamas on Chametu' },
    { icon: FiUserCheck, target: parseNum(statsData.members), label: 'Active members' },
    { icon: FiTrendingUp, ...managed, label: 'Managed on the platform' },
    { icon: FiActivity, target: uptimeTarget, decimals: 2, suffix: '%', label: 'Platform uptime' },
  ]

  return (
    <div className="wrap relative z-20 -mt-10 sm:-mt-14">
      <Reveal direction="fade">
        <div
          ref={ref}
          className="grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-[0_30px_60px_-30px_rgba(11,31,51,0.35)] sm:divide-y-0 lg:grid-cols-4"
        >
          {liveStats.map((s) => (
            <Stat key={s.label} {...s} active={active} />
          ))}
        </div>
      </Reveal>
    </div>
  )
}