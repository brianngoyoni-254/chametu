import { useState } from 'react'
import { Plus, Lock, CalendarDays, Clock, MapPin } from 'lucide-react'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'
import { toast } from 'sonner'

export default function Meetings() {
  const { sharedData, refetchMembers } = useChama()
  const meetings = sharedData?.meetings || []
  
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', agenda: '', location: '' })

  async function schedule(e) {
    e.preventDefault()
    setBusy(true)
    try {
      // Cleaned: No more localStorage token passing
      await api('/api/chama/meetings', { method: 'POST', body: form })
      toast.success('Meeting scheduled')
      setOpen(false); setForm({ title: '', date: '', time: '', agenda: '', location: '' })
      refetchMembers()
    } catch (err) { toast.error(err.message) } finally { setBusy(false) }
  }

  async function lock(id) {
    try {
      // Cleaned: No more localStorage token passing
      await api(`/api/chama/meetings/${id}/lock`, { method: 'PATCH' })
      toast.success('Minutes locked')
      refetchMembers()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Meetings</h1>
          <p className="mt-1 text-sm text-ink-soft">{meetings.length} total meetings</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={15} /> Schedule meeting
        </button>
      </div>

      {open && (
        <form onSubmit={schedule} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <label className="flex-1 text-xs font-semibold text-ink">Title<input required value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="mt-1 w-full rounded border border-line px-2 py-1.5" /></label>
          <label className="text-xs font-semibold text-ink">Date<input required type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="mt-1 rounded border border-line px-2 py-1.5" /></label>
          <label className="text-xs font-semibold text-ink">Time<input required type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))} className="mt-1 rounded border border-line px-2 py-1.5" /></label>
          <button type="submit" disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm text-white">Schedule</button>
        </form>
      )}

      <div className="space-y-3">
        {meetings.map((m) => (
          <div key={m.id} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 text-[0.72rem] font-semibold text-gold">
                  <span className="flex items-center gap-1"><CalendarDays size={12} />{m.date}</span>
                  <span className="flex items-center gap-1 text-ink-soft"><Clock size={12} />{m.time}</span>
                </div>
                <h5 className="mt-2 font-display text-base font-semibold text-navy">
                  {m.title}
                  {m.locked && <span className="ml-2 rounded bg-paper px-2 py-0.5 text-[0.6rem] text-ink-soft uppercase">Locked</span>}
                </h5>
                <p className="text-sm text-ink-soft">{m.agenda}</p>
              </div>
              {!m.locked && <button onClick={() => lock(m.id)} className="flex items-center gap-1 rounded border px-3 py-1 text-xs font-semibold text-navy hover:bg-paper"><Lock size={12} /> Lock</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}