import { Mail, Phone, User as UserIcon, Calendar, Shield, Info } from 'lucide-react'
import { getMemberSession, getChama, getMembers } from '../lib/chametuStorage'

function initials(name) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

export default function MemberProfile() {
  const session = getMemberSession()
  const chama = getChama()
  const record = getMembers().find((m) => m.id === session.id)

  const fields = [
    { icon: Mail, label: 'Email', value: record?.email || '—' },
    { icon: Phone, label: 'Phone', value: record?.phone || '—' },
    { icon: Shield, label: 'Role', value: session.role, capitalize: true },
    {
      icon: Calendar,
      label: 'Member since',
      value: record
        ? new Date(record.joinedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—',
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">My Profile</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Your details within {chama.name}
        </p>
      </div>

      {/* Identity card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg sm:p-7">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(380px 220px at 95% -10%, rgba(16,185,129,0.35), transparent)',
          }}
        />
        <div className="relative flex items-center gap-4">
          <span className="grid h-16 w-16 flex-none place-items-center rounded-2xl bg-gradient-to-br from-emerald to-forest font-display text-xl font-bold text-white shadow-lg ring-2 ring-white/20">
            {initials(session.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-xl font-bold tracking-tight">
              {session.name}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-[0.82rem] capitalize text-white/70">
              <Shield size={12} />
              {session.role} · {chama.name}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h3 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-navy">
          <UserIcon size={14} className="text-ink-soft" />
          Account details
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-xl border border-line bg-paper/40 px-4 py-3"
            >
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white text-forest shadow-sm ring-1 ring-line">
                <f.icon size={14} />
              </span>
              <div className="min-w-0">
                <div className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-soft">
                  {f.label}
                </div>
                <div
                  className={`truncate text-[0.88rem] font-semibold text-navy ${
                    f.capitalize ? 'capitalize' : ''
                  }`}
                >
                  {f.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Need to update your name, email or phone? Contact your chama's treasurer or chairperson —
          member profile edits are reviewed to keep group records accurate.
        </span>
      </div>
    </div>
  )
}