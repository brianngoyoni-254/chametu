import { Link } from 'react-router-dom'
import { FiMapPin, FiHeart } from 'react-icons/fi'
import logo from '../assets/logos.png'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#features', label: 'Features' },
      { href: '#rewards', label: 'Rewards' },
      { href: '#security', label: 'Security' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { to: '/register', label: 'Create your chama' },
      { to: '/login', label: 'Log in' },
    ],
  },
]

const linkClass = 'text-[.88rem] text-ink-soft transition-colors hover:text-forest'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-card">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-[40ch]">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest/10">
              <img src={logo} alt="" className="h-6 w-6 object-contain" />
            </span>
            <span className="font-display text-[1.05rem] font-bold tracking-tight text-navy">Chametu</span>
          </Link>
          <p className="mt-4 text-[.9rem] leading-relaxed text-ink-soft">
            One secure ledger for chamas, SACCOs and investment groups, built for how Kenyan groups save,
            lend and grow together.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-display text-[.9rem] font-semibold text-navy">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to ? (
                    <Link to={l.to} className={linkClass}>
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} className={linkClass}>
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="wrap flex flex-wrap items-center justify-between gap-3 py-5 text-[.8rem] text-ink-soft">
          <div className="flex flex-wrap items-center gap-2">
            <span>&copy; 2026 Chametu</span>
            <span className="text-line" aria-hidden="true">|</span>
            <span className="inline-flex items-center gap-1.5">
              Made with
              <FiHeart size={12} className="text-forest" aria-hidden="true" />
              in Kenya
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <FiMapPin size={13} className="text-forest" aria-hidden="true" />
            <span>Nairobi, Kenya</span>
          </div>
        </div>
      </div>
    </footer>
  )
}