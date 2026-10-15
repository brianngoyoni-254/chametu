import { useEffect, useRef, useState } from 'react'
import { FiUsers, FiUserCheck, FiTrendingUp, FiActivity } from 'react-icons/fi'
import Reveal from './Reveal'

const STATS = [
  { icon: FiUsers, target: 1284, label: 'Chamas on Chametu' },
  { icon: FiUserCheck, target: 18420, label: 'Active members' },
  { icon: FiTrendingUp, target: 1.4, decimals: 1, prefix: 'KSh ', suffix: 'B', label: 'Managed on the platform' },
  { icon: FiActivity, target: 99.98, decimals: 2, suffix: '%', label: 'Platform uptime' },
]

function useCountUp(target, active) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
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
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    // Overlaps the bottom edge of the hero so the stats read as part of the first screen.
    <div className="wrap relative z-20 -mt-10 sm:-mt-14">
      <Reveal direction="fade">
        <div
          ref={ref}
          className="grid grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card shadow-[0_30px_60px_-30px_rgba(11,31,51,0.35)] sm:divide-y-0 lg:grid-cols-4"
        >
          {STATS.map((s) => (
            <Stat key={s.label} {...s} active={active} />
          ))}
        </div>
      </Reveal>
    </div>
  )
}