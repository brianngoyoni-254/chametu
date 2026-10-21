// src/lib/adminNotifications.js
import { useState, useEffect, useCallback } from 'react'
import { readLoans, readPayments, readMembers } from './superadminBridge'

const NOTIF_KEY = 'chametu_admin_notifications_v1'
const PREFS_KEY = 'chametu_admin_notification_prefs_v1'
const EVENT = 'chametu:admin-notifications-updated'
const STORAGE_EVENT = 'chametu:storage-updated'

const SEED = [
  {
    id: 'seed-welcome',
    type: 'info',
    event: 'system',
    title: 'Welcome to Chametu',
    desc: 'Your admin dashboard is ready. Raise a ticket any time from Support.',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    link: '/dashboard/support',
  },
]

export const DEFAULT_ADMIN_PREFS = {
  events: {
    loanApplications: true,
    loanApprovals: true,
    payments: true,
    unmatchedPayments: true,
    memberChanges: true,
    welfareClaims: true,
    system: true,
  },
  delivery: { inApp: true, sound: false },
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
}

function read(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }))
}

export function publishAdminNotification(n) {
  const current = read(NOTIF_KEY, SEED)
  const next = [
    {
      id: n.id || `n-${Date.now()}`,
      type: n.type || 'info',
      event: n.event || 'system',
      title: n.title || 'Notification',
      desc: n.desc || '',
      time: n.time || new Date().toISOString(),
      read: false,
      link: n.link || null,
    },
    ...current,
  ].slice(0, 100)
  write(NOTIF_KEY, next)
}

export function useAdminNotifications() {
  const [items, setItems] = useState(() => read(NOTIF_KEY, SEED))
  const [prefs, setPrefs] = useState(() => read(PREFS_KEY, DEFAULT_ADMIN_PREFS))
  const [derived, setDerived] = useState(() => buildDerived())

  useEffect(() => {
    const onUpdate = (e) => setItems(e.detail)
    const onStorage = () => {
      setItems(read(NOTIF_KEY, SEED))
      setDerived(buildDerived())
    }
    window.addEventListener(EVENT, onUpdate)
    window.addEventListener(STORAGE_EVENT, onStorage)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT, onUpdate)
      window.removeEventListener(STORAGE_EVENT, onStorage)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const markAllRead = useCallback(() => {
    setItems((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      write(NOTIF_KEY, next)
      return next
    })
    setDerived((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markRead = useCallback((id) => {
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      write(NOTIF_KEY, next)
      return next
    })
    setDerived((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const dismiss = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((n) => n.id !== id)
      write(NOTIF_KEY, next)
      return next
    })
    setDerived((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    write(NOTIF_KEY, [])
    setItems([])
    setDerived([])
  }, [])

  const savePrefs = useCallback((next) => {
    setPrefs(next)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const merged = [...derived, ...items].sort((a, b) => (a.time < b.time ? 1 : -1))
  const visible = merged.filter((n) => {
    if (!prefs.events[n.event]) return false
    if (prefs.quietHours.enabled && n.type !== 'critical') {
      const hour = new Date(n.time).getHours()
      const from = Number(prefs.quietHours.from.split(':')[0])
      const to = Number(prefs.quietHours.to.split(':')[0])
      const inWindow = from < to ? hour >= from && hour < to : hour >= from || hour < to
      if (inWindow) return false
    }
    return true
  })

  const unread = visible.filter((n) => !n.read).length

  return { items: visible, all: merged, unread, prefs, markAllRead, markRead, dismiss, clearAll, savePrefs }
}

function buildDerived() {
  const out = []
  const now = Date.now()

  readLoans()
    .filter((l) => l.status === 'new')
    .forEach((l) => {
      out.push({
        id: `loan-${l.id}`,
        type: 'warning',
        event: 'loanApplications',
        title: 'Loan application pending',
        desc: `${l.member} requested KSh ${Number(l.amount).toLocaleString()}`,
        time: l.appliedAt || new Date(now - 3600_000).toISOString(),
        read: false,
        link: '/dashboard/loans',
      })
    })

  readLoans()
    .filter((l) => l.status === 'overdue')
    .forEach((l) => {
      out.push({
        id: `loan-overdue-${l.id}`,
        type: 'critical',
        event: 'loanApprovals',
        title: 'Loan is overdue',
        desc: `${l.member} — KSh ${Number(l.balance).toLocaleString()} outstanding`,
        time: new Date(now - 5400_000).toISOString(),
        read: false,
        link: '/dashboard/loans',
      })
    })

  readPayments()
    .filter((p) => p.status === 'unmatched')
    .forEach((p) => {
      out.push({
        id: `pay-unmatched-${p.id}`,
        type: 'warning',
        event: 'unmatchedPayments',
        title: 'Unmatched M-Pesa payment',
        desc: `${p.name || 'Unknown sender'} — KSh ${Number(p.amount).toLocaleString()}`,
        time: p.time || new Date(now - 900_000).toISOString(),
        read: false,
        link: '/dashboard/payments',
      })
    })

  readMembers()
    .filter((m) => m.status === 'arrears')
    .forEach((m) => {
      out.push({
        id: `member-arrears-${m.id}`,
        type: 'warning',
        event: 'memberChanges',
        title: 'Member in arrears',
        desc: `${m.name} hasn't paid this month`,
        time: new Date(now - 7200_000).toISOString(),
        read: false,
        link: '/dashboard/contributions',
      })
    })

  return out
}