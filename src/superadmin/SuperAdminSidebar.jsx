import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Building2, CreditCard, Smartphone, LifeBuoy, ShieldCheck, Settings, LogOut, X } from 'lucide-react'
import logo from '../assets/logos.png'

const LINKS = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/superadmin/chamas', icon: Building2, label: 'All chamas' },
  { to: '/superadmin/billing', icon: CreditCard, label: 'Billing & tiers' },
  { to: '/superadmin/payments', icon: Smartphone, label: 'Payments & M-Pesa' },
  { to: '/superadmin/support', icon: LifeBuoy, label: 'Support tickets' },
  { to: '/superadmin/audit', icon: ShieldCheck, label: 'Audit log' },
  { to: '/superadmin/settings', icon: Settings, label: 'Platform settings' },
]

export default function SuperAdminSidebar({ open, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (open && onClose) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  const handleLogout = () => {
    localStorage.removeItem('superadmin_session')
    navigate('/superadmin/login')
  }

  const Inner = () => (
    <>
      <div className="flex items-center gap-3 p-5 pb-7 sm:p-6 sm:pb-8">
        <img src={logo} alt="Chametu" className="h-9 w-9 rounded-xl object-contain bg-white/10 p-1 sm:h-10 sm:w-10" />
        <div>
          <div className="font-display text-[1.02rem] font-bold leading-none sm:text-[1.1rem]">Chametu</div>
          <div className="mt-1 text-[0.6rem] font-bold tracking-widest text-gold sm:text-[0.65rem]">SUPERADMIN</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-1 px-3 sm:px-4">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-3 text-[0.88rem] font-medium transition sm:px-4 sm:text-[0.9rem] ${
                isActive ? 'bg-white/10 text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <l.icon size={18} strokeWidth={2} className="opacity-80" />
            <span className="truncate">{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-navy border border-white/20 text-[0.8rem] font-bold">SA</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.85rem] font-semibold">Super Admin</div>
            <div className="truncate text-[0.7rem] text-white/50">Full platform access</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-[0.8rem] font-semibold text-white/60 transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
        >
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex w-[240px] xl:w-[260px] shrink-0 h-screen sticky top-0 flex-col overflow-y-auto bg-[#0B1B2B] text-white">
        <Inner />
      </aside>

      <div className={`fixed inset-0 z-50 lg:hidden transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div onClick={onClose} className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
        <aside className={`absolute left-0 top-0 flex h-full w-[min(82vw,300px)] flex-col overflow-y-auto bg-[#0B1B2B] text-white shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <Inner />
        </aside>
      </div>
    </>
  )
}