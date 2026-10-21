// src/lib/memberNotifications.js
import { useState, useEffect, useCallback } from 'react'

const KEY = 'chametu_member_notifications_v1'
const PREFS_KEY = 'chametu_member_notification_prefs_v1'
const EVENT = 'chametu:member-notifications-updated'
const STORAGE_EVENT = 'chametu:storage-updated'

const SEED = [
  {
    id: 'seed-welcome',
    type: 'info',
    event: 'system',
    title: 'Welcome to Chametu',
    desc: 'Your member portal is ready. Check here for approvals, payments, and reminders.',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    memberId: null,
  },
]

export const DEFAULT_MEMBER_PREFS = {
  events: {
    loanApprovals: true,
    welfareUpdates: true,
    contributionReminders: true,
    paymentConfirmations: true,
    meetingReminders: true,
    system: true,
  },
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
}

function read(key, fb) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb } catch { return fb }
}
function write(key, v) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }))
}

/**
 * Publish a notification scoped to a member.
 * The `memberId` field ensures only that member sees it in their bell.
 * Pass `memberId: null` for broadcast notifications (all members see it).
 */
export function publishMemberNotification(n) {
  const current = read(KEY, SEED)
  const next = [
    {
      id: n.id || `n-${Date.now()}`,
      type: n.type || 'info',
      event: n.event || 'system',
      title: n.title || 'Notification',
      desc: n.desc || '',
      time: n.time || new Date().toISOString(),
      read: false,
      memberId: n.memberId ?? null,
      link: n.link || null,
    },
    ...current,
  ].slice(0, 100)
  write(KEY, next)
}

export function useMemberNotifications(memberId) {
  const [items, setItems] = useState(() => read(KEY, SEED))
  const [prefs, setPrefs] = useState(() => read(PREFS_KEY, DEFAULT_MEMBER_PREFS))

  useEffect(() => {
    const onUpdate = (e) => setItems(e.detail)
    const onStorage = () => setItems(read(KEY, SEED))
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
      write(KEY, next)
      return next
    })
  }, [])

  const markRead = useCallback((id) => {
    setItems((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      write(KEY, next)
      return next
    })
  }, [])

  const dismiss = useCallback((id) => {
    setItems((prev) => {
      const next = prev.filter((n) => n.id !== id)
      write(KEY, next)
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    write(KEY, [])
    setItems([])
  }, [])

  const savePrefs = useCallback((next) => {
    setPrefs(next)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch {}
  }, [])

  // Filter to this member's notifications
  const mine = items.filter(
    (n) => n.memberId === null || n.memberId === memberId || n.memberId === undefined
  )

  // Apply preference filters
  const visible = mine.filter((n) => {
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

  return { items: visible, all: mine, unread, prefs, markAllRead, markRead, dismiss, clearAll, savePrefs }
}