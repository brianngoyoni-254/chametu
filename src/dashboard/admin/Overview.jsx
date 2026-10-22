import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Percent, ArrowLeftRight, TrendingUp, AlertTriangle, Vote, CalendarDays,
  ArrowUpRight, ArrowRight, Smartphone, Users, HeartHandshake, UserPlus, FileText,
  PiggyBank, CheckCircle2,
} from 'lucide-react'
import { useChama } from '../../context/ChamaContext'

const ksh = (n) => 'KSh ' + Math.round(n || 0).toLocaleString('en-KE')

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Overview() {
  const { members, loans, chama } = useChama()
  const chamaName = chama?.name || 'My Chama'
  
  // Real Stats calculation
  const totalSavings = members.reduce((sum, m) => sum + Number(m.savings || 0), 0)
  const activeMembers = members.filter(m => m.status === 'active').length
  const outstandingLoans = loans.filter(l => l.status === 'disbursed').reduce((sum, l) => sum + Number(l.balance || 0), 0)
  const pendingLoansCount = loans.filter(l => l.status === 'pending').length

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            {greeting()}, Chairman
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {chamaName} / {activeMembers} active members
          </p>
        </div>
        <div className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft">
          {today}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 md:grid-cols-2 sm:grid-cols-1">
        <Stat
          to="/dashboard/transactions"
          label="Group savings"
          icon={Wallet}
          tint="bg-forest/10 text-forest"
          value={ksh(totalSavings)}
          sub="Total from all members"
          subTone="text-emerald"
        />
        <Stat
          to="/dashboard/contributions"
          label="Contributions"
          icon={Percent}
          tint="bg-emerald/10 text-emerald"
          value={ksh(totalSavings)} // Placeholder until contribution route exists
          sub="This month"
          subTone="text-emerald"
        />
        <Stat
          to="/dashboard/loans"
          label="Outstanding loans"
          icon={ArrowLeftRight}
          tint="bg-gold/15 text-[#8A6417]"
          value={ksh(outstandingLoans)}
          sub={pendingLoansCount > 0 ? `${pendingLoansCount} pending approval` : 'None pending'}
          subTone={pendingLoansCount > 0 ? 'text-red-600' : 'text-emerald'}
        />
        <Stat
          to="/dashboard/portfolio"
          label="Investments"
          icon={TrendingUp}
          tint="bg-line text-navy"
          value={ksh(0)}
          sub="No investments yet"
          subTone="text-ink-soft"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-6 gap-3 md:grid-cols-3 sm:grid-cols-2">
        {[
          { to: '/dashboard/members', icon: UserPlus, label: 'Invite member' },
          { to: '/dashboard/transactions', icon: Wallet, label: 'Add transaction' },
          { to: '/dashboard/loans', icon: ArrowLeftRight, label: 'New loan' },
          { to: '/dashboard/meetings', icon: CalendarDays, label: 'Schedule meeting' },
          { to: '/dashboard/statements', icon: FileText, label: 'Statements' },
          { to: '/dashboard/reports', icon: TrendingUp, label: 'Reports' },
        ].map((q) => (
          <Link key={q.label} to={q.to} className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-3 text-[0.82rem] font-semibold text-navy transition hover:border-forest/60 hover:bg-forest/[0.03]">
            <q.icon size={15} className="text-forest" /> {q.label}
          </Link>
        ))}
      </div>

      {/* Needs attention (Dynamic) */}
      <Card title="Needs attention">
        {pendingLoansCount === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald"><CheckCircle2 size={16} /> Everything is up to date.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1">
            <Link to="/dashboard/loans" className="group flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm transition hover:border-forest/50 hover:bg-paper/60">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gold/15 text-[#8A6417]"><AlertTriangle size={15} /></span>
              <span className="flex-1 text-navy">{pendingLoansCount} loan application(s) awaiting approval</span>
              <ArrowRight size={14} className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-forest" />
            </Link>
          </div>
        )}
      </Card>

      {/* Members Summary */}
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
      <div className="mt-1.5 flex items-center justify-between">
        <span className={`text-xs font-semibold ${subTone}`}>{sub}</span>
        <ArrowUpRight size={14} className="text-ink-soft opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  )
}