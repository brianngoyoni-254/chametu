export const PERMISSIONS = [
  // Management
  { key: 'manageMembers',     label: 'Manage members',             desc: 'Invite, edit and remove members' },
  { key: 'manageContrib',     label: 'Manage contribution rules',  desc: 'Set amounts, due dates and late fees' },
  { key: 'recordPayments',    label: 'Record payments',            desc: 'Log contributions and loan repayments' },
  { key: 'approveLoans',      label: 'Approve loans',              desc: 'Vote on and disburse loan applications' },
  { key: 'manageInvestments', label: 'Manage investments',         desc: 'Add, edit and revalue portfolio assets' },
  { key: 'manageMeetings',    label: 'Manage meetings & voting',   desc: 'Schedule meetings and open proposals' },
  { key: 'viewReports',       label: 'View all financial reports', desc: 'See contributions, loans and statements' },
  { key: 'editRoles',         label: 'Edit roles & permissions',   desc: 'Change what other roles can do' },

  // Member actions
  { key: 'requestLoans',      label: 'Request loans',              desc: 'Apply for a loan from the chama' },
  { key: 'makePayments',      label: 'Make payments',              desc: 'Pay contributions via M-Pesa' },
  { key: 'raiseIssue',        label: 'Raise an issue',             desc: 'Open a concern with the committee' },
  { key: 'viewOwnData',       label: 'View own data',              desc: 'See their own contributions, loans and statements' },
]

export function emptyPerms(initial = false) {
  return Object.fromEntries(PERMISSIONS.map((p) => [p.key, initial]))
}

export const DEFAULT_ROLES = [
  {
    id: 'chair',
    name: 'Chairman',
    description: 'Chairs meetings, approves loans and oversees the chama.',
    icon: 'Shield',
    system: true,
    memberCount: 1,
    perms: {
      ...emptyPerms(),
      manageMembers: true,
      manageContrib: true,
      recordPayments: true,
      approveLoans: true,
      manageInvestments: true,
      manageMeetings: true,
      viewReports: true,
      editRoles: true,
      requestLoans: true,
      makePayments: true,
      raiseIssue: true,
      viewOwnData: true,
    },
  },
  {
    id: 'treasurer',
    name: 'Treasurer',
    description: 'Handles contributions, disbursements and financial records.',
    icon: 'Wallet',
    system: true,
    memberCount: 1,
    perms: {
      ...emptyPerms(),
      manageContrib: true,
      recordPayments: true,
      manageInvestments: true,
      viewReports: true,
      requestLoans: true,
      makePayments: true,
      raiseIssue: true,
      viewOwnData: true,
    },
  },
  {
    id: 'secretary',
    name: 'Secretary',
    description: 'Records minutes, manages members and documentation.',
    icon: 'FileText',
    system: true,
    memberCount: 1,
    perms: {
      ...emptyPerms(),
      manageMembers: true,
      manageMeetings: true,
      requestLoans: true,
      makePayments: true,
      raiseIssue: true,
      viewOwnData: true,
    },
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Can view their own data, pay, request loans and raise issues.',
    icon: 'User',
    system: true,
    memberCount: 80,
    perms: {
      ...emptyPerms(),
      requestLoans: true,
      makePayments: true,
      raiseIssue: true,
      viewOwnData: true,
    },
  },
]

export function findRoleByName(roles, name) {
  return roles.find((r) => r.name.toLowerCase() === String(name || '').toLowerCase())
}

export function permissionsFor(member, roles) {
  if (!member) return emptyPerms()
  const role = findRoleByName(roles, member.role)
  return role ? { ...emptyPerms(), ...role.perms } : emptyPerms()
}

/**
 * Which permission each dashboard route requires.
 * null = any authenticated member can access.
 * (route not listed = open)
 */
export const ROUTE_PERMISSIONS = {
  // Main
  '/dashboard':               null,
  '/dashboard/invite':        'manageMembers',
  '/dashboard/chama':         null,

  // Rewards
  '/rewards':                 null,
  '/rewards/points':          null,
  '/rewards/plans':           null,

  // Finance
  '/dashboard/payments':      'recordPayments',
  '/dashboard/transactions':  'viewReports',
  '/dashboard/contributions': 'manageContrib',
  '/dashboard/savings':       null,
  '/dashboard/loans':         null,
  '/dashboard/welfare':       null,

  // Investments
  '/dashboard/portfolio':     'manageInvestments',
  '/dashboard/assets':        'manageInvestments',

  // Governance
  '/dashboard/payouts':       'manageMeetings',
  '/dashboard/meetings':      'manageMeetings',
  '/dashboard/voting':        null,

  // People & Reports
  '/dashboard/members':       'manageMembers',
  '/dashboard/roles':         'editRoles',
  '/dashboard/statements':    'viewReports',
  '/dashboard/reports':       'viewReports',
}

/**
 * Minimum tier required to open a route. Members on a lower tier are
 * redirected to /dashboard/upgrade.
 *
 * Rules of thumb:
 *   Starter  : core chama management
 *   Growth   : + investments and financial reports
 *   Business : + governance (voting, payouts, roles)
 *   Gold     : + everything else
 */
export const ROUTE_TIERS = {
  // Growth and above
  '/dashboard/portfolio':  'Growth',
  '/dashboard/assets':     'Growth',
  '/dashboard/statements': 'Growth',
  '/dashboard/reports':    'Growth',

  // Business and above
  '/dashboard/voting':     'Business',
  '/dashboard/payouts':    'Business',
  '/dashboard/meetings':   'Business',
  '/dashboard/roles':      'Business',
}

export const TIER_ORDER = ['Starter', 'Growth', 'Business', 'Gold']

export function tierAtLeast(current, minimum) {
  const a = TIER_ORDER.indexOf(current)
  const b = TIER_ORDER.indexOf(minimum)
  if (a === -1 || b === -1) return true
  return a >= b
}