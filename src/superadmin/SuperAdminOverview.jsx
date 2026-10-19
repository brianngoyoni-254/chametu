import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, X, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'

const KPIS = [
  { label: 'Monthly recurring revenue', value: 'KSh 33,000', sub: '▲ -92.4% vs September', tone: 'text-red-500', link: '/superadmin/billing' },
  { label: 'Active chamas', value: '6 / 10', sub: '196 members', tone: 'text-ink-soft', link: '/superadmin/chamas' },
  { label: 'Overdue on tier payment', value: '4', sub: 'KSh 12,000 at risk', tone: 'text-red-500', link: '/superadmin/billing' },
  { label: 'Deactivated / blocked', value: '4', sub: '1 deactivated · 3 blocked', tone: 'text-ink-soft', link: '/superadmin/chamas' },
]

const COLLECTION_RATES = [
  { name: 'Eldoret Farmers SACCO', rate: 95, color: 'bg-forest' },
  { name: 'Umoja Investment Group', rate: 92, color: 'bg-forest' },
  { name: 'Nyota Ladies Circle', rate: 90, color: 'bg-forest' },
  { name: 'Kiambu Land Chama', rate: 88, color: 'bg-forest' },
  { name: 'Pwani Builders', rate: 84, color: 'bg-forest' },
  { name: 'Amani Savers', rate: 78, color: 'bg-gold' },
  { name: 'Wanjiku Merry-go-round', rate: 71, color: 'bg-gold' },
  { name: 'Mwangaza Youth Group', rate: 63, color: 'bg-gold' },
  { name: 'Mama Mboga Welfare', rate: 45, color: 'bg-red-500' },
]

// Mock data for the export (matching your All Chamas page)
const CHAMAS_DATA = [
  { name: 'Umoja Investment Group', location: 'Nairobi', chair: 'J. Mwangi', tier: 'Gold', members: 48, collection: 92, billing: 'Paid', status: 'Active' },
  { name: 'Wanjiku Merry-go-round', location: 'Thika', chair: 'R. Wanjiku', tier: 'Starter', members: 12, collection: 71, billing: 'Overdue 14d', status: 'Blocked' },
  { name: 'Kiambu Land Chama', location: 'Kiambu', chair: 'P. Kariuki', tier: 'Business', members: 31, collection: 88, billing: 'Paid', status: 'Active' },
  { name: 'Mama Mboga Welfare', location: 'Kisumu', chair: 'A. Achieng', tier: 'Growth', members: 22, collection: 45, billing: 'Overdue 32d', status: 'Blocked' },
  { name: 'Tujenge Circle', location: 'Nakuru', chair: 'S. Kiprono', tier: 'Business', members: 27, collection: 0, billing: 'Paid', status: 'Deactivated' },
  { name: 'Pwani Builders', location: 'Mombasa', chair: 'H. Said', tier: 'Growth', members: 19, collection: 84, billing: 'Paid', status: 'Active' },
  { name: 'Eldoret Farmers SACCO', location: 'Eldoret', chair: 'K. Rotich', tier: 'Gold', members: 56, collection: 95, billing: 'Paid', status: 'Active' },
  { name: 'Amani Savers', location: 'Nairobi', chair: 'L. Njeri', tier: 'Starter', members: 9, collection: 78, billing: 'Overdue 5d', status: 'Overdue' },
  { name: 'Mwangaza Youth Group', location: 'Meru', chair: 'T. Mutua', tier: 'Growth', members: 25, collection: 63, billing: 'Overdue 21d', status: 'Blocked' },
  { name: 'Nyota Ladies Circle', location: 'Nairobi', chair: 'C. Wambui', tier: 'Business', members: 33, collection: 90, billing: 'Paid', status: 'Active' },
]

const RECENT_ACTIVITY = [
  { text: '2 chamas 14+ days overdue blocked in bulk', time: '15/10/2026', color: 'bg-red-500' },
  { text: 'Platform seeded with demo data', time: '15/10/2026', color: 'bg-ink-soft' },
]

export default function SuperAdminOverview() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportType, setExportType] = useState('full') // 'full' | 'billing'

  // --- CSV Logic ---
  const buildCSV = (type) => {
    let headers = []
    let rows = []

    if (type === 'full') {
      headers = ['Chama Name', 'Location', 'Chairperson', 'Tier', 'Members', 'Collection Rate', 'Billing Status', 'Account Status']
      rows = CHAMAS_DATA.map(c => [
        c.name, c.location, c.chair, c.tier, c.members, `${c.collection}%`, c.billing, c.status
      ])
    } else {
      headers = ['Chama Name', 'Tier', 'Billing Status']
      // Only include chamas that have an active or past due invoice
      rows = CHAMAS_DATA.filter(c => c.billing !== 'Paid').map(c => [
        c.name, c.tier, c.billing
      ])
    }

    // Escape function to handle commas in names
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    return [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n')
  }

  const handleDownload = () => {
    const csv = buildCSV(exportType)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chametu-platform-${exportType}-${new Date().toISOString().slice(0, 10)}.csv`
    
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Close modal & show success toast
    setIsExportModalOpen(false)
    toast.success('Export Complete', { 
      description: `Your ${exportType === 'full' ? 'full platform' : 'billing'} report has been downloaded.` 
    })
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Platform overview</h1>
          <p className="mt-1 text-sm text-ink-soft">All chamas, billing and activity · Monday, 19 Oct 2026</p>
        </div>
        
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy/90 dark:bg-emerald dark:text-[#06331F] dark:hover:bg-emerald/90"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* --- KPI Grid --- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <Link 
            key={k.label} 
            to={k.link}
            className="group rounded-2xl border border-line bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-forest/40 hover:shadow-md"
          >
            <div className="text-[0.82rem] font-medium text-ink-soft group-hover:text-navy transition-colors">{k.label}</div>
            <div className="mt-2 font-display text-[1.8rem] font-bold text-navy">{k.value}</div>
            <div className={`mt-1 text-[0.78rem] font-semibold ${k.tone}`}>{k.sub}</div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-[1.05rem] font-bold text-navy">Revenue trend (MRR)</h3>
          <div className="mt-6 relative h-64 w-full">
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[0.7rem] text-ink-soft">
              <span>432k</span><span>216k</span><span>0k</span>
            </div>
            <div className="ml-10 h-full w-full relative border-b border-l border-line/50">
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0 60 L 20 55 L 40 50 L 60 45 L 80 40 L 95 95 L 100 95 L 100 100 L 0 100 Z" fill="url(#lineGrad)" />
                <path d="M 0 60 L 20 55 L 40 50 L 60 45 L 80 40 L 95 95" fill="none" stroke="#0B7A5A" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {[0, 20, 40, 60, 80, 95].map((x, i) => (
                  <circle key={i} cx={x} cy={[60, 55, 50, 45, 40, 95][i]} r="3" fill="#fff" stroke="#0B7A5A" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
            </div>
            <div className="ml-10 mt-2 flex justify-between text-[0.7rem] text-ink-soft">
              <span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-[1.05rem] font-bold text-navy">Revenue by tier</h3>
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#F5B942 0% 60%, #10B981 60% 70%, #0B7A5A 70% 85%, #D1D5DB 85% 100%)' }}>
              <div className="absolute inset-4 rounded-full bg-card" />
              <div className="relative text-center">
                <div className="text-[0.65rem] text-ink-soft">Total</div>
                <div className="font-display font-bold text-navy">33,000</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 w-full text-[0.8rem]">
              {[['Starter', 'KSh 0', 'bg-[#D1D5DB]'],['Growth', 'KSh 3,000', 'bg-emerald'],['Business', 'KSh 10,000', 'bg-forest'],['Gold', 'KSh 20,000', 'bg-gold']].map(([name, val, color]) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                    <span className="text-ink-soft">{name}</span>
                  </div>
                  <span className="font-mono text-navy font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-[1.05rem] font-bold text-navy mb-4">Collection rate by chama</h3>
          <div className="space-y-3">
            {COLLECTION_RATES.map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-4">
                <span className="w-[140px] sm:w-[200px] truncate text-[0.82rem] sm:text-[0.85rem] text-navy font-medium">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-line/40 overflow-hidden">
                  <div className={`h-full rounded-full ${c.color}`} style={{ width: `${c.rate}%` }} />
                </div>
                <span className="w-10 text-right font-mono text-[0.75rem] sm:text-[0.8rem] text-ink-soft">{c.rate}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-sm">
          <h3 className="font-display text-[1.05rem] font-bold text-navy mb-4">Recent activity</h3>
          <div className="flex flex-col gap-4">
            {RECENT_ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${a.color}`} />
                <div>
                  <div className="text-[0.85rem] text-navy">{a.text}</div>
                  <div className="text-[0.72rem] text-ink-soft mt-0.5">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-forest" size={20} />
                <h3 className="font-display font-bold text-navy text-lg">Export Platform Data</h3>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="rounded-lg p-1.5 text-ink-soft hover:bg-paper transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-ink-soft">
                Select the data you want to download. The CSV will be generated instantly.
              </p>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3 rounded-xl border border-line p-3 cursor-pointer hover:border-forest/50 transition">
                  <input 
                    type="radio" 
                    name="export_type" 
                    checked={exportType === 'full'}
                    onChange={() => setExportType('full')}
                    className="accent-forest h-4 w-4" 
                  />
                  <div>
                    <div className="font-semibold text-navy text-sm">Full Platform Report</div>
                    <div className="text-[0.75rem] text-ink-soft">All active, blocked and deactivated chamas.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-line p-3 cursor-pointer hover:border-forest/50 transition">
                  <input 
                    type="radio" 
                    name="export_type" 
                    checked={exportType === 'billing'}
                    onChange={() => setExportType('billing')}
                    className="accent-forest h-4 w-4" 
                  />
                  <div>
                    <div className="font-semibold text-navy text-sm">Billing & Invoices Only</div>
                    <div className="text-[0.75rem] text-ink-soft">Current unpaid and overdue tier invoices.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-line bg-paper/50 px-5 py-4">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-soft hover:text-navy transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleDownload}
                className="rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-forest-dark transition"
              >
                Download CSV
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}