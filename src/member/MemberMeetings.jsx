// src/member/MemberMeetings.jsx
import {
  CalendarDays, Clock, MapPin, Info, Lock, Loader2,
} from 'lucide-react'
import { useMember } from '../context/MemberContext'

function fmtDate(d) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

function daysUntil(d) {
  if (!d) return null
  const target = new Date(d)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.round((target - now) / (1000 * 60 * 60 * 24))
}

export default function MemberMeetings() {
  const { shared, isLoading } = useMember()
  const meetings = shared?.meetings || []

  const upcoming = meetings
    .filter((m) => !m.locked)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  const past = meetings.filter((m) => m.locked)

  const next = upcoming[0]
  const daysToNext = next ? daysUntil(next.date) : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Meetings</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Upcoming schedules, agendas and past meeting records
        </p>
      </div>

      {isLoading && meetings.length === 0 ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto animate-spin text-forest" size={22} />
        </div>
      ) : (
        <>
          {/* Next meeting hero */}
          {next && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(400px 250px at 95% -10%, rgba(245,185,66,0.28), transparent)',
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-gold">
                  <CalendarDays size={12} />
                  Next meeting
                </div>
                <h2 className="mt-2 font-display text-xl font-bold tracking-tight">
                  {next.title}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.82rem] text-white/80">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {fmtDate(next.date)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {next.time}
                  </span>
                  {next.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {next.location}
                    </span>
                  )}
                </div>

                {daysToNext !== null && (
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[0.72rem] font-semibold backdrop-blur">
                    {daysToNext === 0
                      ? 'Today'
                      : daysToNext === 1
                      ? 'Tomorrow'
                      : daysToNext > 0
                      ? `In ${daysToNext} days`
                      : `${Math.abs(daysToNext)} days ago`}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Upcoming list */}
          <div>
            <h3 className="mb-3 font-display text-sm font-semibold text-navy">
              Upcoming meetings
            </h3>
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white py-10 text-center">
                <CalendarDays size={22} className="mx-auto text-ink-soft/50" />
                <p className="mt-2 text-[0.86rem] text-ink-soft">
                  No upcoming meetings scheduled yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((m) => (
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
                        <h4 className="mt-2 font-display text-base font-semibold text-navy">
                          {m.title}
                        </h4>
                        {m.agenda && (
                          <p className="mt-1 text-[0.84rem] text-ink-soft">{m.agenda}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past meetings */}
          {past.length > 0 && (
            <div>
              <h3 className="mb-3 font-display text-sm font-semibold text-navy">
                Past meetings
              </h3>
              <div className="space-y-2.5">
                {past.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-line bg-paper/40 p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-soft">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={11} />
                          {fmtDate(m.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={11} />
                          {m.time}
                        </span>
                      </div>
                      <div className="mt-1.5 text-[0.86rem] font-medium text-navy">
                        {m.title}
                      </div>
                      {m.agenda && (
                        <p className="mt-0.5 text-[0.78rem] text-ink-soft">{m.agenda}</p>
                      )}
                    </div>
                    <span className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft ring-1 ring-line">
                      <Lock size={10} />
                      Minutes locked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <div className="rounded-2xl border border-dashed border-line bg-white py-12 text-center">
              <CalendarDays size={24} className="mx-auto text-ink-soft/50" />
              <p className="mt-2 text-sm text-ink-soft">
                No meetings have been scheduled yet.
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          You'll be notified when a meeting is scheduled. Attendance is recorded by the secretary.
        </span>
      </div>
    </div>
  )
}