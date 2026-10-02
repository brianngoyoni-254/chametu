export const CATALOG = [
  { id: 'badge',     icon: 'BadgeCheck', pts: 100,  costKsh: 0,   name: 'Active Chama Badge',          desc: 'Shown on your group profile and monthly statements.' },
  { id: 'tpl',       icon: 'FileText',   pts: 300,  costKsh: 0,   name: 'Template Pack',               desc: 'Constitution, minutes and loan-agreement templates.' },
  { id: 'trial',     icon: 'Sparkles',   pts: 500,  costKsh: 0,   name: '7-Day Premium Trial',         desc: 'Unlock Silver features for 7 days.' },
  { id: 'credit100', icon: 'Ticket',     pts: 1000, costKsh: 100, name: 'KSh 100 Subscription Credit', desc: 'Applied to your next invoice. Not cash.' },
  { id: 'credit250', icon: 'Ticket',     pts: 2500, costKsh: 250, name: 'KSh 250 Subscription Credit', desc: 'Applied to your next invoice. Not cash.' },
  { id: 'credit500', icon: 'Gift',       pts: 5000, costKsh: 500, name: 'KSh 500 Subscription Credit', desc: 'Equivalent to one free Bronze month.' },
]

export const byId = (id) => CATALOG.find((c) => c.id === id)
