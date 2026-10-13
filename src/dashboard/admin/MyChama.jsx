import { useEffect, useMemo, useState } from 'react'
import { Pencil, Check, Building2, Users, Calendar, Coins } from 'lucide-react'
import { getChama, saveChama, getMembers } from '../../lib/chametuStorage'

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'CH'
}

function buildProfile(chama) {
  return {
    name: chama?.name || 'My Chama',
    type: chama?.type || 'Investment Chama',
    location: chama?.location || 'Nairobi, Kenya',
    currency: chama?.currency || 'KES',
    created: chama?.created || 'Recently',
  }
}

const INITIAL_CONTRIB = {
  amount: 5000,
  frequency: 'Monthly',
  dueDay: 30,
  grace: 3,
}
const INITIAL_LOAN = {
  maxMultiple: 3,
  interest: 10,
  interestType: 'Reducing balance',
  repayment: 'Monthly',
  grace: 30,
}

export default function MyChama() {
  const stored = useMemo(() => getChama(), [])
  const [profile, setProfile] = useState(() => buildProfile(stored))
  const [contrib, setContrib] = useState(() => ({
    ...INITIAL_CONTRIB,
    amount: stored?.amount ?? INITIAL_CONTRIB.amount,
    dueDay: stored?.due ?? INITIAL_CONTRIB.dueDay,
    grace: stored?.grace ?? INITIAL_CONTRIB.grace,
  }))
  const [loan, setLoan] = useState(() => ({
    ...INITIAL_LOAN,
    maxMultiple: stored?.maxLoanMultiple ?? INITIAL_LOAN.maxMultiple,
  }))
  const [editing, setEditing] = useState(null)

  // Member count always reflects what is really stored
  const [memberCount, setMemberCount] = useState(() => (getMembers() || []).length)

  useEffect(() => {
    setMemberCount((getMembers() || []).length)
  }, [editing])

  // Persist name changes so other pages pick them up
  function finishEditing() {
    setEditing(null)
    const current = getChama() || {}
    saveChama({ ...current, ...profile })
  }

  function cancelEditing() {
    setEditing(null)
    setProfile(buildProfile(getChama()))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">My Chama</h1>
          <p className="mt-1 text-sm text-ink-soft">Group settings and overview</p>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-gradient-to-br from-forest to-emerald font-display text-lg font-bold text-white shadow-sm">
            {initials(profile.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg font-bold text-navy">
              {profile.name}
            </h2>
            <p className="truncate text-sm text-ink-soft">
              {profile.type} / {profile.location}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-navy">Chama details</h3>
          {editing === 'profile' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={cancelEditing}
                className="text-xs font-semibold text-ink-soft hover:text-navy"
              >
                Cancel
              </button>
              <button
                onClick={finishEditing}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest"
              >
                <Check size={14} /> Done
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing('profile')}
              className="flex items-center gap-1.5 text-xs font-semibold text-forest"
            >
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
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, [key]: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-line px-2 py-1 font-display text-sm font-semibold text-navy outline-none focus:border-forest"
                />
              ) : (
                <div className="mt-1 truncate font-display text-sm font-semibold text-navy">
                  {profile[key]}
                </div>
              )}
            </div>
          ))}
          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
              <Calendar size={11} /> Created
            </div>
            <div className="mt-1 font-display text-sm font-semibold text-navy">
              {profile.created}
            </div>
          </div>
          <div className="bg-white p-4">
            <div className="flex items-center gap-1.5 text-xs text-ink-soft">
              <Users size={11} /> Members
            </div>
            <div className="mt-1 font-display text-sm font-semibold text-navy">
              {memberCount} active
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-navy">
              <Coins size={14} className="text-ink-soft" />
              Contribution rules
            </h3>
            {editing === 'contrib' ? (
              <button
                onClick={() => setEditing(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest"
              >
                <Check size={14} /> Done
              </button>
            ) : (
              <button
                onClick={() => setEditing('contrib')}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest"
              >
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
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-navy">
              <Building2 size={14} className="text-ink-soft" />
              Loan rules
            </h3>
            {editing === 'loan' ? (
              <button
                onClick={() => setEditing(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest"
              >
                <Check size={14} /> Done
              </button>
            ) : (
              <button
                onClick={() => setEditing('loan')}
                className="flex items-center gap-1.5 text-xs font-semibold text-forest"
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>
          <div className="mt-3 space-y-3 text-sm">
            <Row
              label="Maximum loan (x savings)"
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