import { useEffect, useMemo, useState } from 'react'
import {
  Download, FileText, Printer, Mail, CheckCircle2, AlertCircle,
  Calendar, TrendingUp, Wallet, Bell,
} from 'lucide-react'
import { toast } from 'sonner'
import logoUrl from '../../assets/logos.png'

const MEMBERS_KEY = 'chametu_members_v2'
const ISSUED_KEY = 'chametu_statements_issued_v1'

const CHAMA = {
  name: 'Umoja Investment Chama',
  code: 'CHM-8F3K2P',
  paybill: '174379',
  currency: 'KSh',
}

const MONTHLY_CONTRIBUTION = 5000
const LOAN_MONTHLY_REPAY = 3500
const LATE_FEE = 100

/* -helpers- */

function loadMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function loadIssued() {
  try {
    const raw = localStorage.getItem(ISSUED_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return {}
}

function saveIssued(map) {
  try {
    localStorage.setItem(ISSUED_KEY, JSON.stringify(map))
  } catch {}
}

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

/**
 * Absolute URL for the logo so it resolves correctly inside
 * a window.open('', '_blank') context (which has about:blank base).
 */
function absoluteLogo() {
  try {
    return new URL(logoUrl, window.location.origin).href
  } catch {
    return logoUrl
  }
}

/**
 * Derive per-member per-month data deterministically from member status.
 * Replace this with a real ledger lookup when the backend exists.
 */
function monthDataFor(member, period) {
  if (member.status === 'invited' || member.status === 'inactive') {
    return { contribution: 0, paid: 0, lateFee: 0, loanRepay: 0, isPaid: false }
  }
  const isArrears = member.status === 'arrears'
  const contribution = MONTHLY_CONTRIBUTION
  const paid = isArrears ? 0 : contribution
  const lateFee = isArrears ? LATE_FEE : 0
  const loanRepay = member.loan > 0 && !isArrears ? LOAN_MONTHLY_REPAY : 0
  return { contribution, paid, lateFee, loanRepay, isPaid: paid >= contribution }
}

/* -print template- */

function buildStatementHTML(member, period, data, summary) {
  const monthLabel = fmtMonth(period)
  const generatedAt = new Date().toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const logoSrc = absoluteLogo()

  const rows = [
    ['Contribution', data.contribution, data.paid],
    ['Late fee', data.lateFee, data.lateFee],
    ['Loan repayment', data.loanRepay, data.loanRepay],
  ]

  const lineItems = rows
    .filter(([_, due]) => due > 0)
    .map(([label, due, paid]) => `
      <tr>
        <td>${label}</td>
        <td class="r">${fmtKsh(due)}</td>
        <td class="r">${fmtKsh(paid)}</td>
        <td class="r ${due - paid === 0 ? 'ok' : 'due'}">${due - paid === 0 ? 'Settled' : fmtKsh(due - paid)}</td>
      </tr>
    `).join('') || `<tr><td colspan="4" class="empty">No activity this period</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${member.name} — ${monthLabel} Statement</title>
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
          <div class="brand-sub">Chama code ${CHAMA.code} · M-Pesa Paybill ${CHAMA.paybill}</div>
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
      <div class="sig-label">Member signature · ${member.name}</div>
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

function openPrint(html, title) {
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
  const [members] = useState(() => loadMembers())
  const [period, setPeriod] = useState(recentMonths()[1]) // last completed month
  const [issued, setIssued] = useState(() => loadIssued())
  const [query, setQuery] = useState('')

  useEffect(() => { saveIssued(issued) }, [issued])

  const months = useMemo(() => recentMonths(12), [])

  const rows = useMemo(() => {
    return members
      .filter((m) => m.status !== 'invited')
      .filter((m) => {
        if (!query) return true
        const q = query.toLowerCase()
        return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      })
      .map((m) => ({ member: m, data: monthDataFor(m, period) }))
  }, [members, period, query])

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
      savings: row.member.savings,
      loan: row.member.loan,
    })
    const ok = openPrint(html, `${row.member.name} — ${fmtMonth(period)}`)
    if (ok) {
      markIssued(row.member.id)
      toast.success(`Statement ready for ${row.member.name.split(' ')[0]}`)
    }
  }

  const handlePrintAll = () => {
    if (rows.length === 0) return toast.error('Nothing to print for this filter.')
    const logoSrc = absoluteLogo()
    const pages = rows
      .map((row) => {
        const inner = buildStatementHTML(row.member, period, row.data, {
          savings: row.member.savings,
          loan: row.member.loan,
        })
        // Extract body content from the single-statement HTML
        const body = inner.match(/<body[^>]*>([\s\S]*?)<\/body>/)?.[1] || ''
        return `<div class="statement-page">${body}</div>`
      })
      .join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Statements — ${fmtMonth(period)}</title>
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

    const ok = openPrint(html, `Statements — ${fmtMonth(period)}`)
    if (ok) {
      const next = { ...issued }
      rows.forEach((r) => { next[issuedKey(r.member.id)] = Date.now() })
      setIssued(next)
      toast.success(`Generated ${rows.length} statements`)
    }
  }

  const handleRemindUnpaid = () => {
    const unpaid = rows.filter((r) => !r.data.isPaid && r.data.contribution > 0)
    if (unpaid.length === 0) return toast.success('Howdy Everyone has paid this period ')
    toast.info(`Reminder queued for ${unpaid.length} unpaid member${unpaid.length > 1 ? 's' : ''} (backend not connected)`)
  }

  const issuedCount = rows.filter((r) => isIssued(r.member.id)).length

  return (
    <div className="max-w-[1180px] mx-auto">
      {/* Header */}
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Statements</h1>
          <p className="mt-1.5 text-ink-soft max-w-[64ch]">
            Generate print-ready statements per member for any month. Choose <b>Save as PDF</b> in the print dialog.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-white">
            <Calendar size={14} strokeWidth={2} className="text-ink-soft shrink-0" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-navy cursor-pointer pr-2"
            >
              {months.map((m) => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRemindUnpaid}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-sm font-semibold hover:border-forest transition"
          >
            <Bell size={15} strokeWidth={2} />
            Remind unpaid
          </button>

          <button
            onClick={handlePrintAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-sm font-semibold hover:bg-forest-dark transition"
          >
            <Printer size={15} strokeWidth={2} />
            Download all
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 hero:grid-cols-3 gap-3.5 mb-5">
        <StatCard
          icon={TrendingUp}
          label="Contributions collected"
          value={fmtKsh(totals.contribPaid)}
          sub={`${fmtMonth(period)}`}
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
          sub={totals.outstanding > 0 ? `${rows.filter((r) => !r.data.isPaid && r.data.contribution > 0).length} unpaid` : 'All settled'}
          tone={totals.outstanding > 0 ? 'warn' : 'forest'}
        />
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <div className="text-[0.82rem] text-ink-soft">
          {rows.length} member{rows.length !== 1 ? 's' : ''} · {issuedCount} issued this period
        </div>
        <div className="flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-white max-w-[260px]">
          <FileText size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member…"
            className="outline-none text-sm bg-transparent w-full"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-line rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-[0.88rem]">
            <thead>
              <tr className="text-ink-soft text-[0.72rem] uppercase tracking-wider">
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Member</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Role</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold">Contribution</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold">Loan repay</th>
                <th className="text-left px-5 py-3 border-b border-line font-semibold">Status</th>
                <th className="text-right px-5 py-3 border-b border-line font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const { member, data } = r
                const issuedFlag = isIssued(member.id)
                return (
                  <tr key={member.id} className="hover:bg-forest/[0.03] transition">
                    <td className="px-5 py-3.5 border-b border-line">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-[0.72rem] shrink-0">
                          {initials(member.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-medium text-navy truncate">{member.name}</span>
                          <span className="block text-[0.76rem] text-ink-soft truncate">{member.email}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 border-b border-line text-ink-soft">{member.role}</td>
                    <td className={`px-5 py-3.5 border-b border-line text-right font-mono ${
                      data.paid > 0 ? 'text-forest font-semibold' : data.contribution > 0 ? 'text-red-600' : 'text-ink-soft'
                    }`}>
                      {data.contribution === 0 ? '—' : (data.paid > 0 ? `+ ${data.paid.toLocaleString()}` : '—')}
                    </td>
                    <td className="px-5 py-3.5 border-b border-line text-right font-mono text-navy">
                      {data.loanRepay > 0 ? data.loanRepay.toLocaleString() : '—'}
                    </td>
                    <td className="px-5 py-3.5 border-b border-line">
                      {data.contribution === 0 ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-paper text-ink-soft">
                          No activity
                        </span>
                      ) : data.isPaid ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-emerald/10 text-forest">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wide bg-red-50 text-red-700">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 border-b border-line text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {issuedFlag && (
                          <CheckCircle2
                            size={14}
                            strokeWidth={2}
                            className="text-forest shrink-0"
                            aria-label="Issued"
                          />
                        )}
                        <button
                          onClick={() => handlePrintOne(r)}
                          className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest hover:text-forest-dark transition"
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
  const toneClass = {
    forest: 'bg-emerald/10 text-forest',
    emerald: 'bg-emerald/10 text-emerald',
    warn: 'bg-gold/15 text-[#8A6112]',
  }[tone] || 'bg-emerald/10 text-forest'

  return (
    <div className="bg-white border border-line rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[0.78rem] text-ink-soft font-medium">{label}</div>
          <div className="font-display font-extrabold text-2xl text-navy mt-2">{value}</div>
          <div className="text-[0.76rem] text-ink-soft mt-1">{sub}</div>
        </div>
        <span className={`w-9 h-9 rounded-xl grid place-items-center shrink-0 ${toneClass}`}>
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