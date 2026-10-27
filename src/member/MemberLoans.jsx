// src/member/MemberLoans.jsx
import { useEffect, useState } from 'react'
import {
  Gauge, CheckCircle2, Info, X, Clock, TrendingUp, AlertTriangle,
  ArrowRight, Sparkles, Wallet, Smartphone, Landmark, Receipt,
  Banknote, Loader2,
} from 'lucide-react'
import { useMember } from '../context/MemberContext'

function fmt(n) {
  return 'KSh ' + Math.round(Number(n) || 0).toLocaleString('en-KE')
}

const STATUS_META = {
  pending: {
    label: 'Awaiting approval',
    cls: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
    hint: 'Your treasurer is reviewing this application.',
  },
  approved: {
    label: 'Approved',
    cls: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
    hint: 'Approved — waiting for disbursement.',
  },
  disbursed: {
    label: 'Active',
    cls: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
    hint: 'Active loan — repay to free up your limit.',
  },
  repaid: {
    label: 'Fully repaid',
    cls: 'bg-emerald/15 text-forest ring-1 ring-emerald/30',
    hint: 'Fully repaid.',
  },
  rejected: {
    label: 'Rejected',
    cls: 'bg-line text-ink-soft ring-1 ring-line',
    hint: 'This application was not approved.',
  },
}

const PAYMENT_METHODS = [
  { key: 'mpesa', label: 'M-Pesa', icon: Smartphone, hint: 'Send to paybill 400200' },
  { key: 'bank', label: 'Bank', icon: Landmark, hint: 'Deposit to chama bank account' },
  { key: 'cash', label: 'Cash', icon: Banknote, hint: 'Hand in to treasurer' },
]

export default function MemberLoans() {
  const {
    loans,
    activeLoans,
    pendingLoan,
    savings,
    loanLimit,
    loanUsed,
    loanAvailable,
    isLoading,
    applyLoan,
    repayLoan,
  } = useMember()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', purpose: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [repayTarget, setRepayTarget] = useState(null)
  const [repayAmount, setRepayAmount] = useState('')
  const [repayMethod, setRepayMethod] = useState('mpesa')
  const [repayError, setRepayError] = useState('')
  const [repaying, setRepaying] = useState(false)

  const multiplier = 3
  const usedPct = loanLimit
    ? Math.min(100, Math.round((loanUsed / loanLimit) * 100))
    : 0

  useEffect(() => {
    if (pendingLoan) setOpen(false)
  }, [pendingLoan])

  async function submit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return setError('Enter a valid amount.')
    if (amount > loanAvailable) {
      return setError(`The most you can borrow is ${fmt(loanAvailable)}.`)
    }

    setSubmitting(true)
    const res = await applyLoan(amount, form.purpose)
    setSubmitting(false)

    if (!res.ok) return setError(res.message)
    setForm({ amount: '', purpose: '' })
    setOpen(false)
  }

  function openRepay(loan, amount = '') {
    setRepayTarget(loan)
    setRepayAmount(String(amount || ''))
    setRepayMethod('mpesa')
    setRepayError('')
  }

  async function submitRepay(e) {
    e.preventDefault()
    if (!repayTarget) return
    setRepayError('')
    const amt = Number(repayAmount)
    if (!amt || amt <= 0) return setRepayError('Enter a valid amount.')
    if (amt > Number(repayTarget.balance)) {
      return setRepayError(`Maximum you can repay is ${fmt(repayTarget.balance)}.`)
    }

    setRepaying(true)
    const res = await repayLoan(repayTarget.id, amt)
    setRepaying(false)

    if (!res.ok) return setRepayError(res.message)
    setRepayTarget(null)
    setRepayAmount('')
  }

  if (isLoading && loans.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={26} className="animate-spin text-forest" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">My Loans</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Up to <b className="text-navy">{multiplier}×</b> your savings ({fmt(savings)})
        </p>
      </div>

      {/* Availability card */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(11,31,51,0.15), transparent 70%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-ink-soft">
              <Gauge size={12} /> Available to borrow
            </div>
            {loanUsed > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-navy/5 px-2.5 py-1 text-[0.68rem] font-semibold text-navy">
                <TrendingUp size={11} /> {fmt(loanUsed)} in use
              </span>
            )}
          </div>
          <div className="mt-2 font-display font-mono text-3xl font-bold tracking-tight text-navy">
            {fmt(loanAvailable)}
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
            <span>{fmt(loanUsed)} committed</span>
            <span>{usedPct}% of limit</span>
          </div>
        </div>
      </div>

      {/* Pending application */}
      {pendingLoan && (
        <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-navy">
                Current application
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${STATUS_META[pendingLoan.status].cls}`}
              >
                {STATUS_META[pendingLoan.status].label}
              </span>
            </div>
            <p className="mt-1.5 text-[0.78rem] text-ink-soft">
              {STATUS_META[pendingLoan.status].hint}
            </p>
          </div>
          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <div className="rounded-xl bg-paper/60 p-3.5">
              <div className="text-[0.7rem] text-ink-soft">Requested amount</div>
              <div className="mt-1 font-mono text-base font-bold text-navy">
                {fmt(pendingLoan.amount)}
              </div>
            </div>
            <div className="rounded-xl bg-paper/60 p-3.5">
              <div className="text-[0.7rem] text-ink-soft">Purpose</div>
              <div className="mt-1 truncate text-base font-semibold text-navy">
                {pendingLoan.purpose || '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active loans — each with its own repay button */}
      {activeLoans.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-sm font-semibold text-navy">
            Active loans
          </h3>
          {activeLoans.map((loan) => {
            const repaidPct = loan.amount
              ? Math.round(((loan.amount - loan.balance) / loan.amount) * 100)
              : 0
            return (
              <div
                key={loan.id}
                className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm"
              >
                <div className="border-b border-line px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest/10 text-forest">
                        <Wallet size={14} />
                      </span>
                      <div>
                        <div className="font-display text-[0.94rem] font-semibold text-navy">
                          {loan.purpose || 'Loan'}
                        </div>
                        <div className="text-[0.72rem] text-ink-soft">
                          {loan.created_at
                            ? new Date(loan.created_at).toLocaleDateString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${STATUS_META[loan.status].cls}`}
                    >
                      {STATUS_META[loan.status].label}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-paper/60 p-3.5">
                    <div className="text-[0.7rem] text-ink-soft">Original amount</div>
                    <div className="mt-1 font-mono text-base font-bold text-navy">
                      {fmt(loan.amount)}
                    </div>
                  </div>
                  <div className="rounded-xl bg-paper/60 p-3.5">
                    <div className="text-[0.7rem] text-ink-soft">Balance remaining</div>
                    <div className="mt-1 font-mono text-base font-bold text-navy">
                      {fmt(loan.balance)}
                    </div>
                  </div>
                </div>

                <div className="border-t border-line px-5 py-3">
                  <div className="flex justify-between text-[0.72rem] text-ink-soft">
                    <span>Repayment progress</span>
                    <span className="font-semibold text-navy">{repaidPct}% repaid</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest to-emerald transition-all"
                      style={{ width: `${repaidPct}%` }}
                    />
                  </div>
                </div>

                <div className="border-t border-line bg-paper/40 px-5 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[0.72rem] text-ink-soft">Repayment due</div>
                      <div className="font-mono text-lg font-bold text-navy">
                        {fmt(loan.balance)}
                      </div>
                    </div>
                    <button
                      onClick={() => openRepay(loan, loan.balance)}
                      disabled={Number(loan.balance) <= 0}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
                    >
                      <Wallet size={14} /> Repay loan
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Apply / info card */}
      {!pendingLoan && (
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          {loanAvailable > 0 ? (
            <>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-navy/5 text-navy">
                <Sparkles size={20} />
              </span>
              <p className="mt-3 text-[0.86rem] text-ink-soft">
                You can borrow up to <b className="text-navy">{fmt(loanAvailable)}</b> right now.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-br from-forest to-emerald px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Apply for a loan <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <>
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle size={20} />
              </span>
              <p className="mt-3 text-[0.86rem] text-ink-soft">
                You've used your full <b className="text-navy">{fmt(loanLimit)}</b> limit.
              </p>
              <p className="mt-1 text-[0.78rem] text-ink-soft">
                Repay an active loan to free up your limit.
              </p>
            </>
          )}
        </div>
      )}

      {/* Loan history */}
      {loans.length > 0 && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <h3 className="mb-4 font-display text-sm font-semibold text-navy">
            Loan history
          </h3>
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                  <th className="px-4 py-2.5">Purpose</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Balance</th>
                  <th className="px-4 py-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id} className="border-b border-line last:border-none">
                    <td className="px-4 py-3 font-medium text-navy">
                      {l.purpose || '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-navy">{fmt(l.amount)}</td>
                    <td className="px-4 py-3 font-mono text-navy">{fmt(l.balance)}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[0.66rem] font-bold uppercase tracking-wide ${STATUS_META[l.status]?.cls || ''}`}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply form */}
      {open && (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">
              Loan application
            </h3>
            <button
              onClick={() => {
                setOpen(false)
                setError('')
              }}
              className="rounded-lg p-1 text-ink-soft transition hover:bg-paper hover:text-navy"
            >
              <X size={15} />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-3.5">
            <label className="block text-[0.78rem] font-semibold text-navy">
              Amount (up to {fmt(loanAvailable)})
              <input
                type="number"
                min="1"
                max={loanAvailable}
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
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-br from-forest to-emerald py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </form>
        </div>
      )}

      {/* Repay modal */}
      {repayTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setRepayTarget(null)}
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
                  Outstanding balance:{' '}
                  <b className="text-navy">{fmt(repayTarget.balance)}</b>
                </p>
              </div>
              <button
                onClick={() => setRepayTarget(null)}
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
                  max={repayTarget.balance}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  className="w-full rounded-xl border border-line px-3.5 py-2.5 font-mono text-base font-semibold text-navy outline-none focus:border-forest"
                />
                <div className="mt-1.5 flex gap-1.5">
                  {[0.25, 0.5, 1].map((frac) => {
                    const val = Math.round(repayTarget.balance * frac)
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
                  onClick={() => setRepayTarget(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={repaying}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {repaying ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Wallet size={13} />
                  )}
                  {repaying ? 'Repaying…' : 'Confirm repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          You can hold multiple loans as long as their combined balance stays within your
          limit. Repaying reduces your used balance and instantly frees up room for a new
          loan.
        </span>
      </div>
    </div>
  )
}