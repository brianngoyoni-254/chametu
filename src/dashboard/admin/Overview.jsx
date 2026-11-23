// src/dashboard/admin/Overview.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Percent,
  ArrowLeftRight,
  TrendingUp,
  ArrowRight,
  Users,
  PiggyBank,
} from 'lucide-react'
import { useChama } from '../../context/ChamaContext'
import { ledgerApi } from '../../lib/ledgerApi'

const ksh = (n) => 'KSh ' + Math.round(n || 0).toLocaleString('en-KE')

export default function Overview() {
  const { members, loans, chama, contributions, sharedData } = useChama()

  const totalSavings = members.reduce(
    (s, m) => s + Number(m.savings || 0),
    0,
  )
  const activeMembers = members.filter((m) => m.status === 'active').length
  const outstandingLoans = loans
    .filter((l) => l.status === 'disbursed')
    .reduce((s, l) => s + Number(l.balance || 0), 0)
  const pendingLoansCount = loans.filter((l) => l.status === 'pending').length

  const assetsValue = (sharedData?.assets || []).reduce(
    (s, a) => s + Number(a.value || 0),
    0,
  )

  const monthCollected = Number(contributions?.totalCollected || 0)
  const monthExpected = Number(contributions?.totalExpected || 0)
  const contributionPct = contributions?.pct || 0

  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1180px] space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-1 truncate text-sm text-ink-soft">
            {chama?.name || 'My Chama'} / {activeMembers} active members
          </p>
        </div>
        <div className="rounded-lg border border-line bg-card px-3 py-1.5 text-xs font-medium text-ink-soft">
          {today}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        <Stat
          to="/dashboard/savings"
          label="Group savings"
          icon={Wallet}
          tint="bg-forest/10 text-forest"
          value={ksh(totalSavings)}
          sub={totalSavings > 0 ? 'Total from all members' : 'No savings yet'}
          subTone={totalSavings > 0 ? 'text-emerald' : 'text-ink-soft'}
        />
        <Stat
          to="/dashboard/contributions"
          label="Contributions"
          icon={Percent}
          tint="bg-emerald/10 text-emerald"
          value={ksh(monthCollected)}
          sub={
            monthExpected > 0
              ? `${contributionPct}% of ${ksh(monthExpected)}`
              : 'Nothing expected yet'
          }
          subTone={monthExpected > 0 ? 'text-emerald' : 'text-ink-soft'}
        />
        <Stat
          to="/dashboard/loans"
          label="Outstanding loans"
          icon={ArrowLeftRight}
          tint="bg-gold/15 text-[#8A6417]"
          value={ksh(outstandingLoans)}
          sub={
            pendingLoansCount > 0
              ? `${pendingLoansCount} pending approval`
              : outstandingLoans > 0
              ? 'No pending approvals'
              : 'No active loans'
          }
          subTone={pendingLoansCount > 0 ? 'text-red-600' : 'text-ink-soft'}
        />
        <Stat
          to="/dashboard/assets"
          label="Assets"
          icon={TrendingUp}
          tint="bg-line text-navy"
          value={ksh(assetsValue)}
          sub={assetsValue > 0 ? 'Total asset value' : 'No assets recorded'}
          subTone={assetsValue > 0 ? 'text-emerald' : 'text-ink-soft'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Card title="Members" to="/dashboard/members" linkLabel="Manage">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-forest/10 text-forest">
              <Users size={18} />
            </span>
            <div className="min-w-0">
              <div className="font-display text-lg font-bold text-navy">
                {members.length}
              </div>
              <div className="text-xs text-ink-soft">{activeMembers} active</div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
            <span className="flex items-center gap-2">
              <PiggyBank size={14} className="shrink-0" /> Total member savings
            </span>
            <b className="ml-auto font-mono text-navy">{ksh(totalSavings)}</b>
          </div>
        </Card>

        <Card title="Target profit" to="/dashboard/savings" linkLabel="View savings">
          <TargetRow />
        </Card>
      </div>
    </div>
  )
}

function TargetRow() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await ledgerApi.getSavings()
        if (!cancelled) setSummary(data.summary)
      } catch {
        // not logged in / not ready, silently ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const target = summary?.monthlyProfitTarget || 0
  const progress = summary?.progressPct || 0
  const net = summary?.monthNet || 0

  if (!target) {
    return (
      <p className="text-sm text-ink-soft">
        No monthly target set. Configure one in Settings → Chama.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="min-w-0 break-words text-ink-soft">
          <b className="font-mono text-navy">{ksh(net)}</b> of{' '}
          <b className="font-mono text-navy">{ksh(target)}</b>
        </span>
        <b
          className={`shrink-0 font-mono ${
            progress >= 100 ? 'text-forest' : 'text-navy'
          }`}
        >
          {progress}%
        </b>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  )
}

function Card({ title, to, linkLabel = 'View all', children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <h3 className="font-display text-sm font-semibold text-navy">{title}</h3>
        {to && (
          <Link
            to={to}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-forest hover:underline"
          >
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
      className="group block min-w-0 rounded-2xl border border-line bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/50 hover:shadow-md sm:p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs font-medium text-ink-soft">{label}</span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tint}`}
        >
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-2 break-words font-display text-xl font-bold tracking-tight text-navy sm:mt-3 sm:text-2xl">
        {value}
      </div>
      <div className={`mt-1.5 text-xs font-semibold ${subTone}`}>{sub}</div>
    </Link>
  )
}