import { useState } from 'react'
import { Plus } from 'lucide-react'

const INITIAL = [
  { id: 'kilifi', title: 'Kilifi Property Purchase', amount: 'KSh 4,500,000', closes: 'Oct 2', yes: 14, no: 2, abs: 2 },
  { id: 'raise', title: 'Increase monthly contribution', amount: 'KSh 5,000 → KSh 6,000', closes: 'Oct 10', yes: 9, no: 6, abs: 2 },
]

export default function Voting() {
  const [proposals, setProposals] = useState(INITIAL)
  const [myVotes, setMyVotes] = useState({}) // proposal id -> 'yes' | 'no' | 'abs'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', closes: '' })

  function castVote(id, choice) {
    if (myVotes[id]) return // one vote per member
    setProposals((ps) => ps.map((p) => (p.id === id ? { ...p, [choice]: p[choice] + 1 } : p)))
    setMyVotes((v) => ({ ...v, [id]: choice }))
  }

  function createProposal(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setProposals((ps) => [
      { id: 'p' + Date.now(), title: form.title.trim(), amount: form.amount.trim(), closes: form.closes || 'TBD', yes: 0, no: 0, abs: 0 },
      ...ps,
    ])
    setForm({ title: '', amount: '', closes: '' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Voting &amp; governance</h1>
          <p className="mt-1 text-sm text-ink-soft">Proposals open for member decision</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> New proposal
        </button>
      </div>

      {open && (
        <form onSubmit={createProposal} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="flex-1 min-w-45 text-xs font-semibold text-ink">
            Proposal
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Buy a second tent for events"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount / detail
            <input
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. KSh 50,000"
              className="mt-1.5 block w-44 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Closes
            <input
              value={form.closes}
              onChange={(e) => setForm((f) => ({ ...f, closes: e.target.value }))}
              placeholder="e.g. Oct 15"
              className="mt-1.5 block w-28 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">
            Open vote
          </button>
        </form>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5">
        {proposals.map((p) => {
          const total = p.yes + p.no + p.abs || 1
          const yesPct = Math.round((p.yes / total) * 100)
          const noPct = Math.round((p.no / total) * 100)
          const absPct = 100 - yesPct - noPct
          const voted = myVotes[p.id]

          return (
            <div key={p.id} className="rounded-xl border border-line bg-white p-4.5">
              <h4 className="font-display text-base text-navy">{p.title}</h4>
              {p.amount && <div className="mt-1 font-mono text-sm text-gold">{p.amount}</div>}
              <div className="mt-1 text-xs text-ink-soft">Closes {p.closes}</div>

              <div className="mt-3.5 flex h-2 overflow-hidden rounded-full bg-line">
                <div className="bg-emerald" style={{ width: `${yesPct}%` }} />
                <div className="bg-red-500" style={{ width: `${noPct}%` }} />
                <div className="bg-gold" style={{ width: `${absPct}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
                <span>Yes {yesPct}%</span>
                <span>No {noPct}%</span>
                <span>Abstain {absPct}%</span>
              </div>

              <div className="mt-3.5 flex gap-1.5">
                <button
                  onClick={() => castVote(p.id, 'yes')}
                  disabled={!!voted}
                  className="flex-1 rounded-md bg-emerald py-2 text-xs font-semibold text-[#06331F] disabled:opacity-50"
                >
                  {voted === 'yes' ? '✓ Voted yes' : 'Yes'}
                </button>
                <button
                  onClick={() => castVote(p.id, 'no')}
                  disabled={!!voted}
                  className="flex-1 rounded-md bg-[#FBEAE8] py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                >
                  {voted === 'no' ? '✓ Voted no' : 'No'}
                </button>
                <button
                  onClick={() => castVote(p.id, 'abs')}
                  disabled={!!voted}
                  className="flex-1 rounded-md border border-line py-2 text-xs font-semibold text-ink-soft disabled:opacity-50"
                >
                  {voted === 'abs' ? '✓ Abstained' : 'Abstain'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}