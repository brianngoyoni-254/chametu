import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Sparkles, Users, Smartphone, Loader2, X, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { ORDER } from '../../lib/tiers'
import { useTier } from '../../context/TierContext'
import { api } from '../../lib/api'
import { friendlyFailureReason } from '../../lib/paymentMessages'

const BLURB = {
  Starter:  'Core chama management.',
  Growth:   'Adds investments and reports.',
  Business: 'Adds governance and roles.',
  Gold:     'Everything, for large chamas.',
}

const POLL_MS = 3000
const MAX_POLLS = 40

// stage: 'form' -> 'waiting' -> 'success' | 'failed' | 'timeout'
export default function Upgrade() {
  const location = useLocation()
  const navigate = useNavigate()
  const { baseTier, tier, refresh, tiers } = useTier()

  const needed = location.state?.needed
  const from = location.state?.from

  const [selectedTier, setSelectedTier] = useState(null)
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [stage, setStage] = useState('form')
  const [payment, setPayment] = useState(null)
  const [failReason, setFailReason] = useState('')
  const [prices, setPrices] = useState(null)
  const [pollKick, setPollKick] = useState(0)

  const triesRef = useRef(0)
  // Capture payment id so the poll effect doesn't restart when setPayment
  // swaps the object reference mid-poll.
  const paymentIdRef = useRef(null)
  const currentIndex = ORDER.indexOf(baseTier)

  useEffect(() => {
    let alive = true
    api('/api/settings/public-prices')
      .then((p) => { if (alive && p && typeof p === 'object') setPrices(p) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const priceOf = (name) => Number(prices?.[name] ?? tiers[name]?.price ?? 0)

  const closeModal = () => {
    paymentIdRef.current = null
    setSelectedTier(null)
    setStage('form')
    setPayment(null)
    setFailReason('')
    setPhone('')
    triesRef.current = 0
  }

  const handleChoose = (name) => {
    closeModal()
    setSelectedTier(name)
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 9) {
      return toast.error('Please enter a valid M-Pesa phone number')
    }

    setBusy(true)
    try {
      const res = await api('/api/billing/checkout', {
        method: 'POST',
        body: { tier: selectedTier, phone },
      })
      paymentIdRef.current = res.payment.id
      setPayment(res.payment)
      triesRef.current = 0
      setStage('waiting')
    } catch (err) {
      toast.error(err.message || 'Could not start payment')
    } finally {
      setBusy(false)
    }
  }

  // Poll: depends only on `stage` and `pollKick`; the payment id is read
  // from a ref so setPayment() during polling does NOT restart the interval.
  useEffect(() => {
    if (stage !== 'waiting' || !paymentIdRef.current) return undefined

    let cancelled = false
    const paymentId = paymentIdRef.current

    const applyOutcome = (p) => {
      setPayment(p)

      if (p.status === 'complete') {
        setStage('success')
        toast.success(`${p.tier} plan activated`)
        return true
      }
      if (['failed', 'expired', 'review'].includes(p.status)) {
        setFailReason(friendlyFailureReason(p.failedReason, p.status))
        setStage('failed')
        if (p.status === 'failed') toast.error('Payment not completed')
        return true
      }
      return false
    }

    const check = async () => {
      try {
        const res = await api(`/api/billing/payments/${paymentId}`)
        if (cancelled) return true
        const p = res.payment
        const done = applyOutcome(p)
        if (done && p.status === 'complete') {
          try { await refresh() } catch { /* server already upgraded */ }
        }
        return done
      } catch {
        return false
      }
    }

    ;(async () => {
      const done = await check()
      if (done || cancelled) return
    })()

    const id = setInterval(async () => {
      triesRef.current += 1
      const done = await check()
      if (done) return clearInterval(id)
      if (triesRef.current >= MAX_POLLS) {
        clearInterval(id)
        if (!cancelled) setStage('timeout')
      }
      return undefined
    }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pollKick])

  const finishSuccess = () => {
    const dest = from || '/dashboard'
    closeModal()
    navigate(dest, { replace: true })
  }

  const retryCheck = () => {
    triesRef.current = 0
    setStage('waiting')
    setPollKick((n) => n + 1)
  }

  const locked = stage === 'waiting'

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
        {ORDER.map((name, idx) => {
          const t = tiers[name]
          const current = name === baseTier
          const canPick = idx > currentIndex
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
                    KSh {priceOf(name).toLocaleString()}
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
                Up to {t?.maxMembers} members
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
                {current ? 'Current plan' : canPick ? `Upgrade to ${name}` : 'Included in your plan'}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-6 text-[0.78rem] text-ink-soft text-center">
        Need help with billing? Email support@chametu.co.ke.
      </p>

      {selectedTier && (
        <div
          className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4"
          onClick={() => { if (!locked && stage !== 'success') closeModal() }}
        >
          <div
            className="bg-white border border-line rounded-2xl w-full max-w-sm overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-5 py-4 border-b border-line">
              <div>
                <h3 className="font-display font-semibold text-navy text-[1.05rem]">
                  Upgrade to {selectedTier}
                </h3>
                <p className="mt-0.5 text-[0.82rem] text-ink-soft">
                  KSh {priceOf(selectedTier).toLocaleString()} via M-Pesa
                </p>
              </div>
              {!locked && stage !== 'success' && (
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-paper text-ink-soft hover:text-navy transition"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              )}
            </div>

            {stage === 'form' && (
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
                <p className="mt-2 text-[0.76rem] text-ink-soft">
                  You’ll get an M-Pesa prompt on this number. Your plan upgrades as soon as payment is confirmed.
                </p>

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold disabled:opacity-50"
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
                    {busy ? 'Sending...' : 'Pay with M-Pesa'}
                  </button>
                </div>
              </form>
            )}

            {stage === 'waiting' && (
              <div className="px-5 py-8 text-center">
                <Loader2 size={32} className="mx-auto animate-spin text-forest" />
                <p className="mt-4 font-display font-semibold text-navy">Check your phone</p>
                <p className="mt-1 text-[0.84rem] text-ink-soft">
                  Enter your M-Pesa PIN to pay KSh {Number(payment?.amount ?? 0).toLocaleString()}
                  {' '}to Chametu. Please keep this window open.
                </p>
                <p className="mt-3 text-[0.74rem] text-ink-soft/80">
                  This page updates automatically once payment is confirmed or cancelled.
                </p>
              </div>
            )}

            {stage === 'success' && (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 size={36} className="mx-auto text-emerald" />
                <p className="mt-4 font-display font-semibold text-navy">
                  {payment?.tier || selectedTier} plan activated
                </p>
                <p className="mt-1 text-[0.84rem] text-ink-soft">
                  Payment received. Your new features are ready.
                </p>
                <button
                  onClick={finishSuccess}
                  className="mt-6 px-5 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold"
                >
                  Continue
                </button>
              </div>
            )}

            {stage === 'failed' && (
              <div className="px-5 py-8 text-center">
                <AlertCircle size={36} className="mx-auto text-red-500" />
                <p className="mt-4 font-display font-semibold text-navy">Payment not completed</p>
                <p className="mt-1 text-[0.84rem] text-ink-soft">{failReason}</p>
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setStage('form'); setPayment(null); paymentIdRef.current = null }}
                    className="px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {stage === 'timeout' && (
              <div className="px-5 py-8 text-center">
                <AlertCircle size={36} className="mx-auto text-amber-500" />
                <p className="mt-4 font-display font-semibold text-navy">Still waiting for M-Pesa</p>
                <p className="mt-1 text-[0.84rem] text-ink-soft">
                  We haven’t received confirmation yet. If you already entered your PIN, check again in a moment.
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 rounded-xl border border-line bg-white text-navy text-[0.86rem] font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={retryCheck}
                    className="px-4 py-2.5 rounded-xl bg-forest text-white text-[0.86rem] font-semibold"
                  >
                    Check again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}