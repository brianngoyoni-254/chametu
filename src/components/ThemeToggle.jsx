import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * Standalone theme toggle. Reads/writes localStorage and toggles
 * data-theme on <html>. No context required — safe to drop anywhere.
 */
export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document === 'undefined') return 'light'
    try {
      const stored = localStorage.getItem('chametu_theme')
      if (stored === 'dark' || stored === 'light') return stored
    } catch {}
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    const html = document.documentElement
    if (theme === 'dark') html.setAttribute('data-theme', 'dark')
    else html.removeAttribute('data-theme')
    try { localStorage.setItem('chametu_theme', theme) } catch {}
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-grid place-items-center w-9 h-9 rounded-xl border border-line bg-card text-navy hover:border-forest transition ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <Sun size={15} strokeWidth={2} /> : <Moon size={15} strokeWidth={2} />}
    </button>
  )
}