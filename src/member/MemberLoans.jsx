import { useEffect, useState } from 'react'
import {
  Gauge, CheckCircle2, Info, X, Clock, TrendingUp, AlertTriangle,
  ArrowRight, Sparkles, Wallet, Smartphone, Landmark, Receipt,
  Banknote,
} from 'lucide-react'
import {
  getMemberSession,
  getMemberChama,
  getMemberFinance,
  applyMemberLoan,
  repayMemberLoan,
} from '../lib/chametuStorage'
import { publishAdminNotification } from '../lib/adminNotifications'
import { publishMemberNotification } from '../lib/memberNotifications'

function fmt(n) {
  return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE')
}

const STATUS_META = {
  new: {
    label: 'Awaiting approval',
    cls: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
    hint: 'Your treasurer is reviewing this application.',
    icon: Clock,
  },
  active: {
    label: 'Active',
    cls: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
    hint: 'Your loan has been approved and disbursed.',
    icon: CheckCircle2,
  },
  overdue: {
    label: 'Overdue',
    cls: 'bg-red-50 text-red-600 ring-1 ring-red-100',
    hint: 'You have missed a repayment. Contact your treasurer.',
    icon: AlertTriangle,
  },
  repaid: {
    label: 'Fully repaid',
    cls: 'bg-emerald/15 text-forest ring-1 ring-emerald/30',
    hint: 'This loan has been fully repaid. Congratulations!',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-line text-ink-soft ring-1 ring-line',
    hint: 'This application was not approved.',
    icon: X,
  },
}

const PAYMENT_METHODS = [
  { key: 'mpesa', label: 'M-Pesa', icon: Smartphone, hint: 'Send to paybill 400200' },
  { key: 'bank', label: 'Bank', icon: Landmark, hint: 'Deposit to chama bank account' },
  { key: 'cash', label: 'Cash', icon: Banknote, hint: 'Hand in to treasurer' },
]

export default function MemberLoans() {
  const session = getMemberSession()
  const chama = getMemberChama(session)
  const [finance, setFinance] = useState(() => getMemberFinance(session))
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', purpose: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [repayOpen, setRepayOpen] = useState(false)
  const [repayAmount, setRepayAmount] = useState('')
  const [repayMethod, setRepayMethod] = useState('mpesa')
  const [repayError, setRepayError] = useState('')

  const multiplier = chama.maxLoanMultiple || 3
  const savings = finance.savings || 0
  const loanLimit = savings * multiplier
  const used = finance.loanUsed || 0
  const available = Math.max(0, loanLimit - used)
  const usedPct = loanLimit ? Math.min(100, Math.round((used / loanLimit) * 100)) : 0

  const activeLoan = finance.loan
  const hasActiveLoan = activeLoan && (activeLoan.status === 'active' || activeLoan.status === 'overdue')
  const hasPending = activeLoan && activeLoan.status === 'new'
  const isRepaid = activeLoan && activeLoan.status === 'repaid'

  const activeMeta = activeLoan ? STATUS_META[activeLoan.status] || STATUS_META.new : null
  const ActiveIcon = activeMeta?.icon

  useEffect(() => {
    const onStorage = () => setFinance(getMemberFinance(session))
    window.addEventListener('chametu:storage-updated', onStorage)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('chametu:storage-updated', onStorage)
      window.removeEventListener('storage', onStorage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id])

  useEffect(() => {
    if (hasActiveLoan || hasPending || isRepaid) setSubmitted(false)
  }, [hasActiveLoan, hasPending, isRepaid])

  function submit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return setError('Enter a valid amount.')
    if (amount > available) return setError(`The most you can borrow is ${fmt(available)}.`)

    applyMemberLoan(session, { amount, purpose: form.purpose })
    publishAdminNotification({
      type: 'warning',
      event: 'loanApplications',
      title: 'New loan application',
      desc: `${session?.name || 'Member'} requested ${fmt(amount)}`,
      link: '/dashboard/loans',
    })
    setFinance(getMemberFinance(session))
    setSubmitted(true)
    setOpen(false)
    setForm({ amount: '', purpose: '' })
  }

  function openRepay(amount = '') {
    setRepayAmount(String(amount || ''))
    setRepayMethod('mpesa')
    setRepayError('')
    setRepayOpen(true)
  }

  function submitRepay(e) {
    e.preventDefault()
    setRepayError('')
    const amt = Number(repayAmount)
    if (!amt || amt <= 0) return setRepayError('Enter a valid amount.')
    if (amt > Number(activeLoan.balance))
      return setRepayError(`Maximum you can repay is ${fmt(activeLoan.balance)}.`)

    const result = repayMemberLoan(session, {
      loanId: activeLoan.id,
      amount: amt,
      method: repayMethod,
    })
    if (!result) return setRepayError('Could not record the repayment.')
    if (result.error === 'amount-exceeds-balance')
      return setRepayError(`Maximum you can repay is ${fmt(result.remaining)}.`)

    publishAdminNotification({
      type: 'success',
      event: 'payments',
      title: 'Loan repayment received',
      desc: `${session?.name || 'Member'} repaid ${fmt(amt)}`,
      link: '/dashboard/loans',
    })
    publishMemberNotification({
      memberId: session?.id,
      type: 'success',
      event: 'paymentConfirmations',
      title: 'Repayment recorded',
      desc: `We've recorded your repayment of ${fmt(amt)}.`,
      link: '/member/loans',
    })

    setFinance(getMemberFinance(session))
    setRepayOpen(false)
    setRepayAmount('')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">My Loan</h1>
          <p className="mt-1 text-[0.86rem] text-ink-soft">
            Up to <b className="text-navy">{multiplier}×</b> your savings ({fmt(savings)})
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(11,31,51,0.15), transparent 70%)' }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-ink-soft">
              <Gauge size={12} /> Available to borrow
            </div>
            {used > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2.5 py-1 text-[0.68rem] font-semibold text-navy">
                <TrendingUp size={11} /> {fmt(used)} in use
              </span>
            )}
          </div>
          <div className="mt-2 font-display font-mono text-3xl font-bold tracking-tight text-navy">
            {fmt(available)}
          </div>
          <div className="mt-1 text-[0.78rem] text-ink-soft">
            of your {fmt(loanLimit)} limit
          </div>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-navy to-forest transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[0.7rem] text-ink-soft">
            <span>{fmt(used)} committed</span>
            <span>{usedPct}% of limit</span>
          </div>
        </div>
      </div>

      {activeLoan && activeMeta ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-navy">Current loan</h3>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${activeMeta.cls}`}>
                {ActiveIcon && <ActiveIcon size={11} />}
                {activeMeta.label}
              </span>
            </div>
            <p className="mt-1.5 text-[0.78rem] text-ink-soft">{activeMeta.hint}</p>
          </div>

          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <div className="rounded-xl bg-paper/60 p-3.5">
              <div className="text-[0.7rem] text-ink-soft">Original amount</div>
              <div className="mt-1 font-mono text-base font-bold text-navy">
                {fmt(activeLoan.amount)}
              </div>
            </div>
            <div className="rounded-xl bg-paper/60 p-3.5">
              <div className="text-[0.7rem] text-ink-soft">Balance remaining</div>
              <div className="mt-1 font-mono text-base font-bold text-navy">
                {fmt(activeLoan.balance)}
              </div>
            </div>
          </div>

          {activeLoan.purpose && (
            <div className="border-t border-line px-5 py-3 text-[0.78rem]">
              <span className="text-ink-soft">Purpose: </span>
              <span className="text-navy font-medium">{activeLoan.purpose}</span>
            </div>
          )}

          {hasActiveLoan && (
            <>
              <div className="border-t border-line px-5 py-4">
                <div className="flex justify-between text-[0.72rem] text-ink-soft">
                  <span>Repayment progress</span>
                  <span className="font-semibold text-navy">
                    {Math.round(
                      ((activeLoan.amount - activeLoan.balance) / activeLoan.amount) * 100
                    )}
                    % repaid
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
                    style={{
                      width: `${Math.round(
                        ((activeLoan.amount - activeLoan.balance) / activeLoan.amount) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="border-t border-line bg-paper/40 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[0.72rem] text-ink-soft">Repayment due</div>
                    <div className="font-mono text-lg font-bold text-navy">
                      {fmt(activeLoan.balance)}
                    </div>
                  </div>
                  <button
                    onClick={() => openRepay(activeLoan.balance)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Wallet size={14} /> Repay loan
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : submitted ? (
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald/10 text-forest">
            <CheckCircle2 size={22} />
          </span>
          <h3 className="mt-3 font-display text-base font-bold text-navy">Application submitted</h3>
          <p className="mt-1 text-[0.84rem] text-ink-soft">
            Awaiting treasurer approval. You'll get a notification here once it's reviewed.
          </p>
        </div>
      ) : isRepaid ? (
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald/10 text-forest">
            <CheckCircle2 size={22} />
          </span>
          <h3 className="mt-3 font-display text-base font-bold text-navy">Loan fully repaid</h3>
          <p className="mt-1 text-[0.84rem] text-ink-soft">
            Nice work. Your savings and credit standing are both stronger now.
          </p>
          <button
            onClick={() => setOpen(true)}
            disabled={available <= 0}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
              available > 0
                ? 'bg-gradient-to-br from-forest to-emerald hover:-translate-y-0.5 hover:shadow-md'
                : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            Apply again <ArrowRight size={14} />
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-navy/5 text-navy">
            <Sparkles size={20} />
          </span>
          <p className="mt-3 text-[0.86rem] text-ink-soft">
            {available > 0
              ? `You're eligible to borrow up to ${fmt(available)}.`
              : `You've used your full ${fmt(loanLimit)} limit.`}
          </p>
          <button
            onClick={() => setOpen(true)}
            disabled={available <= 0}
            className={`mt-4 inline-flex items-center gap-1.5 rounded-2xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
              available > 0
                ? 'bg-gradient-to-br from-forest to-emerald hover:-translate-y-0.5 hover:shadow-md'
                : 'cursor-not-allowed bg-forest/40'
            }`}
          >
            Apply for a loan <ArrowRight size={14} />
          </button>
        </div>
      )}

      {open && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">Loan application</h3>
            <button
              onClick={() => { setOpen(false); setError('') }}
              className="rounded-lg p-1 text-ink-soft transition hover:bg-paper hover:text-navy"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3.5">
            <label className="block text-[0.78rem] font-semibold text-navy">
              Amount (up to {fmt(available)})
              <input
                type="number"
                min="1"
                max={available}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="mt-1.5 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
                placeholder="e.g. 50000"
              />
            </label>
            <label className="block text-[0.78rem] font-semibold text-navy">
              Purpose
              <input
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                placeholder="e.g. School fees"
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
              Submit application
            </button>
          </form>
        </div>
      )}

      {repayOpen && activeLoan && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setRepayOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-line px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest/10 text-forest">
                    <Receipt size={15} />
                  </span>
                  <h3 className="font-display text-[1rem] font-bold text-navy">
                    Repay loan
                  </h3>
                </div>
                <p className="mt-1 text-[0.78rem] text-ink-soft">
                  Outstanding balance: <b className="text-navy">{fmt(activeLoan.balance)}</b>
                </p>
              </div>
              <button
                onClick={() => setRepayOpen(false)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitRepay} className="space-y-3 p-5">
              <label className="block">
                <span className="mb-1.5 block text-[0.75rem] font-semibold text-navy">
                  Amount to repay
                </span>
                <input
                  type="number"
                  min="1"
                  max={activeLoan.balance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 font-mono text-base font-semibold text-navy outline-none focus:border-forest"
                />
                <div className="mt-1.5 flex gap-1.5">
                  {[0.25, 0.5, 1].map((frac) => {
                    const val = Math.round(activeLoan.balance * frac)
                    return (
                      <button
                        type="button"
                        key={frac}
                        onClick={() => setRepayAmount(String(val))}
                        className="rounded-lg border border-line px-2.5 py-1 text-[0.7rem] font-semibold text-navy hover:border-forest hover:bg-forest/[0.04]"
                      >
                        {frac === 1 ? 'Full' : `${frac * 100}%`} · {fmt(val)}
                      </button>
                    )
                  })}
                </div>
              </label>

              <div>
                <span className="mb-1.5 block text-[0.75rem] font-semibold text-navy">
                  Payment method
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {PAYMENT_METHODS.map((m) => {
                    const Icon = m.icon
                    const active = repayMethod === m.key
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setRepayMethod(m.key)}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-[0.7rem] font-semibold transition ${
                          active
                            ? 'border-forest bg-forest/[0.06] text-forest'
                            : 'border-line bg-white text-ink-soft hover:border-navy'
                        }`}
                      >
                        <Icon size={14} />
                        {m.label}
                      </button>
                    )
                  })}
                </div>
                <p className="mt-1.5 text-[0.7rem] text-ink-soft">
                  {PAYMENT_METHODS.find((m) => m.key === repayMethod)?.hint}
                </p>
              </div>

              {repayError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-[0.78rem] font-medium text-red-600">
                  {repayError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRepayOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-forest-dark"
                >
                  <Wallet size={13} /> Confirm repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Pending and rejected applications don't reduce your available balance.
          Repayments reduce your loan balance immediately and update your limit in real time.
        </span>
      </div>
    </div>
  )
}