import { useState } from 'react'
import { Plus, Lock } from 'lucide-react'

const INITIAL = [
  {
    id: 1,
    date: 'Sep 28, 2026',
    time: '2:00 PM',
    title: 'Monthly General Meeting',
    agenda: 'Financial report · Loan applications · Investment proposal · Welfare',
    locked: false,
  },
  {
    id: 2,
    date: 'Aug 24, 2026',
    time: '2:00 PM',
    title: 'Monthly General Meeting',
    agenda: 'Approved Kiambu land valuation update; 3 loans disbursed',
    locked: true,
  },
]

export default function Meetings() {
  const [meetings, setMeetings] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', agenda: '' })

  function schedule(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.date || !form.time) return
    setMeetings((m) => [
      { id: Date.now(), title: form.title.trim(), date: form.date, time: form.time, agenda: form.agenda.trim(), locked: false },
      ...m,
    ])
    setForm({ title: '', date: '', time: '', agenda: '' })
    setOpen(false)
  }

  function lockMinutes(id) {
    setMeetings((m) => m.map((mt) => (mt.id === id ? { ...mt, locked: true } : mt)))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Meetings</h1>
          <p className="mt-1 text-sm text-ink-soft">Agendas, attendance &amp; minutes</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Schedule meeting
        </button>
      </div>

      {open && (
        <form onSubmit={schedule} className="space-y-3 rounded-xl border border-line bg-white p-4.5">
          <div className="flex flex-wrap gap-3">
            <label className="flex-1 min-w-45 text-xs font-semibold text-ink">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Monthly General Meeting"
                className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Date
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Time
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
              />
            </label>
          </div>
          <label className="block text-xs font-semibold text-ink">
            Agenda
            <input
              value={form.agenda}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
              placeholder="e.g. Financial report · Loan applications"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">
            Schedule
          </button>
        </form>
      )}

      <div className="space-y-2.5">
        {meetings.map((m) => (
          <div key={m.id} className="rounded-xl border border-line bg-white p-4.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs text-gold">
                  {m.date.toUpperCase()} · {m.time}
                </div>
                <h5 className="mt-1 font-display text-sm text-navy">
                  {m.title}
                  {m.locked && <span className="ml-2 text-xs font-normal text-ink-soft">— Minutes locked</span>}
                </h5>
                <p className="mt-1 text-xs text-ink-soft">{m.agenda}</p>
              </div>
              {!m.locked && (
                <button
                  onClick={() => lockMinutes(m.id)}
                  className="flex flex-none items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-navy"
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