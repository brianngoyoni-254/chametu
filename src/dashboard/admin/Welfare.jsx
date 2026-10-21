import { useEffect, useMemo, useState } from 'react'
import {
  Plus, CheckCircle2, XCircle, RefreshCw, Heart, Search, Clock,
  Wallet, X, Info, TrendingUp, MessageSquare, Users, ArrowUpRight,
  ShieldCheck, ListChecks,
} from 'lucide-react'
import { toast } from 'sonner'
import { readMembers } from '../../lib/superadminBridge'
import { publishAdminNotification } from '../../lib/adminNotifications'
import { publishMemberNotification } from '../../lib/memberNotifications'
import {
  getAllClaims,
  getWelfareSummary,
  getPublicPayouts,
  filterClaims,
  WELFARE_MONTHLY_FEE,
} from '../../lib/welfareShared'

const WELFARE_KEY = 'chametu_welfare_v1'
const EVENT = 'chametu:storage-updated'

function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
}
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
    label: 'Awaiting review',
    cls: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
    icon: Clock,
  },
  paid: {
    label: 'Approved',
    cls: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-red-50 text-red-600 ring-1 ring-red-100',
    icon: XCircle,
  },
}

export default function Welfare() {
  const [members, setMembers] = useState(() => readMembers())
  const [claims, setClaims] = useState(() => getAllClaims())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ member: members[0]?.name || '', reason: '', amount: '' })
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [reviewing, setReviewing] = useState(null)

  useEffect(() => {
    const refresh = () => {
      setMembers(readMembers())
      setClaims(getAllClaims())
    }
    window.addEventListener(EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const summary = useMemo(() => getWelfareSummary(members), [members, claims])
  const payouts = useMemo(() => getPublicPayouts(), [claims])
  const filtered = useMemo(() => filterClaims(claims, tab, query), [claims, tab, query])

  function submitClaim(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0 || !form.reason.trim()) return
    const next = [
      {
        id: Date.now(),
        member: form.member,
        reason: form.reason.trim(),
        amount,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      },
      ...claims,
    ]
    write(WELFARE_KEY, next)
    setClaims(next)
    setForm({ member: members[0]?.name || '', reason: '', amount: '' })
    setOpen(false)
    toast.success('Claim submitted')
  }

  function openReview(claim) {
    setReviewing({ claim, note: '' })
  }

  function approve() {
    const { claim, note } = reviewing
    const next = claims.map((c) =>
      c.id === claim.id
        ? {
            ...c,
            status: 'paid',
            reviewedAt: new Date().toISOString(),
            reviewNote: note,
          }
        : c
    )
    write(WELFARE_KEY, next)
    setClaims(next)
    publishAdminNotification({
      type: 'success',
      event: 'welfareClaims',
      title: 'Welfare claim approved',
      desc: `${claim.member} — ${fmt(claim.amount)}`,
      link: '/dashboard/welfare',
    })
    publishMemberNotification({
      memberId: claim.memberId || claim.member,
      type: 'success',
      event: 'welfareUpdates',
      title: 'Welfare claim approved',
      desc: `Your claim of ${fmt(claim.amount)} has been approved and paid.${note ? ` Note: ${note}` : ''}`,
      link: '/member/welfare',
    })
    toast.success('Claim approved')
    setReviewing(null)
  }

  function reject() {
    const { claim, note } = reviewing
    const next = claims.map((c) =>
      c.id === claim.id
        ? {
            ...c,
            status: 'rejected',
            reviewedAt: new Date().toISOString(),
            reviewNote: note,
          }
        : c
    )
    write(WELFARE_KEY, next)
    setClaims(next)
    publishAdminNotification({
      type: 'warning',
      event: 'welfareClaims',
      title: 'Welfare claim rejected',
      desc: `${claim.member} — ${fmt(claim.amount)}`,
      link: '/dashboard/welfare',
    })
    publishMemberNotification({
      memberId: claim.memberId || claim.member,
      type: 'warning',
      event: 'welfareUpdates',
      title: 'Welfare claim not approved',
      desc: `Your welfare claim of ${fmt(claim.amount)} was not approved.${note ? ` Reason: ${note}` : ''}`,
      link: '/member/welfare',
    })
    toast.info('Claim rejected')
    setReviewing(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Welfare</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Community support fund · transparent ledger visible to all members
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setMembers(readMembers())
              setClaims(getAllClaims())
            }}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-forest"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark"
          >
            <Plus size={15} /> New claim
          </button>
        </div>
      </div>

      {/* Fund health */}
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
            <span className="text-xs text-ink-soft">Members</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald/10 text-forest">
              <Users size={13} />
            </span>
          </div>
          <div className="mt-2 font-display text-lg font-bold text-navy">
            {summary.memberCount}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-ink-soft">
            {fmt(WELFARE_MONTHLY_FEE)}/mo each
          </div>
        </div>
      </div>

      {/* Public ledger */}
      <div className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold text-navy">
              <ListChecks size={14} className="text-forest" />
              Public payout ledger
            </h3>
            <p className="mt-0.5 text-[0.75rem] text-ink-soft">
              Every approved payout — visible to all members
            </p>
          </div>
          <span className="text-[0.72rem] text-ink-soft">
            {payouts.length} payout{payouts.length === 1 ? '' : 's'}
          </span>
        </div>

        {payouts.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ShieldCheck size={26} className="mx-auto text-ink-soft/40" />
            <p className="mt-2 text-[0.86rem] text-ink-soft">
              No payouts have been made yet.
            </p>
          </div>
        ) : (
          <ul className="max-h-[320px] overflow-y-auto divide-y divide-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-forest to-emerald text-white text-[0.64rem] font-bold">
                  {initials(p.member)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="truncate text-[0.86rem] font-semibold text-navy">
                      {p.member}
                    </span>
                    <span className="truncate text-[0.74rem] text-ink-soft">
                      · {p.reason}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[0.66rem] text-ink-soft">
                    {fmtDate(p.reviewedAt || p.submittedAt)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[0.86rem] font-bold text-navy">
                    {fmt(p.amount)}
                  </div>
                  <div className="text-[0.64rem] font-bold uppercase tracking-wider text-emerald">
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
        <form
          onSubmit={submitClaim}
          className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5"
        >
          <label className="text-xs font-semibold text-ink">
            Member
            <select
              value={form.member}
              onChange={(e) => setForm((f) => ({ ...f, member: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              {members.map((m) => (
                <option key={m.id || m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-37.5 text-xs font-semibold text-ink">
            Reason
            <input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Medical"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount (KSh)
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1.5 block w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark"
          >
            Submit
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: `All (${summary.totalClaims})` },
            { key: 'pending', label: `Awaiting (${summary.pendingClaims})` },
            { key: 'paid', label: `Approved (${summary.approvedClaims})` },
            { key: 'rejected', label: `Rejected (${summary.rejectedClaims})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTab(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === f.key
                  ? 'bg-navy text-white'
                  : 'border border-line bg-white text-ink-soft hover:border-navy'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex max-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <Search size={14} className="text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member or reason…"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Claims list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-14 text-center">
          <Heart size={26} className="mx-auto text-ink-soft/40" />
          <p className="mt-2 text-sm text-ink-soft">No welfare claims match.</p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const meta = STATUS_META[c.status] || STATUS_META.pending
            const Icon = meta.icon
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-forest/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold text-navy">
                      {c.member}
                    </h3>
                    <p className="mt-0.5 truncate text-[0.78rem] text-ink-soft">
                      {c.reason}
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

                <div className="mt-3 space-y-1 text-[0.72rem] text-ink-soft">
                  <div className="flex justify-between">
                    <span>Submitted</span>
                    <span className="text-navy">{fmtDate(c.submittedAt)}</span>
                  </div>
                  {c.reviewedAt && (
                    <div className="flex justify-between">
                      <span>Reviewed</span>
                      <span className="text-navy">{fmtDate(c.reviewedAt)}</span>
                    </div>
                  )}
                </div>

                {c.reviewNote && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-paper/70 px-2.5 py-2 text-[0.72rem] text-navy">
                    <MessageSquare size={11} className="mt-0.5 shrink-0 text-ink-soft" />
                    <span>{c.reviewNote}</span>
                  </div>
                )}

                {c.status === 'pending' && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openReview(c)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-forest py-2 text-[0.78rem] font-semibold text-white hover:bg-forest-dark"
                    >
                      <CheckCircle2 size={12} /> Review
                    </button>
                    <button
                      onClick={() => openReview(c)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-line bg-white py-2 text-[0.78rem] font-semibold text-red-600 hover:border-red-400"
                    >
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setReviewing(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="font-display text-[1rem] font-bold text-navy">
                  Review welfare claim
                </h3>
                <p className="mt-1 text-[0.78rem] text-ink-soft">
                  <b className="text-navy">{reviewing.claim.member}</b> · {reviewing.claim.reason} · {fmt(reviewing.claim.amount)}
                </p>
              </div>
              <button
                onClick={() => setReviewing(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <label className="block">
                <span className="mb-1.5 block text-[0.75rem] font-semibold text-navy">
                  Note to member (visible on their claim card)
                </span>
                <textarea
                  value={reviewing.note}
                  onChange={(e) => setReviewing({ ...reviewing, note: e.target.value })}
                  rows={3}
                  placeholder="Add context for the member…"
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
                />
              </label>

              <div className="flex items-start gap-2 rounded-lg bg-paper/70 px-3 py-2 text-[0.72rem] text-ink-soft">
                <Info size={12} className="mt-0.5 flex-none" />
                <span>
                  Approved claims appear on the public ledger for all members. Notes on your
                  decision are only visible to the claimant.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={reject}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <XCircle size={14} /> Reject claim
                </button>
                <button
                  onClick={approve}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-forest-dark"
                >
                  <CheckCircle2 size={14} /> Approve & pay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}