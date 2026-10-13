import { useState } from 'react'
import { Plus, Package, TrendingUp, Landmark, Wrench, Car, Building2 } from 'lucide-react'
import { useSharedState, SHARED_KEYS, DEFAULT_ASSETS } from '../../lib/chametuShared'

const TYPES = ['Land', 'Equipment', 'Vehicle', 'Property', 'Other']

const TYPE_ICON = {
  Land: Landmark,
  Equipment: Wrench,
  Vehicle: Car,
  Property: Building2,
  Other: Package,
}

function fmt(n) {
  return 'KSh ' + Number(n).toLocaleString('en-KE')
}

export default function Assets() {
  const [assets, setAssets] = useSharedState(SHARED_KEYS.assets, DEFAULT_ASSETS)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', type: TYPES[0], price: '', ownership: '100' })

  const totalCost = assets.reduce((s, a) => s + a.price, 0)
  const totalValue = assets.reduce((s, a) => s + a.value, 0)
  const gain = totalValue - totalCost

  function addAsset(e) {
    e.preventDefault()
    const price = Number(form.price)
    const ownership = Number(form.ownership)
    if (!form.name.trim() || !price || price <= 0) return
    const today = new Date()
    const acquired = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    setAssets((a) => [
      ...a,
      {
        id: Date.now(),
        name: form.name.trim(),
        type: form.type,
        price,
        value: price,
        ownership: ownership || 100,
        acquired,
      },
    ])
    setForm({ name: '', type: TYPES[0], price: '', ownership: '100' })
    setOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="font-display text-xl font-bold text-navy">Asset register</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Physical and financial assets the chama owns
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <Plus size={15} /> Add asset
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-1">
        <div className="rounded-2xl border border-line bg-white p-4.5 shadow-sm">
          <div className="text-xs text-ink-soft">Total cost</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">{fmt(totalCost)}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4.5 shadow-sm">
          <div className="text-xs text-ink-soft">Current value</div>
          <div className="mt-2 font-mono text-lg font-bold text-navy">{fmt(totalValue)}</div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4.5 shadow-sm">
          <div className="text-xs text-ink-soft">Unrealised gain</div>
          <div className={`mt-2 font-mono text-lg font-bold ${gain >= 0 ? 'text-emerald' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : '−'}
            {fmt(Math.abs(gain)).replace('KSh ', 'KSh ')}
          </div>
        </div>
      </div>

      {open && (
        <form
          onSubmit={addAsset}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4.5 shadow-sm"
        >
          <label className="min-w-45 flex-1 text-xs font-semibold text-ink">
            Asset name
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Tent and chairs set"
              className="mt-1.5 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald/10"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Type
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="mt-1.5 block rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
            >
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            Purchase price
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="mt-1.5 block w-32 rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Ownership %
            <input
              type="number"
              min="1"
              max="100"
              value={form.ownership}
              onChange={(e) => setForm((f) => ({ ...f, ownership: e.target.value }))}
              className="mt-1.5 block w-24 rounded-xl border border-line px-3 py-2 text-sm outline-none transition focus:border-forest"
            />
          </label>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-br from-forest to-emerald px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Save
          </button>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-sm">
            <thead>
              <tr className="border-b border-line bg-paper/60 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-ink-soft">
                <th className="px-5 py-3">Asset</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Acquired</th>
                <th className="px-5 py-3 text-right">Purchase price</th>
                <th className="px-5 py-3 text-right">Current value</th>
                <th className="px-5 py-3 text-right">Ownership</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => {
                const Icon = TYPE_ICON[a.type] || Package
                return (
                  <tr key={a.id} className="border-b border-line last:border-none hover:bg-forest/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest/10 text-forest">
                          <Icon size={15} />
                        </span>
                        <span className="font-medium text-navy">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{a.type}</td>
                    <td className="px-5 py-3 text-ink-soft">{a.acquired || '—'}</td>
                    <td className="px-5 py-3 text-right font-mono text-navy">
                      {Number(a.price).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-navy">
                      {Number(a.value).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-ink-soft">
                      {a.ownership}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}