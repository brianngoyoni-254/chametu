import { useState } from 'react'
import { Plus } from 'lucide-react'

const TYPES = ['Land', 'Equipment', 'Vehicle', 'Property', 'Other']

const INITIAL = [
  { id: 1, name: 'Kiambu Land Project', type: 'Land', price: 1200000, value: 1500000, ownership: 100 },
  { id: 2, name: 'Office equipment', type: 'Equipment', price: 85000, value: 60000, ownership: 100 },
]

function fmt(n) {
  return n.toLocaleString('en-KE')
}

export default function Assets() {
  const [assets, setAssets] = useState(INITIAL)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: TYPES[0], price: '', ownership: '100' })

  function addAsset(e) {
    e.preventDefault()
    const price = Number(form.price)
    const ownership = Number(form.ownership)
    if (!form.name.trim() || !price || price <= 0) return
    setAssets((a) => [
      ...a,
      { id: Date.now(), name: form.name.trim(), type: form.type, price, value: price, ownership: ownership || 100 },
    ])
    setForm({ name: '', type: TYPES[0], price: '', ownership: '100' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl text-navy">Asset register</h1>
          <p className="mt-1 text-sm text-ink-soft">Physical and financial assets the chama owns</p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Add asset
        </button>
      </div>

      {open && (
        <form onSubmit={addAsset} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4.5">
          <label className="flex-1 min-w-45 text-xs font-semibold text-ink">
            Asset name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Tent and chairs set"
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
            Purchase price (KSh)
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="mt-1.5 block w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Ownership (%)
            <input
              type="number"
              min="1"
              max="100"
              value={form.ownership}
              onChange={(e) => setForm((f) => ({ ...f, ownership: e.target.value }))}
              className="mt-1.5 block w-24 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </label>
          <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white">
            Save
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-line bg-white p-5">
        <table className="w-full min-w-130 text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft">
              <th className="py-2">Asset</th>
              <th className="py-2">Type</th>
              <th className="py-2">Purchase price</th>
              <th className="py-2">Current valuation</th>
              <th className="py-2">Ownership</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id} className="border-b border-line last:border-none">
                <td className="py-2.5">{a.name}</td>
                <td className="py-2.5">{a.type}</td>
                <td className="py-2.5 font-mono">{fmt(a.price)}</td>
                <td className="py-2.5 font-mono">{fmt(a.value)}</td>
                <td className="py-2.5 font-mono">{a.ownership}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}