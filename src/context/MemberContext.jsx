// src/context/MemberContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { api } from '../lib/api'

const MemberContext = createContext(null)

const EMPTY_SHARED = { assets: [], meetings: [], proposals: [], payout: null }

export function MemberProvider({ children }) {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [chama, setChama] = useState(null)
  const [savings, setSavings] = useState(0)
  const [loans, setLoans] = useState([])
  const [contributions, setContributions] = useState([])
  const [savingsHistory, setSavingsHistory] = useState([])
  const [transactions, setTransactions] = useState([])
  const [welfareClaims, setWelfareClaims] = useState([])
  const [shared, setShared] = useState(EMPTY_SHARED)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) return
    setProfile(null)
    setChama(null)
    setSavings(0)
    setLoans([])
    setContributions([])
    setSavingsHistory([])
    setTransactions([])
    setWelfareClaims([])
    setShared(EMPTY_SHARED)
    setIsLoading(false)
    setError(null)
  }, [user])

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token || !user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const [meRes, financeRes, sharedRes, savingsRes, txRes, welfareRes] =
        await Promise.all([
          api('/api/member/me'),
          api('/api/member/finance'),
          api('/api/chama/shared_data'),
          api('/api/ledger/savings').catch(() => ({ summary: null, entries: [] })),
          api('/api/ledger/transactions?limit=50').catch(() => []),
          api('/api/ledger/welfare').catch(() => ({ summary: null, claims: [] })),
        ])

      if (meRes?.user) setProfile(meRes.user)
      if (meRes?.chama) setChama(meRes.chama)
      setSavings(Number(meRes?.savings ?? financeRes?.savings ?? 0))

      setLoans(Array.isArray(financeRes?.loans) ? financeRes.loans : [])
      setContributions(
        Array.isArray(financeRes?.contributions) ? financeRes.contributions : []
      )

      setShared({
        assets: sharedRes?.assets || [],
        meetings: sharedRes?.meetings || [],
        proposals: sharedRes?.proposals || [],
        payout: sharedRes?.payout || null,
      })

      setSavingsHistory(Array.isArray(savingsRes?.entries) ? savingsRes.entries : [])
      setTransactions(Array.isArray(txRes) ? txRes : [])

      const allClaims = Array.isArray(welfareRes?.claims) ? welfareRes.claims : []
      const myName = meRes?.user?.name
      const myId = meRes?.user?.id
      setWelfareClaims(
        allClaims.filter((c) => c.memberId === myId || c.member === myName)
      )
    } catch (err) {
      console.error('[MemberContext] fetch failed:', err)
      setError(err.message || 'Could not load your data')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  /* ---------- mutations ---------- */

  const applyLoan = useCallback(
    async (amount, purpose = '') => {
      try {
        const res = await api('/api/finance/loans/apply', {
          method: 'POST',
          body: { amount: Number(amount), purpose },
        })
        await fetchAll()
        return { ok: true, loan_id: res.loan_id }
      } catch (err) {
        return { ok: false, message: err.message }
      }
    },
    [fetchAll]
  )

  const repayLoan = useCallback(
    async (loanId, amount) => {
      try {
        const res = await api(`/api/finance/loans/${loanId}/repay`, {
          method: 'POST',
          body: { amount: Number(amount) },
        })
        await fetchAll()
        return { ok: true, remaining: res.remaining_balance }
      } catch (err) {
        return { ok: false, message: err.message }
      }
    },
    [fetchAll]
  )

  const submitWelfareClaim = useCallback(
    async (amount, reason) => {
      try {
        await api('/api/chama/welfare/claim', {
          method: 'POST',
          body: { amount: Number(amount), reason },
        })
        await fetchAll()
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err.message }
      }
    },
    [fetchAll]
  )

  const castVote = useCallback(
    async (proposalId, choice) => {
      try {
        await api(`/api/chama/proposals/${proposalId}/vote`, {
          method: 'POST',
          body: { choice },
        })
        await fetchAll()
        return { ok: true }
      } catch (err) {
        return { ok: false, message: err.message }
      }
    },
    [fetchAll]
  )

  /* ---------- derived ---------- */

  const multiplier = chama?.maxLoanMultiple || 3

  const loanLimit = useMemo(
    () => Number(savings || 0) * multiplier,
    [savings, multiplier]
  )

  const loanUsed = useMemo(
    () =>
      loans
        .filter((l) => l.status === 'disbursed' || l.status === 'approved')
        .reduce((s, l) => s + Number(l.balance || 0), 0),
    [loans]
  )

  const loanAvailable = useMemo(
    () => Math.max(0, loanLimit - loanUsed),
    [loanLimit, loanUsed]
  )

  // Every disbursed loan (there can be many)
  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === 'disbursed'),
    [loans]
  )

  // The most recent pending/approved loan awaiting review
  const pendingLoan = useMemo(
    () =>
      loans.find((l) => l.status === 'approved') ||
      loans.find((l) => l.status === 'pending') ||
      null,
    [loans]
  )

  const memberId = profile?.id || null

  const value = useMemo(
    () => ({
      profile,
      chama,
      savings,
      loans,
      contributions,
      savingsHistory,
      transactions,
      welfareClaims,
      shared,
      isLoading,
      error,
      refetch: fetchAll,
      applyLoan,
      repayLoan,
      submitWelfareClaim,
      castVote,
      activeLoans,
      pendingLoan,
      loanUsed,
      loanLimit,
      loanAvailable,
      memberId,
    }),
    [
      profile, chama, savings, loans, contributions, savingsHistory,
      transactions, welfareClaims, shared, isLoading, error, fetchAll,
      applyLoan, repayLoan, submitWelfareClaim, castVote,
      activeLoans, pendingLoan, loanUsed, loanLimit, loanAvailable, memberId,
    ]
  )

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>
}

export function useMember() {
  const ctx = useContext(MemberContext)
  if (!ctx) throw new Error('useMember must be used inside <MemberProvider>')
  return ctx
}