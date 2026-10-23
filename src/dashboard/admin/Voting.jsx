import { useState } from 'react'
import { Plus, Clock } from 'lucide-react'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'
import { toast } from 'sonner'

export default function Voting() {
  const { sharedData, refetchMembers } = useChama()
  const proposals = sharedData?.proposals || []
  
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', amount: '', closes: '' })

  async function createProposal(e) {
    e.preventDefault()
    try {
      // Cleaned: No more localStorage token passing
      await api('/api/chama/proposals', { method: 'POST', body: form })
      toast.success('Proposal created')
      setOpen(false); setForm({ title: '', amount: '', closes: '' })
      refetchMembers()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Voting &amp; governance</h1>
          <p className="mt-1 text-sm text-ink-soft">{proposals.length} proposals open</p>
        </div>
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={15} /> New proposal
        </button>
      </div>

      {open && (
        <form onSubmit={createProposal} className="flex gap-3 rounded-xl border bg-white p-4">
          <input required placeholder="Title" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="flex-1 border-b px-2 py-1" />
          <input required placeholder="Amount" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="border-b px-2 py-1 w-32" />
          <input required placeholder="Closes" value={form.closes} onChange={e => setForm(f => ({...f, closes: e.target.value}))} className="border-b px-2 py-1 w-24" />
          <button type="submit" className="bg-forest text-white px-4 py-2 rounded-lg">Open</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {proposals.map((p) => {
          const total = (p.yes || 0) + (p.no || 0) + (p.abs || 0) || 1
          return (
            <div key={p.id} className="rounded-2xl border bg-white p-5">
              <h4 className="font-bold text-navy">{p.title}</h4>
              <p className="text-gold text-sm">{p.amount}</p>
              <p className="text-xs text-ink-soft flex items-center gap-1 mt-2"><Clock size={10} /> Closes {p.closes}</p>
              <div className="mt-4 h-2 flex rounded-full overflow-hidden bg-line">
                <div className="bg-emerald" style={{ width: `${(p.yes/total)*100}%` }} />
                <div className="bg-red-500" style={{ width: `${(p.no/total)*100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}