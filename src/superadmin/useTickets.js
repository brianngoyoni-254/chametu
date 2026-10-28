// src/superadmin/useTickets.js
import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Wrench, UserCircle, Sparkles, FileText } from 'lucide-react'
import { api } from '../lib/api'

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

export function useTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('superadmin_token')
      const data = await api('/api/superadmin/tickets', { token })
      setTickets(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const create = useCallback(async (draft) => {
    try {
      const token = localStorage.getItem('superadmin_token')
      await api('/api/superadmin/tickets', {
        method: 'POST', token, body: draft
      })
      await fetchTickets()
    } catch (err) {
      console.error(err)
      throw err // Rethrow so the UI can catch and show an error toast
    }
  }, [fetchTickets])

  const update = useCallback(async (id, patch) => {
    try {
      const token = localStorage.getItem('superadmin_token')
      await api(`/api/superadmin/tickets/${id}/status`, {
        method: 'PATCH', token, body: patch
      })
      await fetchTickets()
    } catch (err) {
      console.error(err)
    }
  }, [fetchTickets])

  const addMessage = useCallback(async (id, msg) => {
    try {
      const token = localStorage.getItem('superadmin_token')
      await api(`/api/superadmin/tickets/${id}/reply`, {
        method: 'POST', token, body: msg
      })
      await fetchTickets()
    } catch (err) {
      console.error(err)
    }
  }, [fetchTickets])

  const remove = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('superadmin_token')
      await api(`/api/superadmin/tickets/${id}`, { method: 'DELETE', token })
      await fetchTickets()
    } catch (err) {
      console.error(err)
    }
  }, [fetchTickets])

  const bulkUpdate = useCallback(async (ids, patch) => {
    for (const id of ids) {
      await update(id, patch)
    }
  }, [update])

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

  return { tickets, loading, create, update, addMessage, bulkUpdate, remove, stats, refetch: fetchTickets }
}