export const TIERS = {
  Starter:  { rank: 0, price: 500,  maxMembers: 10,  pointsMultiplier: 1.0, annualRedeemCap: 1000 },
  Growth:   { rank: 1, price: 1000, maxMembers: 50,  pointsMultiplier: 1.0, annualRedeemCap: 2000 },
  Business: { rank: 2, price: 2000, maxMembers: 150, pointsMultiplier: 1.0, annualRedeemCap: 4000 },
  Gold:     { rank: 3, price: 3000, maxMembers: 250, pointsMultiplier: 1.0, annualRedeemCap: 6000 },
}

export const ORDER = ['Starter', 'Growth', 'Business', 'Gold']

export const current  = (name) => TIERS[name] ?? TIERS[ORDER[0]]
export const canEarn  = () => true                        // every paid tier earns
export const nextTier = (name) => ORDER[Math.min(ORDER.indexOf(name) + 1, ORDER.length - 1)]
export const prevTier = (name) => ORDER[Math.max(ORDER.indexOf(name) - 1, 0)]

export const POINTS_PER_KSH   = 0.5
export const KSH_PER_1000_PTS = 100
export const INACTIVITY_DAYS  = 365
export const POINT_LOT_DAYS   = 365
export const TRIAL_DAYS       = 14
export const DAY              = 86400000