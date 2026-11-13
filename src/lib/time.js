// src/lib/time.js

export function parseUtc(iso) {
  if (!iso) return new Date(NaN)
  if (iso instanceof Date) return iso
  const s = String(iso)
  // If it already has a timezone marker (Z or +HH:MM), parse directly
  if (/[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s)
  // Otherwise, append 'Z' to force the browser to read it as UTC
  return new Date(s + 'Z')
}

export function fmtRelative(iso) {
  const then = parseUtc(iso).getTime()
  if (Number.isNaN(then)) return ''
  
  const diff = Date.now() - then
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export function fmtDate(iso) {
  const d = parseUtc(iso)
  if (Number.isNaN(d.getTime())) return ''
  // toLocaleString automatically converts to the user's local timezone
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}