import { useState } from 'react'
import { Gauge, CheckCircle2, Info, X } from 'lucide-react'
import {
  getMemberSession,
  getMemberChama,
  getMemberFinance,
} from '../lib/chametuStorage'

function fmt(n) {
  return 'KSh ' + Math.round(n).toLocaleString('en-KE')
}

const badge = {
  active: 'bg-emerald/10 text-forest ring-1 ring-emerald/20',
  new: 'bg-gold/15 text-[#8A6417] ring-1 ring-gold/25',
  overdue: 'bg-red-50 text-red-600 ring-1 ring-red-100',
}
const label = { active: 'Active', new: 'Awaiting approval', overdue: 'Overdue' }

export default function MemberLoans() {
  const session = getMemberSession()
  const chama = getMemberChama(session)
  const finance = getMemberFinance(session)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ amount: '', purpose: '' })
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const loanLimit = finance.savings * (chama.maxLoanMultiple || 3)
  const used = finance.loan ? finance.loan.amount : 0
  const available = Math.max(0, loanLimit - used)
  const usedPct = loanLimit ? Math.min(100, Math.round((used / loanLimit) * 100)) : 0

  function submit(e) {
    e.preventDefault()
    setError('')
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return setError('Enter a valid amount.')
    if (amount > available) return setError(`The most you can borrow is ${fmt(available)}.`)
    setSubmitted(true)
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">My Loan</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Based on {chama.maxLoanMultiple || 3}x your savings, per {chama.name}'s rules
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(11,31,51,0.15), transparent 70%)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-widest text-ink-soft">
            <Gauge size={12} />
            Available to borrow
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
            <span>{fmt(used)} in use</span>
            <span>{usedPct}% of limit</span>
          </div>
        </div>
      </div>

      {finance.loan ? (
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold text-navy">
              Current loan
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${
                badge[finance.loan.status]
              }`}
            >
              {label[finance.loan.status]}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-paper/60 p-3.5">
              <div className="text-[0.7rem] text-ink-soft">Original amount</div>
              <div className="mt-1 font-mono text-base font-bold text-navy">
                {fmt(finance.loan.amount)}
              </div>
            </div>
            <div className="rounded-xl bg-paper/60 p-3.5">
              <div className="text-[0.7rem] text-ink-soft">Balance remaining</div>
              <div className="mt-1 font-mono text-base font-bold text-navy">
                {fmt(finance.loan.balance)}
              </div>
            </div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-line">
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
              ((finance.loan.amount - finance.loan.balance) / finance.loan.amount) *
                100
            )}
            % repaid
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
          {submitted ? (
            <>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald/10 text-forest">
                <CheckCircle2 size={22} />
              </span>
              <h3 className="mt-3 font-display text-base font-bold text-navy">
                Application submitted
              </h3>
              <p className="mt-1 text-[0.84rem] text-ink-soft">
                Awaiting treasurer approval. You will see it here once reviewed.
              </p>
            </>
          ) : (
            <>
              <p className="text-[0.86rem] text-ink-soft">
                You do not have an active loan right now.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="mt-4 rounded-2xl bg-gradient-to-br from-forest to-emerald px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                Apply for a loan
              </button>
            </>
          )}
        </div>
      )}

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

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Loan applications are reviewed by your treasurer and committee. Approval
          usually takes 2 to 3 working days.
        </span>
      </div>
    </div>
  )
}