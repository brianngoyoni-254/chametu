import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const close = () => setOpen(false)
  const light = !scrolled && !open

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          light
            ? 'border-b border-transparent bg-transparent'
            : 'border-b border-line bg-paper/92 backdrop-blur-md'
        }`}
      >
        <div className="wrap flex items-center justify-between gap-3 py-4">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                light ? 'bg-white/15 backdrop-blur' : 'bg-forest/10'
              }`}
            >
              <img src={logo} alt="Chametu" className="h-6 w-6 object-contain" />
            </span>
            <span
              className={`font-display text-[1.05rem] font-bold tracking-tight transition ${
                light ? 'text-white' : 'text-navy'
              }`}
            >
              Chametu
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-7 text-[0.9rem] font-medium nav:flex">
            {LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={`transition-colors ${
                  light ? 'text-white/80 hover:text-white' : 'text-navy/75 hover:text-navy'
                }`}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right cluster: theme toggle, desktop actions, mobile hamburger */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {/* Desktop actions */}
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
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-[0.88rem] font-semibold transition ${
                  light
                    ? '!bg-[#F5B942] !text-[#2E2200] hover:-translate-y-0.5 hover:!bg-[#FFC857]'
                    : 'bg-forest text-white hover:bg-forest-dark'
                }`}
              >
                Create your chama
                <FiArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>

            {/* Animated hamburger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="relative flex h-9 w-9 flex-col items-center justify-center gap-[5px] text-navy nav:hidden"
            >
              <span
                className="hamburger-line w-6"
                style={{
                  transform: open ? 'translateY(7px) rotate(45deg)' : 'none',
                  background: open || light ? '#ffffff' : 'currentColor',
                }}
              />
              <span
                className="hamburger-line w-4"
                style={{
                  opacity: open ? 0 : 1,
                  transform: open ? 'translateX(8px)' : 'none',
                  background: open || light ? '#ffffff' : 'currentColor',
                }}
              />
              <span
                className="hamburger-line w-6"
                style={{
                  transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none',
                  background: open || light ? '#ffffff' : 'currentColor',
                }}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-50 nav:hidden transition-opacity duration-700 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-[#071410]/95 backdrop-blur-xl" />

        <div
          className="relative flex h-full flex-col"
          style={{
            transition:
              'opacity .7s cubic-bezier(.76,0,.24,1), transform .7s cubic-bezier(.76,0,.24,1)',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          {/* Header */}
          <div className="wrap flex items-center justify-between gap-3 py-4">
            <Link to="/" onClick={close} className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <img src={logo} alt="Chametu" className="h-6 w-6 object-contain" />
              </span>
              <span className="font-display text-[1.05rem] font-bold tracking-tight text-white">
                Chametu
              </span>
            </Link>

            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="relative flex h-9 w-9 items-center justify-center"
            >
              <span
                className="hamburger-line absolute w-6"
                style={{ transform: 'rotate(45deg)', background: '#ffffff' }}
              />
              <span
                className="hamburger-line absolute w-6"
                style={{ transform: 'rotate(-45deg)', background: '#ffffff' }}
              />
            </button>
          </div>

          {/* Links */}
          <nav className="flex flex-1 flex-col items-center justify-center gap-1 px-6">
            {LINKS.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                onClick={close}
                className="block w-full max-w-[520px] border-b border-white/10 py-4 text-center font-serif text-4xl text-white transition-all duration-500 hover:pl-4 sm:text-5xl"
                style={{
                  transitionDelay: open ? `${150 + i * 80}ms` : '0ms',
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateY(0)' : 'translateY(32px)',
                }}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Footer CTA */}
          <div
            className="wrap pb-8 pt-4 transition-all duration-700"
            style={{
              transitionDelay: open ? '550ms' : '0ms',
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
              <Link to="/login" onClick={close} className="hover:text-white">
                Log in
              </Link>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <a href="#features" onClick={close} className="hover:text-white">
                Features
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}