import { useEffect, useRef, useState } from 'react'

export default function Reveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  threshold = 0.12,
  rootMargin = '0px 0px -60px 0px',
  as: Tag = 'div',
  ...rest
}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold, rootMargin }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin])

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${direction}${visible ? ' is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}