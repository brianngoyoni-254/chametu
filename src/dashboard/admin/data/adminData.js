// Single source for the figures Overview shows.
// Members come from localStorage (same key as Members.jsx), so edits there show up here.
// The other pages keep their data in component state, so their seed data is mirrored here.
// When a backend exists, replace these loaders with API calls.

import { getChama } from '../../../lib/chametuStorage'

export const MEMBERS_KEY = 'chametu_members_v2'

/** Live chama name. Prefer this function over the legacy constant. */
export function getChamaName() {
  return getChama()?.name || 'My Chama'
}

/**
 * Legacy constant. Evaluated once at import time, so it can go stale if the
 * chama is created or renamed after this module loads. Kept only for any
 * remaining imports; prefer getChamaName() in new code.
 */
export const CHAMA_NAME = getChamaName()

const SEED_MEMBERS = [
  { id: 'm1', name: 'Daniel Muthui', role: 'Chairman', savings: 85000, loan: 20000, status: 'active' },
  { id: 'm2', name: 'Brian Ngoyoni', role: 'Treasurer', savings: 60000, loan: 0, status: 'active' },
  { id: 'm3', name: 'Kevin Mwangi', role: 'Secretary', savings: 45000, loan: 50000, status: 'active' },
  { id: 'm4', name: 'Mary Achieng', role: 'Member', savings: 120000, loan: 40000, status: 'active' },
  { id: 'm5', name: 'David Otieno', role: 'Member', savings: 30000, loan: 18000, status: 'arrears' },
  { id: 'm6', name: 'Grace Wanjiru', role: 'Member', savings: 380000, loan: 0, status: 'active' },
  { id: 'm7', name: 'Peter Otieno', role: 'Member', savings: 310000, loan: 0, status: 'active' },
  { id: 'm8', name: 'Faith Mwende', role: 'Member', savings: 120000, loan: 0, status: 'invited' },
]

export function loadMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return SEED_MEMBERS
}

export const CONTRIBUTIONS = [
  { name: 'Brian N.', expected: 5000, paid: 5000, status: 'done' },
  { name: 'Jane W.', expected: 5000, paid: 5000, status: 'done' },
  { name: 'Kevin M.', expected: 5000, paid: 0, status: 'pending' },
  { name: 'Mary N.', expected: 5000, paid: 5000, status: 'done' },
  { name: 'David O.', expected: 5000, paid: 0, status: 'overdue' },
]

export const LOANS = [
  { id: 1, member: 'Brian N.', amount: 100000, balance: 72500, status: 'active' },
  { id: 2, member: 'Mary N.', amount: 40000, balance: 40000, status: 'new' },
  { id: 3, member: 'David O.', amount: 60000, balance: 18000, status: 'overdue' },
  { id: 4, member: 'Alice K.', amount: 30000, balance: 9000, status: 'active' },
]

export const TRANSACTIONS = [
  { date: 'Sep 24', desc: 'Contribution / Jane W.', debit: 0, credit: 5000 },
  { date: 'Sep 23', desc: 'Loan repayment / David O.', debit: 0, credit: 9167 },
  { date: 'Sep 22', desc: 'Expense / meeting venue', debit: 2000, credit: 0 },
  { date: 'Sep 20', desc: 'Loan disbursed / Mary N.', debit: 40000, credit: 0 },
  { date: 'Sep 18', desc: 'Investment income / MMF', debit: 0, credit: 12400 },
  { date: 'Sep 12', desc: 'Contribution / Kevin M.', debit: 0, credit: 5000 },
]

const OPENING_BALANCE = 1415333

export const PORTFOLIO = [
  { id: 1, name: 'Kiambu Land Project', type: 'Land', invested: 1200000, value: 1500000 },
  { id: 2, name: 'Money Market Fund', type: 'MMF', invested: 900000, value: 980000 },
  { id: 3, name: 'Treasury Bills 91 day', type: 'T-Bill', invested: 600000, value: 620000 },
]

export const PAYMENTS = [
  { id: 1, status: 'matched' },
  { id: 2, status: 'matched' },
  { id: 3, status: 'unmatched' },
  { id: 4, status: 'unmatched' },
  { id: 5, status: 'matched' },
]

export const PROPOSALS = [
  { id: 'kilifi', title: 'Kilifi Property Purchase', amount: 'KSh 4,500,000', closes: 'Oct 2' },
  { id: 'raise', title: 'Increase monthly contribution', amount: 'KSh 5,000 to KSh 6,000', closes: 'Oct 10' },
]

export const MEETINGS = [
  {
    id: 1,
    date: 'Sep 28, 2026',
    time: '2:00 PM',
    title: 'Monthly General Meeting',
    agenda: 'Financial report / Loan applications / Investment proposal / Welfare',
    locked: false,
  },
]

export const WELFARE = {
  start: 340000,
  claims: [
    { amount: 4500, status: 'pending' },
    { amount: 15000, status: 'paid' },
    { amount: 6000, status: 'paid' },
  ],
}

/** Everything Overview needs, derived in one place. */
export function getOverviewData() {
  const members = loadMembers()
  const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0)

  // Ledger (newest first) with running balance, same maths as Transactions.jsx
  let bal = OPENING_BALANCE
  const ledger = [...TRANSACTIONS]
    .reverse()
    .map((t) => {
      bal = bal + t.credit - t.debit
      return { ...t, balance: bal }
    })
    .reverse()

  const groupBalance = ledger[0]?.balance ?? OPENING_BALANCE
  const moneyIn = sum(TRANSACTIONS, (t) => t.credit)
  const moneyOut = sum(TRANSACTIONS, (t) => t.debit)

  const expected = sum(CONTRIBUTIONS, (c) => c.expected)
  const collected = sum(CONTRIBUTIONS, (c) => c.paid)
  const contribPct = expected ? Math.round((collected / expected) * 100) : 0
  const unpaid = CONTRIBUTIONS.filter((c) => c.status !== 'done')
  const overdueContrib = CONTRIBUTIONS.filter((c) => c.status === 'overdue')

  const liveLoans = LOANS.filter((l) => l.status !== 'rejected')
  const outstanding = sum(liveLoans, (l) => l.balance)
  const overdueLoans = LOANS.filter((l) => l.status === 'overdue')
  const overdueAmount = sum(overdueLoans, (l) => l.balance)
  const pendingLoans = LOANS.filter((l) => l.status === 'new')

  const invested = sum(PORTFOLIO, (p) => p.invested)
  const portfolioValue = sum(PORTFOLIO, (p) => p.value)
  const gain = portfolioValue - invested

  const allocation = Object.values(
    PORTFOLIO.reduce((acc, p) => {
      acc[p.type] = acc[p.type] || { type: p.type, value: 0 }
      acc[p.type].value += p.value
      return acc
    }, {})
  ).sort((a, b) => b.value - a.value)

  const welfarePaid = sum(
    WELFARE.claims.filter((c) => c.status === 'paid'),
    (c) => c.amount
  )
  const welfareBalance = WELFARE.start - welfarePaid
  const welfarePending = WELFARE.claims.filter((c) => c.status === 'pending').length

  return {
    members,
    memberCounts: {
      active: members.filter((m) => m.status === 'active').length,
      arrears: members.filter((m) => m.status === 'arrears').length,
      invited: members.filter((m) => m.status === 'invited').length,
      total: members.length,
    },
    memberSavings: sum(
      members.filter((m) => m.status !== 'invited'),
      (m) => m.savings
    ),
    groupBalance,
    moneyIn,
    moneyOut,
    ledger,
    expected,
    collected,
    contribPct,
    unpaid,
    overdueContrib,
    outstanding,
    overdueLoans,
    overdueAmount,
    pendingLoans,
    liveLoans,
    invested,
    portfolioValue,
    gain,
    allocation,
    welfareBalance,
    welfarePending,
    unmatchedPayments: PAYMENTS.filter((p) => p.status === 'unmatched').length,
    openProposals: PROPOSALS,
    nextMeeting: MEETINGS.find((m) => !m.locked) || null,
  }
}