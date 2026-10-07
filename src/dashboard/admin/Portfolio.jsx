import { useState } from 'react'
import { Plus } from 'lucide-react'

const TYPES = ['Land', 'MMF', 'T-Bill', 'Shares', 'Property', 'Business', 'Other']

const INITIAL = [
  { id: 1, name: 'Kiambu Land Project', type: 'Land', invested: 1200000, value: 1500000 },
  { id: 2, name: 'Money Market Fund', type: 'MMF', invested: 900000, value: 980000 },
  { id: 3, name: 'Treasury Bills — 91 day', type: 'T-Bill', invested: 600000, value: 620000 },
]

function fmt(n) {
  return 'KSh ' + n.toLocaleString('en-KE')
}

export default function Portfolio() {
  const [items, setItems] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: TYPES[0], amount: '' })
  const [updating, setUpdating] = useState(null) // id of row being revalued
  const [newValue, setNewValue] = useState('')

  const invested = items.reduce((s, i) => s + i.invested, 0)
  const value = items.reduce((s, i) => s + i.value, 0)
  const gain = value - invested

  function addInvestment(e) {
    e.preventDefault()
    const amount = Number(form.amount)
    if (!form.name.trim() || !amount || amount <= 0) return
    setItems((it) => [...it, { id: Date.now(), name: form.name.trim(), type: form.type, invested: amount, value: amount }])
    setForm({ name: '', type: TYPES[0], amount: '' })
    setOpen(false)
  }

  function startRevalue(id, current) {
    setUpdating(id)
    setNewValue(String(current))
  }

  function saveRevalue(id) {
    const v = Number(newValue)
    if (!v || v <= 0) return
    setItems((it) => it.map((i) => (i.id === id ? { ...i, value: v } : i)))
    setUpdating(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Investment portfolio</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Total value {fmt(value)} · {gain >= 0 ? '+' : '−'}
            {fmt(Math.abs(gain))} gain
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
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
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Amount invested (KSh)
            <input
              type="number"
              min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="mt-1.5 block w-36 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
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
            {items.map((i) => {
              const g = i.value - i.invested
              return (
                <tr key={i.id} className="border-b border-line last:border-none">
                  <td className="py-2.5">{i.name}</td>
                  <td className="py-2.5">{i.type}</td>
                  <td className="py-2.5 font-mono">{i.invested.toLocaleString()}</td>
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
                      </div>
                    ) : (
                      i.value.toLocaleString()
                    )}
                  </td>
                  <td className={`py-2.5 font-mono ${g >= 0 ? 'text-emerald' : 'text-red-600'}`}>
                    {g >= 0 ? '+' : '−'}
                    {Math.abs(g).toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right">
                    {updating !== i.id && (
                      <button onClick={() => startRevalue(i.id, i.value)} className="text-xs font-semibold text-forest">
                        Update valuation
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}