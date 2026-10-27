// src/lib/notificationsApi.js
import { api } from './api'

export const notificationsApi = {
  list: () => api('/api/notifications/'),
  markRead: (id) => api(`/api/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api('/api/notifications/read-all', { method: 'POST' }),
  dismiss: (id) => api(`/api/notifications/${id}`, { method: 'DELETE' }),
  clearAll: () => api('/api/notifications/clear-all', { method: 'DELETE' }),
  getPrefs: () => api('/api/notifications/prefs'),
  savePrefs: (prefs) => api('/api/notifications/prefs', { method: 'PUT', body: prefs }),
}