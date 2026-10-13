/* ============================================================
   chametuStorage.js - local-only persistence layer
   Holds: chama, invites, members, member sessions, member ledger.
   This is the ONLY file that should touch these localStorage keys.
   ============================================================ */

const CHAMA_KEY          = 'chametu_chama_v1'
const INVITES_KEY        = 'chametu_invites_v1'
const MEMBERS_KEY        = 'chametu_members_v2'
const MEMBER_SESSION_KEY = 'chametu_member_session_v1'
const MEMBER_LEDGER_KEY  = 'chametu_member_ledger_v1'

/* ---------------- low-level helpers ---------------- */

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
}

function uid(prefix = '') {
  return (
    prefix +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10)
  )
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

/* ============================================================
   CHAMA
   ============================================================ */

export function getChama() {
  return read(CHAMA_KEY, null)
}

export function saveChama(chama) {
  write(CHAMA_KEY, chama)
  return chama
}

/**
 * Returns the chama object scoped to the given member session.
 * Prioritises the session's own chamaName and chamaCode so a member
 * always sees the exact chama they were invited to, even if another
 * chama's record happens to be in localStorage.
 *
 * Config (amount, due, grace, maxLoanMultiple) still comes from the
 * locally stored chama record.
 */
export function getMemberChama(session) {
  const local = getChama() || {}
  const name = session?.chamaName || local.name || 'My Chama'
  const code = session?.chamaCode || local.code || ''
  return {
    ...local,
    name,
    code,
  }
}

/* ============================================================
   INVITES
   ============================================================ */

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
      getInvites().map((i) =>
        i.id === invite.id ? { ...i, status: 'expired' } : i
      )
    )
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, invite, chama }
}

/* ============================================================
   MEMBERS
   ============================================================ */

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

/* ============================================================
   MEMBER SESSION
   ============================================================ */

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

/* ============================================================
   PER-MEMBER FINANCE / LEDGER (view layer)
   ============================================================ */

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

  if (ledger[key]) return ledger[key]

  const seed = {
    savings: 45000,
    contributions: {
      expected: scopedChama.amount || 5000,
      paid: 0,
      status: 'pending',
    },
    loan: null,
  }
  ledger[key] = seed
  writeLedger(ledger)
  return seed
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

/* ============================================================
   UTIL
   ============================================================ */

export function joinChamaWithUserStore() {}