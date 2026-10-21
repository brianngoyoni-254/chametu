// src/lib/superadminBridgeImports.js
// Convenience re-exports so admin pages can import cleanly.
export { readMembers, readLoans, readPayments } from './superadminBridge'

// Publish a notification to the admin bell from anywhere.
export function publishAdminNotification(n) {
  const KEY = 'chametu_admin_notifications_v1'
  const EVENT = 'chametu:admin-notifications-updated'
  let current = []
  try {
    const raw = localStorage.getItem(KEY)
    current = raw ? JSON.parse(raw) : []
  } catch {}
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
  try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  try { window.dispatchEvent(new CustomEvent(EVENT, { detail: next })) } catch {}
}