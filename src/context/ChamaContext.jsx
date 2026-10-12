import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { DEFAULT_ROLES, permissionsFor } from '../lib/permissions'

const MEMBERS_KEY = 'chametu_members_v2'
const ROLES_KEY = 'chametu_roles_v2'
const CURRENT_KEY = 'chametu_current_member_v1'
const CHAMA_KEY = 'chametu_chama_v1'

const ChamaContext = createContext(null)

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export function ChamaProvider({ children }) {
  const { user } = useAuth()
  const [members, setMembers] = useState(() => load(MEMBERS_KEY, []))
  const [roles, setRoles] = useState(() => load(ROLES_KEY, DEFAULT_ROLES))
  const [devMemberId, setDevMemberId] = useState(() => load(CURRENT_KEY, null))
  const [chama, setChama] = useState(() => load(CHAMA_KEY, null))
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { save(MEMBERS_KEY, members) }, [members])
  useEffect(() => { save(ROLES_KEY, roles) }, [roles])
  useEffect(() => { save(CURRENT_KEY, devMemberId) }, [devMemberId])
  useEffect(() => { save(CHAMA_KEY, chama) }, [chama])
  useEffect(() => { setHydrated(true) }, [])

  /**
   * Resolve which member this session belongs to.
   *   1. Auth user's email matches a member's email
   *   2. Dev override (View-as switcher)
   *   3. First active non-Member (fallback so the app isn't empty)
   */
  const currentMember = useMemo(() => {
    if (!hydrated) return null

    if (user?.email) {
      const email = String(user.email).toLowerCase()
      const byEmail = members.find((m) => m.email?.toLowerCase() === email)
      if (byEmail) return byEmail
    }

    if (devMemberId) {
      const byId = members.find((m) => m.id === devMemberId)
      if (byId) return byId
    }

    return (
      members.find((m) => m.status === 'active' && m.role !== 'Member') ||
      members.find((m) => m.status === 'active') ||
      members[0] ||
      null
    )
  }, [user, members, devMemberId, hydrated])

  const permissions = useMemo(
    () => permissionsFor(currentMember, roles),
    [currentMember, roles]
  )

  const can = useCallback((permKey) => Boolean(permissions[permKey]), [permissions])

  const setCurrentMember = useCallback((id) => setDevMemberId(id), [])

  /** Patch the currently signed-in member (name / phone / avatar). */
  const updateCurrentMember = useCallback(
    (patch) => {
      if (!currentMember) return
      setMembers((prev) =>
        prev.map((m) => (m.id === currentMember.id ? { ...m, ...patch } : m))
      )
    },
    [currentMember, setMembers]
  )

  /** Called on signup (create mode). Creates a chama with the new user as Chairman. */
  const createChamaForUser = useCallback(
    ({ name, email, chamaName, baseTier = 'Starter' }) => {
      const member = {
        id: `m${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: '—',
        role: 'Chairman',
        savings: 0,
        loan: 0,
        status: 'active',
        isOwner: true,
        avatar: null,
      }
      setMembers([member])
      setRoles(DEFAULT_ROLES)
      setDevMemberId(member.id)
      setChama({
        name: chamaName?.trim() || `${name.split(' ')[0]}'s Chama`,
        code: `CHM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        baseTier,
        createdAt: new Date().toISOString(),
      })
      return { memberId: member.id, baseTier }
    },
    []
  )

  /** Called on signup (join mode). Adds the new user as a Member. */
  const joinChamaWithUser = useCallback(({ name, email, code }) => {
    const member = {
      id: `m${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: '—',
      role: 'Member',
      savings: 0,
      loan: 0,
      status: 'active',
      avatar: null,
    }
    setMembers((prev) => [...prev, member])
    setDevMemberId(member.id)
    return member.id
  }, [])

  const value = useMemo(
    () => ({
      chama,
      members,
      roles,
      currentMember,
      currentRole: currentMember?.role || null,
      permissions,
      can,
      setCurrentMember,
      setMembers,
      setRoles,
      updateCurrentMember,
      createChamaForUser,
      joinChamaWithUser,
    }),
    [
      chama, members, roles, currentMember, permissions, can,
      setCurrentMember, updateCurrentMember, createChamaForUser, joinChamaWithUser,
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