import { useMemo, useState } from 'react'
import {
  BarChart3, FileText, TrendingUp, Users, CalendarCheck, Wallet,
  ArrowUpRight, Download, Printer, Calendar, User,
} from 'lucide-react'
import { toast } from 'sonner'
import logoUrl from '../../assets/logos.png'
import { useChama } from '../../context/ChamaContext'

const REPORTS = [
  {
    id: 'income', icon: BarChart3, title: 'Income statement',
    desc: 'Contributions, expenses and net position for any period.',
    tag: 'Finance', periodType: 'month',
  },
  {
    id: 'member-statement', icon: FileText, title: 'Member statement',
    desc: 'Per-member contribution, savings and loan history.',
    tag: 'Finance', periodType: 'month', target: 'member',
  },
  {
    id: 'loan-portfolio', icon: Wallet, title: 'Loan portfolio',
    desc: 'Outstanding, overdue and repayment-rate breakdown.',
    tag: 'Finance', periodType: 'month',
  },
  {
    id: 'investment', icon: TrendingUp, title: 'Investment performance',
    desc: 'Gains, income and valuation across the portfolio.',
    tag: 'Investments', periodType: 'quarter',
  },
  {
    id: 'attendance', icon: CalendarCheck, title: 'Attendance and voting',
    desc: 'Meeting attendance and resolution history.',
    tag: 'Governance', periodType: 'quarter',
  },
  {
    id: 'activity', icon: Users, title: 'Member activity',
    desc: 'Login, payment and engagement per member.',
    tag: 'People', periodType: 'month',
  },
]

function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-KE', {
    month: 'long', year: 'numeric',
  })
}

function fmtKsh(n, currency = 'KSh') {
  return `${currency} ${Number(n || 0).toLocaleString('en-KE')}`
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

function recentQuarters(n = 4) {
  const out = []
  const d = new Date()
  const q = Math.floor(d.getMonth() / 3)
  for (let i = 0; i < n; i++) {
    const qq = ((q - i) % 4 + 4) % 4
    const year = d.getFullYear() + Math.floor((q - i) / 4)
    out.push(`${year}-Q${qq + 1}`)
  }
  return out
}

function fmtQuarter(qy) {
  const [y, q] = qy.split('-Q')
  return `Q${q} ${y}`
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()
}

function absoluteLogo() {
  try { return new URL(logoUrl, window.location.origin).href } catch { return logoUrl }
}

function toCSV(headers, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
}

function downloadCSV(filename, csv) {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function table(headers, rows, totalsRow = null) {
  const thead = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`
  const bodyRows = totalsRow ? [...rows, totalsRow] : rows
  const tbody = bodyRows.map((r) =>
    `<tr>${r.map((c) => `<td>${typeof c === 'number' ? c.toLocaleString() : c}</td>`).join('')}</tr>`
  ).join('')
  return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`
}

function reportHTML(title, period, bodyTable, summary, chama) {
  const generatedAt = new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
  const logoSrc = absoluteLogo()

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${title} - ${period}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: Inter, system-ui, sans-serif; color: #0B1F33; margin: 0; font-size: 12px; line-height: 1.5; }
  h1 { font-family: Sora, system-ui, sans-serif; font-size: 20px; margin: 0; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 14px; border-bottom: 2px solid #0B7A5A; margin-bottom: 20px; }
  .brand-row { display: flex; align-items: center; gap: 10px; }
  .brand-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; }
  .brand-name { font-family: Sora, system-ui, sans-serif; font-weight: 700; font-size: 16px; color: #0B1F33; line-height: 1.1; }
  .brand-sub { font-size: 10.5px; color: #5B6B7B; margin-top: 2px; }
  .meta { text-align: right; font-size: 11px; color: #5B6B7B; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { padding: 9px 10px; text-align: left; font-size: 11.5px; border-bottom: 1px solid #E3E9EF; }
  th { background: #F3F6F9; font-weight: 600; color: #5B6B7B; text-transform: uppercase; font-size: 10px; }
  tr:last-child td { font-weight: 700; background: #F3F6F9; }
  .summary { background: #E8F7F1; border-radius: 10px; padding: 14px 16px; }
  .summary-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
  .summary-row:last-child { margin-bottom: 0; padding-top: 6px; border-top: 1px solid rgba(11,122,90,0.2); font-weight: 700; }
  .summary-row b { font-family: monospace; }
  .footer { margin-top: 30px; padding-top: 14px; border-top: 1px solid #E3E9EF; font-size: 10.5px; color: #5B6B7B; }
</style></head><body>
  <div class="head">
    <div>
      <div class="brand-row">
        <img src="${logoSrc}" alt="Chametu" class="brand-logo" />
        <div>
          <div class="brand-name">${chama.name}</div>
          <div class="brand-sub">Chama code ${chama.code}</div>
        </div>
      </div>
    </div>
    <div class="meta">
      <div>Period</div>
      <div style="font-size: 14px; font-weight: 700; color: #0B1F33;">${period}</div>
      <div style="margin-top: 6px;">Generated ${generatedAt}</div>
    </div>
  </div>
  <h1 style="margin-bottom: 16px;">${title}</h1>
  ${bodyTable}
  <div class="summary">
    ${summary.map(([k, v]) => `<div class="summary-row"><span>${k}</span><b>${v}</b></div>`).join('')}
  </div>
  <div class="footer">Generated by Chametu. All amounts in KSh.</div>
</body></html>`
}

function openPrint(html) {
  const w = window.open('', '_blank')
  if (!w) { toast.error('Pop-up blocked. Allow pop-ups to view this report.'); return false }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
  return true
}

function buildIncomeReport(period, members, contributions, chama) {
  const expected = contributions.expectedPerMember || 0
  const rows = members.filter((m) => m.status !== 'invited').map((m) => {
    const isArrears = m.status === 'arrears'
    const paid = isArrears ? 0 : expected
    const lateFee = isArrears ? 100 : 0
    return [m.name, m.role, expected, paid, lateFee, paid - expected]
  })

  const headers = ['Member', 'Role', 'Expected', 'Paid', 'Late fee', 'Balance']
  const sum = (i) => rows.reduce((a, r) => a + r[i], 0)
  const totals = ['Total', '', sum(2), sum(3), sum(4), sum(5)]

  return {
    title: `Income statement - ${fmtMonth(period)}`,
    html: reportHTML('Income statement', fmtMonth(period), table(headers, rows, totals), [
      ['Expected contributions', fmtKsh(sum(2))],
      ['Collected', fmtKsh(sum(3))],
      ['Late fees', fmtKsh(sum(4))],
      ['Net position', fmtKsh(sum(3) + sum(4))],
    ], chama),
    csv: toCSV(headers, rows),
    csvName: `income-${period}.csv`,
  }
}

function buildLoanReport(period, loans, chama) {
  const borrowers = loans.filter((l) => l.status === 'active' || l.status === 'overdue')
  const rows = borrowers.map((l) => [
    l.member_name, l.amount, l.balance || l.amount,
    l.status === 'overdue' ? 'Overdue' : 'On track',
  ])

  const headers = ['Borrower', 'Amount', 'Balance', 'Status']
  const totalLoan = borrowers.reduce((a, l) => a + (l.balance || l.amount), 0)

  return {
    title: `Loan portfolio - ${fmtMonth(period)}`,
    html: reportHTML('Loan portfolio', fmtMonth(period), 
      rows.length ? table(headers, rows) : `<p style="text-align:center;color:#5B6B7B;font-style:italic;padding:20px">No active loans this period.</p>`, [
      ['Active borrowers', String(borrowers.length)],
      ['Total outstanding', fmtKsh(totalLoan)],
      ['Overdue accounts', String(borrowers.filter((l) => l.status === 'overdue').length)],
    ], chama),
    csv: toCSV(headers, rows),
    csvName: `loans-${period}.csv`,
  }
}

function buildActivityReport(period, members, chama) {
  const headers = ['Member', 'Role', 'Status', 'Savings', 'Loan', 'Last activity']
  const rows = members.filter((m) => m.status !== 'invited').map((m) => [
    m.name, m.role, m.status, m.savings || 0, m.loan || 0, fmtMonth(period),
  ])

  return {
    title: `Member activity - ${fmtMonth(period)}`,
    html: reportHTML('Member activity', fmtMonth(period), table(headers, rows), [
      ['Active members', String(members.filter((m) => m.status === 'active').length)],
      ['In arrears', String(members.filter((m) => m.status === 'arrears').length)],
      ['Inactive', String(members.filter((m) => m.status === 'inactive').length)],
      ['Total savings', fmtKsh(members.reduce((a, m) => a + (m.savings || 0), 0))],
    ], chama),
    csv: toCSV(headers, rows),
    csvName: `activity-${period}.csv`,
  }
}

function buildMemberStatementReport(period, member, contributions, chama) {
  const expected = contributions.expectedPerMember || 0
  const paid = member.status === 'arrears' ? 0 : expected
  
  const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance']
  const rows = [
    [fmtMonth(period), 'Contribution', expected, paid, expected - paid],
    [fmtMonth(period), 'Savings', '', '', member.savings || 0],
    [fmtMonth(period), 'Loan balance', member.loan || 'None', '', member.loan || 'None'],
  ]

  return {
    title: `Member statement - ${member.name}`,
    html: reportHTML(`Member statement - ${member.name}`, fmtMonth(period), table(headers, rows), [
      ['Member', member.name],
      ['Role', member.role],
      ['Status', member.status],
      ['Savings balance', fmtKsh(member.savings || 0)],
      ['Loan balance', member.loan > 0 ? fmtKsh(member.loan) : 'None'],
    ], chama),
    csv: toCSV(headers, rows),
    csvName: `statement-${member.id}-${period}.csv`,
  }
}

function runReport(report, period, members, loans, contributions, chama, memberId) {
  switch (report.id) {
    case 'income': return buildIncomeReport(period, members, contributions, chama)
    case 'loan-portfolio': return buildLoanReport(period, loans, chama)
    case 'activity': return buildActivityReport(period, members, chama)
    case 'member-statement': {
      const m = members.find((x) => x.id === memberId)
      if (!m) return null
      return buildMemberStatementReport(period, m, contributions, chama)
    }
    // Note: Investment and Attendance are still static mocks until backend endpoints are ready
    case 'investment':
      return {
        title: `Investment performance - ${fmtQuarter(period)}`,
        html: reportHTML('Investment performance', fmtQuarter(period), table(['Asset', 'Type', 'Value'], [['Mock Asset', 'Land', 100000]]), [['Total', 'KSh 100,000']], chama),
        csv: toCSV(['Asset', 'Value'], [['Mock Asset', 100000]]),
        csvName: `investments-${period}.csv`,
      }
    case 'attendance':
      return {
        title: `Attendance and voting - ${fmtQuarter(period)}`,
        html: reportHTML('Attendance and voting', fmtQuarter(period), table(['Meeting', 'Attendance'], [['Mock Meeting', '10/12']]), [['Total meetings', '1']], chama),
        csv: toCSV(['Meeting', 'Attendance'], [['Mock Meeting', '10/12']]),
        csvName: `attendance-${period}.csv`,
      }
    default: return null
  }
}

function PickMemberModal({ open, onClose, members, onPick }) {
  const [query, setQuery] = useState('')
  if (!open) return null

  const list = members
    .filter((m) => m.status !== 'invited')
    .filter((m) => {
      if (!query) return true
      const q = query.toLowerCase()
      return m.name.toLowerCase().includes(q) || (m.email && m.email.toLowerCase().includes(q))
    })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-line px-5 py-4">
          <h3 className="font-display text-[1.05rem] font-semibold text-navy">Select a member</h3>
          <p className="mt-0.5 text-[0.82rem] text-ink-soft">Choose whose statement you want to generate.</p>
        </div>
        <div className="border-b border-line px-5 py-3">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search member..." autoFocus
            className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-[0.92rem] text-navy outline-none transition focus:border-forest"
          />
        </div>
        <div className="max-h-[340px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="px-5 py-10 text-center text-[0.86rem] text-ink-soft">No members match.</div>
          ) : (
            list.map((m) => (
              <button key={m.id} onClick={() => onPick(m)} className="flex w-full items-center gap-3 border-b border-line px-5 py-3 text-left transition last:border-b-0 hover:bg-forest/[0.03]">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-forest to-emerald font-display text-[0.72rem] font-bold text-white">
                  {initials(m.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-navy">{m.name}</span>
                  <span className="block truncate text-[0.76rem] text-ink-soft">{m.email}</span>
                </span>
                <User size={14} strokeWidth={2} className="shrink-0 text-ink-soft" />
              </button>
            ))
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-line bg-paper/40 px-5 py-3.5">
          <button onClick={onClose} className="rounded-xl border border-line bg-white px-4 py-2.5 text-[0.86rem] font-semibold text-navy transition hover:border-navy">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { chama, members, loans, contributions } = useChama()
  const [month, setMonth] = useState(recentMonths(12)[1])
  const [quarter, setQuarter] = useState(recentQuarters(4)[0])
  const [pickFor, setPickFor] = useState(null)

  const months = useMemo(() => recentMonths(12), [])
  const quarters = useMemo(() => recentQuarters(4), [])

  const handleGenerate = (report, mode = 'print') => {
    if (report.id === 'member-statement') {
      setPickFor({ report, mode })
      return
    }
    const period = report.periodType === 'quarter' ? quarter : month
    const result = runReport(report, period, members, loans, contributions, chama)
    if (!result) return toast.error('Could not generate this report.')

    if (mode === 'csv') {
      downloadCSV(result.csvName, result.csv)
      toast.success(`${report.title} exported as CSV`)
      return
    }
    const ok = openPrint(result.html)
    if (ok) toast.success(`${report.title} ready`)
  }

  const handlePickMember = (member) => {
    const { report, mode } = pickFor
    const result = runReport(report, month, members, loans, contributions, chama, member.id)
    setPickFor(null)
    if (!result) return toast.error('Could not generate this report.')

    if (mode === 'csv') {
      downloadCSV(result.csvName, result.csv)
      toast.success(`Statement for ${member.name.split(' ')[0]} exported`)
      return
    }
    const ok = openPrint(result.html)
    if (ok) toast.success(`Statement for ${member.name.split(' ')[0]} ready`)
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Reports</h1>
          <p className="mt-1.5 max-w-[64ch] text-ink-soft">
            Generate any report for <b className="text-navy">{chama?.name || 'My Chama'}</b> for the current or previous periods.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
            <Calendar size={14} strokeWidth={2} className="shrink-0 text-ink-soft" />
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="cursor-pointer bg-transparent pr-2 text-sm font-medium text-navy outline-none">
              {months.map((m) => <option key={m} value={m}>{fmtMonth(m)}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2">
            <Calendar size={14} strokeWidth={2} className="shrink-0 text-ink-soft" />
            <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className="cursor-pointer bg-transparent pr-2 text-sm font-medium text-navy outline-none">
              {quarters.map((q) => <option key={q} value={q}>{fmtQuarter(q)}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3.5 hero:grid-cols-3">
        {REPORTS.map((r) => {
          const Icon = r.icon
          return (
            <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-forest/60">
              <div className="flex items-start justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald/10 text-forest">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span className="rounded-full bg-paper px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">{r.tag}</span>
              </div>
              <h3 className="font-display text-[1rem] font-semibold leading-snug text-navy">{r.title}</h3>
              <p className="text-[0.86rem] leading-relaxed text-ink-soft">{r.desc}</p>
              <div className="mt-auto flex items-center gap-2 pt-2">
                <button onClick={() => handleGenerate(r, 'print')} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-forest px-3 py-2 text-[0.82rem] font-semibold text-white transition hover:bg-forest-dark">
                  <Printer size={13} strokeWidth={2} /> Generate
                </button>
                <button onClick={() => handleGenerate(r, 'csv')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[0.82rem] font-semibold text-navy transition hover:border-forest" aria-label="Export CSV">
                  <Download size={13} strokeWidth={2} /> CSV
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-emerald/10 px-4 py-3 text-[0.84rem] text-navy">
        <ArrowUpRight size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-forest" />
        <span>Reports open in a new tab. Use <b>Save as PDF</b> in the print dialog to keep a copy. Allow pop-ups for this site to avoid the block.</span>
      </div>

      <PickMemberModal open={!!pickFor} onClose={() => setPickFor(null)} members={members} onPick={handlePickMember} />
    </div>
  )
}