// src/lib/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(path, { method = 'GET', body, token, ...rest } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(rest.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}