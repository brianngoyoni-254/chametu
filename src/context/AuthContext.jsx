import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'auth_user'

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on first load
  useEffect(() => {
    // TODO(backend): replace with GET /auth/me using the stored token
    setUser(readStoredUser())
    setLoading(false)
  }, [])

  const persist = useCallback((nextUser) => {
    setUser(nextUser)
    try {
      if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // storage unavailable — keep in-memory state only
    }
  }, [])

  const login = useCallback(
    async ({ email, password }) => {
      // TODO(backend): POST /auth/login { email, password } -> { user, token }
      // Placeholder only: accepts any credentials so the UI can be built.
      const nextUser = { id: 'local-dev', email, name: email.split('@')[0] }
      persist(nextUser)
      return nextUser
    },
    [persist]
  )

  const register = useCallback(
    async ({ name, email, password }) => {
      // TODO(backend): POST /auth/register { name, email, password } -> { user, token }
      const nextUser = { id: 'local-dev', email, name: name || email.split('@')[0] }
      persist(nextUser)
      return nextUser
    },
    [persist]
  )

  const logout = useCallback(async () => {
    // TODO(backend): POST /auth/logout (invalidate token / clear cookie)
    persist(null)
  }, [persist])

  const forgotPassword = useCallback(async (email) => {
    // TODO(backend): POST /auth/forgot-password { email }
    return { ok: true, email }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      forgotPassword,
    }),
    [user, loading, login, register, logout, forgotPassword]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext