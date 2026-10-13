import { createContext, useContext, useState } from 'react'

const ACCOUNTS_KEY = 'chametu_accounts_v1'
const SESSION_KEY = 'chametu_auth_session_v1'

const AuthContext = createContext(null)

const ADMIN_ROLES = ['Chairman', 'Treasurer', 'Secretary']

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

  const login = async ({ email, password }) => {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 300))
      const target = (email || '').trim().toLowerCase()
      const accounts = readAccounts()
      const found = accounts.find((a) => a.email.toLowerCase() === target)

      if (!found) {
        throw new Error(
          'No account found with that email. Ask your chairman for an invite, or create your own chama.'
        )
      }
      if (found.password && password && found.password !== password) {
        throw new Error('Incorrect password.')
      }

      const session = {
        id: found.id,
        name: found.name,
        email: found.email,
        role: found.role,
        portal: found.portal || portalForRole(found.role),
        chamaCode: found.chamaCode || null,
      }
      writeSession(session)
      setUser(session)
      return session
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ name, email, password, role = 'Chairman', chamaCode = null }) => {
    const target = (email || '').trim().toLowerCase()
    const accounts = readAccounts()
    const existing = accounts.find((a) => a.email.toLowerCase() === target)
    if (existing) throw new Error('An account with that email already exists. Try logging in.')

    const account = {
      id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      name: (name || '').trim(),
      email: target,
      password,
      role,
      portal: portalForRole(role),
      chamaCode,
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
    const target = (email || '').trim().toLowerCase()
    return readAccounts().find((a) => a.email.toLowerCase() === target) || null
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