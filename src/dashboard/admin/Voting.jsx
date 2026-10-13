import { useState } from 'react'
import { Plus, Vote, X, CheckCircle2, Clock } from 'lucide-react'
import { useSharedState, SHARED_KEYS, DEFAULT_PROPOSALS } from '../../lib/chametuShared'

export default function Voting() {
  const [proposals, setProposals] = useSharedState(SHARED_KEYS.proposals, DEFAULT_PROPOSALS)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', closes: '' })

  function createProposal(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setProposals((ps) => [
      {
        id: 'p' + Date.now(),
        title: form.title.trim(),
        amount: form.amount.trim(),
        closes: form.closes || 'TBD',
        yes: 0,
        no: 0,
        abs: 0,
        votes: {},
      },
      ...ps,
    ])
    setForm({ title: '', amount: '', closes: '' })
    setOpen(false)
  }

  function closeProposal(id) {
    // For demo: mark as closed by removing from list or keeping view only.
    // Here we simply leave it; in production you'd set closed:true.
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Voting &amp; governance</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} open for member decision
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Plus size={15} /> New proposal
        </button>
      </div>

      {open && (
        <form
          onSubmit={createProposal}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4.5 shadow-sm"
        >
          <label className="min-w-45 flex-1 text-xs font-semibold text-ink">
            Proposal
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Buy a second tent for events"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount / detail
            <input
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="e.g. KSh 50,000"
              className="mt-1.5 block w-44 rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Closes
            <input
              value={form.closes}
              onChange={(e) => setForm((f) => ({ ...f, closes: e.target.value }))}
              placeholder="e.g. Oct 15"
              className="mt-1.5 block w-28 rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Open vote
          </button>
        </form>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {proposals.map((p) => {
          const total = (p.yes || 0) + (p.no || 0) + (p.abs || 0) || 1
          const yesPct = Math.round(((p.yes || 0) / total) * 100)
          const noPct = Math.round(((p.no || 0) / total) * 100)
          const absPct = Math.max(0, 100 - yesPct - noPct)
          const voteCount = Object.keys(p.votes || {}).length
          const approved = yesPct > 50

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-forest/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-display text-base font-semibold text-navy">{p.title}</h4>
                  {p.amount && (
                    <div className="mt-1 font-mono text-sm text-gold">{p.amount}</div>
                  )}
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider ${
                    approved
                      ? 'bg-emerald/10 text-forest'
                      : 'bg-gold/15 text-[#8A6417]'
                  }`}
                >
                  {approved ? 'Passing' : 'Pending'}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                <Clock size={11} />
                Closes {p.closes}
                <span className="text-ink-soft/60">·</span>
                <span>{voteCount} vote{voteCount !== 1 ? 's' : ''}</span>
              </div>

              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line">
                <div className="bg-emerald transition-all" style={{ width: `${yesPct}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${noPct}%` }} />
                <div className="bg-gold transition-all" style={{ width: `${absPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[0.7rem] font-medium text-ink-soft">
                <span className="text-emerald">Yes {yesPct}%</span>
                <span className="text-red-600">No {noPct}%</span>
                <span className="text-gold">Abs {absPct}%</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-emerald/10 py-2">
                  <div className="font-mono text-base font-bold text-forest">{p.yes || 0}</div>
                  <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-forest/70">
                    Yes
                  </div>
                </div>
                <div className="rounded-lg bg-red-50 py-2">
                  <div className="font-mono text-base font-bold text-red-600">{p.no || 0}</div>
                  <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-red-600/70">
                    No
                  </div>
                </div>
                <div className="rounded-lg bg-gold/15 py-2">
                  <div className="font-mono text-base font-bold text-[#8A6417]">
                    {p.abs || 0}
                  </div>
                  <div className="text-[0.62rem] font-semibold uppercase tracking-wider text-[#8A6417]/70">
                    Abs
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}