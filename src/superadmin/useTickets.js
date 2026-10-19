// src/superadmin/useTickets.js
import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Wrench, UserCircle, Sparkles, FileText } from 'lucide-react'

const STORAGE_KEY = 'chametu_superadmin_tickets'
const EVENT_NAME = 'chametu:tickets-updated'

export const TICKET_STATUSES = {
  open: { label: 'Open', cls: 'bg-blue-500/15 text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  pending: { label: 'Pending', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  resolved: { label: 'Resolved', cls: 'bg-emerald/15 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald' },
  closed: { label: 'Closed', cls: 'bg-gray-500/15 text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' },
}

export const TICKET_PRIORITIES = {
  low: { label: 'Low', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', dot: 'bg-gray-400' },
  normal: { label: 'Normal', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400', dot: 'bg-blue-500' },
  high: { label: 'High', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400', dot: 'bg-amber-500' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400', dot: 'bg-red-500' },
}

export const TICKET_CATEGORIES = {
  billing: { label: 'Billing', Icon: CreditCard },
  technical: { label: 'Technical', Icon: Wrench },
  account: { label: 'Account', Icon: UserCircle },
  feature: { label: 'Feature Request', Icon: Sparkles },
  other: { label: 'Other', Icon: FileText },
}

const SEED = [
  {
    id: 'TKT-1001',
    subject: 'M-Pesa STK push failing for Wanjiku Merry-go-round',
    description:
      'STK pushes sent to 0789 012 345 return "timeout" errors. Chama has been trying to pay their Starter tier invoice for 3 days.',
    requester: { name: 'R. Wanjiku', email: 'wanjiku@chametu.co.ke', phone: '0789012345', chama: 'Wanjiku Merry-go-round' },
    category: 'billing',
    priority: 'high',
    status: 'open',
    assignee: 'Danny (Lead Dev)',
    watchers: ['Brian (Dev 2)'],
    tags: ['mpesa', 'payment-failed', 'urgent'],
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    slaResponseDue: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    slaResolveDue: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: 'm1', author: 'R. Wanjiku', role: 'requester', body: 'Hello, our members keep getting "Request cancelled by user" after entering their PIN. This has happened 4 times today. Can you check the paybill 400200?', at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
      { id: 'm2', author: 'Danny (Lead Dev)', role: 'agent', body: 'Thanks for reporting. We see the STK push requests hitting Daraja successfully but the callback is timing out. Investigating now.', at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), internal: false },
      { id: 'm3', author: 'Danny (Lead Dev)', role: 'agent', body: 'Internal note: Daraja sandbox is stable, prod callback URL 502ing. Escalating to infra.', at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), internal: true },
    ],
  },
  {
    id: 'TKT-1002',
    subject: 'Cannot add new members to Kiambu Land Chama',
    description: 'The "Invite members" button spins forever and never sends the SMS.',
    requester: { name: 'P. Kariuki', email: 'kariuki@chametu.co.ke', phone: '0722123456', chama: 'Kiambu Land Chama' },
    category: 'technical',
    priority: 'urgent',
    status: 'pending',
    assignee: 'Brian (Dev 2)',
    watchers: [],
    tags: ['invites', 'sms', 'blocker'],
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    slaResponseDue: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    slaResolveDue: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: 'm1', author: 'P. Kariuki', role: 'requester', body: 'We are trying to onboard 8 new members for our land purchase next week. Invite button is stuck.', at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
      { id: 'm2', author: 'Brian (Dev 2)', role: 'agent', body: 'Apologies for the delay. Looks like an SMS provider rate-limit issue — we can whitelist your chama. Will confirm in ~1 hour.', at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'TKT-1003',
    subject: 'Request: export contributions to Excel',
    description: 'Would love to download monthly contribution reports as Excel (not just PDF).',
    requester: { name: 'A. Achieng', email: 'achieng@chametu.co.ke', phone: '0733123456', chama: 'Mama Mboga Welfare' },
    category: 'feature',
    priority: 'low',
    status: 'open',
    assignee: null,
    watchers: ['Danny (Lead Dev)'],
    tags: ['reports', 'excel'],
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    slaResponseDue: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    slaResolveDue: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: 'm1', author: 'A. Achieng', role: 'requester', body: 'PDF is nice for sharing, but we reconcile in Excel. A CSV or XLSX download per month would save our treasurer hours.', at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'TKT-1004',
    subject: 'Password reset email not arriving',
    description: 'Chairperson cannot reset password — no email received for 30 minutes.',
    requester: { name: 'H. Said', email: 'said@chametu.co.ke', phone: '0744123456', chama: 'Pwani Builders' },
    category: 'account',
    priority: 'normal',
    status: 'resolved',
    assignee: 'Brian (Dev 2)',
    watchers: [],
    tags: ['email', 'password'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    slaResponseDue: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    slaResolveDue: new Date(Date.now() - 20 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: 'm1', author: 'H. Said', role: 'requester', body: 'Chair cannot access account. Reset link not arriving.', at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm2', author: 'Brian (Dev 2)', role: 'agent', body: 'Confirmed the email was going to spam. Adding SPF/DKIM records now. Please ask them to retry.', at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm3', author: 'H. Said', role: 'requester', body: 'Works now, thank you!', at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'TKT-1005',
    subject: 'Billing question about Gold tier upgrade proration',
    description: 'If we upgrade from Business to Gold mid-month, how is the difference charged?',
    requester: { name: 'K. Rotich', email: 'rotich@chametu.co.ke', phone: '0755123456', chama: 'Eldoret Farmers SACCO' },
    category: 'billing',
    priority: 'normal',
    status: 'closed',
    assignee: 'Danny (Lead Dev)',
    watchers: [],
    tags: ['upgrade', 'proration'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    slaResponseDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    slaResolveDue: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: 'm1', author: 'K. Rotich', role: 'requester', body: 'How does the mid-cycle upgrade billing work?', at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm2', author: 'Danny (Lead Dev)', role: 'agent', body: 'We prorate daily. So Business (5k) to Gold (10k) with 12 days left costs (10k-5k)/30 * 12 = KSh 2,000.', at: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'm3', author: 'K. Rotich', role: 'requester', body: 'Clear, thanks!', at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
]

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : SEED
  } catch {
    return SEED
  }
}

function write(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }))
}

let nextId = 1006

export function useTickets() {
  const [tickets, setTickets] = useState(() => read())

  useEffect(() => {
    const onUpdate = (e) => setTickets(e.detail)
    window.addEventListener(EVENT_NAME, onUpdate)
    return () => window.removeEventListener(EVENT_NAME, onUpdate)
  }, [])

  const create = useCallback((draft) => {
    const id = `TKT-${nextId++}`
    const now = new Date().toISOString()
    const newTicket = {
      id,
      subject: draft.subject,
      description: draft.description,
      requester: draft.requester,
      category: draft.category,
      priority: draft.priority,
      status: 'open',
      assignee: draft.assignee || null,
      watchers: [],
      tags: draft.tags || [],
      createdAt: now,
      updatedAt: now,
      slaResponseDue: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      slaResolveDue: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        { id: 'm-' + Date.now(), author: draft.requester.name, role: 'requester', body: draft.description, at: now },
      ],
    }
    setTickets((prev) => { const next = [newTicket, ...prev]; write(next); return next })
    return newTicket
  }, [])

  const update = useCallback((id, patch) => {
    setTickets((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
      write(next); return next
    })
  }, [])

  const addMessage = useCallback((id, msg) => {
    setTickets((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t
        return { ...t, messages: [...t.messages, { id: 'm-' + Date.now(), ...msg, at: new Date().toISOString() }], updatedAt: new Date().toISOString() }
      })
      write(next); return next
    })
  }, [])

  const bulkUpdate = useCallback((ids, patch) => {
    setTickets((prev) => {
      const next = prev.map((t) => (ids.includes(t.id) ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
      write(next); return next
    })
  }, [])

  const remove = useCallback((id) => {
    setTickets((prev) => { const next = prev.filter((t) => t.id !== id); write(next); return next })
  }, [])

  const stats = {
    open: tickets.filter((t) => t.status === 'open').length,
    pending: tickets.filter((t) => t.status === 'pending').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    urgent: tickets.filter((t) => t.priority === 'urgent' && t.status !== 'closed' && t.status !== 'resolved').length,
    unassigned: tickets.filter((t) => !t.assignee && t.status !== 'closed' && t.status !== 'resolved').length,
    slaBreached: tickets.filter((t) => {
      if (t.status === 'closed' || t.status === 'resolved') return false
      return new Date(t.slaResponseDue) < new Date()
    }).length,
  }

  return { tickets, create, update, addMessage, bulkUpdate, remove, stats }
}