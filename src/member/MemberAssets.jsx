// src/member/MemberAssets.jsx
import {
  Package, Landmark, Wrench, Car, Building2, TrendingUp,
  ShieldCheck, Calendar, Loader2,
} from 'lucide-react'
import { useMember } from '../context/MemberContext'

const TYPE_ICON = {
  Land: Landmark,
  Equipment: Wrench,
  Vehicle: Car,
  Property: Building2,
  Other: Package,
}

function fmt(n) {
  return 'KSh ' + Number(n || 0).toLocaleString('en-KE')
}

export default function MemberAssets() {
  const { chama, shared, isLoading } = useMember()
  const assets = shared?.assets || []

  const totalCost = assets.reduce((s, a) => s + Number(a.price || 0), 0)
  const totalValue = assets.reduce((s, a) => s + Number(a.value || 0), 0)
  const gain = totalValue - totalCost
  const gainPct = totalCost ? Math.round((gain / totalCost) * 100) : 0

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-navy">Chama Assets</h1>
        <p className="mt-1 text-[0.86rem] text-ink-soft">
          What {chama?.name || 'the chama'} has acquired so far
        </p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-[#0A2A3E] to-[#0A3D46] p-6 text-white shadow-lg">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(400px 250px at 95% -10%, rgba(16,185,129,0.35), transparent)',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-widest text-emerald/80">
            <TrendingUp size={12} />
            Total chama asset value
          </div>
          <div className="mt-2 font-display font-mono text-3xl font-bold tracking-tight">
            {fmt(totalValue)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.8rem] text-white/70">
            <span>
              Acquired at <b className="text-white/90">{fmt(totalCost)}</b>
            </span>
            {totalCost > 0 && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold ${
                  gain >= 0
                    ? 'bg-emerald/20 text-emerald'
                    : 'bg-red-500/20 text-red-300'
                }`}
              >
                {gain >= 0 ? '▲' : '▼'} {gain >= 0 ? '+' : '−'}
                {gainPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Asset cards */}
      {isLoading && assets.length === 0 ? (
        <div className="py-10 text-center">
          <Loader2 className="mx-auto animate-spin text-forest" size={22} />
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white py-14 text-center">
          <Package size={26} className="mx-auto text-ink-soft/50" />
          <p className="mt-3 text-sm text-ink-soft">
            The chama hasn't acquired any assets yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2">
          {assets.map((a) => {
            const Icon = TYPE_ICON[a.type] || Package
            const g = Number(a.value || 0) - Number(a.price || 0)
            const gp = Number(a.price) ? Math.round((g / Number(a.price)) * 100) : 0
            return (
              <div
                key={a.id}
                className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-forest/15 to-emerald/5 text-forest">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">
                    {a.type}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-base font-semibold text-navy">
                  {a.name}
                </h3>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-mono text-lg font-bold text-navy">
                    {fmt(a.value)}
                  </span>
                  {g !== 0 && (
                    <span
                      className={`text-[0.72rem] font-semibold ${
                        g >= 0 ? 'text-emerald' : 'text-red-600'
                      }`}
                    >
                      {g >= 0 ? '+' : '−'}
                      {Math.abs(gp)}%
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[0.72rem] text-ink-soft">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={11} />
                    {a.acquired || 'Recently'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-forest" />
                    {a.ownership || 100}% chama owned
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl bg-emerald/[0.06] px-4 py-3 text-[0.8rem] text-navy ring-1 ring-emerald/10">
        <ShieldCheck size={15} className="mt-0.5 flex-none text-forest" />
        <span>
          Assets are the chama's collective property. Contact your treasurer for purchase records
          or transfer details.
        </span>
      </div>
    </div>
  )
}