// src/member/MemberVoting.jsx
import { useState } from 'react'
import {
  Check, X, Minus, Vote, Clock, CheckCircle2, Info, Loader2,
} from 'lucide-react'
import { useMember } from '../context/MemberContext'

export default function MemberVoting() {
  const { shared, profile, isLoading, castVote } = useMember()
  const proposals = shared?.proposals || []
  const myId = profile?.id

  const [votingId, setVotingId] = useState(null)
  const [error, setError] = useState('')

  const totalVotes = proposals.reduce(
    (s, p) => s + Object.keys(p.votes || {}).length,
    0
  )

  async function handleVote(proposalId, choice) {
    setError('')
    setVotingId(proposalId)
    const res = await castVote(proposalId, choice)
    setVotingId(null)
    if (!res.ok) setError(res.message)
  }

  if (isLoading && proposals.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 size={26} className="animate-spin text-forest" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">
          Voting &amp; governance
        </h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          Have your say in the chama's decisions · {totalVotes} vote
          {totalVotes !== 1 ? 's' : ''} cast
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[0.82rem] font-medium text-red-700">
          {error}
        </div>
      )}

      {proposals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-line bg-white py-14 text-center">
          <Vote size={26} className="mx-auto text-ink-soft/50" />
          <p className="mt-3 text-sm text-ink-soft">
            No proposals open for voting right now.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {proposals.map((p) => {
          const total = (p.yes || 0) + (p.no || 0) + (p.abs || 0) || 1
          const yesPct = Math.round(((p.yes || 0) / total) * 100)
          const noPct = Math.round(((p.no || 0) / total) * 100)
          const absPct = Math.max(0, 100 - yesPct - noPct)
          const myVote = myId ? p.votes?.[myId] : null
          const voteCount = Object.keys(p.votes || {}).length
          const isBusy = votingId === p.id

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-forest/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold text-navy">
                    {p.title}
                  </h3>
                  {p.amount && (
                    <div className="mt-1 font-mono text-sm text-gold">{p.amount}</div>
                  )}
                </div>
                {myVote && (
                  <span className="flex flex-none items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-forest ring-1 ring-emerald/20">
                    <CheckCircle2 size={10} />
                    Voted
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-[0.72rem] text-ink-soft">
                <Clock size={11} />
                Closes {p.closes}
                <span className="text-ink-soft/60">·</span>
                <span>
                  {voteCount} vote{voteCount !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-line">
                <div className="bg-emerald transition-all" style={{ width: `${yesPct}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${noPct}%` }} />
                <div className="bg-gold transition-all" style={{ width: `${absPct}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[0.7rem] font-medium">
                <span className="text-emerald">Yes {yesPct}%</span>
                <span className="text-red-600">No {noPct}%</span>
                <span className="text-gold">Abs {absPct}%</span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <VoteBtn
                  active={myVote === 'yes'}
                  disabled={!!myVote || isBusy}
                  onClick={() => handleVote(p.id, 'yes')}
                  tone="yes"
                  icon={Check}
                  label="Yes"
                />
                <VoteBtn
                  active={myVote === 'no'}
                  disabled={!!myVote || isBusy}
                  onClick={() => handleVote(p.id, 'no')}
                  tone="no"
                  icon={X}
                  label="No"
                />
                <VoteBtn
                  active={myVote === 'abs'}
                  disabled={!!myVote || isBusy}
                  onClick={() => handleVote(p.id, 'abs')}
                  tone="abs"
                  icon={Minus}
                  label="Abstain"
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <Info size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Each member gets one vote per proposal. Votes are final once cast, and results update
          live for everyone.
        </span>
      </div>
    </div>
  )
}

function VoteBtn({ active, disabled, onClick, tone, icon: Icon, label }) {
  const styles = {
    yes: {
      idle: 'border-line bg-white text-emerald hover:border-emerald hover:bg-emerald/[0.06]',
      active: 'border-emerald bg-emerald text-white',
    },
    no: {
      idle: 'border-line bg-white text-red-600 hover:border-red-400 hover:bg-red-50',
      active: 'border-red-500 bg-red-500 text-white',
    },
    abs: {
      idle: 'border-line bg-white text-ink-soft hover:border-navy hover:bg-paper',
      active: 'border-navy bg-navy text-white',
    },
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[0.78rem] font-semibold transition ${
        active ? styles[tone].active : styles[tone].idle
      } ${disabled && !active ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <Icon size={13} strokeWidth={2.6} />
      {label}
    </button>
  )
}