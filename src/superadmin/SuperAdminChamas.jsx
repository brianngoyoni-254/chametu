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
  const [selectedChama, setSelectedChama] = useState(null) // State for the View Modal

  // Filter Logic
  const filteredChamas = chamas.filter((chama) => {
    const matchesTab = activeTab === 'All' || chama.status === activeTab
    const query = search.toLowerCase()
    const matchesSearch = 
      chama.name.toLowerCase().includes(query) ||
      chama.location.toLowerCase().includes(query) ||
      chama.chair.toLowerCase().includes(query)
    return matchesTab && matchesSearch
  })

  // Badge Helpers
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

  const progressColor = (rate) => {
    if (rate >= 80) return 'bg-emerald'
    if (rate >= 50) return 'bg-gold'
    return 'bg-red-500'
  }

  // Handle Actions (Block, Unblock, Deactivate, Reactivate)
  const handleAction = (id, action) => {
    setChamas(prev => prev.map(c => {
      if (c.id === id) {
        let newStatus = c.status
        let msg = ''

        if (action === 'block') { newStatus = 'Blocked'; msg = 'blocked' }
        if (action === 'unblock') { newStatus = 'Active'; msg = 'unblocked' }
        if (action === 'deactivate') { newStatus = 'Deactivated'; msg = 'deactivated' }
        if (action === 'reactivate') { newStatus = 'Active'; msg = 'reactivated' }

        toast.success(`${c.name} ${msg}`)
        return { ...c, status: newStatus }
      }
      return c
    }))
  }

  // Handle CSV Export
  const handleExport = () => {
    const headers = ['Chama Name', 'Location', 'Chairperson', 'Tier', 'Members', 'Collection Rate', 'Billing Status', 'Account Status']
    const rows = filteredChamas.map(c => [
      c.name, c.location, c.chair, c.tier, c.members, `${c.collection}%`, c.billing, c.status
    ])

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-chamas-${activeTab.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Export Complete', { 
      description: `Downloaded ${filteredChamas.length} chamas matching your filters.` 
    })
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">All chamas</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {chamas.length} registered · control access, billing and removal
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl bg-[#0B1F33] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0B1F33]/90 dark:bg-emerald dark:text-[#06331F]"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Main Container */}
      <div className="rounded-2xl border border-line bg-card shadow-sm">
        
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-[0.82rem] font-semibold transition ${
                  activeTab === tab
                    ? 'bg-[#0B1F33] text-white dark:bg-emerald dark:text-[#06331F]'
                    : 'bg-card border border-line text-navy hover:bg-paper dark:hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search name, town or chairperson..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm text-navy outline-none focus:border-forest"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line bg-paper/30 text-[0.72rem] uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-5 py-3 font-semibold">Chama</th>
                <th className="px-5 py-3 font-semibold">Tier</th>
                <th className="px-5 py-3 font-semibold">Members</th>
                <th className="px-5 py-3 font-semibold w-48">Collection</th>
                <th className="px-5 py-3 font-semibold">Billing</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredChamas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-ink-soft">
                    No chamas found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredChamas.map((chama) => (
                  <tr key={chama.id} className="transition hover:bg-paper/40 dark:hover:bg-white/[0.02]">
                    {/* Name & Location */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-navy">{chama.name}</div>
                      <div className="text-[0.75rem] text-ink-soft">
                        {chama.location} · Chair: {chama.chair}
                      </div>
                    </td>
                    
                    {/* Tier */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-[0.7rem] font-bold ${tierBadge(chama.tier)}`}>
                        {chama.tier}
                      </span>
                    </td>
                    
                    {/* Members */}
                    <td className="px-5 py-4 font-mono text-navy">{chama.members}</td>
                    
                    {/* Collection */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full rounded-full bg-line/50">
                          <div 
                            className={`h-full rounded-full ${progressColor(chama.collection)}`} 
                            style={{ width: `${chama.collection}%` }} 
                          />
                        </div>
                        <span className="w-8 text-right font-mono text-[0.75rem] text-ink-soft">
                          {chama.collection}%
                        </span>
                      </div>
                    </td>
                    
                    {/* Billing */}
                    <td className="px-5 py-4">
                      <span className={`font-semibold ${chama.billing === 'Paid' ? 'text-forest dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {chama.billing}
                      </span>
                    </td>
                    
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-[0.7rem] font-bold ${statusBadge(chama.status)}`}>
                        {chama.status}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedChama(chama)}
                          className="rounded-lg border border-line bg-card px-3.5 py-1.5 text-[0.75rem] font-semibold text-navy transition hover:border-forest hover:text-forest"
                        >
                          View
                        </button>
                        
                        {chama.status === 'Active' && (
                          <button 
                            onClick={() => handleAction(chama.id, 'deactivate')}
                            className="rounded-lg border border-line bg-card px-3.5 py-1.5 text-[0.75rem] font-semibold text-navy transition hover:bg-paper"
                          >
                            Deactivate
                          </button>
                        )}
                        {chama.status === 'Blocked' && (
                          <button 
                            onClick={() => handleAction(chama.id, 'unblock')}
                            className="rounded-lg bg-forest px-3.5 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]"
                          >
                            Unblock
                          </button>
                        )}
                        {chama.status === 'Deactivated' && (
                          <button 
                            onClick={() => handleAction(chama.id, 'reactivate')}
                            className="rounded-lg bg-forest px-3.5 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-forest-dark dark:bg-emerald dark:text-[#06331F]"
                          >
                            Reactivate
                          </button>
                        )}
                        {chama.status === 'Overdue' && (
                          <>
                            <button 
                              onClick={() => handleAction(chama.id, 'deactivate')}
                              className="rounded-lg border border-line bg-card px-3.5 py-1.5 text-[0.75rem] font-semibold text-navy transition hover:bg-paper"
                            >
                              Deactivate
                            </button>
                            <button 
                              onClick={() => handleAction(chama.id, 'block')}
                              className="rounded-lg bg-red-600 px-3.5 py-1.5 text-[0.75rem] font-semibold text-white transition hover:bg-red-700"
                            >
                              Block
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- VIEW MODAL --- */}
      {selectedChama && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Building2 className="text-forest" size={20} />
                <h3 className="font-display font-bold text-navy text-lg">Chama Details</h3>
              </div>
              <button 
                onClick={() => setSelectedChama(null)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              <div className="text-center">
                <h2 className="font-display font-bold text-2xl text-navy">{selectedChama.name}</h2>
                <span className={`mt-2 inline-flex rounded-md px-3 py-1 text-[0.75rem] font-bold ${statusBadge(selectedChama.status)}`}>
                  {selectedChama.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-soft uppercase tracking-wider mb-1">
                    <MapPin size={12} /> Location
                  </div>
                  <div className="text-sm font-medium text-navy">{selectedChama.location}</div>
                </div>
                <div className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-soft uppercase tracking-wider mb-1">
                    <User size={12} /> Chairperson
                  </div>
                  <div className="text-sm font-medium text-navy">{selectedChama.chair}</div>
                </div>
                <div className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-soft uppercase tracking-wider mb-1">
                    <Users size={12} /> Members
                  </div>
                  <div className="text-sm font-medium text-navy">{selectedChama.members} active</div>
                </div>
                <div className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-soft uppercase tracking-wider mb-1">
                    <CreditCard size={12} /> Billing
                  </div>
                  <div className={`text-sm font-medium ${selectedChama.billing === 'Paid' ? 'text-forest' : 'text-red-600'}`}>
                    {selectedChama.billing}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-line p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[0.8rem] font-semibold text-ink-soft">Collection Rate ({selectedChama.tier})</span>
                  <span className="text-[0.8rem] font-bold text-navy">{selectedChama.collection}%</span>
                </div>
                <div className="h-2 rounded-full bg-line/50">
                  <div 
                    className={`h-full rounded-full ${progressColor(selectedChama.collection)}`} 
                    style={{ width: `${selectedChama.collection}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 border-t border-line bg-paper/50 px-5 py-4">
              <button 
                onClick={() => setSelectedChama(null)}
                className="rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold text-navy transition hover:bg-paper"
              >
                Close
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}