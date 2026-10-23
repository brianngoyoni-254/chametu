// src/lib/api.js
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function api(
  path,
  { method = 'GET', body, token, headers: extraHeaders, ...rest } = {},
) {
  const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // Network failure: backend down, wrong port, or a crash with no response.
    throw new Error(
      `Cannot reach the server at ${BASE_URL}. Check that the backend is running.`,
    )
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      data.message || data.detail || `Request failed (${res.status})`,
    )
  }
  return data
}