// src/components/MpesaWaiting.jsx
import { useEffect, useState } from 'react'
import {
  Clock, ShieldCheck, Loader2, RefreshCw, X, Check, ChevronRight,
} from 'lucide-react'

const MAX_POLLS = 40

/* ------------------------------------------------------------------ */
/*  Inline M-Pesa logo (faithful to the real wordmark, no asset file) */
/* ------------------------------------------------------------------ */
function MpesaLogo({ className = 'h-6' }) {
  return (
    <svg
      viewBox="0 0 220 56"
      role="img"
      aria-label="M-Pesa"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Wordmark "M-PESA" in the official green */}
      <text
        x="0"
        y="42"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
        fontSize="42"
        fontWeight="800"
        letterSpacing="-1.5"
        fill="#00A651"
      >
        M-PESA
      </text>
      {/* The signature green swoosh under the "M" */}
      <path
        d="M2 50 C 22 44, 42 44, 58 50"
        stroke="#00A651"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  Small "STK push" style notification shown on the phone screen     */
/* ------------------------------------------------------------------ */
function StkNotification() {
  return (
    <div className="w-full px-1.5">
      <div className="rounded-md bg-white/95 px-1.5 py-1.5 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="grid h-3 w-3 flex-none place-items-center rounded-full bg-[#00A651]">
            <span className="text-[0.4rem] font-black leading-none text-white">M</span>
          </span>
          <span className="truncate text-[0.35rem] font-bold text-[#0B1F33]">
            M-PESA
          </span>
          <span className="ml-auto text-[0.3rem] text-slate-400">now</span>
        </div>
        <div className="mt-0.5 text-[0.34rem] font-medium leading-tight text-slate-700">
          Pay KSh 0 to Chametu?
        </div>
        <div className="mt-0.5 flex gap-1">
          <span className="flex-1 rounded bg-[#00A651] py-0.5 text-center text-[0.3rem] font-bold text-white">
            Enter PIN
          </span>
          <span className="flex-1 rounded bg-slate-200 py-0.5 text-center text-[0.3rem] font-bold text-slate-500">
            Cancel
          </span>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Phone illustration with STK waves + notification                  */
/* ------------------------------------------------------------------ */
function PhoneWithWaves({ amount }) {
  return (
    <div className="relative mx-auto flex h-[200px] w-[200px] items-center justify-center">
      {/* Pulsing STK waves */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border-2 border-[#00A651]/35"
          style={{ animation: `mpesa-wave 2.4s ease-out ${i * 0.8}s infinite` }}
        />
      ))}
      <span className="absolute inset-6 rounded-full bg-[#00A651]/[0.06]" />
      <span className="absolute inset-12 rounded-full bg-[#00A651]/[0.08]" />

      {/* Phone */}
      <div className="relative z-10 flex h-[140px] w-[82px] flex-col items-center justify-between rounded-[16px] border-[3px] border-[#0B1F33] bg-gradient-to-b from-[#0B1F33] to-[#1A3A4E] p-1.5 shadow-[0_16px_40px_-10px_rgba(11,31,51,0.55)]">
        <div className="h-1 w-6 rounded-full bg-white/20" />

        {/* Screen */}
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-1 overflow-hidden rounded-[7px] bg-gradient-to-b from-[#EAF7EF] to-[#DCF0E4] px-1 py-1.5">
          <span className="grid h-6 w-6 animate-pulse place-items-center rounded-full bg-[#00A651] shadow-[0_0_18px_rgba(0,166,81,0.65)]">
            <span className="text-[0.5rem] font-black leading-none text-white">M</span>
          </span>
          <div className="text-center text-[0.34rem] font-bold uppercase tracking-widest text-[#008C44]">
            STK Push
          </div>
          <StkNotification />
        </div>

        <div className="h-1 w-6 rounded-full bg-white/20" />
      </div>

      {/* Floating amount badge */}
      <div className="absolute -right-1 top-3 z-20 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[0.7rem] font-bold text-[#008C44] shadow-[0_6px_16px_-4px_rgba(0,166,81,0.4)] ring-1 ring-[#00A651]/25">
        <span className="h-1.5 w-1.5 rounded-full bg-[#00A651]" />
        KSh {amount.toLocaleString()}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function MpesaWaiting({
  amount = 0,
  phone = '',
  tier = '',
  elapsed = 0,
  attempts = 0,
  maxAttempts = MAX_POLLS,
  onRetry,
  onCancel,
}) {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 500)
    return () => clearInterval(id)
  }, [])

  const progress = Math.min(100, (attempts / maxAttempts) * 100)
  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  // Progress ring math
  const R = 22
  const C = 2 * Math.PI * R
  const dash = (progress / 100) * C

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-[#00A651]/25 bg-white shadow-[0_24px_60px_-24px_rgba(0,166,81,0.45)]">
      {/* ---------- Header: Safaricom → M-Pesa ---------- */}
      <div className="relative bg-gradient-to-r from-[#00A651] via-[#009947] to-[#008C44] px-5 py-4">
        {/* subtle diagonal sheen */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              'linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)',
          }}
        />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
              <MpesaLogo className="h-5" />
            </div>
            <div className="h-8 w-px bg-white/30" />
            <div>
              <div className="text-[0.58rem] font-bold uppercase tracking-[0.2em] text-white/75">
                Payment request
              </div>
              <div className="text-[0.82rem] font-bold text-white">
                Sent to your phone
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[0.66rem] font-bold text-white backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-80" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            LIVE
          </div>
        </div>
      </div>

      {/* ---------- Body ---------- */}
      <div className="relative px-6 pb-6 pt-6">
        {/* subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(#00A651 1px, transparent 1px), linear-gradient(90deg, #00A651 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <PhoneWithWaves amount={amount} />

        {/* Status text */}
        <div className="mt-5 text-center">
          <h3 className="font-display text-[1.15rem] font-bold text-navy">
            Check your phone
          </h3>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[0.87rem] leading-relaxed text-ink-soft">
            Enter your M-Pesa PIN on{' '}
            <b className="font-mono text-navy">{phone || 'your phone'}</b> to activate
            the <b className="text-navy">{tier}</b> plan.
          </p>
        </div>

        {/* ---------- Counter card ---------- */}
        <div className="mt-5 rounded-2xl border border-[#00A651]/15 bg-gradient-to-br from-[#F3FBF6] to-[#EAF7EF] p-4">
          <div className="flex items-center gap-4">
            {/* Progress ring */}
            <div className="relative h-14 w-14 flex-none">
              <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r={R}
                  fill="none"
                  stroke="#00A651"
                  strokeOpacity="0.15"
                  strokeWidth="5"
                />
                <circle
                  cx="28"
                  cy="28"
                  r={R}
                  fill="none"
                  stroke="#00A651"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C}`}
                  style={{ transition: 'stroke-dasharray 500ms ease' }}
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <span className="font-mono text-[0.72rem] font-bold text-[#008C44]">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Right side: text + mini progress */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-[0.74rem]">
                <span className="flex items-center gap-1.5 font-semibold text-navy">
                  <Loader2 size={12} className="animate-spin text-[#00A651]" />
                  Waiting for confirmation{dots}
                </span>
                <span className="font-mono text-ink-soft">
                  {minutes}:{String(seconds).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#00A651] to-[#7CF0C0] transition-[width] duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[0.66rem] text-ink-soft">
                <span>
                  Attempt {attempts} of {maxAttempts}
                </span>
                <span className="flex items-center gap-1 font-semibold text-[#008C44]">
                  <ShieldCheck size={10} /> Secure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[#00A651]/[0.06] px-3.5 py-3 text-[0.78rem] leading-relaxed text-navy ring-1 ring-[#00A651]/10">
          <Clock size={14} className="mt-0.5 flex-none text-[#008C44]" />
          <span>
            This page updates automatically. <b>Don't close it.</b> Your chama is
            created the moment M-Pesa confirms your payment.
          </span>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white py-2.5 text-[0.82rem] font-semibold text-navy transition hover:border-red-200 hover:text-red-600"
          >
            <X size={13} strokeWidth={2.4} />
            Cancel
          </button>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#00A651] py-2.5 text-[0.82rem] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,166,81,0.6)] transition hover:bg-[#008C44]"
          >
            <RefreshCw size={13} strokeWidth={2.4} />
            Check again
          </button>
        </div>

        {/* Footer brand strip */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[0.62rem] font-medium text-ink-soft">
          <MpesaLogo className="h-3 opacity-70" />
          <span className="text-ink-soft/70">·</span>
          <span>Secured by Safaricom</span>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes mpesa-wave {
          0%   { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.45); opacity: 0; }
        }
      `}</style>
    </div>
  )
}