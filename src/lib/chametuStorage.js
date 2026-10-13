/* ============================================================
   chametuStorage.js — local-only persistence layer
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

/** Cryptographically-random token (falls back to Math.random if unavailable). */
function makeToken(len = 32) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
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

/* ============================================================
   INVITES — the security core
   ============================================================ */

export function getInvites() {
  return read(INVITES_KEY, [])
}

function saveInvites(list) {
  write(INVITES_KEY, list)
}

/**
 * Create a fresh invite bound to the current chama.
 * Called by the admin from InviteMembers.jsx.
 */
export function createInvite({ contact, method, role = 'Member' }) {
  const chama = getChama()
  if (!chama) throw new Error('No chama exists yet. Create a chama first.')

  const invite = {
    id: uid('inv_'),
    token: makeToken(32),               // ← gate #1
    chamaCode: chama.code,              // ← gate #2
    chamaName: chama.name,
    contact: contact.trim(),
    method,                             // 'email' | 'phone'
    role,
    status: 'pending',                  // 'pending' | 'joined' | 'expired'
    createdAt: Date.now(),
    expiresAt: Date.now() + INVITE_TTL_DAYS * DAY_MS, // ← gate #4
    joinedAt: null,
    joinedAs: null,                     // member id once used
  }

  saveInvites([invite, ...getInvites()])
  return invite
}

/** Re-issue an expired invite: new token, new 7-day window, status back to pending. */
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

/** Permanently delete an invite. */
export function cancelInvite(id) {
  saveInvites(getInvites().filter((i) => i.id !== id))
}

/** Full local URL the invitee should open. */
export function inviteLink(invite) {
  const path = `/join/${invite.chamaCode}/${invite.token}`
  try {
    return new URL(path, window.location.origin).href
  } catch {
    return path
  }
}

/**
 * Validate an incoming invite. Returns:
 *   { ok: true, invite, chama }
 *   { ok: false, reason: 'wrong-chama' | 'not-found' | 'used' | 'expired' }
 *
 * This is the function that decides whether someone is allowed in.
 */
export function findValidInvite(chamaCode, token) {
  const chama = getChama()
  if (!chama) return { ok: false, reason: 'wrong-chama' }
  if (!chamaCode || chama.code.toUpperCase() !== String(chamaCode).toUpperCase()) {
    return { ok: false, reason: 'wrong-chama' }     // ← gate #2
  }

  const invite = getInvites().find((i) => i.token === token)
  if (!invite) return { ok: false, reason: 'not-found' }   // ← gate #1

  if (invite.chamaCode.toUpperCase() !== chama.code.toUpperCase()) {
    return { ok: false, reason: 'wrong-chama' }     // ← gate #2 double-check
  }
  if (invite.status === 'joined') return { ok: false, reason: 'used' }   // ← gate #3

  if (invite.expiresAt && Date.now() > invite.expiresAt) {
    // Mark expired on disk so UI can show "Resend"
    saveInvites(
      getInvites().map((i) => (i.id === invite.id ? { ...i, status: 'expired' } : i))
    )
    return { ok: false, reason: 'expired' }         // ← gate #4
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

/**
 * Contact-match check. Used in MemberJoin to block duplicate signups.
 * Accepts email OR phone.
 */
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

/**
 * Consume an invite and create a member record.
 * Called from MemberJoin.jsx with the verified invite.
 */
export function createMemberFromInvite({ invite, chama, name, contact, password }) {
  const isEmail = (contact || '').includes('@')
  const member = {
    id: uid('m_'),
    name: name.trim(),
    email: isEmail ? contact.trim().toLowerCase() : '—',
    phone: isEmail ? '—' : contact.trim(),
    role: invite.role || 'Member',
    savings: 0,
    loan: 0,
    status: 'active',
    avatar: null,
    joinedAt: Date.now(),
    inviteId: invite.id,
    chamaCode: chama.code,
    // NOTE: demo only. In production, hash this server-side.
    password,
  }

  saveMembers([member, ...getMembers()])

  // Mark invite as joined — this burns the link.
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

/** Used by MemberJoin's "I already have an account" tab. */
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

/** Deterministic per-member finance snapshot. Replace with a real ledger later. */
export function getMemberFinance(session) {
  const chama = getChama() || {}
  const ledger = readLedger()
  const key = session?.id || session?.email || 'anon'

  if (ledger[key]) return ledger[key]

  // Seed something reasonable so the portal isn't empty on first login
  const seed = {
    savings: 45000,
    contributions: { expected: chama.amount || 5000, paid: 0, status: 'pending' },
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
   UTIL — used by admin's "Join chama with code" flow
   ============================================================ */

export function joinChamaWithUserStore() {
  // Placeholder: the ChamaContext handles joining. Kept here so
  // MemberJoin and Register both have a stable hook to call.
}