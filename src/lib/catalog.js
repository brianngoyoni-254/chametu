// src/lib/catalog.js
import { api } from './api'

function token() {
  return localStorage.getItem('auth_token')
}

export async function fetchCatalog() {
  return api('/api/rewards/catalog', { token: token() })
}

export async function fetchTiers() {
  return api('/api/rewards/tiers', { token: token() })
}

export async function fetchState() {
  return api('/api/rewards/state', { token: token() })
}

export async function redeemReward(rewardId) {
  return api('/api/rewards/redeem', {
    method: 'POST', token: token(), body: { rewardId },
  })
}

// NOTE: there are deliberately no setBaseTier / startTrial / upgradeTier helpers.
// A plan can only change through a verified M-Pesa payment (see /api/billing),
// never from the browser.