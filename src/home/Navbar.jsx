import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMenu, FiX, FiArrowRight, FiSun, FiMoon } from 'react-icons/fi'
import logo from '../assets/logos.png'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#rewards', label: 'Rewards' },
  { href: '#security', label: 'Security' },
]

/**
 * Inline theme toggle for the landing navbar. Reads/writes
 * localStorage['chametu_theme'] and toggles data-theme on <html>.
 * Matches the same pattern used on the auth pages.
 */
function ThemeToggle({ className = '' }) {
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
      className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-card text-navy transition hover:border-forest ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
    </button>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-50 border-b border-line bg-paper/92 backdrop-blur-sm">
      <div className="wrap flex items-center justify-between gap-3 py-[15px]">
        <Link to="/" className="flex shrink-0 items-center gap-[9px]">
          <img
            src={logo}
            alt="Chametu"
            className="h-[30px] w-auto object-contain"
            width="120"
            height="30"
          />
        </Link>

        <nav className="hidden gap-7 text-[.92rem] font-medium text-navy nav:flex">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="opacity-[.78] transition-opacity hover:opacity-100">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle className="hidden nav:inline-grid" />
          <Link
            to="/login"
            className="hidden text-[.88rem] font-semibold text-navy opacity-75 transition-opacity hover:opacity-100 nav:block"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="btn btn-primary whitespace-nowrap max-[400px]:px-3 max-[400px]:text-[.82rem]"
          >
            Create your chama
            <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="-mr-1.5 p-1.5 text-navy nav:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper nav:hidden">
          <div className="wrap flex flex-col gap-4 py-[18px] text-[.92rem] font-medium text-navy">
            {LINKS.map((l) => (
              <a key={l.label} href={l.href} onClick={close}>
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between gap-4">
              <Link to="/login" onClick={close} className="font-semibold">
                Log in
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}