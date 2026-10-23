// src/lib/ledgerApi.js
import { api } from './api'

const t = () => localStorage.getItem('auth_token')

export const ledgerApi = {
  // Savings
  getSavings: (memberId) =>
    api(`/api/ledger/savings${memberId ? `?member_id=${memberId}` : ''}`, { token: t() }),
  addSavings: (body) =>
    api('/api/ledger/savings', { method: 'POST', token: t(), body }),

  // Payments
  getPayments: (q) =>
    api(`/api/ledger/payments${q ? `?q=${encodeURIComponent(q)}` : ''}`, { token: t() }),
  addPayment: (body) =>
    api('/api/ledger/payments', { method: 'POST', token: t(), body }),
  matchPayment: (paymentId, memberId) =>
    api(`/api/ledger/payments/${paymentId}/match`, {
      method: 'POST', token: t(), body: { member_id: memberId },
    }),

  // Transactions
  getTransactions: () =>
    api('/api/ledger/transactions', { token: t() }),
  addTransaction: (body) =>
    api('/api/ledger/transactions', { method: 'POST', token: t(), body }),

  // Welfare
  getWelfare: () =>
    api('/api/ledger/welfare', { token: t() }),
  reviewWelfare: (claimId, body) =>
    api(`/api/ledger/welfare/${claimId}/review`, {
      method: 'PATCH', token: t(), body,
    }),

  // Audit
  getAudit: () => api('/api/ledger/audit', { token: t() }),
}