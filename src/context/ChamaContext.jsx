import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { DEFAULT_ROLES, permissionsFor } from '../lib/permissions'

const ChamaContext = createContext(null)

export function ChamaProvider({ children }) {
  const { user } = useAuth()
  
  const [members, setMembers] = useState([])
  const [loans, setLoans] = useState([])
  const [roles] = useState(DEFAULT_ROLES)
  const [chama, setChama] = useState(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [devMemberId, setDevMemberId] = useState(null)

  // 1. Load chama data from localStorage
  useEffect(() => {
    if (!user) {
      setChama(null)
      return
    }
    try {
      const raw = localStorage.getItem('chama_data')
      if (raw) setChama(JSON.parse(raw))
    } catch {
      setChama(null)
    }
  }, [user])

  // 2. Fetch Members
  const fetchMembers = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !user) {
      setMembers([])
      setIsLoadingMembers(false)
      return
    }

    setIsLoadingMembers(true)
    try {
      const response = await fetch('http://localhost:5000/api/chama/members', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data)
      } else if (response.status === 401) {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    } catch (err) {
      console.error("Failed to fetch members:", err)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [user])

  // 3. Fetch Loans
  const fetchLoans = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !user) return

    try {
      const response = await fetch('http://localhost:5000/api/finance/loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setLoans(data)
      }
    } catch (err) {
      console.error("Failed to fetch loans:", err)
    }
  }, [user])

  useEffect(() => {
    fetchMembers()
    fetchLoans()
  }, [fetchMembers, fetchLoans])

  // 4. Finance Actions
  const recordContribution = useCallback(async (memberId, amount, reference = 'CASH') => {
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch('http://localhost:5000/api/finance/contribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ member_id: memberId, amount, reference })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      await fetchMembers() // Refresh balances
      return { ok: true, message: data.message }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchMembers])

  const applyForLoan = useCallback(async (amount, purpose = '') => {
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch('http://localhost:5000/api/finance/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount, purpose })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      await fetchLoans()
      return { ok: true, loan_id: data.loan_id }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchLoans])

  const updateLoanStatus = useCallback(async (loanId, status) => {
    const token = localStorage.getItem('auth_token')
    try {
      const res = await fetch(`http://localhost:5000/api/finance/loans/${loanId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      
      await fetchLoans()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchLoans])

  const currentMember = useMemo(() => {
    if (!user) return null
    if (members.length === 0) {
      return { id: 'temp', name: user.name, email: user.email, role: user.role || 'Chairman', status: 'active' }
    }
    const email = String(user.email).toLowerCase()
    const byEmail = members.find((m) => m.email?.toLowerCase() === email)
    if (byEmail) return byEmail
    if (devMemberId) {
      const byId = members.find((m) => m.id === devMemberId)
      if (byId) return byId
    }
    return members[0] || null
  }, [user, members, devMemberId])

  const permissions = useMemo(() => permissionsFor(currentMember, roles), [currentMember, roles])
  const can = useCallback((permKey) => Boolean(permissions[permKey]), [permissions])
  const setCurrentMember = useCallback((id) => setDevMemberId(id), [])

  const updateChama = useCallback((patch) => {
    setChama((prev) => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem('chama_data', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      chama, members, loans, roles, currentMember,
      currentRole: currentMember?.role || null,
      isLoadingMembers, permissions, can, setCurrentMember, setMembers,
      updateChama, refetchMembers: fetchMembers, refetchLoans: fetchLoans,
      recordContribution, applyForLoan, updateLoanStatus,
    }),
    [
      chama, members, loans, roles, currentMember, isLoadingMembers,
      permissions, can, setCurrentMember, updateChama, fetchMembers, fetchLoans,
      recordContribution, applyForLoan, updateLoanStatus,
    ]
  )

  return <ChamaContext.Provider value={value}>{children}</ChamaContext.Provider>
}

export function useChama() {
  const ctx = useContext(ChamaContext)
  if (!ctx) throw new Error('useChama must be used inside <ChamaProvider>')
  return ctx
}

export function useCan(permKey) {
  const { can } = useChama()
  return can(permKey)
}