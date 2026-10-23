// src/context/ChamaContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { DEFAULT_ROLES, permissionsFor } from '../lib/permissions'
import { api } from '../lib/api'

const ChamaContext = createContext(null)

export function ChamaProvider({ children }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loans, setLoans] = useState([])
  const [contributions, setContributions] = useState({
    period: '', expectedPerMember: 0, totalCollected: 0,
    totalExpected: 0, pct: 0, members: [],
  })
  const [invites, setInvites] = useState([])
  const [sharedData, setSharedData] = useState({
    welfare: [], meetings: [], proposals: [], assets: [], payout: null,
  })
  const [roles] = useState(DEFAULT_ROLES)
  const [chama, setChama] = useState(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  useEffect(() => {
    if (!user) {
      setChama(null); setMembers([]); setLoans([]); setInvites([])
      setContributions({ period: '', expectedPerMember: 0, totalCollected: 0,
        totalExpected: 0, pct: 0, members: [] })
      setSharedData({ welfare: [], meetings: [], proposals: [], assets: [], payout: null })
      return
    }
    try {
      const raw = localStorage.getItem('chama_data')
      if (raw) setChama(JSON.parse(raw))
    } catch { setChama(null) }
  }, [user])

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !user) {
      setMembers([]); setLoans([]); setIsLoadingMembers(false)
      return
    }
    setIsLoadingMembers(true)
    try {
      const [membersRes, loansRes, sharedRes, contribRes, invitesRes] = await Promise.all([
        api('/api/chama/members', { token }),
        api('/api/finance/loans', { token }),
        api('/api/chama/shared_data', { token }),
        api('/api/chama/contributions', { token }),
        api('/api/chama/invites', { token }).catch(() => []),
      ])
      setMembers(membersRes)
      setLoans(loansRes)
      setSharedData(sharedRes)
      setContributions(contribRes)
      setInvites(invitesRes)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // ============ ACTIONS ============
  const recordContribution = useCallback(async (memberId, amount, method = 'cash') => {
    const token = localStorage.getItem('auth_token')
    try {
      await api('/api/chama/contributions', {
        method: 'POST', token,
        body: { member_id: memberId, amount, method },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const updateMember = useCallback(async (memberId, patch) => {
    const token = localStorage.getItem('auth_token')
    try {
      const updated = await api(`/api/chama/members/${memberId}`, {
        method: 'PUT', token, body: patch,
      })
      await fetchData()
      return { ok: true, member: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const removeMember = useCallback(async (memberId) => {
    const token = localStorage.getItem('auth_token')
    try {
      await api(`/api/chama/members/${memberId}`, { method: 'DELETE', token })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const changeRole = useCallback(async (memberId, role) => {
    const token = localStorage.getItem('auth_token')
    try {
      await api(`/api/chama/members/${memberId}/role`, {
        method: 'PATCH', token, body: { role },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const inviteMember = useCallback(async ({ name, email, contact, role }) => {
    const token = localStorage.getItem('auth_token')
    try {
      const invite = await api('/api/chama/invites', {
        method: 'POST', token,
        body: { name, contact: contact || email, role },
      })
      setInvites((prev) => [invite, ...prev])
      return { ok: true, invite }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const cancelInvite = useCallback(async (inviteId) => {
    const token = localStorage.getItem('auth_token')
    try {
      await api(`/api/chama/invites/${inviteId}`, { method: 'DELETE', token })
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const applyForLoan = useCallback(async (amount, purpose = '') => {
    const token = localStorage.getItem('auth_token')
    try {
      const data = await api('/api/finance/loans/apply', {
        method: 'POST', token, body: { amount, purpose },
      })
      await fetchData()
      return { ok: true, loan_id: data.loan_id }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const updateLoanStatus = useCallback(async (loanId, status) => {
    const token = localStorage.getItem('auth_token')
    try {
      await api(`/api/finance/loans/${loanId}/status`, {
        method: 'PATCH', token, body: { status },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const currentMember = useMemo(() => {
    if (!user) return null
    if (members.length === 0) {
      return {
        id: 'temp', name: user.name, email: user.email,
        role: user.role || 'Chairman', status: 'active',
      }
    }
    const email = String(user.email).toLowerCase()
    return members.find((m) => m.email?.toLowerCase() === email) || members[0]
  }, [user, members])

  const permissions = useMemo(() => permissionsFor(currentMember, roles), [currentMember, roles])
  const can = useCallback((permKey) => Boolean(permissions[permKey]), [permissions])

  const updateChama = useCallback((patch) => {
    setChama((prev) => {
      const next = { ...prev, ...patch }
      localStorage.setItem('chama_data', JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      chama, members, loans, roles, currentMember, sharedData,
      contributions, invites,
      isLoadingMembers, permissions, can, updateChama,
      refetchMembers: fetchData, refetchLoans: fetchData,
      recordContribution, updateMember, removeMember, changeRole,
      inviteMember, cancelInvite,
      applyForLoan, updateLoanStatus,
    }),
    [chama, members, loans, roles, currentMember, sharedData,
     contributions, invites, isLoadingMembers, permissions, can, updateChama,
     fetchData, recordContribution, updateMember, removeMember, changeRole,
     inviteMember, cancelInvite, applyForLoan, updateLoanStatus]
  )

  return <ChamaContext.Provider value={value}>{children}</ChamaContext.Provider>
}

export function useChama() {
  const ctx = useContext(ChamaContext)
  if (!ctx) throw new Error('useChama must be used inside <ChamaProvider>')
  return ctx
}