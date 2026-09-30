import { useEffect, useRef, useState } from 'react'

const STATS = [
  { target: 1284, suffix: '', label: 'Chamas on Chametu' },
  { target: 18420, suffix: '', label: 'Active members' },
  { target: 1400, suffix: 'M', label: 'KSh managed' },
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
    const duration = 900
    let frame

    function step(now) {
      const p = Math.min(1, (now - start) / duration)
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [active, target])

  return value
}

function Stat({ target, suffix, label, active }) {
  const value = useCountUp(target, active)
  return (
    <div>
      <b className="block font-display text-[1.3rem] font-bold text-navy">
        {value.toLocaleString()}
        {suffix}
      </b>
      <span className="text-[.76rem] text-ink-soft">{label}</span>
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
    <div className="wrap">
      <div ref={ref} className="border-y border-line py-[22px]">
        <div className="grid grid-cols-2 gap-[22px] text-center sm:grid-cols-4 sm:gap-[18px]">
          {STATS.map((s) => (
            <Stat key={s.label} {...s} active={active} />
          ))}
          <div>
            <b className="block font-display text-[1.3rem] font-bold text-navy">99.98%</b>
            <span className="text-[.76rem] text-ink-soft">Platform uptime</span>
          </div>
        </div>
      </div>
    </div>
  )
}