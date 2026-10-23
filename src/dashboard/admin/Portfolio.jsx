import { useMemo, useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useChama } from '../../context/ChamaContext'
import { api } from '../../lib/api'

const TYPES = ['Land', 'MMF', 'T-Bill', 'Shares', 'Property', 'Business', 'Other']

const fmt = (n) => 'KSh ' + Number(n || 0).toLocaleString('en-KE')

export default function Portfolio() {
  const { sharedData, refetchMembers } = useChama()
  const assets = sharedData?.assets || []

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', type: TYPES[0], amount: '' })
  const [updating, setUpdating] = useState(null)
  const [newValue, setNewValue] = useState('')

  const invested = useMemo(
    () => assets.reduce((s, a) => s + Number(a.price || 0), 0),
    [assets],
  )
  const value = useMemo(
    () => assets.reduce((s, a) => s + Number(a.value || 0), 0),
    [assets],
  )
  const gain = value - invested

  async function addInvestment(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.name.trim() || !amount || amount <= 0) {
      toast.error('Enter a name and a positive amount')
      return
    }
    setBusy(true)
    try {
      await api('/api/chama/assets', {
        method: 'POST',
        token: localStorage.getItem('auth_token'),
        body: {
          name: form.name.trim(),
          type: form.type,
          price: amount,
          ownership: 100,
          acquired: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        },
      })
      toast.success('Investment added')
      setForm({ name: '', type: TYPES[0], amount: '' })
      setOpen(false)
      refetchMembers?.()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  function startRevalue(id, current) {
    setUpdating(id)
    setNewValue(String(current))
  }

  async function saveRevalue(id) {
    const v = Number(newValue)
    if (!v || v <= 0) return
    try {
      await api(`/api/chama/assets/${id}`, {
        method: 'PATCH',
        token: localStorage.getItem('auth_token'),
        body: { value: v },
      })
      toast.success('Valuation updated')
      setUpdating(null)
      refetchMembers?.()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Investment portfolio</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {assets.length === 0
              ? 'No investments yet'
              : `Total value ${fmt(value)} · ${gain >= 0 ? '+' : '−'}${fmt(Math.abs(gain))} gain`}
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark"
        >
          <Plus size={15} /> Add investment
        </button>
      </div>

      {open && (
        <form onSubmit={addInvestment} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="flex-1 min-w-45 text-xs font-semibold text-ink">
            Investment name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Nakuru farmland"
              className="mt-1.5 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1.5 block rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            >
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount invested (KSh)
            <input
              type="number" min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1.5 block w-36 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button type="submit" disabled={busy} className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        {assets.length === 0 ? (
          <div className="py-12 text-center text-ink-soft text-sm">
            No investments yet. Add the first one above to start tracking gains.
          </div>
        ) : (
          <table className="w-full min-w-135 text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ink-soft">
                <th className="py-2">Investment</th>
                <th className="py-2">Type</th>
                <th className="py-2">Invested</th>
                <th className="py-2">Current value</th>
                <th className="py-2">Gain</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {assets.map((i) => {
                const g = Number(i.value || 0) - Number(i.price || 0)
                return (
                  <tr key={i.id} className="border-b border-line last:border-none">
                    <td className="py-2.5">{i.name}</td>
                    <td className="py-2.5">{i.type}</td>
                    <td className="py-2.5 font-mono">{Number(i.price || 0).toLocaleString()}</td>
                    <td className="py-2.5 font-mono">
                      {updating === i.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="w-28 rounded-md border border-line px-2 py-1 text-sm outline-none focus:border-forest"
                          />
                          <button onClick={() => saveRevalue(i.id)} className="text-xs font-semibold text-forest">
                            Save
                          </button>
                          <button onClick={() => setUpdating(null)} className="text-xs font-semibold text-ink-soft">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        Number(i.value || 0).toLocaleString()
                      )}
                    </td>
                    <td className={`py-2.5 font-mono ${g >= 0 ? 'text-forest' : 'text-red-600'}`}>
                      {g >= 0 ? '+' : '−'}{Math.abs(g).toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right">
                      {updating !== i.id && (
                        <button
                          onClick={() => startRevalue(i.id, i.value)}
                          className="text-xs font-semibold text-forest"
                        >
                          Update valuation
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}