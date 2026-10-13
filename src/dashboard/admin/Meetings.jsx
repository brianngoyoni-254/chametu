import { useState } from 'react'
import { Plus, Lock, CalendarDays, Clock, MapPin } from 'lucide-react'
import { useSharedState, SHARED_KEYS, DEFAULT_MEETINGS } from '../../lib/chametuShared'

function fmtDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export default function Meetings() {
  const [meetings, setMeetings] = useSharedState(SHARED_KEYS.meetings, DEFAULT_MEETINGS)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    date: '',
    time: '',
    agenda: '',
    location: '',
  })

  function schedule(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date || !form.time) return
    setMeetings((m) => [
      {
        id: Date.now(),
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        agenda: form.agenda.trim(),
        location: form.location.trim(),
        locked: false,
      },
      ...m,
    ])
    setForm({ title: '', date: '', time: '', agenda: '', location: '' })
    setOpen(false)
  }

  function lockMinutes(id) {
    setMeetings((m) => m.map((mt) => (mt.id === id ? { ...mt, locked: true } : mt)))
  }

  const upcoming = meetings.filter((m) => !m.locked).length

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Meetings</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {upcoming} upcoming · {meetings.length} total
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Plus size={15} /> Schedule meeting
        </button>
      </div>

      {open && (
        <form
          onSubmit={schedule}
          className="space-y-3 rounded-2xl border border-line bg-white p-4.5 shadow-sm"
        >
          <div className="flex flex-wrap gap-3">
            <label className="min-w-45 flex-1 text-xs font-semibold text-ink">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Monthly General Meeting"
                className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1.5 block rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Time
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="mt-1.5 block rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-ink">
            Location
            <input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Chama office, Nairobi"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
            />
          </label>
          <label className="block text-xs font-semibold text-ink">
            Agenda
            <input
              value={form.agenda}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
              placeholder="e.g. Financial report · Loan applications"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Schedule
          </button>
        </form>
      )}

      <div className="space-y-3">
        {meetings.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-forest/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 text-[0.72rem] font-semibold uppercase tracking-wide text-gold">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {fmtDate(m.date)}
                  </span>
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <Clock size={12} />
                    {m.time}
                  </span>
                  {m.location && (
                    <span className="flex items-center gap-1.5 text-ink-soft">
                      <MapPin size={12} />
                      {m.location}
                    </span>
                  )}
                </div>
                <h5 className="mt-2 font-display text-base font-semibold text-navy">
                  {m.title}
                  {m.locked && (
                    <span className="ml-2 rounded-full bg-paper px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">
                      Minutes locked
                    </span>
                  )}
                </h5>
                <p className="mt-1 text-[0.84rem] text-ink-soft">{m.agenda}</p>
              </div>
              {!m.locked && (
                <button
                  onClick={() => lockMinutes(m.id)}
                  className="flex flex-none items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-navy transition hover:border-forest hover:bg-forest/[0.03]"
                >
                  <Lock size={13} /> Lock minutes
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}