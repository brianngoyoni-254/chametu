// src/lib/superadminBridge.js
// Bridges admin + member data (localStorage) into superadmin shape.

const KEYS = {
  // Admin-managed
  chamaAdmin: 'chametu_chama_v1',
  members: 'chametu_members_v2',
  invites: 'chametu_invites_v1',
  loans: 'chametu_loans_v1',
  savings: 'chametu_savings_v1',
  welfare: 'chametu_welfare_v1',
  transactions: 'chametu_transactions_v1',
  payments: 'chametu_payments_v1',
  memberLedger: 'chametu_member_ledger_v1',
  // Shared (admin + member both read/write)
  assets: 'chametu_shared_assets_v1',
  meetings: 'chametu_shared_meetings_v1',
  payout: 'chametu_shared_payout_v1',
  proposals: 'chametu_shared_proposals_v1',
  // Superadmin
  tickets: 'chametu_superadmin_tickets',
  auditLog: 'chametu_superadmin_audit',
  authSession: 'chametu_auth_session',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function readChama() {
  const c = read(KEYS.chamaAdmin, null) || {}
  return {
    name: c.name || 'My Chama',
    code: c.code || 'CHM-000000',
    type: c.type || 'Investment Chama',
    location: c.location || 'Nairobi, Kenya',
    currency: c.currency || 'KSh',
    paybill: c.paybill || '174379',
    amount: c.amount ?? 5000,
    due: c.due ?? 30,
    grace: c.grace ?? 3,
    created: c.created || 'Recently',
  }
}

export const readMembers = () => read(KEYS.members, [])
export const readInvites = () => read(KEYS.invites, [])
export const readLoans = () => read(KEYS.loans, [])
export const readWelfare = () => read(KEYS.welfare, [])
export const readAssets = () => read(KEYS.assets, [])
export const readMeetings = () => read(KEYS.meetings, [])
export const readProposals = () => read(KEYS.proposals, [])
export const readTransactions = () => read(KEYS.transactions, [])
export const readPayments = () => read(KEYS.payments, [])
export const readSavings = () => read(KEYS.savings, [])

/**
 * Portfolio is derived from assets that have a `value` field
 * (the admin portfolio page uses the same list).
 */
export function readPortfolio() {
  const assets = readAssets()
  return assets
    .filter((a) => typeof a.value === 'number' && a.value > 0)
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type || 'Other',
      invested: Number(a.price) || 0,
      value: Number(a.value) || 0,
    }))
}

const TIER_THRESHOLDS = [
  { tier: 'Gold', min: 40 },
  { tier: 'Business', min: 25 },
  { tier: 'Growth', min: 15 },
  { tier: 'Starter', min: 0 },
]
export function tierForMemberCount(n) {
  const hit = TIER_THRESHOLDS.find((t) => n >= t.min)
  return hit ? hit.tier : 'Starter'
}

export function readChamaSummary() {
  const chama = readChama()
  const members = readMembers()
  const loans = readLoans()
  const savings = readSavings()
  const portfolio = readPortfolio()
  const assets = readAssets()
  const payments = readPayments()
  const authSession = read(KEYS.authSession, null)

  const active = members.filter((m) => m.status === 'active')
  const arrears = members.filter((m) => m.status === 'arrears')
  const invited = members.filter((m) => m.status === 'invited')
  const deactivated = members.filter((m) => m.status === 'inactive')

  const totalSavings =
    active.reduce((s, m) => s + (m.savings || 0), 0) ||
    savings.reduce((s, r) => s + (r.deposit || 0) - (r.withdrawal || 0), 0)

  const totalLoanBalance = loans
    .filter((l) => l.status !== 'rejected')
    .reduce((s, l) => s + (l.balance || 0), 0)

  const portfolioValue = portfolio.reduce((s, p) => s + (p.value || 0), 0)
  const assetsValue = assets.reduce((s, a) => s + (Number(a.value) || 0), 0)

  const unmatchedPayments = payments.filter((p) => p.status === 'unmatched').length
  const matchedPayments = payments.filter((p) => p.status === 'matched').length

  const tier = tierForMemberCount(active.length)

  const chair =
    members.find(
      (m) =>
        m.role?.toLowerCase() === 'chairman' ||
        m.role?.toLowerCase() === 'chairperson'
    )?.name ||
    authSession?.name ||
    '—'

  const expectedTotal = active.length * chama.amount
  const paidTotal = active.reduce((s) => s + chama.amount, 0)
  const collection = expectedTotal ? Math.round((paidTotal / expectedTotal) * 100) : 0

  const overdueLoans = loans.filter((l) => l.status === 'overdue')
  const daysOverdue = overdueLoans.length > 0 || arrears.length > 0 ? 14 : 0

  const status =
    deactivated.length === members.length && members.length > 0
      ? 'deactivated'
      : overdueLoans.length > 0
        ? 'blocked'
        : 'active'

  const tierPrice = {
    Starter: 1500,
    Growth: 3000,
    Business: 5000,
    Gold: 10000,
  }[tier]

  return {
    id: chama.code,
    name: chama.name,
    loc: chama.location,
    chair,
    tier,
    m: active.length + invited.length,
    col: collection,
    od: daysOverdue,
    status,
    sav: totalSavings,
    memberCounts: {
      total: members.length,
      active: active.length,
      invited: invited.length,
      arrears: arrears.length,
      deactivated: deactivated.length,
    },
    totalLoanBalance,
    portfolioValue,
    assetsValue,
    unmatchedPayments,
    matchedPayments,
    tierPrice,
  }
}

export function readUnpaidInvoices() {
  const s = readChamaSummary()
  if (s.od <= 0) return []
  return [
    {
      id: 1,
      name: s.name,
      owner: s.chair,
      tier: s.tier,
      daysOverdue: s.od,
      amount: s.tierPrice,
      status: s.status === 'blocked' ? 'Blocked' : 'Overdue',
    },
  ]
}

export function readPaymentLedger() {
  const chama = readChama()
  const summary = readChamaSummary()
  const payments = readPayments()
  const transactions = readTransactions()
  const savings = readSavings()

  const mpesa = payments.map((p) => ({
    id: p.id,
    channel: 'mpesa',
    ref: p.ref || '—',
    chama: chama.name,
    payer: p.matchedTo || p.name || 'Unknown',
    phone: p.phone,
    amount: p.amount,
    time: p.time || new Date().toISOString(),
    status: p.status === 'matched' ? 'paid' : 'pending',
    tier: summary.tier,
  }))

  const cash = savings
    .filter((r) => r.deposit > 0)
    .map((r, i) => ({
      id: `cash-${i}`,
      channel: 'cash',
      ref: `RCPT-${1000 + i}`,
      chama: chama.name,
      payer: r.member,
      receivedBy: 'Treasurer',
      amount: r.deposit,
      time: new Date().toISOString(),
      status: 'paid',
      tier: summary.tier,
    }))

  const bank = transactions
    .filter((t) => t.credit > 0 && /deposit|bank|loan/i.test(t.desc || ''))
    .map((t, i) => ({
      id: `bank-${i}`,
      channel: 'bank',
      ref: `BNK-${2000 + i}`,
      chama: chama.name,
      payer: t.desc,
      account: '—',
      amount: t.credit,
      time: new Date().toISOString(),
      status: 'paid',
      tier: summary.tier,
    }))

  return [...mpesa, ...cash, ...bank].sort((a, b) => (a.time < b.time ? 1 : -1))
}

export function readDerivedAudit() {
  const entries = []
  const now = Date.now()

  readMembers().forEach((m) => {
    if (m.status === 'invited') {
      entries.push({
        id: `m-${m.id}-inv`,
        actor: 'Chama admin',
        action: 'Invite sent',
        target: `${m.name} (${m.email})`,
        tone: 'blue',
        time: new Date(now - 3600_000).toISOString(),
        ip: '—',
      })
    }
    if (m.status === 'inactive') {
      entries.push({
        id: `m-${m.id}-ina`,
        actor: 'Chama admin',
        action: 'Member deactivated',
        target: m.name,
        tone: 'gray',
        time: new Date(now - 7200_000).toISOString(),
        ip: '—',
      })
    }
  })

  readPayments().forEach((p) => {
    entries.push({
      id: `p-${p.id}`,
      actor: 'System',
      action: p.status === 'matched' ? 'M-Pesa matched' : 'M-Pesa unmatched',
      target: `${p.name || 'Unknown'} — KSh ${p.amount}`,
      tone: p.status === 'matched' ? 'green' : 'amber',
      time: new Date(now - 1800_000).toISOString(),
      ip: '—',
    })
  })

  readLoans().forEach((l) => {
    if (l.status === 'new') {
      entries.push({
        id: `l-${l.id}-new`,
        actor: l.member,
        action: 'Loan application submitted',
        target: `KSh ${l.amount}`,
        tone: 'blue',
        time: new Date(now - 5400_000).toISOString(),
        ip: '—',
      })
    }
    if (l.status === 'overdue') {
      entries.push({
        id: `l-${l.id}-od`,
        actor: 'System',
        action: 'Loan marked overdue',
        target: `${l.member} — KSh ${l.balance} outstanding`,
        tone: 'red',
        time: new Date(now - 10800_000).toISOString(),
        ip: '—',
      })
    }
  })

  readWelfare().forEach((w) => {
    if (w.status === 'pending') {
      entries.push({
        id: `w-${w.id}`,
        actor: w.member,
        action: 'Welfare claim submitted',
        target: `${w.reason} — KSh ${w.amount}`,
        tone: 'amber',
        time: new Date(now - 2600_000).toISOString(),
        ip: '—',
      })
    }
  })

  return entries.sort((a, b) => (a.time < b.time ? 1 : -1))
}

export function readAuditLog() {
  return read(KEYS.auditLog, [])
}
export function writeAuditLog(entries) {
  try {
    localStorage.setItem(KEYS.auditLog, JSON.stringify(entries))
  } catch {}
  window.dispatchEvent(new CustomEvent('chametu:audit-updated', { detail: entries }))
}
export function appendAuditLog(entry) {
  const current = readAuditLog()
  const next = [
    { ...entry, id: entry.id || `a-${Date.now()}`, time: entry.time || new Date().toISOString() },
    ...current,
  ].slice(0, 200)
  writeAuditLog(next)
  return next
}