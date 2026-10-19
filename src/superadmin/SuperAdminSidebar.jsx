import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, CreditCard, Smartphone, ShieldCheck, Settings, LogOut } from 'lucide-react'
import logo from '../assets/logos.png' // <-- Import the logo

const LINKS = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/superadmin/chamas', icon: Building2, label: 'All chamas' },
  { to: '/superadmin/billing', icon: CreditCard, label: 'Billing & tiers' },
  { to: '/superadmin/payments', icon: Smartphone, label: 'Payments & M-Pesa' },
  { to: '/superadmin/audit', icon: ShieldCheck, label: 'Audit log' },
  { to: '/superadmin/settings', icon: Settings, label: 'Platform settings' },
]

export default function SuperAdminSidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('superadmin_session')
    navigate('/superadmin/login')
  }

  return (
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-[#0B1B2B] text-white overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 p-6 pb-8">
        <img 
          src={logo} 
          alt="Chametu" 
          className="h-10 w-10 rounded-xl object-contain bg-white/10 p-1" 
        />
        <div>
          <div className="font-display font-bold text-[1.1rem] leading-none">Chametu</div>
          <div className="text-[0.65rem] font-bold tracking-widest text-gold mt-1">SUPERADMIN</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-4">
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-[0.9rem] font-medium transition ${
                isActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <l.icon size={18} strokeWidth={2} className="opacity-80" />
            {l.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-6 border-t border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-navy border border-white/20 text-[0.8rem] font-bold">
            SA
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[0.85rem] font-semibold truncate">Super Admin</div>
            <div className="text-[0.7rem] text-white/50">Full platform access</div>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-[0.8rem] font-semibold text-white/60 transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )
}