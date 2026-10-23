// src/lib/welfareShared.js
// Shared read-only helpers for the welfare fund.
// Legacy local-storage version — used only by the member demo flow.

const WELFARE_KEY = 'chametu_welfare_v1'
const CONTRIBUTIONS_KEY = 'chametu_welfare_contributions_v1'
const MONTHLY_WELFARE_FEE = 500

function read(key, fb) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fb
  } catch {
    return fb
  }
}

export const WELFARE_MONTHLY_FEE = MONTHLY_WELFARE_FEE

export function getAllClaims() {
  return read(WELFARE_KEY, []).sort(
    (a, b) =>
      new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
  )
}

export function getWelfareContributions() {
  return read(CONTRIBUTIONS_KEY, [])
}

export function getWelfareSummary(members = []) {
  const claims = getAllClaims()
  const contributions = getWelfareContributions()

  const activeMembers = members.filter(
    (m) => m.status !== 'inactive' && m.status !== 'invited'
  )
  const expectedMonthly = activeMembers.length * MONTHLY_WELFARE_FEE
  const seededCollected = 340000

  const collected =
    contributions.reduce((s, c) => s + Number(c.amount || 0), 0) || seededCollected

  const paid = claims
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + Number(c.amount || 0), 0)

  const pending = claims
    .filter((c) => c.status === 'pending')
    .reduce((s, c) => s + Number(c.amount || 0), 0)

  const rejected = claims
    .filter((c) => c.status === 'rejected')
    .reduce((s, c) => s + Number(c.amount || 0), 0)

  return {
    collected,
    paid,
    pending,
    rejected,
    balance: Math.max(0, collected - paid),
    expectedMonthly,
    totalClaims: claims.length,
    approvedClaims: claims.filter((c) => c.status === 'paid').length,
    pendingClaims: claims.filter((c) => c.status === 'pending').length,
    rejectedClaims: claims.filter((c) => c.status === 'rejected').length,
    monthlyFee: MONTHLY_WELFARE_FEE,
    memberCount: activeMembers.length,
  }
}

export function getPublicPayouts() {
  return getAllClaims()
    .filter((c) => c.status === 'paid')
    .sort(
      (a, b) =>
        new Date(b.reviewedAt || b.submittedAt || 0).getTime() -
        new Date(a.reviewedAt || a.submittedAt || 0).getTime()
    )
}

export function filterClaims(claims, tab, query) {
  return claims
    .filter((c) => tab === 'all' || c.status === tab)
    .filter((c) => {
      if (!query) return true
      const q = query.trim().toLowerCase()
      return (
        (c.member || '').toLowerCase().includes(q) ||
        (c.reason || '').toLowerCase().includes(q)
      )
    })
}