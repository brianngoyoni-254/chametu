import { createContext, useContext, useState } from 'react'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

const AuthContext = createContext(null)

const ADMIN_ROLES = ['Chairman', 'Treasurer', 'Secretary']

export function portalForRole(role) {
  return ADMIN_ROLES.includes(role) ? 'admin' : 'member'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  /**
   * Login calls the Flask backend to verify credentials and get a JWT.
   */
  const login = async ({ chamaName, email, password }) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password.')
      }

      // The backend returns { token, user: { name, email, role }, chama: { ... } }
      const sessionUser = {
        ...data.user,
        portal: portalForRole(data.user.role),
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
      // Store chama details to use in ChamaContext later
      if (data.chama) {
        localStorage.setItem('chama_data', JSON.stringify(data.chama))
      }

      setUser(sessionUser)
      return sessionUser
    } finally {
      setLoading(false)
    }
  }

  /**
   * Register calls the Flask backend to create the User + Chama.
   */
  const register = async ({ name, email, password, phone, chamaName, tier }) => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone, // Passed to the backend now
          chama_name: chamaName,
          tier: tier || 'Starter',
          amount: 1000, // Default contribution amount
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      const sessionUser = {
        ...data.user,
        portal: portalForRole(data.user.role),
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(sessionUser))
      if (data.chama) {
        localStorage.setItem('chama_data', JSON.stringify(data.chama))
      }

      setUser(sessionUser)
      return sessionUser
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('chama_data')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}