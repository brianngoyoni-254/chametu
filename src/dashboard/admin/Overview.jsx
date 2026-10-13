import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Percent, ArrowLeftRight, TrendingUp, AlertTriangle, Vote, CalendarDays,
  ArrowUpRight, ArrowRight, Smartphone, Users, HeartHandshake, UserPlus, FileText,
  PiggyBank, CheckCircle2,
} from 'lucide-react'
import { getOverviewData } from './data/adminData'
import { getChama } from '../../lib/chametuStorage'

const ksh = (n) => 'KSh ' + Math.round(n).toLocaleString('en-KE')
const compact = (n) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`
    : n >= 1_000
      ? `${Math.round(n / 1_000)}K`
      : String(n)

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

const ALLOC_COLORS = ['bg-forest', 'bg-emerald', 'bg-gold', 'bg-navy', 'bg-ink-soft']

function Card({ title, to, linkLabel = 'View all', children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-display text-sm font-semibold text-navy">{title}</h3>
        {to && (
          <Link to={to} className="flex items-center gap-1 text-xs font-semibold text-forest hover:underline">
            {linkLabel} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Stat({ to, label, value, sub, subTone, icon: Icon, tint }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/50 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tint}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight text-navy">{value}</div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className={`text-xs font-semibold ${subTone}`}>{sub}</span>
        <ArrowUpRight size={14} className="text-ink-soft opacity-0 transition group-hover:opacity-100" />
      </div>
    </Link>
  )
}

export default function Overview() {
  const d = useMemo(() => getOverviewData(), [])

  // Real chama name and current user
  const chama = getChama()
  const chamaName = chama?.name || 'My Chama'

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const alerts = [
    d.overdueContrib.length + d.unpaid.filter((u) => u.status === 'pending').length > 0 && {
      tone: 'amber',
      icon: AlertTriangle,
      to: '/dashboard/contributions',
      text: `${d.unpaid.length} member${d.unpaid.length > 1 ? 's' : ''} yet to pay this month's contribution`,
    },
    d.overdueLoans.length > 0 && {
      tone: 'red',
      icon: AlertTriangle,
      to: '/dashboard/loans',
      text: `${d.overdueLoans.length} overdue loan${d.overdueLoans.length > 1 ? 's' : ''} with ${ksh(d.overdueAmount)} outstanding`,
    },
    d.pendingLoans.length > 0 && {
      tone: 'amber',
      icon: ArrowLeftRight,
      to: '/dashboard/loans',
      text: `${d.pendingLoans.length} loan application${d.pendingLoans.length > 1 ? 's' : ''} awaiting approval`,
    },
    d.unmatchedPayments > 0 && {
      tone: 'amber',
      icon: Smartphone,
      to: '/dashboard/payments',
      text: `${d.unmatchedPayments} M-Pesa payment${d.unmatchedPayments > 1 ? 's' : ''} need matching to a member`,
    },
    d.openProposals.length > 0 && {
      tone: 'gold',
      icon: Vote,
      to: '/dashboard/voting',
      text: `${d.openProposals.length} open proposal${d.openProposals.length > 1 ? 's' : ''} need votes. ${d.openProposals[0].title}`,
    },
    d.welfarePending > 0 && {
      tone: 'amber',
      icon: HeartHandshake,
      to: '/dashboard/welfare',
      text: `${d.welfarePending} welfare claim${d.welfarePending > 1 ? 's' : ''} awaiting approval`,
    },
  ].filter(Boolean)

  const alertStyle = {
    red: 'bg-red-500/15 text-red-600',
    amber: 'bg-gold/15 text-[#8A6417]',
    gold: 'bg-gold/15 text-[#8A6112]',
  }

  const flowMax = Math.max(...d.ledger.flatMap((t) => [t.credit, t.debit]), 1)
  const flowRows = [...d.ledger].reverse()
  const allocTotal = d.allocation.reduce((s, a) => s + a.value, 0) || 1

  const quick = [
    { to: '/dashboard/invite', icon: UserPlus, label: 'Invite member' },
    { to: '/dashboard/transactions', icon: Wallet, label: 'Add transaction' },
    { to: '/dashboard/loans', icon: ArrowLeftRight, label: 'New loan' },
    { to: '/dashboard/meetings', icon: CalendarDays, label: 'Schedule meeting' },
    { to: '/dashboard/statements', icon: FileText, label: 'Statements' },
    { to: '/dashboard/reports', icon: TrendingUp, label: 'Reports' },
  ]

  return (
    <div className="mx-auto max-w-[1180px] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-navy">
            {greeting()}, Chairman
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {chamaName} / {d.memberCounts.active} active members
            {d.memberCounts.arrears > 0 && ` / ${d.memberCounts.arrears} in arrears`}
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
          label="Group balance"
          icon={Wallet}
          tint="bg-forest/10 text-forest"
          value={ksh(d.groupBalance)}
          sub={`Up ${ksh(d.moneyIn)} recently`}
          subTone="text-emerald"
        />
        <Stat
          to="/dashboard/contributions"
          label="Contributions"
          icon={Percent}
          tint="bg-emerald/10 text-emerald"
          value={ksh(d.collected)}
          sub={`${d.contribPct}% of ${ksh(d.expected)}`}
          subTone={d.contribPct >= 90 ? 'text-emerald' : 'text-[#8A6417]'}
        />
        <Stat
          to="/dashboard/loans"
          label="Outstanding loans"
          icon={ArrowLeftRight}
          tint="bg-gold/15 text-[#8A6417]"
          value={ksh(d.outstanding)}
          sub={d.overdueAmount > 0 ? `${ksh(d.overdueAmount)} overdue` : 'None overdue'}
          subTone={d.overdueAmount > 0 ? 'text-red-600' : 'text-emerald'}
        />
        <Stat
          to="/dashboard/portfolio"
          label="Investments"
          icon={TrendingUp}
          tint="bg-line text-navy"
          value={ksh(d.portfolioValue)}
          sub={`${d.gain >= 0 ? 'Up' : 'Down'} ${ksh(Math.abs(d.gain))}`}
          subTone={d.gain >= 0 ? 'text-emerald' : 'text-red-600'}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-6 gap-3 md:grid-cols-3 sm:grid-cols-2">
        {quick.map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-card px-3.5 py-3 text-[0.82rem] font-semibold text-navy transition hover:border-forest/60 hover:bg-forest/[0.03]"
          >
            <q.icon size={15} className="text-forest" /> {q.label}
          </Link>
        ))}
      </div>

      {/* Cash flow and contribution performance */}
      <div className="grid grid-cols-[1.5fr_1fr] gap-4 md:grid-cols-1">
        <Card title="Cash flow" to="/dashboard/transactions" linkLabel="Ledger">
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-forest/10 p-3">
              <div className="text-xs text-forest">Money in</div>
              <div className="mt-0.5 font-mono text-base font-bold text-navy">{ksh(d.moneyIn)}</div>
            </div>
            <div className="rounded-xl bg-gold/15 p-3">
              <div className="text-xs text-[#8A6417]">Money out</div>
              <div className="mt-0.5 font-mono text-base font-bold text-navy">{ksh(d.moneyOut)}</div>
            </div>
          </div>
          <div className="flex h-40 items-end gap-3">
            {flowRows.map((t, i) => (
              <div
                key={i}
                className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                title={t.desc}
              >
                <div className="flex h-32 w-full items-end justify-center gap-1">
                  <div
                    className="w-3 rounded-t bg-emerald transition-all"
                    style={{ height: `${(t.credit / flowMax) * 100}%` }}
                  />
                  <div
                    className="w-3 rounded-t bg-gold transition-all"
                    style={{ height: `${(t.debit / flowMax) * 100}%` }}
                  />
                </div>
                <span className="text-[11px] text-ink-soft">{t.date}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Contribution performance" to="/dashboard/contributions">
          <div
            className="relative mx-auto grid h-36 w-36 place-items-center rounded-full"
            style={{ background: `conic-gradient(#10B981 ${d.contribPct * 3.6}deg, #EDEAE0 0deg)` }}
          >
            <div className="absolute inset-3 rounded-full bg-card" />
            <div className="relative text-center">
              <div className="font-display text-2xl font-bold text-navy">{d.contribPct}%</div>
              <div className="text-xs text-ink-soft">of target</div>
            </div>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            {[
              ['Expected', ksh(d.expected)],
              ['Collected', ksh(d.collected)],
              ['Outstanding', ksh(d.expected - d.collected)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="font-mono font-medium text-navy">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {/* Needs attention */}
      <Card title="Needs attention">
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-emerald">
            <CheckCircle2 size={16} /> Everything is up to date.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-1">
            {alerts.map((a) => (
              <Link
                key={a.text}
                to={a.to}
                className="group flex items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm transition hover:border-forest/50 hover:bg-paper/60"
              >
                <span className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${alertStyle[a.tone]}`}>
                  <a.icon size={15} />
                </span>
                <span className="flex-1 text-navy">{a.text}</span>
                <ArrowRight
                  size={14}
                  className="text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-forest"
                />
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Recent transactions and side column */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 md:grid-cols-1">
        <Card title="Recent transactions" to="/dashboard/transactions">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  <th className="py-2">Date</th>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {d.ledger.slice(0, 6).map((t, i) => {
                  const credit = t.credit > 0
                  return (
                    <tr key={i} className="border-b border-line last:border-none">
                      <td className="py-2.5 text-ink-soft">{t.date}</td>
                      <td className="py-2.5">{t.desc}</td>
                      <td className={`py-2.5 text-right font-mono font-medium ${credit ? 'text-emerald' : 'text-red-600'}`}>
                        {credit ? '+ ' : '- '}
                        {(credit ? t.credit : t.debit).toLocaleString('en-KE')}
                      </td>
                      <td className="py-2.5 text-right font-mono text-navy">
                        {t.balance.toLocaleString('en-KE')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          {d.nextMeeting && (
            <Link
              to="/dashboard/meetings"
              className="block rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:border-forest/50"
            >
              <div className="flex items-center gap-1.5 font-mono text-xs text-gold">
                <CalendarDays size={13} /> {d.nextMeeting.date.toUpperCase()} / {d.nextMeeting.time}
              </div>
              <h5 className="mt-1.5 font-display text-sm font-semibold text-navy">
                {d.nextMeeting.title}
              </h5>
              <p className="mt-1 text-xs text-ink-soft">{d.nextMeeting.agenda}</p>
            </Link>
          )}

          {d.pendingLoans[0] && (
            <Link
              to="/dashboard/loans"
              className="block rounded-2xl border border-line bg-card p-5 shadow-sm transition hover:border-forest/50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Loan awaiting approval
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-navy">{d.pendingLoans[0].member}</span>
                <b className="font-mono text-navy">{ksh(d.pendingLoans[0].amount)}</b>
              </div>
              <div className="mt-3 text-xs font-semibold text-forest">Review application</div>
            </Link>
          )}

          <Card title="Members" to="/dashboard/members" linkLabel="Manage">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-forest/10 text-forest">
                <Users size={18} />
              </span>
              <div>
                <div className="font-display text-lg font-bold text-navy">{d.memberCounts.total}</div>
                <div className="text-xs text-ink-soft">
                  {d.memberCounts.active} active / {d.memberCounts.invited} invited / {d.memberCounts.arrears} arrears
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
              <PiggyBank size={14} /> Member savings
              <b className="ml-auto font-mono text-navy">{ksh(d.memberSavings)}</b>
            </div>
          </Card>
        </div>
      </div>

      {/* Portfolio allocation */}
      <Card title="Portfolio allocation" to="/dashboard/portfolio" linkLabel="Portfolio">
        <div className="flex h-3 overflow-hidden rounded-full bg-line">
          {d.allocation.map((a, i) => (
            <div
              key={a.type}
              className={ALLOC_COLORS[i % ALLOC_COLORS.length]}
              style={{ width: `${(a.value / allocTotal) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {d.allocation.map((a, i) => (
            <span key={a.type} className="flex items-center gap-2">
              <i className={`h-2.5 w-2.5 rounded-sm ${ALLOC_COLORS[i % ALLOC_COLORS.length]}`} />
              <span className="text-ink-soft">{a.type}</span>
              <b className="font-mono text-navy">{compact(a.value)}</b>
              <span className="text-xs text-ink-soft">{Math.round((a.value / allocTotal) * 100)}%</span>
            </span>
          ))}
        </div>
      </Card>
    </div>
  )
}