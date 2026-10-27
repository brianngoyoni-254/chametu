// src/lib/notifications.js
import { useCallback, useEffect, useMemo, useState } from 'react'
import { notificationsApi } from './notificationsApi'

export const AUTH_CHANGED_EVENT = 'auth-changed'

const DEFAULT_PREFS = {
  events: {
    loanApplications: true,
    loanApprovals: true,
    payments: true,
    unmatchedPayments: true,
    memberChanges: true,
    welfareClaims: true,
    contributionReminders: true,
    paymentConfirmations: true,
    meetingReminders: true,
    system: true,
  },
  delivery: { inApp: true, sound: false },
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
}

export { DEFAULT_PREFS as DEFAULT_NOTIFICATION_PREFS }

function isInQuietHours(prefs, isoTime) {
  if (!prefs?.quietHours?.enabled) return false
  const hour = new Date(isoTime).getHours()
  const from = Number(String(prefs.quietHours.from || '22:00').split(':')[0])
  const to = Number(String(prefs.quietHours.to || '07:00').split(':')[0])
  return from < to ? hour >= from && hour < to : hour >= from || hour < to
}

export function useNotifications() {
  const [items, setItems] = useState([])
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [list, prefsRes] = await Promise.all([
        notificationsApi.list(),
        notificationsApi.getPrefs().catch(() => DEFAULT_PREFS),
      ])
      setItems(Array.isArray(list) ? list : [])
      setPrefs(prefsRes || DEFAULT_PREFS)
    } catch (err) {
      setError(err.message || 'Could not load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const onAuthChanged = () => refresh()
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged)
  }, [refresh])

  const visible = useMemo(() => {
    return items.filter((n) => {
      if (prefs?.events && prefs.events[n.event] === false) return false
      if (n.type !== 'critical' && isInQuietHours(prefs, n.time)) return false
      return true
    })
  }, [items, prefs])

  const unread = useMemo(() => visible.filter((n) => !n.read).length, [visible])

  const markRead = useCallback(async (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    try {
      await notificationsApi.markRead(id)
    } catch {
      await refresh()
    }
  }, [refresh])

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await notificationsApi.markAllRead()
    } catch {
      await refresh()
    }
  }, [refresh])

  const dismiss = useCallback(async (id) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
    try {
      await notificationsApi.dismiss(id)
    } catch {
      await refresh()
    }
  }, [refresh])

  const clearAll = useCallback(async () => {
    setItems([])
    try {
      await notificationsApi.clearAll()
    } catch {
      await refresh()
    }
  }, [refresh])

  const savePrefs = useCallback(async (next) => {
    setPrefs(next)
    try {
      const saved = await notificationsApi.savePrefs(next)
      setPrefs(saved || next)
      return { ok: true }
    } catch (err) {
      await refresh()
      return { ok: false, message: err.message }
    }
  }, [refresh])

  return {
    items: visible,
    all: items,
    unread,
    prefs,
    loading,
    error,
    refresh,
    markRead,
    markAllRead,
    dismiss,
    clearAll,
    savePrefs,
  }
}