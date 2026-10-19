import { useState } from 'react'
import { Search, Download, X, Building2, MapPin, User, Users, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

const INITIAL_CHAMAS = [
  { id: 1, name: 'Umoja Investment Group', location: 'Nairobi', chair: 'J. Mwangi', tier: 'Gold', members: 48, collection: 92, billing: 'Paid', status: 'Active' },
  { id: 2, name: 'Wanjiku Merry-go-round', location: 'Thika', chair: 'R. Wanjiku', tier: 'Starter', members: 12, collection: 71, billing: 'Overdue 14d', status: 'Blocked' },
  { id: 3, name: 'Kiambu Land Chama', location: 'Kiambu', chair: 'P. Kariuki', tier: 'Business', members: 31, collection: 88, billing: 'Paid', status: 'Active' },
  { id: 4, name: 'Mama Mboga Welfare', location: 'Kisumu', chair: 'A. Achieng', tier: 'Growth', members: 22, collection: 45, billing: 'Overdue 32d', status: 'Blocked' },
  { id: 5, name: 'Tujenge Circle', location: 'Nakuru', chair: 'S. Kiprono', tier: 'Business', members: 27, collection: 0, billing: 'Paid', status: 'Deactivated' },
  { id: 6, name: 'Pwani Builders', location: 'Mombasa', chair: 'H. Said', tier: 'Growth', members: 19, collection: 84, billing: 'Paid', status: 'Active' },
  { id: 7, name: 'Eldoret Farmers SACCO', location: 'Eldoret', chair: 'K. Rotich', tier: 'Gold', members: 56, collection: 95, billing: 'Paid', status: 'Active' },
  { id: 8, name: 'Amani Savers', location: 'Nairobi', chair: 'L. Njeri', tier: 'Starter', members: 9, collection: 78, billing: 'Overdue 5d', status: 'Overdue' },
  { id: 9, name: 'Mwangaza Youth Group', location: 'Meru', chair: 'T. Mutua', tier: 'Growth', members: 25, collection: 63, billing: 'Overdue 21d', status: 'Blocked' },
  { id: 10, name: 'Nyota Ladies Circle', location: 'Nairobi', chair: 'C. Wambui', tier: 'Business', members: 33, collection: 90, billing: 'Paid', status: 'Active' },
]

const TABS = ['All', 'Active', 'Overdue', 'Deactivated', 'Blocked']

export default function SuperAdminChamas() {
  const [chamas, setChamas] = useState(INITIAL_CHAMAS)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedChama, setSelectedChama] = useState(null)

  const filteredChamas = chamas.filter((c) => {
    const matchesTab = activeTab === 'All' || c.status === activeTab
    const q = search.toLowerCase()
    return matchesTab && (c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.chair.toLowerCase().includes(q))
  })

  const tierBadge = (tier) => {
    if (tier === 'Starter') return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
    if (tier === 'Growth') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    if (tier === 'Business') return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
    if (tier === 'Gold') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    return 'bg-gray-100 text-gray-600'
  }

  const statusBadge = (status) => {
    if (status === 'Active') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
    if (status === 'Blocked') return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
    if (status === 'Deactivated') return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    if (status === 'Overdue') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
    return 'bg-gray-100'
  }

  const progressColor = (rate) => (rate >= 80 ? 'bg-emerald' : rate >= 50 ? 'bg-gold' : 'bg-red-500')

  const handleAction = (id, action) => {
    setChamas((prev) => prev.map((c) => {
      if (c.id !== id) return c
      let newStatus = c.status
      let msg = ''
      if (action === 'block') { newStatus = 'Blocked'; msg = 'blocked' }
      if (action === 'unblock') { newStatus = 'Active'; msg = 'unblocked' }
      if (action === 'deactivate') { newStatus = 'Deactivated'; msg = 'deactivated' }
      if (action === 'reactivate') { newStatus = 'Active'; msg = 'reactivated' }
      toast.success(`${c.name} ${msg}`)
      return { ...c, status: newStatus }
    }))
  }

  const handleExport = () => {
    const headers = ['Chama Name', 'Location', 'Chairperson', 'Tier', 'Members', 'Collection Rate', 'Billing Status', 'Account Status']
    const rows = filteredChamas.map((c) => [c.name, c.location, c.chair, c.tier, c.members, `${c.collection}%`, c.billing, c.status])
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-chamas-${activeTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    toast.success('Export Complete', { description: `Downloaded ${filteredChamas.length} chamas.` })
  }

  const ActionButtons = ({ chama, compact }) => (
    <div className={`flex ${compact ? 'flex-wrap' : 'flex-wrap justify-end'} items-center gap-2`}>
      <button onClick={() => setSelectedChama(chama)} className="rounded-lg border border-line bg-card px-3 py-1.5 text-[0.72rem] font-semibold text-navy transition hover:border-forest hover:text-forest dark:border-white/10 dark:bg-white/5 dark:text-white sm:px-3.5 sm:text-[0.75rem]">View</button>
      {chama.status === 'Active' && (
        <button onClick={() => handleAction(chama.id, 'deactivate')} className="rounded-lg border border-line bg-card px-3 py-1.5 text-[0.72rem] font-semibold text-navy transition hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white sm:px-3.5 sm:text-[0.75rem]">Deactivate</button>
      )}
      {chama.status === 'Blocked' && (
        <button onClick={() => handleAction(chama.id, 'unblock')} className="rounded-lg bg-forest px-3 py-1.5 text-[0.72rem] font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-3.5 sm:text-[0.75rem]">Unblock</button>
      )}
      {chama.status === 'Deactivated' && (
        <button onClick={() => handleAction(chama.id, 'reactivate')} className="rounded-lg bg-forest px-3 py-1.5 text-[0.72rem] font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F] sm:px-3.5 sm:text-[0.75rem]">Reactivate</button>
      )}
      {chama.status === 'Overdue' && (
        <>
          <button onClick={() => handleAction(chama.id, 'deactivate')} className="rounded-lg border border-line bg-card px-3 py-1.5 text-[0.72rem] font-semibold text-navy transition hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white sm:px-3.5 sm:text-[0.75rem]">Deactivate</button>
          <button onClick={() => handleAction(chama.id, 'block')} className="rounded-lg bg-red-600 px-3 py-1.5 text-[0.72rem] font-semibold text-white transition hover:bg-red-700 sm:px-3.5 sm:text-[0.75rem]">Block</button>
        </>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-[1300px] space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-navy dark:text-white sm:text-2xl">All chamas</h1>
          <p className="mt-1 text-[0.8rem] text-ink-soft sm:text-sm">{chamas.length} registered · control access, billing and removal</p>
        </div>
        <button onClick={handleExport} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B1F33]/90 dark:bg-emerald dark:text-[#06331F] sm:w-auto">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-card shadow-sm dark:border-white/10">
        <div className="flex flex-col gap-3 border-b border-line p-3 dark:border-white/10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.78rem] font-semibold transition sm:px-4 sm:text-[0.82rem] ${activeTab === tab ? 'bg-[#0B1F33] text-white dark:bg-emerald dark:text-[#06331F]' : 'border border-line bg-card text-navy hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search chama, town, chair…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-forest dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <ul className="divide-y divide-line md:hidden dark:divide-white/5">
          {filteredChamas.length === 0 ? (
            <li className="px-4 py-10 text-center text-[0.82rem] text-ink-soft">No chamas match.</li>
          ) : filteredChamas.map((c) => (
            <li key={c.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[0.9rem] font-bold text-navy dark:text-white">{c.name}</p>
                  <p className="truncate text-[0.72rem] text-ink-soft">{c.location} · {c.chair}</p>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-1 text-[0.66rem] font-bold ${statusBadge(c.status)}`}>{c.status}</span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-[0.72rem]">
                <div><span className="block text-ink-soft">Tier</span><span className={`mt-0.5 inline-flex rounded px-1.5 py-0.5 text-[0.66rem] font-bold ${tierBadge(c.tier)}`}>{c.tier}</span></div>
                <div><span className="block text-ink-soft">Members</span><span className="font-mono font-semibold text-navy dark:text-white">{c.members}</span></div>
                <div><span className="block text-ink-soft">Billing</span><span className={`font-semibold ${c.billing === 'Paid' ? 'text-forest dark:text-emerald' : 'text-red-600 dark:text-red-400'}`}>{c.billing}</span></div>
              </div>
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[0.68rem] text-ink-soft"><span>Collection</span><span className="font-mono">{c.collection}%</span></div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line/50 dark:bg-white/10">
                  <div className={`h-full rounded-full ${progressColor(c.collection)}`} style={{ width: `${c.collection}%` }} />
                </div>
              </div>
              <div className="mt-3"><ActionButtons chama={c} compact /></div>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper/30 text-[0.7rem] uppercase tracking-wider text-ink-soft dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-semibold lg:px-5">Chama</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Tier</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Members</th>
                <th className="px-4 py-3 font-semibold lg:px-5 w-44">Collection</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Billing</th>
                <th className="px-4 py-3 font-semibold lg:px-5">Status</th>
                <th className="px-4 py-3 text-right font-semibold lg:px-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-white/5">
              {filteredChamas.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-ink-soft">No chamas match.</td></tr>
              ) : filteredChamas.map((c) => (
                <tr key={c.id} className="transition hover:bg-paper/40 dark:hover:bg-white/[0.02]">
                  <td className="px-4 py-3 lg:px-5 lg:py-4">
                    <div className="font-semibold text-navy dark:text-white">{c.name}</div>
                    <div className="text-[0.72rem] text-ink-soft">{c.location} · Chair: {c.chair}</div>
                  </td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`inline-flex rounded-md px-2.5 py-1 text-[0.68rem] font-bold ${tierBadge(c.tier)}`}>{c.tier}</span></td>
                  <td className="px-4 py-3 font-mono text-navy dark:text-white lg:px-5 lg:py-4">{c.members}</td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-line/50 dark:bg-white/10">
                        <div className={`h-full rounded-full ${progressColor(c.collection)}`} style={{ width: `${c.collection}%` }} />
                      </div>
                      <span className="w-8 text-right font-mono text-[0.72rem] text-ink-soft">{c.collection}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`font-semibold ${c.billing === 'Paid' ? 'text-forest dark:text-emerald' : 'text-red-600 dark:text-red-400'}`}>{c.billing}</span></td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><span className={`inline-flex rounded-md px-2.5 py-1 text-[0.68rem] font-bold ${statusBadge(c.status)}`}>{c.status}</span></td>
                  <td className="px-4 py-3 lg:px-5 lg:py-4"><ActionButtons chama={c} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedChama && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setSelectedChama(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-150 dark:border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-4 py-3 dark:border-white/10 sm:px-5 sm:py-4">
              <div className="flex items-center gap-2"><Building2 className="text-forest dark:text-emerald" size={18} /><h3 className="font-display text-base font-bold text-navy dark:text-white sm:text-lg">Chama details</h3></div>
              <button onClick={() => setSelectedChama(null)} className="rounded-lg p-1.5 text-ink-soft hover:bg-paper dark:hover:bg-white/10"><X size={18} /></button>
            </div>
            <div className="space-y-4 p-4 sm:p-6">
              <div className="text-center">
                <h2 className="font-display text-lg font-bold text-navy dark:text-white sm:text-2xl">{selectedChama.name}</h2>
                <span className={`mt-2 inline-flex rounded-md px-3 py-1 text-[0.72rem] font-bold ${statusBadge(selectedChama.status)}`}>{selectedChama.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                {[
                  { icon: MapPin, label: 'Location', val: selectedChama.location },
                  { icon: User, label: 'Chairperson', val: selectedChama.chair },
                  { icon: Users, label: 'Members', val: `${selectedChama.members} active` },
                  { icon: CreditCard, label: 'Billing', val: selectedChama.billing, tone: selectedChama.billing === 'Paid' ? 'text-forest dark:text-emerald' : 'text-red-600 dark:text-red-400' },
                ].map((x) => (
                  <div key={x.label} className="rounded-xl border border-line p-2.5 dark:border-white/10 sm:p-3">
                    <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-wider text-ink-soft sm:text-[0.68rem]"><x.icon size={11} /> {x.label}</div>
                    <div className={`mt-0.5 text-[0.8rem] font-medium sm:mt-1 sm:text-sm ${x.tone || 'text-navy dark:text-white'}`}>{x.val}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-line p-3 dark:border-white/10 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[0.74rem] font-semibold text-ink-soft sm:text-[0.8rem]">Collection rate ({selectedChama.tier})</span>
                  <span className="text-[0.78rem] font-bold text-navy dark:text-white sm:text-[0.8rem]">{selectedChama.collection}%</span>
                </div>
                <div className="h-2 rounded-full bg-line/50 dark:bg-white/10">
                  <div className={`h-full rounded-full ${progressColor(selectedChama.collection)}`} style={{ width: `${selectedChama.collection}%` }} />
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-line bg-paper/50 px-4 py-3 dark:border-white/10 dark:bg-white/5 sm:px-5 sm:py-4">
              <button onClick={() => setSelectedChama(null)} className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy transition hover:bg-paper dark:border-white/10 dark:bg-white/5 dark:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}