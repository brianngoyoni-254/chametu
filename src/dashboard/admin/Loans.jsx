import { useEffect, useMemo, useState } from 'react'
import { Plus, CheckCircle2, XCircle, Clock, Search, RefreshCw, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { readLoans, readMembers } from '../../lib/superadminBridge'
import { publishAdminNotification } from '../../lib/adminNotifications'
import { publishMemberNotification } from '../../lib/memberNotifications'

const LOANS_KEY = 'chametu_loans_v1'
const EVENT = 'chametu:storage-updated'

function read(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }))
}

const badge = {
  active: 'bg-[#E9F5EF] text-forest',
  new: 'bg-[#FBF1E0] text-[#8A6417]',
  overdue: 'bg-[#FBEAE8] text-red-600',
  rejected: 'bg-line text-ink-soft',
}
const label = { active: 'Active', new: 'New', overdue: 'Overdue', rejected: 'Rejected' }

function progressOf(amount, balance) {
  if (!amount) return 0
  return Math.round(((amount - balance) / amount) * 100)
}
function fmt(n) {
  return Number(n).toLocaleString('en-KE')
}

export default function Loans() {
  const [loans, setLoans] = useState(() => read(LOANS_KEY, []))
  const members = readMembers()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ member: members[0]?.name || '', amount: '', purpose: '' })
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')

  const refresh = () => setLoans(read(LOANS_KEY, []))
  useEffect(() => {
    const onStorage = () => refresh()
    window.addEventListener(EVENT, onStorage)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onStorage)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const filtered = useMemo(() => {
    return loans
      .filter((l) => tab === 'all' || (tab === 'new' ? l.status === 'new' : l.status === tab))
      .filter((l) => {
        if (!query) return true
        const q = query.toLowerCase()
        return (l.member + (l.purpose || '')).toLowerCase().includes(q)
      })
  }, [loans, tab, query])

  const counts = useMemo(() => ({
    all: loans.length,
    active: loans.filter((l) => l.status === 'active').length,
    new: loans.filter((l) => l.status === 'new').length,
    overdue: loans.filter((l) => l.status === 'overdue').length,
    rejected: loans.filter((l) => l.status === 'rejected').length,
  }), [loans])

  const outstanding = loans
    .filter((l) => l.status === 'active' || l.status === 'overdue')
    .reduce((s, l) => s + Number(l.balance || 0), 0)

  function submitApplication(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return
    const next = [{
      id: Date.now(),
      member: form.member,
      amount,
      balance: amount,
      status: 'new',
      purpose: form.purpose,
      appliedAt: new Date().toISOString(),
    }, ...loans]
    write(LOANS_KEY, next)
    setLoans(next)
    setForm({ member: members[0]?.name || '', amount: '', purpose: '' })
    setOpen(false)
    toast.success('Application submitted')
  }

  function approve(id) {
    const target = loans.find((l) => l.id === id)
    const next = loans.map((loan) => (loan.id === id ? { ...loan, status: 'active' } : loan))
    write(LOANS_KEY, next)
    setLoans(next)
    if (target) {
      publishAdminNotification({
        type: 'success',
        event: 'loanApprovals',
        title: 'Loan approved',
        desc: `${target.member} — KSh ${Number(target.amount).toLocaleString()}`,
        link: '/dashboard/loans',
      })
      publishMemberNotification({
        memberId: target.memberId || target.member,
        type: 'success',
        event: 'loanApprovals',
        title: 'Loan approved 🎉',
        desc: `Your loan of KSh ${Number(target.amount).toLocaleString()} has been approved.`,
        link: '/member/loans',
      })
    }
    toast.success('Loan approved')
  }

  function reject(id) {
    const target = loans.find((l) => l.id === id)
    const next = loans.map((loan) => (loan.id === id ? { ...loan, status: 'rejected' } : loan))
    write(LOANS_KEY, next)
    setLoans(next)
    if (target) {
      publishAdminNotification({
        type: 'warning',
        event: 'loanApprovals',
        title: 'Loan rejected',
        desc: `${target.member} — KSh ${Number(target.amount).toLocaleString()}`,
        link: '/dashboard/loans',
      })
      publishMemberNotification({
        memberId: target.memberId || target.member,
        type: 'warning',
        event: 'loanApprovals',
        title: 'Loan application declined',
        desc: `Your loan application for KSh ${Number(target.amount).toLocaleString()} was not approved. Contact your treasurer for details.`,
        link: '/member/loans',
      })
    }
    toast.info('Application rejected')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Loans</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {counts.active + counts.overdue} active · KSh {fmt(outstanding)} outstanding
            {counts.new > 0 && ` · ${counts.new} pending review`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-forest">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark">
            <Plus size={15} /> New application
          </button>
        </div>
      </div>

      {open && (
        <form onSubmit={submitApplication} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="text-xs font-semibold text-ink">
            Member
            <select value={form.member} onChange={(e) => setForm((f) => ({ ...f, member: e.target.value }))} className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest">
              {members.map((m) => <option key={m.id || m.name} value={m.name}>{m.name}</option>)}
            </select>
          </label>
          <label className="flex-1 min-w-37.5 text-xs font-semibold text-ink">
            Purpose
            <input value={form.purpose} onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Business expansion" className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest" />
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount (KSh)
            <input type="number" min="1" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="mt-1.5 block w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest" />
          </label>
          <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark">Submit</button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'new', label: `Pending (${counts.new})` },
            { key: 'active', label: `Active (${counts.active})` },
            { key: 'overdue', label: `Overdue (${counts.overdue})` },
            { key: 'rejected', label: `Rejected (${counts.rejected})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTab(f.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === f.key ? 'bg-navy text-white' : 'border border-line bg-white text-ink-soft hover:border-navy'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex max-w-[240px] flex-1 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <Search size={14} className="text-ink-soft" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search member or purpose…" className="w-full bg-transparent text-sm outline-none" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={26} className="mx-auto text-ink-soft/40" />
            <p className="mt-2 text-sm text-ink-soft">No loan applications match.</p>
          </div>
        ) : (
          <table className="w-full min-w-130 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Member</th>
                <th className="py-2">Purpose</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Balance</th>
                <th className="py-2">Progress</th>
                <th className="py-2">Status</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-line last:border-none">
                  <td className="py-2.5 font-medium text-navy">{l.member}</td>
                  <td className="py-2.5 text-ink-soft">{l.purpose || '—'}</td>
                  <td className="py-2.5 font-mono">{fmt(l.amount)}</td>
                  <td className="py-2.5 font-mono">{fmt(l.balance)}</td>
                  <td className="py-2.5">
                    <div className="h-1.5 w-27.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-emerald" style={{ width: `${progressOf(l.amount, l.balance)}%` }} />
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge[l.status]}`}>{label[l.status]}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    {l.status === 'new' && (
                      <div className="flex justify-end gap-2.5">
                        <button onClick={() => approve(l.id)} className="flex items-center gap-1 text-xs font-semibold text-forest">
                          <CheckCircle2 size={12} /> Approve
                        </button>
                        <button onClick={() => reject(l.id)} className="flex items-center gap-1 text-xs font-semibold text-red-600">
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    )}
                    {l.status === 'new' && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[0.68rem] text-ink-soft">
                        <Clock size={10} /> Awaiting review
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}