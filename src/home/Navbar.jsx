import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMenu, FiX } from 'react-icons/fi'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#rewards', label: 'Rewards' },
  { href: '#security', label: 'Security' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-50 border-b border-line bg-paper/92 backdrop-blur-sm">
      <div className="wrap flex items-center justify-between gap-3 py-[15px]">
        <Link to="/" className="flex shrink-0 items-center gap-[9px] text-[1.1rem] font-bold text-navy">
          <span className="relative block h-[29px] w-[29px] flex-none rounded-lg bg-[linear-gradient(155deg,#0B7A5A,#10B981)]">
            <span className="absolute left-[7px] top-[9px] h-[2px] w-[15px] bg-gold shadow-[0_6px_0_var(--color-gold),0_12px_0_rgba(255,255,255,.6)]" />
          </span>
          Chametu
        </Link>

        <nav className="hidden gap-7 text-[.92rem] font-medium text-navy nav:flex">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} className="opacity-[.78] transition-opacity hover:opacity-100">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden text-[.88rem] font-semibold text-navy opacity-75 nav:block">
            Log in
          </Link>
          <Link to="/register" className="btn btn-primary whitespace-nowrap max-[400px]:px-3 max-[400px]:text-[.82rem]">
            Create your chama
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
            <Link to="/login" onClick={close} className="font-semibold">
              Log in
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}