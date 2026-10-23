// src/lib/chametuStorage.js
// Legacy local-only persistence layer.
// NOTE: payments, savings, transactions, welfare, contributions and loans
// have been migrated to the backend — the keys below are only used by the
// demo-member entry flow and any remaining legacy helpers.

const CHAMA_KEY          = 'chametu_chama_v1'
const INVITES_KEY        = 'chametu_invites_v1'
const MEMBERS_KEY        = 'chametu_members_v2'
const MEMBER_SESSION_KEY = 'chametu_member_session_v1'
const MEMBER_LEDGER_KEY  = 'chametu_member_ledger_v1'
const TRANSACTIONS_KEY   = 'chametu_transactions_v1'
const PAYMENTS_KEY       = 'chametu_payments_v1'
const WELFARE_KEY        = 'chametu_welfare_v1'
const LOANS_KEY          = 'chametu_loans_v1'
const SAVINGS_KEY        = 'chametu_savings_v1'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('chametu:storage-updated', { detail: { key } }))
  } catch {}
}

function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function makeToken(len = 32) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  try {
    const buf = new Uint32Array(len)
    crypto.getRandomValues(buf)
    for (let i = 0; i < len; i++) out += chars[buf[i] % chars.length]
  } catch {
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

const DAY_MS = 24 * 60 * 60 * 1000
const INVITE_TTL_DAYS = 7

/* ============================ CHAMA ============================ */

export function getChama() {
  return read(CHAMA_KEY, null)
}

export function saveChama(chama) {
  write(CHAMA_KEY, chama)
  return chama
}

export function getMemberChama(session) {
  const local = getChama() || {}
  const name = session?.chamaName || local.name || 'My Chama'
  const code = session?.chamaCode || local.code || ''
  return { ...local, name, code }
}

/* ============================ INVITES ============================ */

export function getInvites() {
  return read(INVITES_KEY, [])
}

function saveInvites(list) {
  write(INVITES_KEY, list)
}

export function createInvite({ contact, method, role = 'Member' }) {
  const chama = getChama()
  if (!chama) throw new Error('No chama exists yet. Create a chama first.')

  const invite = {
    id: uid('inv_'),
    token: makeToken(32),
    chamaCode: chama.code,
    chamaName: chama.name,
    contact: contact.trim(),
    method,
    role,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + INVITE_TTL_DAYS * DAY_MS,
    joinedAt: null,
    joinedAs: null,
  }

  saveInvites([invite, ...getInvites()])
  return invite
}

export function resendInvite(id) {
  const list = getInvites()
  const next = list.map((inv) =>
    inv.id === id
      ? {
          ...inv,
          token: makeToken(32),
          status: 'pending',
          createdAt: Date.now(),
          expiresAt: Date.now() + INVITE_TTL_DAYS * DAY_MS,
          joinedAt: null,
          joinedAs: null,
        }
      : inv
  )
  saveInvites(next)
  return next.find((i) => i.id === id) || null
}

export function cancelInvite(id) {
  saveInvites(getInvites().filter((i) => i.id !== id))
}

export function inviteLink(invite) {
  const path = `/join/${invite.chamaCode}/${invite.token}`
  try {
    return new URL(path, window.location.origin).href
  } catch {
    return path
  }
}

export function findValidInvite(chamaCode, token) {
  const chama = getChama()
  if (!chama) return { ok: false, reason: 'wrong-chama' }
  if (!chamaCode || chama.code.toUpperCase() !== String(chamaCode).toUpperCase()) {
    return { ok: false, reason: 'wrong-chama' }
  }

  const invite = getInvites().find((i) => i.token === token)
  if (!invite) return { ok: false, reason: 'not-found' }

  if (invite.chamaCode.toUpperCase() !== chama.code.toUpperCase()) {
    return { ok: false, reason: 'wrong-chama' }
  }
  if (invite.status === 'joined') return { ok: false, reason: 'used' }

  if (invite.expiresAt && Date.now() > invite.expiresAt) {
    saveInvites(
      getInvites().map((i) => (i.id === invite.id ? { ...i, status: 'expired' } : i))
    )
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, invite, chama }
}

/* ============================ MEMBERS ============================ */

export function getMembers() {
  return read(MEMBERS_KEY, [])
}

function saveMembers(list) {
  write(MEMBERS_KEY, list)
}

export function findMemberByContact(chamaCode, contact) {
  const target = (contact || '').trim().toLowerCase()
  return (
    getMembers().find(
      (m) =>
        (m.email || '').toLowerCase() === target ||
        (m.phone || '').replace(/\s/g, '') === target.replace(/\s/g, '')
    ) || null
  )
}

export function createMemberFromInvite({ invite, chama, name, contact, password }) {
  const isEmail = (contact || '').includes('@')
  const member = {
    id: uid('m_'),
    name: name.trim(),
    email: isEmail ? contact.trim().toLowerCase() : '-',
    phone: isEmail ? '-' : contact.trim(),
    role: invite.role || 'Member',
    savings: 0,
    loan: 0,
    status: 'active',
    avatar: null,
    joinedAt: Date.now(),
    inviteId: invite.id,
    chamaCode: chama.code,
    chamaName: chama.name,
    password,
  }

  saveMembers([member, ...getMembers()])

  saveInvites(
    getInvites().map((i) =>
      i.id === invite.id
        ? { ...i, status: 'joined', joinedAt: Date.now(), joinedAs: member.id }
        : i
    )
  )

  return member
}

/* ============================ MEMBER SESSION ============================ */

export function getMemberSession() {
  return read(MEMBER_SESSION_KEY, null)
}

export function setMemberSession(member) {
  write(MEMBER_SESSION_KEY, member)
}

export function clearMemberSession() {
  try {
    localStorage.removeItem(MEMBER_SESSION_KEY)
  } catch {}
}

export function loginMember(chamaCode, contact, password) {
  const member = findMemberByContact(chamaCode, contact)
  if (!member) return null
  if (member.password && member.password !== password) return null
  setMemberSession({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    chamaCode: member.chamaCode || chamaCode,
    chamaName: member.chamaName || getChama()?.name || '',
    joinedAt: member.joinedAt,
  })
  return member
}

/* ============================ LEGACY LOAN HELPERS ============================ */
// These are kept for backward-compat only. The backend is the source of truth
// for loans now, but the demo-member flow still calls into these functions.

export function getMemberLiveLoan(session) {
  if (!session) return null
  const loans = read(LOANS_KEY, [])
  const mine = loans.filter(
    (l) =>
      l.memberId === session.id ||
      l.member === session.name ||
      (session.email && l.memberEmail === session.email)
  )

  const current =
    mine.find((l) => l.status === 'active') ||
    mine.find((l) => l.status === 'overdue') ||
    mine.find((l) => l.status === 'new') ||
    mine.find((l) => l.status === 'repaid') ||
    null

  if (!current) return null

  return {
    id: current.id,
    amount: Number(current.amount) || 0,
    balance: Number(current.balance ?? current.amount) || 0,
    status: current.status,
    purpose: current.purpose || '',
    appliedAt: current.appliedAt,
    approvedAt: current.approvedAt,
    repaidAt: current.repaidAt,
  }
}

export function getMemberLoanUsed(session) {
  if (!session) return 0
  const loans = read(LOANS_KEY, [])
  return loans
    .filter(
      (l) =>
        (l.memberId === session.id || l.member === session.name) &&
        (l.status === 'active' || l.status === 'overdue')
    )
    .reduce((s, l) => s + Number(l.balance ?? l.amount ?? 0), 0)
}

/* ============================ LEGACY FINANCE VIEW ============================ */
// Left in place because DemoMemberEntry still calls getMemberFinance().

function readLedger() {
  return read(MEMBER_LEDGER_KEY, {})
}

function writeLedger(map) {
  write(MEMBER_LEDGER_KEY, map)
}

export function getMemberFinance(session) {
  const scopedChama = getMemberChama(session)
  const ledger = readLedger()
  const key = session?.id || session?.email || 'anon'

  const base = ledger[key] || {
    savings: 45000,
    contributions: {
      expected: scopedChama.amount || 5000,
      paid: 0,
      status: 'pending',
    },
    loan: null,
  }
  if (!ledger[key]) {
    ledger[key] = base
    writeLedger(ledger)
  }

  const liveLoan = getMemberLiveLoan(session)

  return {
    ...base,
    loan: liveLoan,
    loanUsed: getMemberLoanUsed(session),
    loanLimitMultiplier: scopedChama.maxLoanMultiple || 3,
  }
}

export function setMemberFinance(session, next) {
  const ledger = readLedger()
  const key = session?.id || session?.email || 'anon'
  ledger[key] = next
  writeLedger(ledger)
  return next
}

export function getMemberTransactions(session) {
  const key = session?.id || session?.email || 'anon'
  const ledger = readLedger()
  return (ledger[key] && ledger[key].transactions) || []
}

/* ============================ LEGACY WRITE-BACK ACTIONS ============================ */
// Kept for backward-compat. The migrated dashboard pages now use
// /api/ledger/* endpoints instead.

export function payMemberContribution(session, amount) {
  const members = getMembers()
  const idx = members.findIndex(
    (m) => m.id === session?.id || m.email === session?.email
  )
  const chama = getChama() || {}
  const paid = Number(amount) || chama.amount || 5000
  const name = session?.name || 'Member'

  if (idx !== -1) {
    members[idx] = { ...members[idx], status: 'active', contributionPaid: paid }
    saveMembers(members)
  }

  const pays = read(PAYMENTS_KEY, [])
  pays.unshift({
    id: `p-${Date.now()}`,
    name,
    phone: members[idx]?.phone || '—',
    amount: paid,
    ref: `Q${makeToken(9)}`,
    status: 'matched',
    matchedTo: name,
    time: new Date().toISOString(),
  })
  write(PAYMENTS_KEY, pays)

  const tx = read(TRANSACTIONS_KEY, [])
  tx.unshift({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    desc: `Contribution — ${name}`,
    debit: 0,
    credit: paid,
  })
  write(TRANSACTIONS_KEY, tx)

  const savings = read(SAVINGS_KEY, [])
  savings.unshift({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    member: name,
    deposit: paid,
    withdrawal: 0,
    balance: (members[idx]?.savings || 0) + paid,
  })
  write(SAVINGS_KEY, savings)
}

export function applyMemberLoan(session, { amount, purpose }) {
  const loans = read(LOANS_KEY, [])
  const member = getMembers().find(
    (m) => m.id === session?.id || m.email === session?.email
  )
  loans.unshift({
    id: Date.now(),
    member: session?.name || 'Member',
    memberId: session?.id || member?.id,
    memberEmail: session?.email || member?.email,
    amount: Number(amount) || 0,
    balance: Number(amount) || 0,
    status: 'new',
    purpose: purpose || '',
    appliedAt: new Date().toISOString(),
  })
  write(LOANS_KEY, loans)
}

export function applyMemberWelfare(session, { reason, amount }) {
  const member = getMembers().find(
    (m) => m.id === session?.id || m.email === session?.email
  )
  const welfare = read(WELFARE_KEY, [])
  welfare.unshift({
    id: Date.now(),
    member: session?.name || 'Member',
    memberId: session?.id || member?.id,
    reason: reason || 'Other',
    amount: Number(amount) || 0,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  })
  write(WELFARE_KEY, welfare)
}

export function repayMemberLoan(session, { loanId, amount, method = 'mpesa' }) {
  const loans = read(LOANS_KEY, [])
  const idx = loans.findIndex(
    (l) =>
      l.id === loanId &&
      (l.memberId === session?.id ||
        l.member === session?.name ||
        l.memberEmail === session?.email)
  )
  if (idx === -1) return null

  const loan = loans[idx]
  const amt = Number(amount)
  if (!amt || amt <= 0) return null
  if (amt > Number(loan.balance || 0))
    return { error: 'amount-exceeds-balance', remaining: Number(loan.balance) }

  const remaining = Number(loan.balance) - amt
  const updated = {
    ...loan,
    balance: remaining,
    status: remaining <= 0 ? 'repaid' : loan.status,
    repaidAt: remaining <= 0 ? new Date().toISOString() : loan.repaidAt,
    lastRepaymentAt: new Date().toISOString(),
  }
  loans[idx] = updated
  write(LOANS_KEY, loans)

  const name = session?.name || loan.member || 'Member'

  const tx = read(TRANSACTIONS_KEY, [])
  tx.unshift({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    desc: `Loan repayment — ${name}`,
    debit: 0,
    credit: amt,
  })
  write(TRANSACTIONS_KEY, tx)

  const savings = read(SAVINGS_KEY, [])
  savings.unshift({
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    member: name,
    deposit: amt,
    withdrawal: 0,
    balance: 0,
    kind: 'loan-repayment',
  })
  write(SAVINGS_KEY, savings)

  const ledger = readLedger()
  const key = session?.id || session?.email || 'anon'
  const entries = (ledger[key]?.transactions) || []
  ledger[key] = {
    ...(ledger[key] || {}),
    transactions: [
      {
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        desc: `Loan repayment${loan.purpose ? ` — ${loan.purpose}` : ''}`,
        amount: -amt,
      },
      ...entries,
    ],
  }
  writeLedger(ledger)

  void method
  return updated
}

export function isLoanOutstanding(loan) {
  if (!loan) return false
  return loan.status === 'active' || loan.status === 'overdue'
}

export function joinChamaWithUserStore() {}