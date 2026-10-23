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

export async function setBaseTier(tier) {
  return api('/api/rewards/tier/base', {
    method: 'PUT', token: token(), body: { tier },
  })
}

export async function startTrial() {
  return api('/api/rewards/tier/trial', { method: 'POST', token: token() })
}

export async function upgradeTier(tier) {
  return api('/api/rewards/tier/upgrade', {
    method: 'POST', token: token(), body: { tier },
  })
}