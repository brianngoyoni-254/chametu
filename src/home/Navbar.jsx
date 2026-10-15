import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiArrowRight, FiX, FiMenu } from 'react-icons/fi'
import logo from '../assets/logos.png'
import ThemeToggle from '../components/ThemeToggle'

const LINKS = [
  { href: '#cartoon', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#rewards', label: 'Rewards' },
  { href: '#security', label: 'Security' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const close = () => setOpen(false)
  const light = isHome && !scrolled && !open

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          light
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-line bg-paper/85 backdrop-blur-xl'
        }`}
      >
        <div className="wrap flex items-center justify-between gap-3 py-3.5 sm:py-4">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={close}>
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                light ? 'bg-white/15 backdrop-blur' : 'bg-forest/10'
              }`}
            >
              <img src={logo} alt="Chametu" className="h-6 w-6 object-contain" />
            </span>
            <span
              className={`font-display text-[1.02rem] font-bold tracking-tight transition sm:text-[1.05rem] ${
                light ? 'text-white' : 'text-navy'
              }`}
            >
              Chametu
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-[0.88rem] font-medium nav:flex nav:gap-7 nav:text-[0.9rem]">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`relative transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-[2px] after:w-0 after:rounded-full after:bg-current after:transition-all after:duration-300 hover:after:w-full ${
                  light ? 'text-white/80 hover:text-white' : 'text-navy/75 hover:text-navy'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden items-center gap-3 nav:flex">
              <Link
                to="/login"
                className={`text-[0.88rem] font-semibold transition ${
                  light ? 'text-white/80 hover:text-white' : 'text-navy/75 hover:text-navy'
                }`}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.86rem] font-semibold transition sm:px-5 sm:text-[0.88rem] ${
                  light
                    ? '!bg-[#F5B942] !text-[#2E2200] hover:-translate-y-0.5 hover:!bg-[#FFC857]'
                    : 'bg-forest text-white hover:-translate-y-0.5 hover:bg-forest-dark'
                }`}
              >
                Create your chama
                <FiArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-navy transition hover:bg-navy/5 nav:hidden"
            >
              {open ? (
                <FiX size={22} strokeWidth={2.4} className="text-white" />
              ) : (
                <FiMenu size={22} strokeWidth={2.4} style={{ color: light ? '#fff' : 'currentColor' }} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain nav:hidden transition-opacity duration-500 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-[#071410]/96 backdrop-blur-2xl" />

        <div
          className="relative flex min-h-full flex-col"
          style={{
            transition: 'opacity .55s cubic-bezier(.76,0,.24,1), transform .55s cubic-bezier(.76,0,.24,1)',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          <div className="wrap flex items-center justify-between gap-3 py-3.5">
            <Link to="/" onClick={close} className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <img src={logo} alt="Chametu" className="h-6 w-6 object-contain" />
              </span>
              <span className="font-display text-[1.02rem] font-bold tracking-tight text-white">
                Chametu
              </span>
            </Link>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="grid h-10 w-10 place-items-center rounded-xl text-white transition hover:bg-white/10"
            >
              <FiX size={22} strokeWidth={2.4} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-1 px-6 pb-4">
            {LINKS.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                onClick={close}
                className="block w-full border-b border-white/10 py-4 text-center font-display text-[1.5rem] font-semibold text-white transition-all duration-500 hover:pl-3 min-[400px]:text-[1.75rem] sm:text-3xl"
                style={{
                  transitionDelay: open ? `${120 + i * 70}ms` : '0ms',
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(24px)',
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div
            className="wrap pb-[max(28px,env(safe-area-inset-bottom))] pt-4 transition-all duration-700"
            style={{
              transitionDelay: open ? '460ms' : '0ms',
              opacity: open ? 1 : 0,
              transform: open ? 'translateY(0)' : 'translateY(20px)',
            }}
          >
            <Link
              to="/register"
              onClick={close}
              className="flex w-full items-center justify-center gap-2 rounded-full !bg-[#F5B942] py-4 text-[0.95rem] font-bold !text-[#2E2200]"
            >
              Create your chama
              <FiArrowRight size={16} strokeWidth={2.4} />
            </Link>
            <div className="mt-4 flex items-center justify-center gap-4 text-[0.82rem] text-white/60">
              <Link to="/login" onClick={close} className="hover:text-white">Log in</Link>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <a href="#features" onClick={close} className="hover:text-white">Features</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}