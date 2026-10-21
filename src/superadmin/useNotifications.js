// src/superadmin/useNotifications.js
import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'chametu_superadmin_notifications'
const SETTINGS_KEY = 'chametu_superadmin_notification_prefs'
const TICKETS_KEY = 'chametu_superadmin_tickets'
const EVENT_NAME = 'chametu:notifications-updated'
const TICKETS_EVENT = 'chametu:tickets-updated'

const SEED = [
  { id: 'n1', type: 'critical', event: 'enforcement', channel: null, title: '2 chamas blocked', desc: 'Bulk enforcement executed — 14+ days overdue', time: new Date(Date.now() - 12 * 60 * 1000).toISOString(), read: false },
  { id: 'n2', type: 'success', event: 'payments', channel: 'mpesa', title: 'Payment received', desc: 'Umoja Investment Group paid KSh 10,000 via M-Pesa', time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), read: false },
  { id: 'n3', type: 'info', event: 'newRegistration', channel: null, title: 'New chama registered', desc: 'Nyota Ladies Circle joined on Business tier', time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), read: false },
  { id: 'n4', type: 'warning', event: 'payments', channel: 'mpesa', title: 'Payment pending', desc: 'Mama Mboga Welfare — STK awaiting PIN for 45 min', time: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), read: true },
]

export const DEFAULT_PREFS = {
  channels: { mpesa: true, bank: true, cash: true },
  events: { payments: true, chamaChanges: true, enforcement: true, newRegistration: true, auditAlerts: true },
  delivery: { inApp: true, email: false, sms: false },
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
}

function read(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}
function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

export function notify(list) {
  write(STORAGE_KEY, list)
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: list }))
}
export function pushNotification(n) {
  const current = read(STORAGE_KEY, SEED)
  const next = [{ ...n, id: n.id || `n-${Date.now()}`, time: new Date().toISOString(), read: false }, ...current].slice(0, 50)
  notify(next)
}

function deriveTicketNotifications() {
  const tickets = read(TICKETS_KEY, [])
  return tickets
    .filter((t) => t.status === 'open' || t.status === 'pending')
    .map((t) => ({
      id: `t-${t.id}`,
      type: t.priority === 'urgent' ? 'critical' : t.priority === 'high' ? 'warning' : 'info',
      event: 'auditAlerts',
      channel: null,
      title: `[${t.id}] ${t.subject}`,
      desc: `${t.requester?.name || 'Requester'} — ${t.status === 'open' ? 'Open' : 'Pending'}`,
      time: t.updatedAt || t.createdAt,
      read: false,
      ticketId: t.id,
    }))
}

export function useNotifications() {
  const [items, setItems] = useState(() => read(STORAGE_KEY, SEED))
  const [ticketNotifs, setTicketNotifs] = useState(deriveTicketNotifications)
  const [prefs, setPrefs] = useState(() => read(SETTINGS_KEY, DEFAULT_PREFS))

  useEffect(() => {
    const onUpdate = (e) => setItems(e.detail)
    const onTickets = () => setTicketNotifs(deriveTicketNotifications())
    window.addEventListener(EVENT_NAME, onUpdate)
    window.addEventListener(TICKETS_EVENT, onTickets)
    window.addEventListener('storage', onTickets)
    return () => {
      window.removeEventListener(EVENT_NAME, onUpdate)
      window.removeEventListener(TICKETS_EVENT, onTickets)
      window.removeEventListener('storage', onTickets)
    }
  }, [])

  const markAllRead = useCallback(() => {
    setItems((prev) => { const next = prev.map((n) => ({ ...n, read: true })); notify(next); return next })
  }, [])
  const markRead = useCallback((id) => {
    setItems((prev) => { const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n)); notify(next); return next })
  }, [])
  const dismiss = useCallback((id) => {
    setItems((prev) => { const next = prev.filter((n) => n.id !== id); notify(next); return next })
  }, [])
  const clearAll = useCallback(() => { notify([]); setItems([]) }, [])
  const savePrefs = useCallback((next) => { setPrefs(next); write(SETTINGS_KEY, next) }, [])

  const merged = [...ticketNotifs, ...items]
  const visible = merged.filter((n) => {
    if (n.channel && prefs.channels[n.channel] === false) return false
    if (n.event && prefs.events[n.event] === false && !n.ticketId) return false
    return true
  })
  const unread = visible.filter((n) => !n.read).length

  return { items: visible, all: merged, unread, prefs, markAllRead, markRead, dismiss, clearAll, savePrefs }
}