// src/auth/BillingUpgrade.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Check, Crown, ShieldCheck, Sparkles, Star,
  Smartphone, Loader2, AlertCircle, Clock, Receipt,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTrial } from '../context/TrialContext'
import { useTier } from '../context/TierContext'
import { ORDER } from '../lib/tiers'
import { api } from '../lib/api'
import logo from '../assets/logos.png'

const PLAN_META = {
  Starter:  { features: ['Core chama management for small groups'] },
  Growth:   { features: ['Everything in Starter', 'Investments and financial reports'], popular: true },
  Business: { features: ['Everything in Growth', 'Governance, voting and role management'] },
  Gold:     { features: ['Everything in Business', 'Built for large chamas and SACCOs'], star: true },
}

const POLL_MS = 3000
const MAX_POLLS = 40

const stripDigits = (v) => String(v || '').replace(/\D/g, '').slice(0, 10)
const isValidPhone = (digits) => /^0[17]\d{8}$/.test(digits)
const formatKsh = (n) => `KSh ${Number(n || 0).toLocaleString()}`

export default function BillingUpgrade() {
  const navigate = useNavigate()
  const { trial, isLocked, markPaid, daysLeft } = useTrial()
  const { tiers, refresh: refreshTier } = useTier()

  const [selectedTier, setSelectedTier] = useState(trial?.tier || 'Growth')
  const [phone, setPhone] = useState('')
  const [stage, setStage] = useState('form') // form | waiting | success | failed | review | timeout
  const [payment, setPayment] = useState(null)
  const [failReason, setFailReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pollKick, setPollKick] = useState(0)

  const paymentIdRef = useRef(null)
  const triesRef = useRef(0)

  const price = Number(tiers[selectedTier]?.price ?? 0)
  const phoneValid = isValidPhone(phone)

  const pay = async (e) => {
    e.preventDefault()
    setError('')
    if (!phoneValid) return setError('Enter a valid 10-digit Kenyan phone number.')

    setBusy(true)
    try {
      const res = await api('/api/billing/checkout', {
        method: 'POST',
        body: { tier: selectedTier, phone },
      })

      // Hosted redirect
      if (res?.checkout?.redirectUrl) {
        window.location.href = res.checkout.redirectUrl
        return
      }

      // Direct success
      if (res?.status === 'complete' || res?.paid) {
        markPaid(selectedTier)
        try { await refreshTier() } catch {}
        setStage('success')
        toast.success(`${selectedTier} plan activated.`)
        return
      }

      // STK initiated — poll for status
      if (res?.payment?.id) {
        paymentIdRef.current = res.payment.id
        setPayment(res.payment)
        triesRef.current = 0
        setStage('waiting')
        return
      }

      setError('Unexpected response from server. Please try again.')
    } catch (err) {
      setError(err?.message || 'Could not start payment.')
    } finally {
      setBusy(false)
    }
  }

  // Poll payment status
  useEffect(() => {
    if (stage !== 'waiting' || !paymentIdRef.current) return undefined

    let cancelled = false
    const paymentId = paymentIdRef.current
    let inFlight = false

    const check = async () => {
      inFlight = true
      try {
        const res = await api(`/api/billing/payments/${paymentId}`)
        if (cancelled) return true

        const p = res.payment
        setPayment(p)

        if (p.status === 'complete') {
          setStage('success')
          try { markPaid(p.tier || selectedTier) } catch {}
          try { await refreshTier() } catch {}
          toast.success(`${p.tier} plan activated`)
          return true
        }
        if (p.status === 'review') {
          setStage('review')
          return true
        }
        if (['failed', 'expired'].includes(p.status)) {
          setFailReason(p.failedReason || 'Payment was not completed.')
          setStage('failed')
          return true
        }
        return false
      } catch {
        return false
      } finally {
        inFlight = false
      }
    }

    ;(async () => { await check() })()

    const id = setInterval(async () => {
      if (inFlight || cancelled) return
      triesRef.current += 1
      const done = await check()
      if (done) return clearInterval(id)
      if (triesRef.current >= MAX_POLLS) {
        clearInterval(id)
        if (!cancelled) setStage('timeout')
      }
    }, POLL_MS)

    return () => {
      cancelled = true
      clearInterval(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, pollKick])

  const retryCheck = () => {
    triesRef.current = 0
    setStage('waiting')
    setPollKick((n) => n + 1)
  }

  const backToForm = () => {
    paymentIdRef.current = null
    setPayment(null)
    setFailReason('')
    setError('')
    triesRef.current = 0
    setStage('form')
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-paper lg:grid-cols-[1fr_1.05fr]">
      {/* Left: context */}
      <aside className="relative hidden flex-col overflow-hidden bg-navy p-10 text-white lg:flex lg:p-14">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(700px 500px at 0% 0%, rgba(16,185,129,0.32), transparent 60%), radial-gradient(600px 500px at 100% 100%, rgba(245,185,66,0.14), transparent 60%), linear-gradient(160deg, #0B1F33 0%, #0A2A3E 55%, #08222A 100%)',
          }}
        />
        <Link to="/" className="relative flex items-center gap-3 text-white no-underline">
          <img src={logo} alt="Chametu" className="h-10 w-10 rounded-xl object-contain ring-1 ring-white/20" />
          <div>
            <div className="font-display text-lg font-bold leading-none tracking-tight">Chametu</div>
            <div className="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-emerald/80">
              Chama Management
            </div>
          </div>
        </Link>

        <div className="relative mt-14">
          <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-widest backdrop-blur ${isLocked ? 'border border-red-400/30 bg-red-500/10 text-red-200' : 'border border-emerald/30 bg-emerald/10 text-emerald'}`}>
            {isLocked ? <AlertCircle size={11} /> : <Sparkles size={11} />}
            {isLocked ? 'Account locked' : 'Trial active'}
          </div>

          <h1 className="mt-6 max-w-[520px] font-display text-[2.4rem] font-bold leading-[1.08] tracking-tight">
            {isLocked ? (
              <>Unlock your <span className="bg-gradient-to-r from-emerald to-[#7CF0C0] bg-clip-text text-transparent">chama</span></>
            ) : (
              <>Keep your chama <span className="bg-gradient-to-r from-emerald to-[#7CF0C0] bg-clip-text text-transparent">running</span></>
            )}
          </h1>

          <p className="mt-5 max-w-[46ch] text-[1rem] leading-relaxed text-white/70">
            {isLocked
              ? 'Your trial is over. Pick a plan to restore access. All your data is safe.'
              : `You've got ${daysLeft ?? 0} day${daysLeft === 1 ? '' : 's'} left. Add payment now to keep everything on without a break.`}
          </p>

          {trial?.tier && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 backdrop-blur">
              <Clock size={14} className="text-gold" />
              <span className="text-[0.84rem] text-white/80">
                Current plan: <b className="text-white">{trial.tier}</b>
              </span>
            </div>
          )}
        </div>

        <div className="relative mt-auto flex items-center gap-2 pt-10 text-[0.72rem] text-white/40">
          <ShieldCheck size={13} />
          <span>256-bit encrypted · Your data stays yours</span>
        </div>
      </aside>

      {/* Right: form */}
      <main className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[520px]">
          <div className="mb-8 flex items-center justify-between">
            <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-[0.82rem] font-semibold text-forest hover:underline">
              <ArrowLeft size={13} strokeWidth={2.2} /> Back to dashboard
            </Link>
          </div>

          {stage === 'success' ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald/10 text-forest ring-1 ring-emerald/20">
                <Check size={28} strokeWidth={2.6} />
              </span>
              <h2 className="mt-4 font-display text-[1.5rem] font-bold text-navy">
                {payment?.tier || selectedTier} plan activated
              </h2>
              <p className="mt-2 text-[0.92rem] text-ink-soft">
                Payment confirmed. Your dashboard is unlocked.
              </p>
              <button
                type="button"
                onClick={() => navigate('/dashboard', { replace: true })}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-3.5 font-display text-[0.94rem] font-bold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                Go to dashboard
              </button>
            </div>
          ) : stage === 'waiting' ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
              <Loader2 size={36} className="mx-auto animate-spin text-forest" />
              <h2 className="mt-4 font-display text-[1.3rem] font-bold text-navy">Check your phone</h2>
              <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
                Enter your M-Pesa PIN to pay <b>{formatKsh(payment?.amount ?? price)}</b> to Chametu.
              </p>
              <p className="mt-3 text-[0.78rem] text-ink-soft/80">
                This page updates automatically.
              </p>
            </div>
          ) : stage === 'failed' ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
              <AlertCircle size={36} className="mx-auto text-red-500" />
              <h2 className="mt-4 font-display text-[1.3rem] font-bold text-navy">Payment not completed</h2>
              <p className="mt-2 text-[0.9rem] text-ink-soft">{failReason}</p>
              <div className="mt-6 flex gap-2">
                <button onClick={backToForm} className="flex-1 rounded-xl border border-line bg-white py-2.5 text-[0.86rem] font-semibold text-navy">
                  Try again
                </button>
                <Link to="/dashboard" className="flex-1 rounded-xl bg-forest py-2.5 text-center text-[0.86rem] font-semibold text-white no-underline">
                  Back to dashboard
                </Link>
              </div>
            </div>
          ) : stage === 'review' ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
              <Clock size={36} className="mx-auto text-amber-500" />
              <h2 className="mt-4 font-display text-[1.3rem] font-bold text-navy">Payment received, confirming</h2>
              <p className="mt-2 text-[0.9rem] text-ink-soft">
                Your payment came through. We're verifying it — this usually takes a few minutes.
              </p>
              <button onClick={retryCheck} className="mt-6 w-full rounded-xl bg-forest py-2.5 text-[0.86rem] font-semibold text-white">
                Check again
              </button>
            </div>
          ) : stage === 'timeout' ? (
            <div className="rounded-3xl border border-line bg-white p-8 text-center shadow-sm">
              <AlertCircle size={36} className="mx-auto text-amber-500" />
              <h2 className="mt-4 font-display text-[1.3rem] font-bold text-navy">Still waiting for M-Pesa</h2>
              <p className="mt-2 text-[0.9rem] text-ink-soft">
                If you already entered your PIN, check again in a moment.
              </p>
              <div className="mt-6 flex gap-2">
                <button onClick={backToForm} className="flex-1 rounded-xl border border-line bg-white py-2.5 text-[0.86rem] font-semibold text-navy">
                  Start over
                </button>
                <button onClick={retryCheck} className="flex-1 rounded-xl bg-forest py-2.5 text-[0.86rem] font-semibold text-white">
                  Check again
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-forest/[0.08] px-3 py-1.5 text-[0.64rem] font-bold uppercase tracking-widest text-forest">
                <Crown size={11} /> {isLocked ? 'Unlock account' : 'Upgrade plan'}
              </div>

              <h2 className="mt-4 font-display text-[1.9rem] font-bold leading-tight tracking-tight text-navy dark:text-white">
                Pick a plan
              </h2>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft dark:text-slate-300">
                You'll be charged monthly. Cancel any time from Billing.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ORDER.map((tierName) => {
                  const t = tiers[tierName]
                  const meta = PLAN_META[tierName]
                  const selected = selectedTier === tierName
                  return (
                    <button
                      key={tierName}
                      type="button"
                      onClick={() => setSelectedTier(tierName)}
                      aria-pressed={selected}
                      className={`relative flex flex-col rounded-2xl border-[1.5px] bg-white p-4 text-left transition dark:bg-white/[0.03] ${selected ? 'border-forest shadow-[0_0_0_3px_rgba(11,122,90,0.12)] dark:border-emerald dark:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]' : 'border-line hover:-translate-y-0.5 hover:border-forest dark:border-white/10'}`}
                    >
                      {meta.popular && (
                        <span className="absolute -top-2 right-3 rounded-full bg-gradient-to-r from-forest to-emerald px-2 py-0.5 text-[0.56rem] font-bold tracking-widest text-white shadow">
                          MOST POPULAR
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-forest dark:text-emerald-400">
                          {tierName}
                        </span>
                        {meta.star && <Star size={12} className="text-gold" />}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="font-display text-[1.5rem] font-bold text-navy dark:text-white">
                          {formatKsh(t?.price)}
                        </span>
                        <span className="text-[0.74rem] text-ink-soft dark:text-slate-400">/mo</span>
                      </div>
                      <div className="mt-1 text-[0.7rem] text-ink-soft dark:text-slate-400">
                        {t?.maxMembers} members max
                      </div>
                      <div className="mt-3 flex items-center gap-1.5 text-[0.74rem]">
                        <span className={`grid h-4 w-4 place-items-center rounded-full ${selected ? 'bg-forest text-white' : 'border-[1.5px] border-line'}`}>
                          {selected && <Check size={9} strokeWidth={3} />}
                        </span>
                        <span className={selected ? 'font-semibold text-navy dark:text-white' : 'text-ink-soft dark:text-slate-400'}>
                          {selected ? 'Selected' : 'Choose'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <form onSubmit={pay} className="mt-6 space-y-3.5">
                <div>
                  <label className="mb-1.5 block text-[0.8rem] font-semibold text-navy dark:text-white">
                    M-Pesa phone number
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-line bg-[#F8FAFC] px-4 transition focus-within:border-forest focus-within:bg-white focus-within:ring-4 focus-within:ring-forest/10 dark:border-white/15 dark:bg-white/[0.04] dark:focus-within:bg-white/[0.06]">
                    <Smartphone size={16} strokeWidth={1.9} className="shrink-0 text-ink-soft" />
                    <input
                      inputMode="tel"
                      value={phone}
                      onChange={(e) => setPhone(stripDigits(e.target.value))}
                      placeholder="0712345678"
                      autoComplete="tel"
                      maxLength={10}
                      className="min-w-0 flex-1 border-0 bg-transparent py-3.5 font-mono text-[0.9rem] text-navy outline-none placeholder:text-ink-soft/60 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-dashed border-line bg-white px-4 py-3.5 dark:border-white/15 dark:bg-white/[0.04]">
                  <div className="text-[0.86rem] dark:text-slate-300">
                    <b className="text-navy dark:text-white">Total this month</b>
                    <br />
                    <span className="text-ink-soft dark:text-slate-400">{selectedTier} plan</span>
                  </div>
                  <b className="font-mono text-[1.25rem] text-navy dark:text-white">{formatKsh(price)}</b>
                </div>

                {error && (
                  <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-red-100 bg-red-50 px-3.5 py-3 text-[0.82rem] leading-relaxed text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    <AlertCircle size={14} className="mt-0.5 flex-none" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy || !phoneValid}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-forest to-emerald py-4 font-display text-[0.95rem] font-bold text-white shadow-[0_10px_24px_rgba(11,122,90,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-55"
                >
                  {busy ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending STK push…
                    </>
                  ) : (
                    <>
                      <Receipt size={15} strokeWidth={2.4} /> Pay {formatKsh(price)} with M-Pesa
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-start gap-2 px-1">
                <ShieldCheck size={14} strokeWidth={2} className="mt-0.5 shrink-0 text-forest" />
                <p className="text-[0.74rem] leading-relaxed text-ink-soft dark:text-slate-400">
                  We'll send an STK Push to your phone. Enter your M-Pesa PIN to confirm. Your
                  account unlocks the moment payment is confirmed.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}