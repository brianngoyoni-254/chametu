import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sparkles, Users, Smartphone, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ORDER } from '../../lib/tiers'
import { useTier } from '../../context/TierContext'
import { api } from '../../lib/api'

const BLURB = {
  Starter:  'Core chama management.',
  Growth:   'Adds investments and reports.',
  Business: 'Adds governance and roles.',
  Gold:     'Everything, for large chamas.',
}

export default function Upgrade() {
  const location = useLocation()
  const navigate = useNavigate()
  const { baseTier, tier, setBaseTier, tiers } = useTier()

  const needed = location.state?.needed
  const from = location.state?.from

  const [selectedTier, setSelectedTier] = useState(null)
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)

  const handleChoose = (name) => {
    setSelectedTier(name)
    setPhone('')
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (!phone) return toast.error('Please enter your M-Pesa phone number')

    setBusy(true)
    try {
      await api('/api/chama/billing/upgrade', {
        method: 'POST',
        body: { tier: selectedTier, phone }
      })
      
      toast.success(`STK Push sent to ${phone}. Enter your PIN to complete payment.`)
      
      setBaseTier(selectedTier)
      
      setSelectedTier(null)
      navigate(from || '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-[960px] mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[0.84rem] font-semibold text-forest hover:text-forest-dark transition"
        >
          <ArrowLeft size={14} strokeWidth={2} />
          Back
        </button>
      </div>

      <div className="text-center max-w-[52ch] mx-auto mb-8">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gold/15 text-[#8A6112] grid place-items-center mb-4">
          <Sparkles size={20} strokeWidth={2} />
        </div>
        <h1 className="font-display font-bold text-2xl text-navy">
          {needed ? `${needed} plan required` : 'Upgrade your plan'}
        </h1>
        <p className="mt-2 text-ink-soft">
          {needed
            ? `This feature is available on ${needed} and above. You're currently on ${baseTier}${
                tier !== baseTier ? ` (effective: ${tier})` : ''
              }.`
            : 'Pick the plan that matches your chama’s size and ambitions.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ORDER.map((name) => {
          const t = tiers[name]
          const current = name === baseTier
          const canPick = !current
          return (
            <div
              key={name}
              className={`bg-white border rounded-2xl p-5 flex flex-col gap-3 ${
                current ? 'border-forest ring-1 ring-forest' : 'border-line'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display font-semibold text-navy text-[1.02rem]">
                    {name}
                  </div>
                  <div className="mt-0.5 font-mono text-[0.9rem] text-forest">
                    KSh {t.price.toLocaleString()}
                    <span className="text-ink-soft text-[0.78rem]"> / mo</span>
                  </div>
                </div>
                {current && (
                  <span className="text-[0.66rem] font-bold uppercase tracking-wider text-forest bg-emerald/10 px-2 py-1 rounded-full">
                    Current
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[0.78rem] text-ink-soft">
                <Users size={12} strokeWidth={2} />
                Up to {t.maxMembers} members
              </div>

              <p className="text-[0.82rem] text-ink-soft leading-snug flex-1">
                {BLURB[name]}
              </p>

              <button
                onClick={() => handleChoose(name)}
                disabled={!canPick}
                className={`mt-auto py-2 rounded-xl text-[0.84rem] font-semibold transition ${
                  canPick
                    ? 'bg-forest text-white hover:bg-forest-dark'
                    : 'bg-paper text-ink-soft cursor-not-allowed'
                }`}
              >
                {current ? 'Current plan' : `Switch to ${name}`}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-[0.78rem] text-ink-soft text-center">
        Have a code? Ask your chairman or email support@chametu.co.ke for help.
      </p>

      {selectedTier && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setSelectedTier(null)}>
          <div className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-5 py-4 border-b border-line">
              <div>
                <h3 className="font-display font-semibold text-navy text-[1.05rem]">
                  {selectedTier === baseTier ? `Pay for ${selectedTier}` : `Upgrade to ${selectedTier}`}
                </h3>
                <p className="mt-0.5 text-[0.82rem] text-ink-soft">Enter your M-Pesa phone number to receive the STK push.</p>
              </div>
              <button onClick={() => setSelectedTier(null)} className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition">
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            
            <form onSubmit={handlePayment} className="px-5 py-4">
              <label className="flex flex-col gap-1.5 text-[0.8rem] font-semibold text-navy">
                M-Pesa Phone Number
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-line bg-white focus-within:border-forest">
                  <Smartphone size={15} strokeWidth={2} className="text-ink-soft shrink-0" />
                  <input 
                    type="tel"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="e.g. 0712345678" 
                    autoFocus
                    className="w-full outline-none text-[0.92rem] text-navy bg-transparent" 
                  />
                </div>
              </label>
              
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedTier(null)} className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold disabled:opacity-50">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
                  {busy ? 'Sending...' : 'Pay with M-Pesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}