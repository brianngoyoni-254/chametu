import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'

const INITIAL_PROFILE = {
  name: 'Umoja Investment Chama',
  type: 'Investment Chama',
  location: 'Nairobi, Kenya',
  currency: 'KES',
  created: 'January 2025',
  members: 84,
}

const INITIAL_CONTRIB = { amount: 5000, frequency: 'Monthly', dueDay: 30, grace: 3 }
const INITIAL_LOAN = { maxMultiple: 3, interest: 10, interestType: 'Reducing balance', repayment: 'Monthly', grace: 30 }

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function MyChama() {
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [contrib, setContrib] = useState(INITIAL_CONTRIB)
  const [loan, setLoan] = useState(INITIAL_LOAN)
  const [editing, setEditing] = useState(null) // 'profile' | 'contrib' | 'loan' | null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">My Chama</h1>
          <p className="mt-1 text-sm text-ink-soft">Group settings &amp; overview</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-forest font-display text-lg font-bold text-white">
            {initials(profile.name)}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-navy">{profile.name}</h2>
            <p className="text-sm text-ink-soft">
              {profile.type} · {profile.location}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-navy">Chama details</h3>
          {editing === 'profile' ? (
            <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 text-xs font-semibold text-forest">
              <Check size={14} /> Done
            </button>
          ) : (
            <button onClick={() => setEditing('profile')} className="flex items-center gap-1.5 text-xs font-semibold text-forest">
              <Pencil size={13} /> Edit
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-1">
          {[
            ['name', 'Chama name'],
            ['type', 'Type'],
            ['location', 'Location'],
            ['currency', 'Currency'],
          ].map(([key, label]) => (
            <div key={key} className="bg-white p-4">
              <div className="text-xs text-ink-soft">{label}</div>
              {editing === 'profile' ? (
                <input
                  value={profile[key]}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-line px-2 py-1 font-display text-sm font-semibold text-navy outline-none focus:border-forest"
                />
              ) : (
                <div className="mt-1 font-display text-sm font-semibold text-navy">{profile[key]}</div>
              )}
            </div>
          ))}
          <div className="bg-white p-4">
            <div className="text-xs text-ink-soft">Created</div>
            <div className="mt-1 font-display text-sm font-semibold text-navy">{profile.created}</div>
          </div>
          <div className="bg-white p-4">
            <div className="text-xs text-ink-soft">Members</div>
            <div className="mt-1 font-display text-sm font-semibold text-navy">{profile.members} active</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">Contribution rules</h3>
            {editing === 'contrib' ? (
              <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                <Check size={14} /> Done
              </button>
            ) : (
              <button onClick={() => setEditing('contrib')} className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <Row
              label="Amount (KSh)"
              value={contrib.amount}
              editing={editing === 'contrib'}
              onChange={(v) => setContrib((c) => ({ ...c, amount: Number(v) || 0 }))}
              type="number"
            />
            <Row
              label="Due day of month"
              value={contrib.dueDay}
              editing={editing === 'contrib'}
              onChange={(v) => setContrib((c) => ({ ...c, dueDay: Number(v) || 0 }))}
              type="number"
            />
            <Row
              label="Grace period (days)"
              value={contrib.grace}
              editing={editing === 'contrib'}
              onChange={(v) => setContrib((c) => ({ ...c, grace: Number(v) || 0 }))}
              type="number"
            />
            <Row label="Frequency" value={contrib.frequency} editing={false} />
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-navy">Loan rules</h3>
            {editing === 'loan' ? (
              <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                <Check size={14} /> Done
              </button>
            ) : (
              <button onClick={() => setEditing('loan')} className="flex items-center gap-1.5 text-xs font-semibold text-forest">
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <Row
              label="Maximum loan (× savings)"
              value={loan.maxMultiple}
              editing={editing === 'loan'}
              onChange={(v) => setLoan((l) => ({ ...l, maxMultiple: Number(v) || 0 }))}
              type="number"
            />
            <Row
              label="Interest rate (%)"
              value={loan.interest}
              editing={editing === 'loan'}
              onChange={(v) => setLoan((l) => ({ ...l, interest: Number(v) || 0 }))}
              type="number"
            />
            <Row
              label="Grace period (days)"
              value={loan.grace}
              editing={editing === 'loan'}
              onChange={(v) => setLoan((l) => ({ ...l, grace: Number(v) || 0 }))}
              type="number"
            />
            <Row label="Interest type" value={loan.interestType} editing={false} />
            <Row label="Repayment" value={loan.repayment} editing={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, editing, onChange, type = 'text' }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-2.5 last:border-none last:pb-0">
      <span className="text-ink-soft">{label}</span>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 rounded-md border border-line px-2 py-1 text-right font-mono text-sm outline-none focus:border-forest"
        />
      ) : (
        <span className="font-mono font-medium text-navy">{value}</span>
      )}
    </div>
  )
}