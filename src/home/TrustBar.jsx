import { useEffect, useRef, useState } from 'react'
import { FiUsers, FiUserCheck, FiDollarSign, FiActivity } from 'react-icons/fi'
import Reveal from './Reveal'

const STATS = [
  { icon: FiUsers, target: 1284, suffix: '', label: 'Chamas on Chametu' },
  { icon: FiUserCheck, target: 18420, suffix: '', label: 'Active members' },
  { icon: FiDollarSign, target: 1400, suffix: 'M', label: 'KSh managed' },
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

function Stat({ icon: Icon, target, suffix, label, active }) {
  const value = useCountUp(target, active)
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest/10 text-forest">
        <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <b className="font-display text-[1.3rem] font-bold leading-tight text-navy">
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
      <Reveal direction="fade">
        <div ref={ref} className="border-y border-line py-[22px]">
          <div className="grid grid-cols-2 gap-[22px] text-center sm:grid-cols-4 sm:gap-[18px]">
            {STATS.map((s) => (
              <Stat key={s.label} {...s} active={active} />
            ))}
            <div className="flex flex-col items-center gap-1">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest/10 text-forest">
                <FiActivity size={15} strokeWidth={2.2} aria-hidden="true" />
              </span>
              <b className="font-display text-[1.3rem] font-bold leading-tight text-navy">99.98%</b>
              <span className="text-[.76rem] text-ink-soft">Platform uptime</span>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  )
}