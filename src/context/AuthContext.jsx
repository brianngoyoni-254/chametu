// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const AUTH_CHANGED_EVENT = 'auth-changed'

const AuthContext = createContext(null)
const ADMIN_ROLES = ['Chairman', 'Treasurer', 'Secretary']

export function portalForRole(role) {
  return ADMIN_ROLES.includes(role) ? 'admin' : 'member'
}

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
      else localStorage.removeItem(USER_KEY)
    } catch {}
  }, [user])

  const login = async ({ email, password }) => {
    setLoading(true)
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } })
      const sessionUser = {
        ...data.user,
        portal: data.user.portal || portalForRole(data.user.role),
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      // NOTE: do NOT persist chama in localStorage — ChamaContext fetches it.
      setUser(sessionUser)
      notifyAuthChanged()
      return sessionUser
    } finally {
      setLoading(false)
    }
  }

  const register = async ({ name, email, password, phone, chamaName, tier }) => {
    setLoading(true)
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: {
          name, email, password, phone,
          chama_name: chamaName,
          tier: tier || 'Starter',
          amount: 1000,
        },
      })
      const sessionUser = {
        ...data.user,
        portal: data.user.portal || portalForRole(data.user.role),
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(sessionUser)
      notifyAuthChanged()
      return sessionUser
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    try {
      const data = await api('/api/member/me', { token })
      const fresh = {
        ...user,
        id: data.user?.id ?? user?.id,
        name: data.user?.name ?? user?.name,
        email: data.user?.email ?? user?.email,
        phone: data.user?.phone ?? user?.phone,
        role: data.user?.role ?? user?.role,
        portal: data.user?.portal || user?.portal || portalForRole(data.user?.role ?? user?.role),
      }
      setUser(fresh)
      return fresh
    } catch {
      return null
    }
  }

  const updateUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      try { localStorage.setItem(USER_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  const logout = () => {
    // Clear everything auth-related, including the old chama cache key
    // so users upgrading to this version don't keep stale data around.
    Object.keys(localStorage)
      .filter((k) => k.startsWith('auth_') || k.startsWith('chama_') || k.startsWith('member_'))
      .forEach((k) => localStorage.removeItem(k))
    setUser(null)
    notifyAuthChanged()
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}