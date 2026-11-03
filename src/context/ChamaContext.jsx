// src/context/ChamaContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { permissionsFor } from '../lib/permissions'
import { api } from '../lib/api'

const ChamaContext = createContext(null)

const EMPTY_CONTRIBUTIONS = {
  period: '', frequency: 'monthly', expectedPerMember: 0,
  totalCollected: 0, totalExpected: 0, pct: 0, members: [],
}

const EMPTY_SHARED = {
  welfare: [], meetings: [], proposals: [], assets: [], payout: null,
}

export function ChamaProvider({ children }) {
  const { user } = useAuth()

  const [chama, setChama] = useState(null)
  const [members, setMembers] = useState([])
  const [loans, setLoans] = useState([])
  const [contributions, setContributions] = useState(EMPTY_CONTRIBUTIONS)
  const [invites, setInvites] = useState([])
  const [sharedData, setSharedData] = useState(EMPTY_SHARED)
  const [roles, setRoles] = useState([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)

  // Reset everything when the user logs out.
  useEffect(() => {
    if (user) return
    setChama(null)
    setMembers([])
    setLoans([])
    setInvites([])
    setRoles([])
    setContributions(EMPTY_CONTRIBUTIONS)
    setSharedData(EMPTY_SHARED)
    setIsLoadingMembers(false)
  }, [user])

  /**
   * The single source of truth. Every mutation calls this so the UI
   * always reflects what the backend says — no localStorage shadow copy.
   */
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !user) {
      setMembers([]); setLoans([]); setRoles([])
      setInvites([]); setSharedData(EMPTY_SHARED)
      setContributions(EMPTY_CONTRIBUTIONS)
      setIsLoadingMembers(false)
      return
    }

    setIsLoadingMembers(true)
    try {
      const [meRes, membersRes, loansRes, sharedRes, contribRes, invitesRes, rolesRes] =
        await Promise.all([
          api('/api/member/me'),
          api('/api/chama/members'),
          api('/api/finance/loans'),
          api('/api/chama/shared_data'),
          api('/api/chama/contributions'),
          api('/api/chama/invites').catch(() => []),
          api('/api/chama/roles').catch(() => []),
        ])

      // Chama now comes from the backend, not localStorage.
      if (meRes?.chama) setChama(meRes.chama)
      setMembers(membersRes || [])
      setLoans(loansRes || [])
      setSharedData(sharedRes || EMPTY_SHARED)
      setContributions(contribRes || EMPTY_CONTRIBUTIONS)
      setInvites(invitesRes || [])
      if (Array.isArray(rolesRes) && rolesRes.length > 0) setRoles(rolesRes)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setIsLoadingMembers(false)
    }
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  // Explicit refreshers so pages can pull fresh data after a mutation.
  const refetchInvites = useCallback(async () => {
    try {
      const data = await api('/api/chama/invites')
      setInvites(data || [])
      return data
    } catch {
      return []
    }
  }, [])

  const refreshChama = useCallback(async () => {
    try {
      const me = await api('/api/member/me')
      if (me?.chama) setChama(me.chama)
      return me?.chama || null
    } catch {
      return null
    }
  }, [])

  // ---- Roles ----
  const updateRole = useCallback(async (roleId, patch) => {
    try {
      const updated = await api(`/api/chama/roles/${roleId}`, { method: 'PUT', body: patch })
      setRoles((prev) => prev.map((r) => (r.id === roleId ? { ...r, ...updated } : r)))
      return { ok: true, role: updated }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const addRole = useCallback(async (roleData) => {
    try {
      const newRole = await api('/api/chama/roles', { method: 'POST', body: roleData })
      setRoles((prev) => [...prev, newRole])
      return { ok: true, role: newRole }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const deleteRole = useCallback(async (roleId) => {
    try {
      await api(`/api/chama/roles/${roleId}`, { method: 'DELETE' })
      setRoles((prev) => prev.filter((r) => r.id !== roleId))
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  // ---- Contributions ----
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
      const updated = await api('/api/chama/contributions/schedule', { method: 'PUT', body: patch })
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

  // ---- Members ----
  const updateMember = useCallback(async (memberId, patch) => {
    try {
      const updated = await api(`/api/chama/members/${memberId}`, { method: 'PUT', body: patch })
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

  // NEW: Permanent Delete Function
  const hardDeleteMember = useCallback(async (memberId) => {
    try {
      await api(`/api/chama/members/${memberId}/permanent`, { method: 'DELETE' })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const changeRole = useCallback(async (memberId, role) => {
    try {
      await api(`/api/chama/members/${memberId}/role`, { method: 'PATCH', body: { role } })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  // ---- Invites ----
  // Single API shape: { contact, role, name? } -> backend saves to member_invites
  const inviteMember = useCallback(async ({ name, email, contact, role }) => {
    try {
      const resolvedContact = (contact || email || '').trim()
      if (!resolvedContact) return { ok: false, message: 'Contact is required' }

      const invite = await api('/api/chama/invites', {
        method: 'POST',
        body: { name, contact: resolvedContact, role },
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

  // ---- Loans ----
  const applyForLoan = useCallback(async (amount, purpose = '') => {
    try {
      const data = await api('/api/finance/loans/apply', { method: 'POST', body: { amount, purpose } })
      await fetchData()
      return { ok: true, loan_id: data.loan_id }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const updateLoanStatus = useCallback(async (loanId, status) => {
    try {
      await api(`/api/finance/loans/${loanId}/status`, { method: 'PATCH', body: { status } })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const repayLoan = useCallback(async (loanId, amount) => {
    try {
      const data = await api(`/api/finance/loans/${loanId}/repay`, { method: 'POST', body: { amount } })
      await fetchData()
      return { ok: true, remaining: data.remaining_balance }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  const recordPayout = useCallback(async (memberId, amount, date) => {
    try {
      await api('/api/chama/payouts', { method: 'POST', body: { member_id: memberId, amount, date } })
      await fetchData()
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [fetchData])

  // ---- Derived ----
  const currentMember = useMemo(() => {
    if (!user) return null
    if (members.length === 0) {
      return { id: 'temp', name: user.name, email: user.email, role: user.role || 'Chairman', status: 'active' }
    }
    const email = String(user.email).toLowerCase()
    return members.find((m) => m.email?.toLowerCase() === email) || members[0]
  }, [user, members])

  const permissions = useMemo(() => permissionsFor(currentMember, roles), [currentMember, roles])
  const can = useCallback((permKey) => Boolean(permissions[permKey]), [permissions])

  // `updateChama` patches local chama state AND persists to backend via
  // the two endpoints that own those fields (settings + chama details).
  const updateChama = useCallback(async (patch) => {
    try {
      const body = {}
      if (patch.name !== undefined) body.name = patch.name
      if (patch.location !== undefined) body.location = patch.location
      if (Object.keys(body).length > 0) {
        await api('/api/settings/', { method: 'PUT', body })
      }
      setChama((prev) => (prev ? { ...prev, ...patch } : prev))
      return { ok: true }
    } catch (err) {
      return { ok: false, message: err.message }
    }
  }, [])

  const value = useMemo(() => ({
    chama, members, loans, roles, currentMember, sharedData,
    contributions, invites,
    isLoadingMembers, permissions, can, updateChama,
    refetchMembers: fetchData,
    refetchLoans: fetchData,
    refetchInvites,
    refreshChama,
    recordContribution, setContributionSchedule, setContributionOverride,
    updateMember, removeMember, changeRole, hardDeleteMember, // Added here
    inviteMember, cancelInvite,
    applyForLoan, updateLoanStatus, repayLoan,
    updateRole, addRole, deleteRole, setRoles,
    recordPayout,
  }), [
    chama, members, loans, roles, currentMember, sharedData,
    contributions, invites, isLoadingMembers, permissions, can, updateChama,
    fetchData, refetchInvites, refreshChama,
    recordContribution, setContributionSchedule, setContributionOverride,
    updateMember, removeMember, changeRole, hardDeleteMember, inviteMember, cancelInvite,
    applyForLoan, updateLoanStatus, repayLoan, updateRole, addRole, deleteRole,
    recordPayout,
  ])

  return <ChamaContext.Provider value={value}>{children}</ChamaContext.Provider>
}

export function useChama() {
  const ctx = useContext(ChamaContext)
  if (!ctx) throw new Error('useChama must be used inside <ChamaProvider>')
  return ctx
}