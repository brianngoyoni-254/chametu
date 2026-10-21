import { useEffect, useMemo, useState } from 'react'
import {
  Heart, Info, X, Clock, CheckCircle2, XCircle, Wallet,
  TrendingUp, MessageSquare, Users, ArrowDownRight, ArrowUpRight,
  Search, ShieldCheck, ListChecks,
} from 'lucide-react'
import {
  getMemberSession,
  getMembers,
  applyMemberWelfare,
} from '../lib/chametuStorage'
import { publishAdminNotification } from '../lib/adminNotifications'
import {
  getAllClaims,
  getWelfareSummary,
  getPublicPayouts,
  filterClaims,
  WELFARE_MONTHLY_FEE,
} from '../lib/welfareShared'

function fmt(n) {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE')
}
function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return '—'
  }
}
function initials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const STATUS_META = {
  pending: {
    label: 'Awaiting approval',
    cls: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
    icon: Clock,
    hint: 'The committee is reviewing your claim.',
  },
  paid: {
    label: 'Approved',
    cls: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
    icon: CheckCircle2,
    hint: 'Your claim has been approved and paid.',
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-red-50 text-red-600 ring-1 ring-red-100',
    icon: XCircle,
    hint: 'Your claim was not approved. See note below.',
  },
}

export default function MemberWelfare() {
  const session = getMemberSession()
  const [members, setMembers] = useState(() => getMembers())
  const [claims, setClaims] = useState(() => getAllClaims())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ reason: '', amount: '' })
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')
  const [ledgerQuery, setLedgerQuery] = useState('')

  useEffect(() => {
    const refresh = () => {
      setMembers(getMembers())
      setClaims(getAllClaims())
    }
    window.addEventListener('chametu:storage-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('chametu:storage-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const summary = useMemo(() => getWelfareSummary(members), [members, claims])
  const payouts = useMemo(() => getPublicPayouts(), [claims])

  const myClaims = useMemo(
    () =>
      claims.filter(
        (c) =>
          c.memberId === session?.id ||
          c.member === session?.name
      ),
    [claims, session?.id, session?.name]
  )

  const myCounts = useMemo(() => ({
    all: myClaims.length,
    pending: myClaims.filter((c) => c.status === 'pending').length,
    paid: myClaims.filter((c) => c.status === 'paid').length,
    rejected: myClaims.filter((c) => c.status === 'rejected').length,
    totalReceived: myClaims.filter((c) => c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0),
  }), [myClaims])

  const filteredClaims = useMemo(
    () => filterClaims(myClaims, tab, ''),
    [myClaims, tab]
  )

  const filteredPayouts = useMemo(() => {
    if (!ledgerQuery.trim()) return payouts
    const q = ledgerQuery.trim().toLowerCase()
    return payouts.filter(
      (p) =>
        (p.member || '').toLowerCase().includes(q) ||
        (p.reason || '').toLowerCase().includes(q)
    )
  }, [payouts, ledgerQuery])

  function submit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!form.reason.trim()) return setError('Tell us the reason for your claim.')
    if (!amount || amount <= 0) return setError('Enter a valid amount.')

    applyMemberWelfare(session, { reason: form.reason.trim(), amount })

    publishAdminNotification({
      type: 'warning',
      event: 'welfareClaims',
      title: 'New welfare claim',
      desc: `${session?.name || 'Member'} requested ${fmt(amount)}`,
      link: '/dashboard/welfare',
    })

    setClaims(getAllClaims())
    setForm({ reason: '', amount: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Welfare</h1>
          <p className="mt-1 text-[0.86rem] text-ink-soft">
            Community support fund · {summary.memberCount} contributing members ·{' '}
            {fmt(WELFARE_MONTHLY_FEE)}/member/month
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Heart size={15} /> New claim
        </button>
      </div>

      {/* Fund health KPIs */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">Fund balance</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/10 text-forest">
              <Wallet size={13} />
            </span>
          </div>
          <div className="mt-2 font-display font-mono text-lg font-bold text-navy">
            {fmt(summary.balance)}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-emerald font-semibold">
            {fmt(summary.collected)} collected
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">Paid out</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-navy/5 text-navy">
              <ArrowUpRight size={13} />
            </span>
          </div>
          <div className="mt-2 font-display font-mono text-lg font-bold text-navy">
            {fmt(summary.paid)}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-ink-soft">
            {summary.approvedClaims} claim{summary.approvedClaims === 1 ? '' : 's'} approved
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">Awaiting review</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gold/15 text-[#8A6417]">
              <Clock size={13} />
            </span>
          </div>
          <div className="mt-2 font-display text-lg font-bold text-navy">
            {summary.pendingClaims}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-[#8A6417] font-semibold">
            {fmt(summary.pending)} pending
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">Community</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/10 text-forest">
              <Users size={13} />
            </span>
          </div>
          <div className="mt-2 font-display text-lg font-bold text-navy">
            {summary.memberCount}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-ink-soft">active members</div>
        </div>
      </div>

      {/* Public payout ledger */}
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-navy">
              <ListChecks size={14} className="text-forest" />
              Community payout ledger
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-ink-soft">
              Every approved payout is visible to all members
            </p>
          </div>
          <div className="flex max-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-1.5">
            <Search size={13} className="text-ink-soft" />
            <input
              value={ledgerQuery}
              onChange={(e) => setLedgerQuery(e.target.value)}
              placeholder="Search member or reason…"
              className="w-full bg-transparent text-[0.82rem] outline-none"
            />
          </div>
        </div>

        {filteredPayouts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ShieldCheck size={26} className="mx-auto text-ink-soft/40" />
            <p className="mt-2 text-[0.86rem] text-ink-soft">
              {payouts.length === 0
                ? 'No payouts have been made from the fund yet.'
                : 'No payouts match your search.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filteredPayouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-forest to-emerald text-white text-[0.68rem] font-bold">
                  {initials(p.member)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="truncate text-[0.88rem] font-semibold text-navy">
                      {p.member}
                    </span>
                    <span className="text-[0.72rem] text-ink-soft">·</span>
                    <span className="truncate text-[0.78rem] text-ink-soft">
                      {p.reason}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[0.68rem] text-ink-soft">
                    Paid {fmtDate(p.reviewedAt || p.submittedAt)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[0.9rem] font-bold text-navy">
                    {fmt(p.amount)}
                  </div>
                  <div className="text-[0.66rem] font-bold uppercase tracking-wider text-emerald">
                    Paid
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* New claim form */}
      {open && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">
              New welfare claim
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-ink-soft hover:bg-paper hover:text-navy"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3.5">
            <label className="block text-[0.78rem] font-semibold text-navy">
              Reason
              <input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Medical, bereavement, emergency"
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
              />
            </label>
            <label className="block text-[0.78rem] font-semibold text-navy">
              Amount (KSh)
              <input
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
              />
            </label>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.78rem] font-medium text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Submit claim
            </button>
          </form>
        </div>
      )}

      {/* My claims */}
      <div>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[1.02rem] font-bold text-navy">My claims</h2>
            <p className="mt-0.5 text-[0.78rem] text-ink-soft">
              Only you can see the notes on your own claims
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'all', label: `All (${myCounts.all})` },
              { key: 'pending', label: `Awaiting (${myCounts.pending})` },
              { key: 'paid', label: `Approved (${myCounts.paid})` },
              { key: 'rejected', label: `Rejected (${myCounts.rejected})` },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setTab(f.key)}
                className={`rounded-full px-3 py-1 text-[0.72rem] font-semibold transition ${
                  tab === f.key
                    ? 'bg-navy text-white'
                    : 'border border-line bg-white text-ink-soft hover:border-navy'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white py-12 text-center">
            <Heart size={24} className="mx-auto text-ink-soft/40" />
            <p className="mt-2 text-[0.84rem] text-ink-soft">
              {myClaims.length === 0
                ? "You haven't submitted any welfare claims yet."
                : 'No claims match this filter.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3.5 sm:grid-cols-2">
            {filteredClaims.map((c) => {
              const meta = STATUS_META[c.status] || STATUS_META.pending
              const Icon = meta.icon
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-forest/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-navy">
                        {c.reason}
                      </h3>
                      <p className="mt-0.5 text-[0.72rem] text-ink-soft">
                        Submitted {fmtDate(c.submittedAt)}
                      </p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wide ${meta.cls}`}>
                      <Icon size={10} />
                      {meta.label}
                    </span>
                  </div>

                  <div className="mt-4 font-display font-mono text-xl font-bold text-navy">
                    {fmt(c.amount)}
                  </div>

                  <p className="mt-2 text-[0.76rem] text-ink-soft">{meta.hint}</p>

                  {c.reviewNote && (
                    <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-paper/70 px-2.5 py-2 text-[0.72rem] text-navy">
                      <MessageSquare size={11} className="mt-0.5 shrink-0 text-ink-soft" />
                      <span>{c.reviewNote}</span>
                    </div>
                  )}

                  {c.reviewedAt && (
                    <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
                      <Clock size={10} /> Reviewed {fmtDate(c.reviewedAt)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          The welfare fund is transparent by design — every approved payout is visible to all
          members. You'll get a notification here once your own claim is reviewed.
        </span>
      </div>
    </div>
  )
}