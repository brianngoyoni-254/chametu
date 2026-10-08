import { useMemo, useState } from 'react'
import {
  BarChart3, FileText, TrendingUp, Users, CalendarCheck, Wallet,
  ArrowUpRight, Download, Printer, Calendar, User,
} from 'lucide-react'
import { toast } from 'sonner'
import logoUrl from '../../assets/logos.png'

const MEMBERS_KEY = 'chametu_members_v2'

const CHAMA = {
  name: 'Umoja Investment Chama',
  code: 'CHM-8F3K2P',
  currency: 'KSh',
}

const MONTHLY_CONTRIBUTION = 5000

/* -report catalog- */

const REPORTS = [
  {
    id: 'income',
    icon: BarChart3,
    title: 'Income statement',
    desc: 'Contributions, expenses and net position for any period.',
    tag: 'Finance',
    periodType: 'month',
  },
  {
    id: 'member-statement',
    icon: FileText,
    title: 'Member statement',
    desc: 'Per-member contribution, savings and loan history.',
    tag: 'Finance',
    periodType: 'month',
    target: 'member',
  },
  {
    id: 'loan-portfolio',
    icon: Wallet,
    title: 'Loan portfolio',
    desc: 'Outstanding, overdue and repayment-rate breakdown.',
    tag: 'Finance',
    periodType: 'month',
  },
  {
    id: 'investment',
    icon: TrendingUp,
    title: 'Investment performance',
    desc: 'Gains, income and valuation across the portfolio.',
    tag: 'Investments',
    periodType: 'quarter',
  },
  {
    id: 'attendance',
    icon: CalendarCheck,
    title: 'Attendance & voting',
    desc: 'Meeting attendance and resolution history.',
    tag: 'Governance',
    periodType: 'quarter',
  },
  {
    id: 'activity',
    icon: Users,
    title: 'Member activity',
    desc: 'Login, payment and engagement per member.',
    tag: 'People',
    periodType: 'month',
  },
]

/* ---------- helpers ---------- */

function loadMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function fmtMonth(ym) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-KE', {
    month: 'long',
    year: 'numeric',
  })
}

function fmtKsh(n) {
  return `${CHAMA.currency} ${Number(n).toLocaleString('en-KE')}`
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
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase()
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

/* - CSV - */

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

/* -print- */

function table(headers, rows, totalsRow = null) {
  const thead = `<tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>`
  const bodyRows = totalsRow ? [...rows, totalsRow] : rows
  const tbody = bodyRows
    .map(
      (r) =>
        `<tr>${r
          .map((c) => `<td>${typeof c === 'number' ? c.toLocaleString() : c}</td>`)
          .join('')}</tr>`
    )
    .join('')
  return `<table><thead>${thead}</thead><tbody>${tbody}</tbody></table>`
}

function reportHTML(title, period, bodyTable, summary) {
  const generatedAt = new Date().toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const logoSrc = absoluteLogo()

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>${title} — ${period}</title>
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
          <div class="brand-name">${CHAMA.name}</div>
          <div class="brand-sub">Chama code ${CHAMA.code}</div>
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
  <div class="footer">Generated by Chametu. All amounts in ${CHAMA.currency}.</div>
</body></html>`
}

function openPrint(html) {
  const w = window.open('', '_blank')
  if (!w) {
    toast.error('Pop-up blocked. Allow pop-ups to view this report.')
    return false
  }
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 300)
  return true
}

/* -report builders- */

function buildIncomeReport(period, members) {
  const rows = members
    .filter((m) => m.status !== 'invited')
    .map((m) => {
      const isArrears = m.status === 'arrears'
      const paid = isArrears ? 0 : MONTHLY_CONTRIBUTION
      const lateFee = isArrears ? 100 : 0
      return [m.name, m.role, MONTHLY_CONTRIBUTION, paid, lateFee, paid - MONTHLY_CONTRIBUTION]
    })

  const headers = ['Member', 'Role', 'Expected', 'Paid', 'Late fee', 'Balance']
  const sum = (i) => rows.reduce((a, r) => a + r[i], 0)
  const totals = ['Total', '', sum(2), sum(3), sum(4), sum(5)]

  return {
    title: `Income statement — ${fmtMonth(period)}`,
    html: reportHTML(
      'Income statement',
      fmtMonth(period),
      table(headers, rows, totals),
      [
        ['Expected contributions', fmtKsh(sum(2))],
        ['Collected', fmtKsh(sum(3))],
        ['Late fees', fmtKsh(sum(4))],
        ['Net position', fmtKsh(sum(3) + sum(4))],
      ]
    ),
    csv: toCSV(headers, rows),
    csvName: `income-${period}.csv`,
  }
}

function buildLoanReport(period, members) {
  const borrowers = members.filter((m) => m.loan > 0)
  const rows = borrowers.map((m) => {
    const isOverdue = m.status === 'arrears'
    return [
      m.name,
      m.role,
      m.loan,
      isOverdue ? m.loan : Math.round(m.loan * 0.3),
      isOverdue ? 'Overdue' : 'On track',
    ]
  })

  const headers = ['Borrower', 'Role', 'Loan balance', 'Repaid to date', 'Status']
  const totalLoan = borrowers.reduce((a, m) => a + m.loan, 0)

  return {
    title: `Loan portfolio — ${fmtMonth(period)}`,
    html: reportHTML(
      'Loan portfolio',
      fmtMonth(period),
      rows.length
        ? table(headers, rows)
        : `<p style="text-align:center;color:#5B6B7B;font-style:italic;padding:20px">No active loans this period.</p>`,
      [
        ['Active borrowers', String(borrowers.length)],
        ['Total outstanding', fmtKsh(totalLoan)],
        ['Overdue accounts', String(borrowers.filter((m) => m.status === 'arrears').length)],
        [
          'Repayment rate',
          borrowers.length
            ? `${Math.round(
                (1 - borrowers.filter((m) => m.status === 'arrears').length / borrowers.length) * 100
              )}%`
            : '—',
        ],
      ]
    ),
    csv: toCSV(headers, rows),
    csvName: `loans-${period}.csv`,
  }
}

function buildActivityReport(period, members) {
  const headers = ['Member', 'Role', 'Status', 'Savings', 'Loan', 'Last activity']
  const rows = members
    .filter((m) => m.status !== 'invited')
    .map((m) => [m.name, m.role, m.status, m.savings, m.loan, fmtMonth(period)])

  return {
    title: `Member activity — ${fmtMonth(period)}`,
    html: reportHTML(
      'Member activity',
      fmtMonth(period),
      table(headers, rows),
      [
        ['Active members', String(members.filter((m) => m.status === 'active').length)],
        ['In arrears', String(members.filter((m) => m.status === 'arrears').length)],
        ['Inactive', String(members.filter((m) => m.status === 'inactive').length)],
        ['Total savings', fmtKsh(members.reduce((a, m) => a + m.savings, 0))],
      ]
    ),
    csv: toCSV(headers, rows),
    csvName: `activity-${period}.csv`,
  }
}

function buildInvestmentReport(quarter) {
  const rows = [
    ['Kiambu Land Project', 'Land', 1200000, 1500000, 300000, '+25.0%'],
    ['Money Market Fund', 'MMF', 900000, 980000, 80000, '+8.9%'],
    ['Treasury Bills — 91 day', 'T-Bill', 600000, 620000, 20000, '+3.3%'],
  ]
  const headers = ['Investment', 'Type', 'Invested', 'Current value', 'Gain', 'Return']
  const totalInvested = rows.reduce((a, r) => a + r[2], 0)
  const totalValue = rows.reduce((a, r) => a + r[3], 0)

  return {
    title: `Investment performance — ${fmtQuarter(quarter)}`,
    html: reportHTML(
      'Investment performance',
      fmtQuarter(quarter),
      table(headers, rows),
      [
        ['Total invested', fmtKsh(totalInvested)],
        ['Current value', fmtKsh(totalValue)],
        ['Unrealised gain', fmtKsh(totalValue - totalInvested)],
        ['Overall return', `${Math.round(((totalValue - totalInvested) / totalInvested) * 100)}%`],
      ]
    ),
    csv: toCSV(headers, rows),
    csvName: `investments-${quarter}.csv`,
  }
}

function buildAttendanceReport(quarter) {
  const headers = ['Meeting', 'Date', 'Attendance', 'Quorum', 'Resolutions']
  const rows = [
    ['Monthly General Meeting', 'Sep 28, 2026', '72 / 84', 'Yes', 3],
    ['Monthly General Meeting', 'Aug 24, 2026', '68 / 84', 'Yes', 2],
    ['Special: Land Purchase', 'Jul 15, 2026', '61 / 84', 'Yes', 1],
    ['Monthly General Meeting', 'Jun 27, 2026', '58 / 84', 'No', 2],
  ]

  return {
    title: `Attendance & voting — ${fmtQuarter(quarter)}`,
    html: reportHTML(
      'Attendance & voting',
      fmtQuarter(quarter),
      table(headers, rows),
      [
        ['Meetings held', String(rows.length)],
        [
          'Average attendance',
          `${Math.round(
            rows.reduce((a, r) => a + Number(r[2].split(' / ')[0]), 0) / rows.length
          )} / 84`,
        ],
        ['Total resolutions passed', String(rows.reduce((a, r) => a + r[4], 0))],
        ['Quorum met', `${rows.filter((r) => r[3] === 'Yes').length} of ${rows.length}`],
      ]
    ),
    csv: toCSV(headers, rows),
    csvName: `attendance-${quarter}.csv`,
  }
}

function buildMemberStatementReport(period, member) {
  const isArrears = member.status === 'arrears'
  const paid = isArrears ? 0 : MONTHLY_CONTRIBUTION
  const headers = ['Date', 'Description', 'Debit', 'Credit', 'Balance']
  const rows = [
    [
      fmtMonth(period),
      'Contribution',
      MONTHLY_CONTRIBUTION,
      paid,
      MONTHLY_CONTRIBUTION - paid,
    ],
    [fmtMonth(period), 'Savings', '', '', member.savings],
    [fmtMonth(period), 'Loan balance', member.loan || '—', '', member.loan || '—'],
  ]

  return {
    title: `Member statement — ${member.name}`,
    html: reportHTML(
      `Member statement — ${member.name}`,
      fmtMonth(period),
      table(headers, rows),
      [
        ['Member', member.name],
        ['Role', member.role],
        ['Status', member.status],
        ['Savings balance', fmtKsh(member.savings)],
        ['Loan balance', member.loan > 0 ? fmtKsh(member.loan) : '—'],
      ]
    ),
    csv: toCSV(headers, rows),
    csvName: `statement-${member.id}-${period}.csv`,
  }
}

/* -report dispatch- */

function runReport(report, period, members, memberId) {
  switch (report.id) {
    case 'income':
      return buildIncomeReport(period, members)
    case 'loan-portfolio':
      return buildLoanReport(period, members)
    case 'activity':
      return buildActivityReport(period, members)
    case 'investment':
      return buildInvestmentReport(period)
    case 'attendance':
      return buildAttendanceReport(period)
    case 'member-statement': {
      const m = members.find((x) => x.id === memberId)
      if (!m) return null
      return buildMemberStatementReport(period, m)
    }
    default:
      return null
  }
}

/* - modal for member-statement- */

function PickMemberModal({ open, onClose, members, onPick }) {
  const [query, setQuery] = useState('')
  if (!open) return null

  const list = members
    .filter((m) => m.status !== 'invited')
    .filter((m) => {
      if (!query) return true
      const q = query.toLowerCase()
      return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    })

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-navy text-[1.05rem]">Select a member</h3>
          <p className="mt-0.5 text-[0.82rem] text-ink-soft">
            Choose whose statement you want to generate.
          </p>
        </div>

        <div className="px-5 py-3 border-b border-line">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member…"
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-white text-[0.92rem] text-navy outline-none focus:border-forest transition"
          />
        </div>

        <div className="max-h-[340px] overflow-y-auto">
          {list.length === 0 ? (
            <div className="px-5 py-10 text-center text-ink-soft text-[0.86rem]">
              No members match.
            </div>
          ) : (
            list.map((m) => (
              <button
                key={m.id}
                onClick={() => onPick(m)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left border-b border-line last:border-b-0 hover:bg-forest/[0.03] transition"
              >
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest to-emerald text-white grid place-items-center font-display font-bold text-[0.72rem] shrink-0">
                  {initials(m.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-navy truncate">{m.name}</span>
                  <span className="block text-[0.76rem] text-ink-soft truncate">{m.email}</span>
                </span>
                <User size={14} strokeWidth={2} className="text-ink-soft shrink-0" />
              </button>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-line bg-paper/40">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold hover:border-navy transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}


export default function Reports() {
  const [members] = useState(() => loadMembers())
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
    const result = runReport(report, period, members)
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
    const result = runReport(report, month, members, member.id)
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
    <div className="max-w-[1180px] mx-auto">
      <header className="flex justify-between items-start gap-6 flex-wrap mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy">Reports</h1>
          <p className="mt-1.5 text-ink-soft max-w-[64ch]">
            Generate any report for the current or previous periods. Every report opens in a print-ready view and exports as CSV.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-white">
            <Calendar size={14} strokeWidth={2} className="text-ink-soft shrink-0" />
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-navy cursor-pointer pr-2"
            >
              {months.map((m) => (
                <option key={m} value={m}>{fmtMonth(m)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-white">
            <Calendar size={14} strokeWidth={2} className="text-ink-soft shrink-0" />
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="bg-transparent outline-none text-sm font-medium text-navy cursor-pointer pr-2"
            >
              {quarters.map((q) => (
                <option key={q} value={q}>{fmtQuarter(q)}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 hero:grid-cols-3 gap-3.5">
        {REPORTS.map((r) => {
          const Icon = r.icon
          return (
            <div
              key={r.id}
              className="bg-white border border-line rounded-2xl p-5 flex flex-col gap-3 hover:border-forest/60 hover:-translate-y-0.5 transition"
            >
              <div className="flex items-start justify-between">
                <span className="w-9 h-9 rounded-xl bg-emerald/10 text-forest grid place-items-center">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span className="text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft bg-paper px-2.5 py-1 rounded-full">
                  {r.tag}
                </span>
              </div>

              <h3 className="font-display font-semibold text-navy text-[1rem] leading-snug">
                {r.title}
              </h3>
              <p className="text-[0.86rem] text-ink-soft leading-relaxed">{r.desc}</p>

              <div className="mt-auto pt-2 flex items-center gap-2">
                <button
                  onClick={() => handleGenerate(r, 'print')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-forest text-white text-[0.82rem] font-semibold hover:bg-forest-dark transition"
                >
                  <Printer size={13} strokeWidth={2} />
                  Generate
                </button>
                <button
                  onClick={() => handleGenerate(r, 'csv')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-line bg-white text-navy text-[0.82rem] font-semibold hover:border-forest transition"
                  aria-label="Export CSV"
                >
                  <Download size={13} strokeWidth={2} />
                  CSV
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald/10 text-navy text-[0.84rem]">
        <ArrowUpRight size={16} strokeWidth={2} className="text-forest mt-0.5 shrink-0" />
        <span>
          Reports open in a new tab. Use <b>Save as PDF</b> in the print dialog to keep a copy. Allow pop-ups for this site to avoid the block.
        </span>
      </div>

      <PickMemberModal
        open={!!pickFor}
        onClose={() => setPickFor(null)}
        members={members}
        onPick={handlePickMember}
      />
    </div>
  )
}