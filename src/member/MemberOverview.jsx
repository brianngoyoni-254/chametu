import { Link } from 'react-router-dom'
import {
  PiggyBank, Percent, ArrowRightLeft, Gauge, ArrowRight,
  CalendarDays, Sparkles, TrendingUp, CheckCircle2, Clock,
  Package, RefreshCw, Vote, Wallet, Users, ArrowUpRight,
  CircleDollarSign, Landmark, Bell, UserRound,
} from 'lucide-react'
import {
  getMemberSession,
  getMemberChama,
  getMemberFinance,
  getMemberTransactions,
} from '../lib/chametuStorage'
import { getOverviewData } from '../dashboard/admin/data/adminData'
import {
  useSharedState,
  SHARED_KEYS,
  DEFAULT_MEETINGS,
  DEFAULT_ASSETS,
  DEFAULT_PROPOSALS,
} from '../lib/chametuShared'

function fmt(n) {
  return 'KSh ' + Math.round(n || 0).toLocaleString('en-KE')
}

function fmtCompact(n) {
  const abs = Math.abs(n || 0)
  if (abs >= 1_000_000) {
    const v = (n / 1_000_000).toFixed(1).replace(/\.0$/, '')
    return v + 'M'
  }
  if (abs >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n || 0)
}

function fmtDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
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

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const AVATAR_GRADIENTS = [
  'from-forest to-emerald',
  'from-gold to-[#E8A21F]',
  'from-navy to-[#0A2A3E]',
  'from-emerald to-[#0A7A5A]',
  'from-[#0B7A5A] to-[#10B981]',
  'from-[#0A3D46] to-[#0B7A5A]',
]

export default function MemberOverview() {
  const session = getMemberSession()
  const chama = getMemberChama(session)
  const finance = getMemberFinance(session)
  const tx = getMemberTransactions(session).slice(0, 5)
  const d = getOverviewData()
  const [meetings] = useSharedState(SHARED_KEYS.meetings, DEFAULT_MEETINGS)
  const [assets] = useSharedState(SHARED_KEYS.assets, DEFAULT_ASSETS)
  const [proposals] = useSharedState(SHARED_KEYS.proposals, DEFAULT_PROPOSALS)

  const chamaName = chama.name
  const firstName = (session?.name || 'there').split(' ')[0]

  const loanLimit = finance.savings * (chama.maxLoanMultiple || 3)
  const loanUsed = finance.loan ? finance.loan.amount : 0
  const loanAvailable = Math.max(0, loanLimit - loanUsed)

  const contribPct = Math.min(
    100,
    Math.round(
      (finance.contributions.paid / finance.contributions.expected) * 100
    ) || 0
  )
  const isContributionDone = finance.contributions.status === 'done'

  const nextMeeting = meetings.filter((m) => !m.locked)[0]
  const daysToNext = nextMeeting ? daysUntil(nextMeeting.date) : null
  const openProposals = proposals.length
  const assetCount = assets.length
  const assetValue = assets.reduce((s, a) => s + Number(a.value || 0), 0)

  const allMembers = d.members || []
  const visibleMembers = allMembers.slice(0, 8)
  const extraCount = Math.max(0, allMembers.length - visibleMembers.length)

  return (
    <div className="space-y-6">
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
              Chama dashboard
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[0.68rem] font-semibold capitalize text-white/90 backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              {session?.role || 'Member'}
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
              label="Group balance"
              value={fmtCompact(d.groupBalance)}
            />
            <HeroStat
              icon={Percent}
              label="Collected"
              value={fmtCompact(d.collected)}
              sub={`${d.contribPct}%`}
              border
            />
            <HeroStat
              icon={ArrowRightLeft}
              label="Loans out"
              value={fmtCompact(d.outstanding)}
              sub={`${d.liveLoans?.length || 0} active`}
              border
            />
            <HeroStat
              icon={TrendingUp}
              label="Investments"
              value={fmtCompact(d.portfolioValue)}
              sub={
                d.gain >= 0
                  ? `+${fmtCompact(d.gain)}`
                  : `-${fmtCompact(Math.abs(d.gain))}`
              }
            />
          </div>
        </div>
      </div>

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
            value={fmt(finance.savings)}
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
                : `${fmt(finance.contributions.paid)} of ${fmt(
                    finance.contributions.expected
                  )}`
            }
            accent="from-gold/20 to-gold/5 text-[#8A6417]"
            success={isContributionDone}
          />
        </div>
      </section>

      <section>
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.02rem] font-bold text-navy">
              Chama at a glance
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              Where the group stands financially
            </p>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard
            icon={CircleDollarSign}
            tone="forest"
            label="Group balance"
            value={fmt(d.groupBalance)}
            footer={`${fmt(d.moneyIn)} in recently`}
            footerTone="text-emerald"
          />
          <SnapshotCard
            icon={Landmark}
            tone="gold"
            label="Contributions this month"
            value={fmt(d.collected)}
            footer={`${d.contribPct}% of ${fmt(d.expected)}`}
            footerTone={d.contribPct >= 90 ? 'text-emerald' : 'text-[#8A6417]'}
            progress={d.contribPct}
          />
          <SnapshotCard
            icon={ArrowRightLeft}
            tone="navy"
            label="Outstanding loans"
            value={fmt(d.outstanding)}
            footer={
              d.overdueAmount > 0
                ? `${fmt(d.overdueAmount)} overdue`
                : 'All on track'
            }
            footerTone={d.overdueAmount > 0 ? 'text-red-600' : 'text-emerald'}
          />
          <SnapshotCard
            icon={TrendingUp}
            tone="emerald"
            label="Investments"
            value={fmt(d.portfolioValue)}
            footer={
              d.gain >= 0
                ? `+${fmt(d.gain)} gain`
                : `-${fmt(Math.abs(d.gain))} loss`
            }
            footerTone={d.gain >= 0 ? 'text-emerald' : 'text-red-600'}
          />
        </div>
      </section>

      <section>
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.02rem] font-bold text-navy">
              Your chama community
            </h2>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              Everyone working towards the same goals
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-[220px_1fr]">
            <div className="relative overflow-hidden bg-gradient-to-br from-forest to-emerald p-6 text-white">
              <div
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{
                  background:
                    'radial-gradient(300px 200px at 100% 100%, rgba(255,255,255,0.2), transparent)',
                }}
              />
              <div className="relative">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 backdrop-blur">
                  <Users size={18} />
                </span>
                <div className="mt-5 font-display text-[3.2rem] font-bold leading-none tracking-tight">
                  {d.memberCounts.total}
                </div>
                <div className="mt-1.5 text-[0.82rem] font-semibold text-white/90">
                  {d.memberCounts.total === 1 ? 'Member' : 'Members'} in {chamaName}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[0.66rem] font-semibold backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    {d.memberCounts.active} active
                  </span>
                  {d.memberCounts.invited > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[0.66rem] font-semibold backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                      {d.memberCounts.invited} invited
                    </span>
                  )}
                  {d.memberCounts.arrears > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[0.66rem] font-semibold backdrop-blur">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-300" />
                      {d.memberCounts.arrears} in arrears
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-ink-soft">
                  <UserRound size={12} />
                  Members
                </div>
                <span className="text-[0.72rem] text-ink-soft">
                  {d.memberCounts.active} of {d.memberCounts.total} active
                </span>
              </div>

              {allMembers.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-line py-6 text-center">
                  <Users size={20} className="mx-auto text-ink-soft/60" />
                  <p className="mt-2 text-[0.82rem] text-ink-soft">
                    No other members have joined yet.
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {visibleMembers.map((m, i) => (
                      <span
                        key={m.id || i}
                        title={`${m.name} / ${m.role}`}
                        className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br ${
                          AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
                        } font-display text-[0.7rem] font-bold text-white ring-2 ring-white`}
                      >
                        {initials(m.name)}
                      </span>
                    ))}
                  </div>
                  {extraCount > 0 && (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-paper font-display text-[0.7rem] font-bold text-ink-soft ring-2 ring-white">
                      +{extraCount}
                    </span>
                  )}
                </div>
              )}

              <div className="my-5 h-px bg-line" />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <MiniStat
                  icon={PiggyBank}
                  label="Member savings"
                  value={fmt(d.memberSavings)}
                />
                <MiniStat
                  icon={Percent}
                  label="Group contribution"
                  value={`${d.contribPct}%`}
                  tone={d.contribPct >= 90 ? 'good' : 'warn'}
                />
                <MiniStat
                  icon={CheckCircle2}
                  label="Active rate"
                  value={
                    d.memberCounts.total
                      ? `${Math.round(
                          (d.memberCounts.active / d.memberCounts.total) * 100
                        )}%`
                      : '0%'
                  }
                  tone="good"
                  className="hidden sm:flex"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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
            title={`${assetCount} item${assetCount === 1 ? '' : 's'}`}
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
            title="See who is next"
            sub="Check the payout order"
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

          {tx.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line py-10 text-center">
              <Clock size={20} className="mx-auto text-ink-soft/60" />
              <p className="mt-2 text-sm text-ink-soft">
                No transactions on your account yet.
              </p>
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
                        t.amount > 0
                          ? 'bg-emerald/10 text-forest'
                          : 'bg-red-50 text-red-600'
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
            <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
              <Bell size={12} className="text-gold" />
              Next contribution
            </div>
            <div className="mt-2">
              <div className="font-display text-lg font-bold text-navy">
                Due on the {chama.due || 30}th
              </div>
              <p className="mt-0.5 text-[0.78rem] text-ink-soft">
                {fmt(chama.amount || 5000)} / {chama.grace || 3} day grace period
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

          {finance.loan && (
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
                  <TrendingUp size={14} className="text-forest" />
                  Your active loan
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
                      ((finance.loan.amount - finance.loan.balance) /
                        finance.loan.amount) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-1.5 text-[0.7rem] text-ink-soft">
                {Math.round(
                  ((finance.loan.amount - finance.loan.balance) /
                    finance.loan.amount) *
                    100
                )}
                % repaid
              </div>
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
                  {d.memberCounts.total} member
                  {d.memberCounts.total === 1 ? '' : 's'} total
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

function MiniStat({ icon: Icon, label, value, tone, className = '' }) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald'
      : tone === 'warn'
        ? 'text-[#8A6417]'
        : 'text-navy'

  return (
    <div className={`flex items-start gap-2.5 ${className}`}>
      <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg bg-paper text-ink-soft">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <div className="text-[0.66rem] font-semibold uppercase tracking-wider text-ink-soft">
          {label}
        </div>
        <div
          className={`mt-0.5 truncate font-display font-mono text-[0.94rem] font-bold ${toneClass}`}
        >
          {value}
        </div>
      </div>
    </div>
  )
}