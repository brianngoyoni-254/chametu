import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Percent, PiggyBank, ArrowRightLeft, Receipt,
  Heart, User, X, Sparkles, Package, CalendarDays, RefreshCw, Vote,
} from 'lucide-react'
import logo from '../assets/logos.png'

const GROUPS = [
  {
    label: 'My account',
    links: [
      { to: '/member', icon: LayoutDashboard, label: 'Overview', end: true },
      { to: '/member/contributions', icon: Percent, label: 'Contributions' },
      { to: '/member/savings', icon: PiggyBank, label: 'My Savings' },
      { to: '/member/loans', icon: ArrowRightLeft, label: 'My Loan' },
      { to: '/member/transactions', icon: Receipt, label: 'Transactions' },
    ],
  },
  {
    label: 'The chama',
    links: [
      { to: '/member/assets', icon: Package, label: 'Assets' },
      { to: '/member/meetings', icon: CalendarDays, label: 'Meetings' },
      { to: '/member/rotation', icon: RefreshCw, label: 'Payout Rotation' },
      { to: '/member/voting', icon: Vote, label: 'Voting' },
      { to: '/member/welfare', icon: Heart, label: 'Welfare' },
    ],
  },
  {
    label: 'Me',
    links: [{ to: '/member/profile', icon: User, label: 'My Profile' }],
  },
]

export default function MemberSidebar({ open, onClose, chamaName }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/*
        Sidebar is a brand element — always dark, in both light and dark
        themes. That's why the gradient uses a hardcoded #0B1F33 instead of
        the themeable `from-navy` (which flips to a light colour in dark
        mode). Everything inside the sidebar (text-white/*, bg-emerald/25,
        bg-white/[0.06], etc.) is likewise hardcoded and does not respond
        to the theme.
      */}
      <aside
        className={`fixed z-50 flex h-screen w-[272px] flex-col overflow-y-auto bg-gradient-to-b from-[#0B1F33] via-[#0A2A3E] to-[#08222A] p-4 text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-2.5 pb-5 pt-1.5">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-emerald/40 blur-md" />
              <img
                src={logo}
                alt="Chametu"
                className="relative h-9 w-9 rounded-xl object-contain ring-1 ring-white/20"
              />
            </div>
            <div>
              <div className="font-display text-[0.95rem] font-bold leading-none tracking-tight">
                Chametu
              </div>
              <div className="mt-1 text-[0.62rem] font-medium tracking-wide text-emerald/80">
                MEMBER PORTAL
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* Chama pill */}
        <div className="mx-2 mb-4 rounded-2xl border border-white/10 bg-white/[0.06] px-3.5 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald/25">
              <Sparkles size={11} className="text-emerald" />
            </span>
            <span className="text-[0.62rem] font-bold uppercase tracking-widest text-white/50">
              Your chama
            </span>
          </div>
          <div className="mt-2 truncate font-display text-[0.88rem] font-semibold text-white">
            {chamaName || 'My Chama'}
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex flex-col gap-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 px-3.5 text-[0.6rem] font-bold uppercase tracking-widest text-white/35">
                {group.label}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.86rem] font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald/25 to-emerald/5 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.3)]'
                          : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-emerald" />
                        )}
                        <l.icon
                          size={16}
                          strokeWidth={2}
                          className={`shrink-0 transition ${
                            isActive ? 'text-emerald' : 'opacity-80 group-hover:opacity-100'
                          }`}
                        />
                        {l.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer note */}
        <div className="mt-auto pt-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-[0.68rem] leading-relaxed text-white/50">
            <div className="font-semibold text-white/70">Read-only access</div>
            You can view your records, vote on proposals and submit requests. Only admins can edit
            chama settings.
          </div>
        </div>
      </aside>
    </>
  )
}