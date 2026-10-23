import { useEffect, useMemo, useState } from 'react'
import { Search, Settings2, Calendar, X, Save, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'

const badge = {
  done: 'bg-[#E9F5EF] text-forest',
  partial: 'bg-[#FBF1E0] text-[#8A6417]',
  pending: 'bg-[#FBF1E0] text-[#8A6417]',
  overdue: 'bg-[#FBEAE8] text-red-600',
}

const fmt = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-KE')

const FREQ_LABEL = {
  weekly: 'weekly',
  monthly: 'monthly',
  quarterly: 'quarterly',
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Contributions() {
  const {
    contributions, recordContribution, isLoadingMembers,
    chama, setContributionSchedule, setContributionOverride,
  } = useChama()

  const [query, setQuery] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [configOpen, setConfigOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState(null)

  const rows = contributions?.members || []
  const frequency = contributions?.frequency || 'monthly'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows
  }, [rows, query])

  const collected = contributions?.totalCollected || 0
  const expected = contributions?.totalExpected || 0
  const pct = contributions?.pct || 0
  const expectedPerMember = contributions?.expectedPerMember || 0

  const handleMarkPaid = async (memberId, name, amount) => {
    setBusyId(memberId)
    const res = await recordContribution(memberId, amount, 'cash')
    setBusyId(null)
    if (res.ok) toast.success(`Recorded ${fmt(amount)} for ${name.split(' ')[0]}`)
    else toast.error(res.message)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Contributions</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {fmt(collected)} of {fmt(expected)} this {frequency} ({pct}%)
            {contributions?.period && (
              <span className="ml-2 text-[0.78rem] text-ink-soft">
                · period {contributions.period}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-navy hover:border-forest"
          >
            <Settings2 size={14} /> Configure
          </button>
          <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2 text-sm text-ink-soft">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search member…"
              className="w-44 bg-transparent outline-none placeholder:text-ink-soft"
            />
          </div>
        </div>
      </div>

      {/* ---- Schedule summary ---- */}
      <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest/10 text-forest">
              <Calendar size={16} />
            </span>
            <div>
              <div className="font-semibold text-navy">
                {frequency === 'weekly'
                  ? `Every ${WEEKDAYS[contributions?.dueWeekday ?? 1]}`
                  : frequency === 'quarterly'
                  ? 'Every quarter'
                  : 'Every month'}
                {' · '}{fmt(expectedPerMember)} per member
              </div>
              <div className="text-[0.78rem] text-ink-soft">
                {frequency === 'weekly'
                  ? `Due on ${WEEKDAYS[contributions?.dueWeekday ?? 1]} of each week`
                  : `Due on day ${contributions?.dueDay ?? 30} of the ${frequency === 'quarterly' ? 'last month in the quarter' : 'month'}`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setConfigOpen(true)}
            className="text-xs font-semibold text-forest hover:underline"
          >
            Change schedule
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Member</th>
              <th className="py-2">Expected</th>
              <th className="py-2">Paid</th>
              <th className="py-2">Balance</th>
              <th className="py-2">Status</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoadingMembers ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-soft">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-ink-soft">
                {rows.length === 0 ? 'No active members yet.' : 'No members match your search.'}
              </td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.memberId} className="border-b border-line last:border-none">
                  <td className="py-2.5">
                    <div className="font-medium text-navy">{r.name}</div>
                    <div className="text-[0.72rem] text-ink-soft">{r.role}</div>
                  </td>
                  <td className="py-2.5 font-mono">
                    {r.expected.toLocaleString()}
                    {r.override != null && (
                      <span className="ml-1.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-[#8A6417]">
                        custom
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-mono">{r.paid.toLocaleString()}</td>
                  <td className="py-2.5 font-mono">{r.balance.toLocaleString()}</td>
                  <td className="py-2.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${badge[r.status]}`}>
                      {r.status === 'done' ? 'Paid' : r.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => setOverrideTarget(r)}
                        className="text-[0.72rem] font-semibold text-ink-soft hover:text-navy"
                      >
                        Adjust
                      </button>
                      {r.status !== 'done' && r.balance > 0 && (
                        <button
                          onClick={() => handleMarkPaid(r.memberId, r.name, r.balance)}
                          disabled={busyId === r.memberId}
                          className="text-xs font-semibold text-forest disabled:opacity-50"
                        >
                          {busyId === r.memberId ? 'Recording…' : `Record ${fmt(r.balance)}`}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {configOpen && (
        <ScheduleModal
          initial={{
            amount: expectedPerMember || 0,
            frequency,
            due_day: contributions?.dueDay ?? 30,
            due_weekday: contributions?.dueWeekday ?? 1,
          }}
          onClose={() => setConfigOpen(false)}
          onSave={async (patch) => {
            const res = await setContributionSchedule(patch)
            if (res.ok) {
              toast.success('Contribution schedule updated')
              setConfigOpen(false)
            } else toast.error(res.message)
          }}
        />
      )}

      {overrideTarget && (
        <OverrideModal
          member={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSave={async (amount) => {
            const res = await setContributionOverride(overrideTarget.memberId, amount)
            if (res.ok) {
              toast.success(`Override saved for ${overrideTarget.name.split(' ')[0]}`)
              setOverrideTarget(null)
            } else toast.error(res.message)
          }}
        />
      )}
    </div>
  )
}

/* ---------- Schedule modal ---------- */
function ScheduleModal({ initial, onClose, onSave }) {
  const [frequency, setFrequency] = useState(initial.frequency || 'monthly')
  const [amount, setAmount] = useState(String(initial.amount || ''))
  const [dueDay, setDueDay] = useState(String(initial.due_day || 30))
  const [dueWeekday, setDueWeekday] = useState(String(initial.due_weekday ?? 1))
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const payload = {
      amount: Number(amount) || 0,
      frequency,
    }
    if (frequency === 'weekly') payload.due_weekday = Number(dueWeekday)
    else payload.due_day = Number(dueDay)

    setBusy(true)
    await onSave(payload)
    setBusy(false)
  }

  const inputCls = 'w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest transition'

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-md overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-display font-semibold text-navy">Configure contributions</h3>
              <p className="mt-0.5 text-[0.82rem] text-ink-soft">
                Set the amount each member should pay and how often.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-paper text-ink-soft">
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 space-y-3.5">
            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-navy">
                Amount per member (KSh)
              </span>
              <input
                type="number" min="0" step="100" required
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
                placeholder="e.g. 1000"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-navy">
                Frequency
              </span>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputCls}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </label>

            {frequency === 'weekly' ? (
              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-navy">
                  Due every
                </span>
                <select value={dueWeekday} onChange={(e) => setDueWeekday(e.target.value)} className={inputCls}>
                  {WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-[0.8rem] font-semibold text-navy">
                  Due day of {frequency === 'quarterly' ? 'the last month in the quarter' : 'the month'}
                </span>
                <input
                  type="number" min="1" max="31" required
                  value={dueDay} onChange={(e) => setDueDay(e.target.value)}
                  className={inputCls}
                />
              </label>
            )}

            <div className="flex items-start gap-2 rounded-xl bg-emerald/[0.06] px-3.5 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
              <AlertCircle size={14} className="mt-0.5 flex-none text-forest" />
              <span>
                Changing the schedule affects the current and future periods. Past contributions
                are preserved — no history is deleted.
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line bg-paper/40 px-5 py-3.5">
            <button type="button" onClick={onClose} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {busy ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ---------- Override modal ---------- */
function OverrideModal({ member, onClose, onSave }) {
  const [amount, setAmount] = useState(
    member.override != null ? String(member.override) : '',
  )
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    // Empty string clears the override → back to chama default
    await onSave(amount === '' ? null : Number(amount))
    setBusy(false)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={submit}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-display font-semibold text-navy">
                Custom amount for {member.name.split(' ')[0]}
              </h3>
              <p className="mt-0.5 text-[0.82rem] text-ink-soft">
                Overrides the chama default. Leave blank to reset.
              </p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-paper text-ink-soft">
              <X size={16} />
            </button>
          </div>
          <div className="px-5 py-4">
            <label className="block">
              <span className="mb-1.5 block text-[0.8rem] font-semibold text-navy">
                Amount (KSh)
              </span>
              <input
                type="number" min="0" step="100"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Leave blank to use chama default"
                className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-forest"
              />
            </label>
            <p className="mt-2 text-[0.74rem] text-ink-soft">
              Current chama default: <b className="text-navy">{fmt(member.expected)}</b>
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-line bg-paper/40 px-5 py-3.5">
            <button type="button" onClick={onClose} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:border-navy">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}