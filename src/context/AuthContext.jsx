import { createContext, useContext, useState } from 'react'

const ACCOUNTS_KEY = 'chametu_accounts_v1'
const SESSION_KEY = 'chametu_auth_session_v1'

const AuthContext = createContext(null)

const ADMIN_ROLES = ['Chairman', 'Treasurer', 'Secretary']
const norm = (v) => (v || '').trim().toLowerCase()

export function portalForRole(role) {
  return ADMIN_ROLES.includes(role) ? 'admin' : 'member'
}

/* ---------- storage ---------- */

function readAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function writeAccounts(list) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
  } catch {}
}
function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeSession(s) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else localStorage.removeItem(SESSION_KEY)
  } catch {}
}

/* ---------- provider ---------- */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readSession())
  const [loading, setLoading] = useState(false)

  /**
   * Login requires chamaName + email + password.
   * The chama name is checked against the stored account.
   */
  const login = async ({ chamaName, email, password }) => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 400))

      const targetChama = (chamaName || '').trim()
      const targetEmail = norm(email)

      if (!targetChama) throw new Error('Enter your chama name.')
      if (!targetEmail) throw new Error('Enter your email address.')
      if (!password) throw new Error('Enter your password.')

      const accounts = readAccounts()
      const found = accounts.find((a) => norm(a.email) === targetEmail)

      if (!found) {
        throw new Error(
          "We couldn't find an account with those details. Check your email, or ask your chairman to invite you."
        )
      }

      // Chama name check (skipped for legacy accounts missing chamaName)
      const accountChama = norm(found.chamaName)
      if (accountChama && accountChama !== norm(targetChama)) {
        throw new Error(
          "Those details don't match any account on this device. Double-check the chama name."
        )
      }

      if (found.password && found.password !== password) {
        throw new Error('Incorrect password. Try again or reset it.')
      }

      const session = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        portal: found.portal || portalForRole(found.role),
        chamaCode: found.chamaCode || null,
        chamaName: found.chamaName || targetChama,
      }
      writeSession(session)
      setUser(session)
      return session
    } finally {
      setLoading(false)
    }
  }

  /**
   * Only used by the Chairman creation flow (and by invite-based
   * signups in MemberJoin which pass chamaName from getChama()).
   */
  const register = async ({
    name,
    email,
    password,
    role = 'Chairman',
    chamaCode = null,
    chamaName = '',
  }) => {
    const target = norm(email)
    const accounts = readAccounts()
    const existing = accounts.find((a) => norm(a.email) === target)
    if (existing) {
      throw new Error('An account with that email already exists. Try logging in.')
    }

    const account = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: (name || '').trim(),
      email: target,
      password,
      role,
      portal: portalForRole(role),
      chamaCode,
      chamaName: (chamaName || '').trim(),
      createdAt: Date.now(),
    }
    writeAccounts([...accounts, account])

    const session = {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      portal: account.portal,
      chamaCode: account.chamaCode,
      chamaName: account.chamaName,
    }
    writeSession(session)
    setUser(session)
    return session
  }

  const logout = () => {
    writeSession(null)
    setUser(null)
  }

  const listAccounts = () => readAccounts()

  const findAccount = (email) => {
    const target = norm(email)
    return readAccounts().find((a) => norm(a.email) === target) || null
  }

  const deleteAccount = (id) => {
    writeAccounts(readAccounts().filter((a) => a.id !== id))
  }

  const clearAllAccounts = () => {
    writeAccounts([])
    writeSession(null)
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    listAccounts,
    findAccount,
    deleteAccount,
    clearAllAccounts,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}