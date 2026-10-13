const ACCOUNTS_KEY = 'chametu_accounts_v1'
const CHAMA_KEY = 'chametu_chama_v1'
const MEMBERS_KEY = 'chametu_members_v2'
const INVITES_KEY = 'chametu_invites_v1'
const SESSION_KEY = 'chametu_auth_session_v1'

export const DEMO_CHAMA_CODE = 'CHM-8F3K2P'

export const DEMO_CHAMA = {
  name: 'Umoja Investment Chama',
  code: DEMO_CHAMA_CODE,
  type: 'Investment Chama',
  location: 'Nairobi, Kenya',
  currency: 'KES',
  email: 'daniel@chametu.co.ke',
  due: 30,
  amount: 5000,
  grace: 3,
  maxLoanMultiple: 3,
  created: 'January 2026',
}

export const DEMO_PEOPLE = [
  { name: 'Daniel Muthui', email: 'daniel@chametu.co.ke', role: 'Chairman',  portal: 'admin',  savings: 85000,  loan: 20000 },
  { name: 'Brian Ngoyoni', email: 'brian@chametu.co.ke',  role: 'Treasurer', portal: 'admin',  savings: 60000,  loan: 0     },
  { name: 'Kevin Mwangi',  email: 'kevin@chametu.co.ke',  role: 'Secretary', portal: 'admin',  savings: 45000,  loan: 50000 },
  { name: 'Mary Achieng',  email: 'mary@chametu.co.ke',   role: 'Member',    portal: 'member', savings: 120000, loan: 40000 },
]

const PASSWORD = 'demo'

export function setupDemoChama() {
  try {
    localStorage.setItem(CHAMA_KEY, JSON.stringify(DEMO_CHAMA))
  } catch {}

  const accounts = DEMO_PEOPLE.map((p, i) => ({
    id: 'u_demo_' + i,
    name: p.name,
    email: p.email,
    password: PASSWORD,
    role: p.role,
    portal: p.portal,
    chamaCode: DEMO_CHAMA.code,
    chamaName: DEMO_CHAMA.name,       // ← needed for the new login
    createdAt: Date.now(),
  }))
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch {}

  const members = DEMO_PEOPLE.map((p, i) => ({
    id: 'm_demo_' + i,
    name: p.name,
    email: p.email,
    phone: '0712 000 00' + i,
    role: p.role,
    savings: p.savings,
    loan: p.loan,
    status: 'active',
    joinedAt: Date.now(),
    avatar: null,
    chamaCode: DEMO_CHAMA.code,
  }))
  try {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members))
  } catch {}

  try {
    localStorage.setItem(INVITES_KEY, JSON.stringify([]))
  } catch {}

  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}

  return { chama: DEMO_CHAMA, accounts, password: PASSWORD }
}

export function resetAll() {
  const keys = [
    ACCOUNTS_KEY,
    CHAMA_KEY,
    MEMBERS_KEY,
    INVITES_KEY,
    SESSION_KEY,
    'chametu_member_session_v1',
    'chametu_member_ledger_v1',
    'chametu_shared_assets_v1',
    'chametu_shared_meetings_v1',
    'chametu_shared_payout_v1',
    'chametu_shared_proposals_v1',
    'chametu_pending_signup',
    'chametu_statements_issued_v1',
    'chametu_reset_code',
  ]
  keys.forEach((k) => {
    try {
      localStorage.removeItem(k)
      sessionStorage.removeItem(k)
    } catch {}
  })
}