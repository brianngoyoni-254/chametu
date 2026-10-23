import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from './api'

const TOKEN_KEY = 'chametu_member_token'
const USER_KEY = 'chametu_member_user'
const CHAMA_KEY = 'chametu_member_chama'

function read(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
}

export function useMemberAuth() {
  const [user, setUser] = useState(() => read(USER_KEY, null))
  const [chama, setChama] = useState(() => read(CHAMA_KEY, null))
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null)
  const [loading, setLoading] = useState(false)

  // Prevent the infinite loop
  const hasHydrated = useRef(false)

  const persist = (t, u, c) => {
    if (t) localStorage.setItem(TOKEN_KEY, t)
    write(USER_KEY, u)
    write(CHAMA_KEY, c)
    setToken(t)
    setUser(u)
    setChama(c)
  }

  const clear = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(CHAMA_KEY)
    setToken(null)
    setUser(null)
    setChama(null)
  }

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const data = await api('/api/member/login', {
        method: 'POST',
        body: { email, password },
      })
      persist(data.token, data.user, data.chama)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const acceptInvite = useCallback(async ({ email, name, password, chamaCode, role }) => {
    setLoading(true)
    try {
      const data = await api('/api/member/accept-invite', {
        method: 'POST',
        body: { email, name, password, chama_code: chamaCode, role },
      })
      persist(data.token, data.user, data.chama)
      return data
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clear()
  }, [])

  const refresh = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY)
    if (!currentToken) return null
    try {
      const data = await api('/api/member/me', { token: currentToken })
      write(USER_KEY, data.user)
      write(CHAMA_KEY, data.chama)
      setUser(data.user)
      setChama(data.chama)
      return data
    } catch {
      clear()
      return null
    }
  }, [])

  // Only hydrate ONCE on mount if we have a token but no user data
  useEffect(() => {
    if (hasHydrated.current) return
    hasHydrated.current = true
    if (token && !user) {
      refresh()
    }
  }, [token, user, refresh])

  return {
    user, chama, token, loading,
    login, logout, refresh, acceptInvite,
    isAuthenticated: !!token,
  }
}