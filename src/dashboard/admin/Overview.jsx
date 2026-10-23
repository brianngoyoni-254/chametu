// src/dashboard/admin/Overview.jsx
import { Link } from 'react-router-dom'
import {
  Wallet, Percent, ArrowLeftRight, TrendingUp, AlertTriangle, 
  ArrowRight, Smartphone, Users, CheckCircle2, PiggyBank
} from 'lucide-react'
import { useChama } from '../../context/ChamaContext'

const ksh = (n) => 'KSh ' + Math.round(n || 0).toLocaleString('en-KE')
const compact = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n/1000)}K` : String(n)

export default function Overview() {
  const { members, loans, chama } = useChama()
  
  const totalSavings = members.reduce((s, m) => s + Number(m.savings || 0), 0)
  const activeMembers = members.filter(m => m.status === 'active').length
  const outstandingLoans = loans.filter(l => l.status === 'disbursed').reduce((s, l) => s + Number(l.balance || 0), 0)
  const pendingLoansCount = loans.filter(l => l.status === 'pending').length

  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-soft">{chama?.name || 'My Chama'} / {activeMembers} active members</p>
        </div>
        <div className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft">{today}</div>
      </div>

      <div className="grid grid-cols-4 gap-4 md:grid-cols-2 sm:grid-cols-1">
        <Stat to="/dashboard/transactions" label="Group savings" icon={Wallet} tint="bg-forest/10 text-forest" value={ksh(totalSavings)} sub="Total from all members" subTone="text-emerald" />
        <Stat to="/dashboard/contributions" label="Contributions" icon={Percent} tint="bg-emerald/10 text-emerald" value={ksh(totalSavings)} sub="This month" subTone="text-emerald" />
        <Stat to="/dashboard/loans" label="Outstanding loans" icon={ArrowLeftRight} tint="bg-gold/15 text-[#8A6417]" value={ksh(outstandingLoans)} sub={pendingLoansCount > 0 ? `${pendingLoansCount} pending approval` : 'None pending'} subTone={pendingLoansCount > 0 ? 'text-red-600' : 'text-emerald'} />
        <Stat to="/dashboard/portfolio" label="Investments" icon={TrendingUp} tint="bg-line text-navy" value={ksh(0)} sub="No investments yet" subTone="text-ink-soft" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card title="Members" to="/dashboard/members" linkLabel="Manage">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest/10 text-forest"><Users size={18} /></span>
            <div>
              <div className="font-display text-lg font-bold text-navy">{members.length}</div>
              <div className="text-xs text-ink-soft">{activeMembers} active</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
            <PiggyBank size={14} /> Total Member savings
            <b className="ml-auto font-mono text-navy">{ksh(totalSavings)}</b>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Card({ title, to, linkLabel = 'View all', children }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-navy">{title}</h3>
        {to && <Link to={to} className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline">{linkLabel} <ArrowRight size={12} /></Link>}
      </div>
      {children}
    </section>
  )
}

function Stat({ to, label, value, sub, subTone, icon: Icon, tint }) {
  return (
    <Link to={to} className="group rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/50 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tint}`}><Icon size={16} /></span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight text-navy">{value}</div>
      <div className={`mt-1.5 text-xs font-semibold ${subTone}`}>{sub}</div>
    </Link>
  )
}