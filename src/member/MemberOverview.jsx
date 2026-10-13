import { Link } from 'react-router-dom'
import {
  PiggyBank, Percent, ArrowRightLeft, Gauge, ArrowRight,
  CalendarDays, Sparkles, TrendingUp, CheckCircle2, Clock,
  Package, RefreshCw, Vote,
} from 'lucide-react'
import {
  getMemberSession,
  getChama,
  getMemberFinance,
  getMemberTransactions,
} from '../lib/chametuStorage'
import { useSharedState, SHARED_KEYS, DEFAULT_MEETINGS, DEFAULT_PROPOSALS } from '../lib/chametuShared'

function fmt(n) {
  return 'KSh ' + Math.round(n).toLocaleString('en-KE')
}

function fmtDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

export default function MemberOverview() {
  const session = getMemberSession()
  const chama = getChama()
  const finance = getMemberFinance(session)
  const tx = getMemberTransactions(session).slice(0, 4)
  const [meetings] = useSharedState(SHARED_KEYS.meetings, DEFAULT_MEETINGS)
  const [proposals] = useSharedState(SHARED_KEYS.proposals, DEFAULT_PROPOSALS)

  const loanLimit = finance.savings * (chama.maxLoanMultiple || 3)
  const loanUsed = finance.loan ? finance.loan.amount : 0
  const loanAvailable = Math.max(0, loanLimit - loanUsed)
  const contribPct = Math.min(
    100,
    Math.round((finance.contributions.paid / finance.contributions.expected) * 100)
  )
  const isContributionDone = finance.contributions.status === 'done'

  const nextMeeting = meetings.filter((m) => !m.locked)[0]
  const openProposals = proposals.filter((p) => Object.keys(p.votes || {}).length < 4)

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(400px 250px at 90% -20%, rgba(16,185,129,0.35), transparent)',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-emerald/80">
              <Sparkles size={11} />
              Member dashboard
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-[1.7rem]">
              Hi, {session.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 text-[0.86rem] text-white/70">
              Here's a snapshot of your account at{' '}
              <b className="font-semibold text-white">{chama.name}</b>
            </p>
          </div>
          <span className="rounded-full border border-white/20 bg-white/[0.08] px-3 py-1.5 text-[0.7rem] font-semibold capitalize text-white/90 backdrop-blur">
            {session.role} · Active
          </span>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur sm:gap-3 sm:p-4">
          <div className="text-center">
            <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-white/50">
              Savings
            </div>
            <div className="mt-1 font-mono text-[0.9rem] font-bold text-white sm:text-base">
              {fmt(finance.savings)}
            </div>
          </div>
          <div className="border-x border-white/10 text-center">
            <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-white/50">
              Loan limit
            </div>
            <div className="mt-1 font-mono text-[0.9rem] font-bold text-white sm:text-base">
              {fmt(loanLimit)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-white/50">
              Due this month
            </div>
            <div className="mt-1 font-mono text-[0.9rem] font-bold text-gold sm:text-base">
              {fmt(finance.contributions.expected)}
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <StatCard
          to="/member/savings"
          icon={PiggyBank}
          tint="from-emerald/15 to-emerald/5 text-forest"
          label="My savings"
          value={fmt(finance.savings)}
          sub="Growing every contribution"
        />
        <StatCard
          to="/member/loans"
          icon={Gauge}
          tint="from-navy/15 to-navy/5 text-navy"
          label="Loan available"
          value={fmt(loanAvailable)}
          sub={`of ${fmt(loanLimit)} limit`}
        />
        <StatCard
          to="/member/contributions"
          icon={Percent}
          tint="from-gold/20 to-gold/5 text-[#8A6417]"
          label="This month"
          value={`${contribPct}%`}
          sub={isContributionDone ? 'Fully paid ✓' : `${fmt(finance.contributions.paid)} paid`}
          success={isContributionDone}
        />
      </div>

      {/* What's happening in the chama */}
      <div>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="font-display text-sm font-semibold text-navy">
            What's happening in the chama
          </h3>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <UpdateCard
            to="/member/assets"
            icon={Package}
            tint="from-forest to-emerald"
            label="Assets"
            title="Chama property"
            sub="See what we've acquired"
          />
          <UpdateCard
            to="/member/meetings"
            icon={CalendarDays}
            tint="from-gold to-[#E8A21F]"
            label="Meetings"
            title={nextMeeting ? nextMeeting.title : 'No meetings yet'}
            sub={nextMeeting ? `${fmtDate(nextMeeting.date)} · ${nextMeeting.time}` : 'Stay tuned'}
          />
          <UpdateCard
            to="/member/rotation"
            icon={RefreshCw}
            tint="from-navy to-[#0A2A3E]"
            label="Rotation"
            title="Who's next?"
            sub="Check the merry-go-round order"
          />
          <UpdateCard
            to="/member/voting"
            icon={Vote}
            tint="from-emerald to-[#0A7A5A]"
            label="Voting"
            title={`${openProposals.length} open proposal${openProposals.length !== 1 ? 's' : ''}`}
            sub="Have your say"
            badge={openProposals.length > 0}
          />
        </div>
      </div>

      {/* Two-column: activity + next step */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">
              Recent activity
            </h3>
            <Link
              to="/member/transactions"
              className="flex items-center gap-1 text-xs font-semibold text-forest transition hover:gap-1.5"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {tx.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-8 text-center">
              <Clock size={20} className="mx-auto text-ink-soft/60" />
              <p className="mt-2 text-sm text-ink-soft">No transactions yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tx.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-line/70 px-3.5 py-2.5 transition hover:border-forest/40 hover:bg-forest/[0.02]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                        t.amount > 0 ? 'bg-emerald/10 text-forest' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      <ArrowRightLeft size={13} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[0.84rem] font-medium text-navy">
                        {t.desc}
                      </div>
                      <div className="text-[0.7rem] text-ink-soft">{t.date}</div>
                    </div>
                  </div>
                  <span
                    className={`ml-2 flex-none font-mono text-[0.82rem] font-semibold ${
                      t.amount > 0 ? 'text-emerald' : 'text-red-600'
                    }`}
                  >
                    {t.amount > 0 ? '+' : ''}
                    {t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-ink-soft">
              <CalendarDays size={12} />
              Next contribution
            </div>
            <div className="mt-2 font-display text-lg font-bold text-navy">
              Due on the {chama.due}th
            </div>
            <p className="mt-1 text-[0.82rem] text-ink-soft">
              {fmt(chama.amount)} · {chama.grace}-day grace period
            </p>

            {isContributionDone ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald/10 py-2.5 text-[0.84rem] font-semibold text-forest">
                <CheckCircle2 size={15} />
                Paid for this month
              </div>
            ) : (
              <Link
                to="/member/contributions"
                className="mt-4 block rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-center text-[0.84rem] font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Pay now
              </Link>
            )}
          </div>

          {finance.loan && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-navy">
                  <TrendingUp size={14} className="text-forest" />
                  Active loan
                </h3>
                <Link
                  to="/member/loans"
                  className="flex items-center gap-1 text-[0.7rem] font-semibold text-forest"
                >
                  View <ArrowRight size={11} />
                </Link>
              </div>
              <div className="font-mono text-xl font-bold text-navy">
                {fmt(finance.loan.balance)}
              </div>
              <div className="text-[0.72rem] text-ink-soft">
                remaining of {fmt(finance.loan.amount)}
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-forest to-emerald"
                  style={{
                    width: `${Math.round(
                      ((finance.loan.amount - finance.loan.balance) / finance.loan.amount) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ to, icon: Icon, tint, label, value, sub, success }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="text-[0.72rem] font-medium text-ink-soft">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${tint}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-3 font-display font-mono text-xl font-bold tracking-tight text-navy">
        {value}
      </div>
      <div
        className={`mt-1 flex items-center gap-1 text-[0.72rem] font-medium ${
          success ? 'text-emerald' : 'text-ink-soft'
        }`}
      >
        {success && <CheckCircle2 size={11} />}
        {sub}
      </div>
      <ArrowRight
        size={13}
        className="absolute bottom-4 right-4 text-ink-soft opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </Link>
  )
}

function UpdateCard({ to, icon: Icon, tint, label, title, sub, badge }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-line bg-white p-4.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
    >
      {badge && (
        <span className="absolute right-3.5 top-3.5 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1.5 text-[0.62rem] font-bold text-white">
          New
        </span>
      )}
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-sm`}
      >
        <Icon size={16} />
      </span>
      <div className="mt-3 text-[0.62rem] font-bold uppercase tracking-widest text-ink-soft">
        {label}
      </div>
      <div className="mt-1 truncate font-display text-[0.95rem] font-semibold text-navy">
        {title}
      </div>
      <div className="mt-0.5 truncate text-[0.74rem] text-ink-soft">{sub}</div>
      <ArrowRight
        size={12}
        className="absolute bottom-4 right-4 text-ink-soft opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </Link>
  )
}