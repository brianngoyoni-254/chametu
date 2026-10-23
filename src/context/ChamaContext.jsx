// src/context/ChamaContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { permissionsFor } from '../lib/permissions'
import { api } from '../lib/api'

const ChamaContext = createContext(null)

export function ChamaProvider({ children }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [loans, setLoans] = useState([])
  const [contributions, setContributions] = useState({
    period: '', frequency: 'monthly', expectedPerMember: 0,
    totalCollected: 0, totalExpected: 0, pct: 0, members: [],
  })
  const [invites, setInvites] = useState([])
  const [sharedData, setSharedData] = useState({
    welfare: [], meetings: [], proposals: [], assets: [], payout: null,
  })
  // Roles are fetched from the backend
  const [roles, setRoles] = useState([])
  const [chama, setChama] = useState(null)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  useEffect(() => {
    if (!user) {
      setChama(null); setMembers([]); setLoans([]); setInvites([]); setRoles([])
      setContributions({ period: '', frequency: 'monthly', expectedPerMember: 0,
        totalCollected: 0, totalExpected: 0, pct: 0, members: [] })
      setSharedData({ welfare: [], meetings: [], proposals: [], assets: [], payout: null })
      return
    }
    try {
      const raw = localStorage.getItem('chama_data')
      if (raw) setChama(JSON.parse(raw))
    } catch { setChama(null) }
  }, [user])

  const fetchData = useCallback(async () => {
    // We still check for token to avoid unnecessary API calls if logged out
    const token = localStorage.getItem('auth_token')
    if (!token || !user) {
      setMembers([]); setLoans([]); setRoles([]); setIsLoadingMembers(false)
      return
    }
    setIsLoadingMembers(true)
    try {
      // Cleaned: No more { token } passed manually. api.js handles it.
      const [membersRes, loansRes, sharedRes, contribRes, invitesRes, rolesRes] = await Promise.all([
        api('/api/chama/members'),
        api('/api/finance/loans'),
        api('/api/chama/shared_data'),
        api('/api/chama/contributions'),
        api('/api/chama/invites').catch(() => []),
        api('/api/chama/roles').catch(() => []),
      ])
      setMembers(membersRes)
      setLoans(loansRes)
      setSharedData(sharedRes)
      setContributions(contribRes)
      setInvites(invitesRes)
      if (rolesRes.length > 0) setRoles(rolesRes)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // --- Roles & Permissions API Calls ---
  const updateRole = useCallback(async (roleId, patch) => {
    try {
      const updated = await api(`/api/chama/roles/${roleId}`, {
        method: 'PUT', body: patch,
      })
      // Optimistic update
      setRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updated } : r))
      return { ok: true, role: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const addRole = useCallback(async (roleData) => {
    try {
      const newRole = await api('/api/chama/roles', {
        method: 'POST', body: roleData,
      })
      setRoles(prev => [...prev, newRole])
      return { ok: true, role: newRole }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const deleteRole = useCallback(async (roleId) => {
    try {
      await api(`/api/chama/roles/${roleId}`, { method: 'DELETE' })
      setRoles(prev => prev.filter(r => r.id !== roleId))
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])
  // ------------------------------------------

  const recordContribution = useCallback(async (memberId, amount, method = 'cash') => {
    try {
      await api('/api/chama/contributions', {
        method: 'POST',
        body: { member_id: memberId, amount, method },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const setContributionSchedule = useCallback(async (patch) => {
    try {
      const updated = await api('/api/chama/contributions/schedule', {
        method: 'PUT', body: patch,
      })
      await fetchData()
      return { ok: true, schedule: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const setContributionOverride = useCallback(async (memberId, amount) => {
    try {
      await api(`/api/chama/members/${memberId}/contribution-override`, {
        method: 'PATCH', body: { amount },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const updateMember = useCallback(async (memberId, patch) => {
    try {
      const updated = await api(`/api/chama/members/${memberId}`, {
        method: 'PUT', body: patch,
      })
      await fetchData()
      return { ok: true, member: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const removeMember = useCallback(async (memberId) => {
    try {
      await api(`/api/chama/members/${memberId}`, { method: 'DELETE' })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const changeRole = useCallback(async (memberId, role) => {
    try {
      await api(`/api/chama/members/${memberId}/role`, {
        method: 'PATCH', body: { role },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const inviteMember = useCallback(async ({ name, email, contact, role }) => {
    try {
      const invite = await api('/api/chama/invites', {
        method: 'POST',
        body: { name, contact: contact || email, role },
      })
      setInvites((prev) => [invite, ...prev])
      return { ok: true, invite }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const cancelInvite = useCallback(async (inviteId) => {
    try {
      await api(`/api/chama/invites/${inviteId}`, { method: 'DELETE' })
      setInvites((prev) => prev.filter((i) => i.id !== inviteId))
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const applyForLoan = useCallback(async (amount, purpose = '') => {
    try {
      const data = await api('/api/finance/loans/apply', {
        method: 'POST', body: { amount, purpose },
      })
      await fetchData()
      return { ok: true, loan_id: data.loan_id }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const updateLoanStatus = useCallback(async (loanId, status) => {
    try {
      await api(`/api/finance/loans/${loanId}/status`, {
        method: 'PATCH', body: { status },
      })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const repayLoan = useCallback(async (loanId, amount) => {
    try {
      const data = await api(`/api/finance/loans/${loanId}/repay`, {
        method: 'POST', body: { amount },
      })
      await fetchData()
      return { ok: true, remaining: data.remaining_balance }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  // NEW: Record Payout Function
  const recordPayout = useCallback(async (memberId, amount, date) => {
    try {
      await api('/api/chama/payouts', {
        method: 'POST',
        body: { member_id: memberId, amount, date },
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
      recordContribution, setContributionSchedule, setContributionOverride,
      updateMember, removeMember, changeRole,
      inviteMember, cancelInvite,
      applyForLoan, updateLoanStatus, repayLoan,
      updateRole, addRole, deleteRole, setRoles,
      recordPayout // <-- Added to context value
    }),
    [chama, members, loans, roles, currentMember, sharedData,
     contributions, invites, isLoadingMembers, permissions, can, updateChama,
     fetchData, recordContribution, setContributionSchedule, setContributionOverride,
     updateMember, removeMember, changeRole, inviteMember, cancelInvite,
     applyForLoan, updateLoanStatus, repayLoan, updateRole, addRole, deleteRole,
     recordPayout] // <-- Added to dependencies
  )

  return <ChamaContext.Provider value={value}>{children}</ChamaContext.Provider>
}

export function useChama() {
  const ctx = useContext(ChamaContext)
  if (!ctx) throw new Error('useChama must be used inside <ChamaProvider>')
  return ctx
}