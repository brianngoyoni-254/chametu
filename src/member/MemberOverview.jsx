// src/member/MemberOverview.jsx
import { Link } from 'react-router-dom'
import {
  PiggyBank, Percent, ArrowRightLeft, Gauge, ArrowRight,
  CalendarDays, Sparkles, TrendingUp, CheckCircle2, Clock,
  Package, RefreshCw, Vote, Wallet, Users, ArrowUpRight,
  CircleDollarSign, Landmark, Bell, UserRound, Loader2, AlertCircle,
} from 'lucide-react'
import { useMember } from '../context/MemberContext'

function fmt(n) {
  return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE')
}

function fmtCompact(n) {
  const abs = Math.abs(Number(n) || 0)
  if (abs >= 1_000_000) {
    return (Number(n) / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  }
  if (abs >= 1_000) return Math.round(Number(n) / 1_000) + 'K'
  return String(Math.round(Number(n) || 0))
}

function fmtDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return d
  }
}

function daysUntil(d) {
  if (!d) return null
  const target = new Date(d)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / (1000 * 60 * 60 * 24))
}

export default function MemberOverview() {
  const {
    profile,
    chama,
    savings,
    loans,
    contributions,
    savingsHistory,
    transactions,
    shared,
    isLoading,
    error,
    activeLoans,
    pendingLoan,
    loanUsed,
    loanAvailable,
    loanLimit,
    refetch,
  } = useMember()

  if (isLoading && !profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={26} className="animate-spin text-forest" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle size={22} className="mx-auto text-red-600" />
        <p className="mt-2 text-sm font-semibold text-red-700">{error}</p>
        <button
          onClick={refetch}
          className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const firstName = (profile?.name || 'there').split(' ')[0]
  const chamaName = chama?.name || 'your chama'

  const assets = shared?.assets || []
  const meetings = shared?.meetings || []
  const proposals = shared?.proposals || []
  const payout = shared?.payout

  const assetValue = assets.reduce((s, a) => s + Number(a.value || 0), 0)
  const openProposals = proposals.length

  const nextMeeting = meetings
    .filter((m) => !m.locked)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0]
  const daysToNext = nextMeeting ? daysUntil(nextMeeting.date) : null

  const currentPeriodContrib = contributions[0]
  const contribPaid = Number(currentPeriodContrib?.amount || 0)
  const contribExpected = Number(chama?.monthly_contribution || 0)
  const contribPct = contribExpected
    ? Math.min(100, Math.round((contribPaid / contribExpected) * 100))
    : 0
  const isContributionDone = contribExpected > 0 && contribPaid >= contribExpected

  const recentTx = transactions.slice(0, 5)

  const activeLoansList = activeLoans || []
  const totalLoanBalance = activeLoansList.reduce(
    (s, l) => s + Number(l.balance || 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(500px 300px at 95% -20%, rgba(16,185,129,0.35), transparent), radial-gradient(400px 260px at -10% 110%, rgba(245,185,66,0.12), transparent)',
          }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-1.5 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-emerald/85">
              <Sparkles size={11} />
              Member dashboard
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.68rem] font-semibold capitalize text-white/90 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              {profile?.role || 'Member'}
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
            Hi, {firstName}
          </h1>
          <p className="mt-1 max-w-[52ch] text-[0.88rem] leading-relaxed text-white/70">
            Here is what is happening at{' '}
            <b className="font-semibold text-white">{chamaName}</b> right now.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur sm:grid-cols-4 sm:gap-3 sm:p-4">
            <HeroStat
              icon={Wallet}
              label="Your savings"
              value={fmtCompact(savings)}
            />
            <HeroStat
              icon={Percent}
              label="Collected"
              value={fmtCompact(contribPaid)}
              sub={`${contribPct}%`}
              border
            />
            <HeroStat
              icon={ArrowRightLeft}
              label="Loans out"
              value={fmtCompact(totalLoanBalance)}
              sub={`${activeLoansList.length} active`}
              border
            />
            <HeroStat
              icon={TrendingUp}
              label="Chama assets"
              value={fmtCompact(assetValue)}
              sub={`${assets.length} item${assets.length === 1 ? '' : 's'}`}
              border
            />
          </div>
        </div>
      </div>

      {/* Your account */}
      <section>
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.02rem] font-bold text-navy">
              Your account
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              A snapshot of your savings, loans and this month
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <PersonalCard
            to="/member/savings"
            icon={PiggyBank}
            label="My savings"
            value={fmt(savings)}
            sub="Grows with every contribution"
            accent="from-emerald/15 to-emerald/5 text-forest"
          />
          <PersonalCard
            to="/member/loans"
            icon={Gauge}
            label="Loan available"
            value={fmt(loanAvailable)}
            sub={`of ${fmt(loanLimit)} limit`}
            accent="from-navy/15 to-navy/5 text-navy"
          />
          <PersonalCard
            to="/member/contributions"
            icon={Percent}
            label="This month"
            value={isContributionDone ? 'Fully paid' : `${contribPct}%`}
            sub={
              isContributionDone
                ? 'Well done'
                : `${fmt(contribPaid)} of ${fmt(contribExpected)}`
            }
            accent="from-gold/20 to-gold/5 text-[#8A6417]"
            success={isContributionDone}
          />
        </div>
      </section>

      {/* Chama at a glance */}
      <section>
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.02rem] font-bold text-navy">
              Chama at a glance
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              What the group owns and owes
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard
            icon={CircleDollarSign}
            tone="forest"
            label="Your savings"
            value={fmt(savings)}
            footer={`${savingsHistory.length} ledger entries`}
            footerTone="text-ink-soft"
          />
          <SnapshotCard
            icon={Landmark}
            tone="gold"
            label="Monthly contribution"
            value={fmt(contribExpected)}
            footer={
              isContributionDone ? 'Paid this month' : `${contribPct}% paid`
            }
            footerTone={isContributionDone ? 'text-emerald' : 'text-[#8A6417]'}
            progress={contribPct}
          />
          <SnapshotCard
            icon={ArrowRightLeft}
            tone="navy"
            label="Your loan balance"
            value={fmt(totalLoanBalance)}
            footer={
              activeLoansList.length > 0
                ? `${activeLoansList.length} active loan${activeLoansList.length === 1 ? '' : 's'}`
                : pendingLoan
                ? 'Application pending'
                : 'No active loan'
            }
            footerTone={
              totalLoanBalance > 0
                ? 'text-[#8A6417]'
                : pendingLoan
                ? 'text-[#8A6417]'
                : 'text-ink-soft'
            }
          />
          <SnapshotCard
            icon={TrendingUp}
            tone="emerald"
            label="Chama assets"
            value={fmt(assetValue)}
            footer={`${assets.length} item${assets.length === 1 ? '' : 's'}`}
            footerTone="text-emerald"
          />
        </div>
      </section>

      {/* Happening in the chama */}
      <section>
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.02rem] font-bold text-navy">
              Happening in the chama
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              Assets, meetings, payouts and decisions
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <UpdateCard
            to="/member/assets"
            icon={Package}
            gradient="from-forest to-emerald"
            label="Assets"
            title={`${assets.length} item${assets.length === 1 ? '' : 's'}`}
            sub={`Valued at ${fmt(assetValue)}`}
          />
          <UpdateCard
            to="/member/meetings"
            icon={CalendarDays}
            gradient="from-gold to-[#E8A21F]"
            label="Next meeting"
            title={nextMeeting ? nextMeeting.title : 'None scheduled'}
            sub={
              nextMeeting
                ? `${fmtDate(nextMeeting.date)} / ${
                    daysToNext === 0
                      ? 'Today'
                      : daysToNext === 1
                      ? 'Tomorrow'
                      : daysToNext > 0
                      ? `In ${daysToNext} days`
                      : `${Math.abs(daysToNext)} days ago`
                  }`
                : 'Stay tuned for updates'
            }
          />
          <UpdateCard
            to="/member/rotation"
            icon={RefreshCw}
            gradient="from-navy to-[#0A2A3E]"
            label="Rotation"
            title={
              payout?.order?.length
                ? `${payout.order.length} members`
                : 'See who is next'
            }
            sub={
              payout?.order?.length
                ? 'Check your position'
                : 'Check the payout order'
            }
          />
          <UpdateCard
            to="/member/voting"
            icon={Vote}
            gradient="from-emerald to-[#0A7A5A]"
            label="Voting"
            title={`${openProposals} open`}
            sub="Have your say"
            badge={openProposals > 0}
          />
        </div>
      </section>

      {/* Recent activity + next steps */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-sm font-bold text-navy">
                Your recent activity
              </h3>
              <p className="mt-0.5 text-[0.72rem] text-ink-soft">
                Everything on your account
              </p>
            </div>
            <Link
              to="/member/transactions"
              className="flex items-center gap-1 text-xs font-semibold text-forest transition hover:gap-1.5"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentTx.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-10 text-center">
              <Clock size={20} className="mx-auto text-ink-soft/60" />
              <p className="mt-2 text-sm text-ink-soft">
                No transactions on your account yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map((t, i) => {
                const isDebit =
                  t.type === 'debit' || t.type === 'loan_disbursement'
                return (
                  <div
                    key={t.id || i}
                    className="flex items-center justify-between rounded-xl border border-line/70 px-3.5 py-2.5 transition hover:border-forest/40 hover:bg-forest/[0.02]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                          isDebit
                            ? 'bg-red-500/15 text-red-600'
                            : 'bg-emerald/10 text-forest'
                        }`}
                      >
                        <ArrowRightLeft size={13} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-[0.84rem] font-medium text-navy">
                          {t.reference || t.type}
                        </div>
                        <div className="text-[0.7rem] text-ink-soft">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString()
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`ml-2 flex-none font-mono text-[0.82rem] font-semibold ${
                        isDebit ? 'text-red-600' : 'text-emerald'
                      }`}
                    >
                      {isDebit ? '−' : '+'}
                      {Number(t.amount || 0).toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              <Bell size={12} className="text-gold" />
              Next contribution
            </div>
            <div className="mt-2">
              <div className="font-display text-lg font-bold text-navy">
                Due on the {chama?.due_day || 30}th
              </div>
              <p className="mt-0.5 text-[0.78rem] text-ink-soft">
                {fmt(contribExpected)} / month
              </p>
            </div>

            {isContributionDone ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald/10 py-2.5 text-[0.84rem] font-semibold text-forest ring-1 ring-emerald/20">
                <CheckCircle2 size={15} />
                Paid for this month
              </div>
            ) : (
              <Link
                to="/member/contributions"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-[0.84rem] font-semibold text-white shadow-[0_6px_16px_rgba(11,122,90,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(11,122,90,0.28)]"
              >
                Pay now
                <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {(activeLoansList.length > 0 || pendingLoan) && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
                  <TrendingUp size={14} className="text-forest" />
                  {pendingLoan && activeLoansList.length === 0
                    ? 'Pending loan'
                    : 'Active loans'}
                </h3>
                <Link
                  to="/member/loans"
                  className="flex items-center gap-1 text-[0.7rem] font-semibold text-forest"
                >
                  View <ArrowRight size={11} />
                </Link>
              </div>

              {pendingLoan ? (
                <>
                  <div className="font-mono text-xl font-bold text-navy">
                    {fmt(pendingLoan.amount)}
                  </div>
                  <div className="text-[0.72rem] text-ink-soft">
                    {pendingLoan.status === 'approved'
                      ? 'Approved — awaiting disbursement'
                      : 'Awaiting treasurer approval'}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-mono text-xl font-bold text-navy">
                    {fmt(totalLoanBalance)}
                  </div>
                  <div className="text-[0.72rem] text-ink-soft">
                    across {activeLoansList.length} active loan
                    {activeLoansList.length === 1 ? '' : 's'}
                  </div>
                  <Link
                    to="/member/loans"
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-forest/10 py-2 text-[0.78rem] font-semibold text-forest hover:bg-forest/20"
                  >
                    Repay now <ArrowRight size={12} />
                  </Link>
                </>
              )}
            </div>
          )}

          <Link
            to="/member/meetings"
            className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-forest to-emerald text-white shadow-sm">
                <Users size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[0.92rem] font-bold text-navy">
                  Chama community
                </div>
                <div className="text-[0.72rem] text-ink-soft">
                  {meetings.length} meeting{meetings.length === 1 ? '' : 's'} ·{' '}
                  {assets.length} asset{assets.length === 1 ? '' : 's'}
                </div>
              </div>
              <ArrowRight
                size={14}
                className="flex-none text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-forest"
              />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ---------- primitives ---------- */

function HeroStat({ icon: Icon, label, value, sub, border }) {
  return (
    <div
      className={`px-1 py-1 text-center sm:px-2 ${
        border ? 'border-white/10 sm:border-l' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white/50 sm:text-[0.62rem]">
        {Icon ? <Icon size={10} /> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 font-mono text-[0.92rem] font-bold text-white sm:text-[1rem]">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[0.62rem] font-semibold text-emerald sm:text-[0.66rem]">
          {sub}
        </div>
      )}
    </div>
  )
}

function PersonalCard({ to, icon: Icon, label, value, sub, accent, success }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span className="text-[0.72rem] font-semibold text-ink-soft">
          {label}
        </span>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${accent}`}
        >
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

function SnapshotCard({
  icon: Icon,
  tone,
  label,
  value,
  footer,
  footerTone,
  progress,
}) {
  const toneClass = {
    forest: 'from-forest/12 to-forest/0 text-forest ring-forest/15',
    gold: 'from-gold/20 to-gold/0 text-[#8A6417] ring-gold/20',
    navy: 'from-navy/12 to-navy/0 text-navy ring-navy/15',
    emerald: 'from-emerald/15 to-emerald/0 text-emerald ring-emerald/20',
  }[tone]

  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/30 hover:shadow-md">
      <div className="flex items-start justify-between">
        <span className="text-[0.72rem] font-semibold text-ink-soft">
          {label}
        </span>
        <span
          className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ring-1 ${toneClass}`}
        >
          <Icon size={15} />
        </span>
      </div>
      <div className="mt-3 font-display font-mono text-xl font-bold tracking-tight text-navy">
        {value}
      </div>

      {typeof progress === 'number' && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      <div
        className={`mt-2 text-[0.72rem] font-semibold ${
          footerTone || 'text-ink-soft'
        }`}
      >
        {footer}
      </div>
    </div>
  )
}

function UpdateCard({ to, icon: Icon, gradient, label, title, sub, badge }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-line bg-white p-4.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
    >
      {badge && (
        <span className="absolute right-3.5 top-3.5 rounded-full bg-red-500 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-sm">
          New
        </span>
      )}
      <span
        className={`grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-[0_6px_16px_rgba(11,31,51,0.14)]`}
      >
        <Icon size={16} />
      </span>
      <div className="mt-3 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </div>
      <div className="mt-1 truncate font-display text-[0.94rem] font-bold text-navy">
        {title}
      </div>
      <div className="mt-0.5 truncate text-[0.74rem] text-ink-soft">{sub}</div>
      <ArrowUpRight
        size={13}
        className="absolute bottom-4 right-4 text-ink-soft opacity-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-forest group-hover:opacity-100"
      />
    </Link>
  )
}