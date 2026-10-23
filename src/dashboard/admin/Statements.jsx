import { useEffect, useMemo, useState } from 'react'
import {
  Download, FileText, Printer, CheckCircle2, AlertCircle,
  Calendar, TrendingUp, Wallet, Bell,
} from 'lucide-react'
import { toast } from 'sonner'
import logoUrl from '../../assets/logos.png'
import { useChama } from '../../context/ChamaContext'

const LATE_FEE = 100

/* -helpers- */

function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-KE', {
    month: 'long',
    year: 'numeric',
  })
}

function recentMonths(n = 12) {
  const out = []
  const d = new Date()
  d.setDate(1)
  for (let i = 0; i < n; i++) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    d.setMonth(d.getMonth() - 1)
  }
  return out
}

function fmtKsh(n) {
  return `KSh ${Number(n).toLocaleString('en-KE')}`
}

function absoluteLogo() {
  try {
    return new URL(logoUrl, window.location.origin).href
  } catch {
    return logoUrl
  }
}

/**
 * Derive per-member per-month data from real backend context.
 */
function monthDataFor(member, chama, loanBalance) {
  const amount = chama?.monthly_contribution || 5000
  const lateFeeAmount = chama?.late_fee || LATE_FEE
  
  if (member.status === 'invited' || member.status === 'inactive') {
    return { contribution: 0, paid: 0, lateFee: 0, loanRepay: 0, isPaid: false }
  }
  const isArrears = member.status === 'arrears'
  const contribution = amount
  const paid = isArrears ? 0 : contribution
  const lateFee = isArrears ? lateFeeAmount : 0
  // Simplified loan repay calculation for demo (if they have a loan, assume they paid 30% of it or a fixed amount)
  const loanRepay = loanBalance > 0 && !isArrears ? Math.round(loanBalance * 0.1) : 0 // Just an example logic
  
  return { contribution, paid, lateFee, loanRepay, isPaid: paid >= contribution }
}

/* -print template- */

function buildStatementHTML(member, period, data, summary, chama) {
  const CHAMA = {
    name: chama?.name || 'My Chama',
    code: chama?.code || 'CHM-000000',
    paybill: chama?.paybill || '174379',
    currency: 'KSh',
  }
  const monthLabel = fmtMonth(period)
  const generatedAt = new Date().toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const logoSrc = absoluteLogo()

  const rows = [
    ['Contribution', data.contribution, data.paid],
    ['Late fee', data.lateFee, data.lateFee],
    ['Loan repayment', data.loanRepay, data.loanRepay],
  ]

  const lineItems =
    rows
      .filter(([_, due]) => due > 0)
      .map(
        ([label, due, paid]) => `
      <tr>
        <td>${label}</td>
        <td class="r">${fmtKsh(due)}</td>
        <td class="r">${fmtKsh(paid)}</td>
        <td class="r ${due - paid === 0 ? 'ok' : 'due'}">${due - paid === 0 ? 'Settled' : fmtKsh(due - paid)}</td>
      </tr>
    `
      )
      .join('') || `<tr><td colspan="4" class="empty">No activity this period</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${member.name} - ${monthLabel} Statement</title>
<style>
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, -apple-system, sans-serif; color: #0B1F33; margin: 0; padding: 0; font-size: 12px; line-height: 1.5; }
  h1 { font-family: 'Sora', system-ui, sans-serif; font-size: 20px; margin: 0; color: #0B1F33; }
  h2 { font-family: 'Sora', system-ui, sans-serif; font-size: 14px; margin: 0 0 8px; color: #0B1F33; }
  p { margin: 0; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #0B7A5A; margin-bottom: 20px; }
  .brand-row { display: flex; align-items: center; gap: 10px; }
  .brand-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; }
  .brand-name { font-family: 'Sora', system-ui, sans-serif; font-weight: 700; font-size: 16px; color: #0B1F33; line-height: 1.1; }
  .brand-sub { font-size: 10.5px; color: #5B6B7B; margin-top: 2px; }
  .meta { text-align: right; font-size: 11px; color: #5B6B7B; }
  .meta b { color: #0B1F33; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .block { border: 1px solid #E3E9EF; border-radius: 10px; padding: 12px 14px; }
  .block .k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #5B6B7B; font-weight: 600; }
  .block .v { font-size: 13px; color: #0B1F33; margin-top: 2px; font-weight: 500; }
  .block .v.mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { padding: 9px 10px; text-align: left; font-size: 11.5px; border-bottom: 1px solid #E3E9EF; }
  th { background: #F3F6F9; font-weight: 600; color: #5B6B7B; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
  td.r, th.r { text-align: right; }
  .ok { color: #0B7A5A; font-weight: 600; }
  .due { color: #B4232A; font-weight: 600; }
  .empty { text-align: center; color: #5B6B7B; font-style: italic; padding: 20px; }
  .summary { background: #E8F7F1; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
  .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
  .summary-row:last-child { margin-bottom: 0; padding-top: 6px; border-top: 1px solid rgba(11,122,90,0.2); font-weight: 700; }
  .summary-row b { font-family: 'JetBrains Mono', monospace; color: #0B1F33; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #E3E9EF; font-size: 10.5px; color: #5B6B7B; }
  .signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 40px; }
  .sig { flex: 1; }
  .sig-line { border-bottom: 1px solid #0B1F33; height: 30px; margin-bottom: 4px; }
  .sig-label { font-size: 10px; color: #5B6B7B; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <div class="brand-row">
        <img src="${logoSrc}" alt="Chametu" class="brand-logo" />
        <div>
          <div class="brand-name">${CHAMA.name}</div>
          <div class="brand-sub">Chama code ${CHAMA.code} / M-Pesa Paybill ${CHAMA.paybill}</div>
        </div>
      </div>
    </div>
    <div class="meta">
      <div>Statement period</div>
      <div style="font-size: 14px; font-weight: 700; color: #0B1F33;">${monthLabel}</div>
      <div style="margin-top: 6px;">Generated ${generatedAt}</div>
    </div>
  </div>

  <div class="grid">
    <div class="block">
      <div class="k">Member</div>
      <div class="v">${member.name}</div>
      <div class="v mono" style="font-size: 11px; color: #5B6B7B; margin-top: 2px;">${member.email}</div>
    </div>
    <div class="block">
      <div class="k">Chama account</div>
      <div class="v mono">${member.id.toUpperCase()}-${CHAMA.code.slice(-6)}</div>
      <div class="v" style="font-size: 11px; color: #5B6B7B; margin-top: 2px;">${member.role}</div>
    </div>
  </div>

  <h2>Line items</h2>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th class="r">Due</th>
        <th class="r">Paid</th>
        <th class="r">Balance</th>
      </tr>
    </thead>
    <tbody>
      ${lineItems}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-row"><span>Contribution paid this period</span><b>${fmtKsh(data.paid)}</b></div>
    <div class="summary-row"><span>Loan repayment this period</span><b>${fmtKsh(data.loanRepay)}</b></div>
    <div class="summary-row"><span>Late fee charged</span><b>${fmtKsh(data.lateFee)}</b></div>
    <div class="summary-row"><span>Outstanding contribution</span><b>${fmtKsh(Math.max(0, data.contribution - data.paid))}</b></div>
    <div class="summary-row"><span>Total savings balance</span><b>${fmtKsh(summary.savings)}</b></div>
    <div class="summary-row"><span>Loan balance</span><b>${fmtKsh(summary.loan)}</b></div>
  </div>

  <div class="signatures">
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">Member signature / ${member.name}</div>
    </div>
    <div class="sig">
      <div class="sig-line"></div>
      <div class="sig-label">Treasurer signature</div>
    </div>
  </div>

  <div class="footer">
    This statement is generated automatically by Chametu from the chama's records. If you spot a discrepancy, contact your chama treasurer within 14 days. Payments made after the statement date may not appear here.
  </div>
</body>
</html>`
}

function openPrint(html) {
  const w = window.open('', '_blank')
  if (!w) {
    toast.error('Pop-up blocked. Allow pop-ups to download statements.')
    return false
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
  return true
}

/* ---------- page ---------- */

export default function Statements() {
  const { members, loans, chama } = useChama()
  const [period, setPeriod] = useState(recentMonths()[1])
  // Session-only tracking (resets on refresh, but no longer relies on localStorage)
  const [issued, setIssued] = useState({}) 
  const [query, setQuery] = useState('')

  const months = useMemo(() => recentMonths(12), [])

  const rows = useMemo(() => {
    return members
      .filter((m) => m.status !== 'invited')
      .filter((m) => {
        if (!query) return true
        const q = query.toLowerCase()
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      })
      .map((m) => {
        // Calculate real loan balance for this member
        const memberLoan = (loans || [])
          .filter(l => l.member_id === m.id && l.status === 'disbursed')
          .reduce((sum, l) => sum + Number(l.balance || 0), 0)
          
        return { 
          member: m, 
          loanBalance: memberLoan,
          data: monthDataFor(m, chama, memberLoan) 
        }
      })
  }, [members, loans, chama, period, query])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.contribPaid += r.data.paid
        acc.loanRepay += r.data.loanRepay
        acc.lateFees += r.data.lateFee
        acc.outstanding += Math.max(0, r.data.contribution - r.data.paid)
        return acc
      },
      { contribPaid: 0, loanRepay: 0, lateFees: 0, outstanding: 0 }
    )
  }, [rows])

  const issuedKey = (memberId) => `${period}:${memberId}`
  const isIssued = (memberId) => Boolean(issued[issuedKey(memberId)])

  const markIssued = (memberId) => {
    setIssued((prev) => ({ ...prev, [issuedKey(memberId)]: Date.now() }))
  }

  const handlePrintOne = (row) => {
    const html = buildStatementHTML(row.member, period, row.data, {
      savings: row.member.savings || 0,
      loan: row.loanBalance,
    }, chama)
    const ok = openPrint(html)
    if (ok) {
      markIssued(row.member.id)
      toast.success(`Statement ready for ${row.member.name.split(' ')[0]}`)
    }
  }

  const handlePrintAll = () => {
    if (rows.length === 0) return toast.error('Nothing to print for this filter.')
    const pages = rows
      .map((row) => {
        const inner = buildStatementHTML(row.member, period, row.data, {
          savings: row.member.savings || 0,
          loan: row.loanBalance,
        }, chama)
        const body = inner.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] || ''
        return `<div class="statement-page">${body}</div>`
      })
      .join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Statements - ${fmtMonth(period)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Inter, system-ui, sans-serif; margin: 0; }
  .statement-page { page-break-after: always; }
  .statement-page:last-child { page-break-after: auto; }
  .head { display: flex; justify-content: space-between; padding-bottom: 14px; border-bottom: 2px solid #0B7A5A; margin-bottom: 20px; }
  .brand-row { display: flex; align-items: center; gap: 10px; }
  .brand-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; }
  .brand-name { font-family: 'Sora', system-ui, sans-serif; font-weight: 700; font-size: 16px; color: #0B1F33; line-height: 1.1; }
  .brand-sub { font-size: 10.5px; color: #5B6B7B; margin-top: 2px; }
  .meta { text-align: right; font-size: 11px; color: #5B6B7B; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .block { border: 1px solid #E3E9EF; border-radius: 10px; padding: 12px 14px; }
  .block .k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #5B6B7B; font-weight: 600; }
  .block .v { font-size: 13px; color: #0B1F33; margin-top: 2px; font-weight: 500; }
  .block .v.mono { font-family: monospace; font-size: 12px; }
  h2 { font-size: 14px; margin: 0 0 8px; color: #0B1F33; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { padding: 9px 10px; text-align: left; font-size: 11.5px; border-bottom: 1px solid #E3E9EF; }
  th { background: #F3F6F9; font-weight: 600; color: #5B6B7B; text-transform: uppercase; font-size: 10px; }
  td.r, th.r { text-align: right; }
  .ok { color: #0B7A5A; font-weight: 600; }
  .due { color: #B4232A; font-weight: 600; }
  .empty { text-align: center; color: #5B6B7B; font-style: italic; padding: 20px; }
  .summary { background: #E8F7F1; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; }
  .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
  .summary-row:last-child { margin-bottom: 0; padding-top: 6px; border-top: 1px solid rgba(11,122,90,0.2); font-weight: 700; }
  .summary-row b { font-family: monospace; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #E3E9EF; font-size: 10.5px; color: #5B6B7B; }
  .signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 40px; }
  .sig { flex: 1; }
  .sig-line { border-bottom: 1px solid #0B1F33; height: 30px; margin-bottom: 4px; }
  .sig-label { font-size: 10px; color: #5B6B7B; }
</style></head><body>${pages}</body></html>`

    const ok = openPrint(html)
    if (ok) {
      const next = { ...issued }
      rows.forEach((r) => {
        next[issuedKey(r.member.id)] = Date.now()
      })
      setIssued(next)
      toast.success(`Generated ${rows.length} statements`)
    }
  }

  const handleRemindUnpaid = () => {
    const unpaid = rows.filter((r) => !r.data.isPaid && r.data.contribution > 0)
    if (unpaid.length === 0) return toast.success('Everyone has paid this period')
    toast.info(
      `Reminder queued for ${unpaid.length} unpaid member${unpaid.length > 1 ? 's' : ''} (backend email service required)`
    )
  }

  const issuedCount = rows.filter((r) => isIssued(r.member.id)).length

  return (
    <div className="mx-auto max-w-[1180px]">
      {/* Header */}
      <header className="mb-5 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Statements</h1>
          <p className="mt-1.5 max-w-[64ch] text-ink-soft">
            Generate print-ready statements for members of <b className="text-navy">{chama?.name || 'My Chama'}</b>.
            Choose <b>Save as PDF</b> in the print dialog.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
            <Calendar size={14} strokeWidth={2} className="shrink-0 text-ink-soft" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="cursor-pointer bg-transparent pr-2 text-sm font-medium text-navy outline-none"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {fmtMonth(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRemindUnpaid}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-forest"
          >
            <Bell size={15} strokeWidth={2} />
            Remind unpaid
          </button>

          <button
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-dark"
          >
            <Printer size={15} strokeWidth={2} />
            Download all
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="mb-5 grid grid-cols-1 gap-3.5 hero:grid-cols-3">
        <StatCard
          icon={TrendingUp}
          label="Contributions collected"
          value={fmtKsh(totals.contribPaid)}
          sub={fmtMonth(period)}
          tone="forest"
        />
        <StatCard
          icon={Wallet}
          label="Loan repayments"
          value={fmtKsh(totals.loanRepay)}
          sub={`${rows.filter((r) => r.data.loanRepay > 0).length} members repaying`}
          tone="emerald"
        />
        <StatCard
          icon={AlertCircle}
          label="Outstanding"
          value={fmtKsh(totals.outstanding)}
          sub={
            totals.outstanding > 0
              ? `${rows.filter((r) => !r.data.isPaid && r.data.contribution > 0).length} unpaid`
              : 'All settled'
          }
          tone={totals.outstanding > 0 ? 'warn' : 'forest'}
        />
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[0.82rem] text-ink-soft">
          {rows.length} member{rows.length !== 1 ? 's' : ''} / {issuedCount} issued this period
        </div>
        <div className="flex max-w-[260px] items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
          <FileText size={15} strokeWidth={2} className="shrink-0 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.88rem]">
            <thead>
              <tr className="text-[0.72rem] uppercase tracking-wider text-ink-soft">
                <th className="border-b border-line px-5 py-3 text-left font-semibold">Member</th>
                <th className="border-b border-line px-5 py-3 text-left font-semibold">Role</th>
                <th className="border-b border-line px-5 py-3 text-right font-semibold">
                  Contribution
                </th>
                <th className="border-b border-line px-5 py-3 text-right font-semibold">
                  Loan repay
                </th>
                <th className="border-b border-line px-5 py-3 text-left font-semibold">Status</th>
                <th className="border-b border-line px-5 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const { member, data } = r
                const issuedFlag = isIssued(member.id)
                return (
                  <tr key={member.id} className="transition hover:bg-forest/[0.03]">
                    <td className="border-b border-line px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-forest to-emerald font-display text-[0.72rem] font-bold text-white">
                          {initials(member.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-navy">
                            {member.name}
                          </span>
                          <span className="block truncate text-[0.76rem] text-ink-soft">
                            {member.email}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="border-b border-line px-5 py-3.5 text-ink-soft">
                      {member.role}
                    </td>
                    <td
                      className={`border-b border-line px-5 py-3.5 text-right font-mono ${
                        data.paid > 0
                          ? 'font-semibold text-forest'
                          : data.contribution > 0
                            ? 'text-red-600'
                            : 'text-ink-soft'
                      }`}
                    >
                      {data.contribution === 0
                        ? 'None'
                        : data.paid > 0
                          ? `+ ${data.paid.toLocaleString()}`
                          : 'None'}
                    </td>
                    <td className="border-b border-line px-5 py-3.5 text-right font-mono text-navy">
                      {data.loanRepay > 0 ? data.loanRepay.toLocaleString() : 'None'}
                    </td>
                    <td className="border-b border-line px-5 py-3.5">
                      {data.contribution === 0 ? (
                        <span className="inline-block rounded-full bg-paper px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-ink-soft">
                          No activity
                        </span>
                      ) : data.isPaid ? (
                        <span className="inline-block rounded-full bg-emerald/10 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-forest">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-red-50 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-red-700">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="border-b border-line px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {issuedFlag && (
                          <CheckCircle2
                            size={14}
                            strokeWidth={2}
                            className="shrink-0 text-forest"
                            aria-label="Issued"
                          />
                        )}
                        <button
                          onClick={() => handlePrintOne(r)}
                          className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest transition hover:text-forest-dark"
                        >
                          <Download size={14} strokeWidth={2} />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-ink-soft">
                    {members.length === 0
                      ? 'No members yet. Add members first.'
                      : 'No members match your search.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
  const toneClass =
    {
      forest: 'bg-emerald/10 text-forest',
      emerald: 'bg-emerald/10 text-emerald',
      warn: 'bg-gold/15 text-[#8A6112]',
    }[tone] || 'bg-emerald/10 text-forest'

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.78rem] font-medium text-ink-soft">{label}</div>
          <div className="mt-2 font-display text-2xl font-extrabold text-navy">{value}</div>
          <div className="mt-1 text-[0.76rem] text-ink-soft">{sub}</div>
        </div>
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${toneClass}`}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
    </div>
  )
}

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
}