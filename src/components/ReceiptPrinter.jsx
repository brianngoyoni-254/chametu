// src/components/ReceiptPrinter.jsx
import {
  createContext, useContext, useMemo,
} from 'react'
import {
  CheckCircle2, Loader2,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */
const ReceiptPrinterContext = createContext(null)

function useReceiptPrinter(component) {
  const ctx = useContext(ReceiptPrinterContext)
  if (!ctx) throw new Error(`${component} must be used inside <ReceiptPrinter.Root>.`)
  return ctx
}

/* ------------------------------------------------------------------ */
/*  Chametu palette helpers                                           */
/* ------------------------------------------------------------------ */
const CHAMETU = {
  navy:    '#0B1F33',
  navy2:   '#0A3D46',
  forest:  '#0B7A5A',
  emerald: '#10B981',
  gold:    '#F5B942',
  paper:   '#FBF8F1',
  paperLine: 'rgba(11,31,51,0.10)',
  ink:     '#0B1F33',
  inkSoft: '#3B5063',
}

const RECEIPT_TOOTH_COUNT = 40
const RECEIPT_TOOTH_DEPTH = 4

/* Build a jagged bottom edge as a CSS polygon */
const receiptClipPath = (() => {
  const points = Array.from(
    { length: RECEIPT_TOOTH_COUNT * 2 },
    (_, index) => {
      const x = 100 - ((index + 1) * 100) / (RECEIPT_TOOTH_COUNT * 2)
      const y = index % 2 === 0 ? '100%' : `calc(100% - ${RECEIPT_TOOTH_DEPTH}px)`
      return `${x}% ${y}`
    },
  ).join(', ')
  return `polygon(0 0, 100% 0, 100% calc(100% - ${RECEIPT_TOOTH_DEPTH}px), ${points})`
})()

/* Stepped feed keyframes */
const PRINTING_KEYFRAMES = [
  'translateY(calc(-100% + 2px))',
  'translateY(-91%)', 'translateY(-91%)',
  'translateY(-81%)', 'translateY(-81%)',
  'translateY(-70%)', 'translateY(-70%)',
  'translateY(-58%)', 'translateY(-58%)',
  'translateY(-45%)', 'translateY(-45%)',
  'translateY(-32%)', 'translateY(-32%)',
  'translateY(-20%)', 'translateY(-20%)',
  'translateY(-10%)', 'translateY(-10%)',
  'translateY(-3%)',  'translateY(-3%)',
  'translateY(0%)',
]
const PRINTING_TIMES = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
  0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
]

/* ------------------------------------------------------------------ */
/*  Root                                                              */
/* ------------------------------------------------------------------ */
function Root({
  stage = 'processing',
  animate = true,
  feedMotion = 'stepped',
  className = '',
  children,
  ...rest
}) {
  const ctx = useMemo(
    () => ({ stage, animate, feedMotion }),
    [stage, animate, feedMotion],
  )
  return (
    <ReceiptPrinterContext.Provider value={ctx}>
      <section
        aria-label="Receipt printer"
        data-stage={stage}
        className={`relative flex w-full max-w-sm flex-col items-center ${className}`}
        {...rest}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  )
}

/* ------------------------------------------------------------------ */
/*  Machine                                                           */
/* ------------------------------------------------------------------ */
function Machine({ className = '', children, ...rest }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[24px] border border-[#0B1F33]/40 p-3 pb-8 shadow-[0_20px_36px_-20px_rgba(11,31,51,0.55),0_6px_14px_-8px_rgba(11,31,51,0.24),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(11,31,51,0.55)] ${className}`}
      style={{
        background:
          'linear-gradient(160deg, #0B1F33 0%, #0A2A3E 55%, #08222A 100%)',
      }}
      {...rest}
    >
      {children}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-3 h-2 rounded border border-black/60 bg-black shadow-inner"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background:
            'linear-gradient(160deg, rgba(255,255,255,0.10), transparent 40%, rgba(0,0,0,0.15))',
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Header                                                            */
/* ------------------------------------------------------------------ */
function Header({ className = '', children, ...rest }) {
  return (
    <div
      className={`relative z-10 flex h-11 items-start justify-between ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Screen                                                            */
/* ------------------------------------------------------------------ */
function Screen({ className = '', children, ...rest }) {
  return (
    <div
      className={`relative z-10 overflow-hidden rounded-xl border border-black/50 bg-[#041720] p-4 text-emerald-100 shadow-inner shadow-black/70 ${className}`}
      {...rest}
    >
      <div className="relative z-10">{children}</div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 3px)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 shadow-[inset_0_0_24px_4px_rgba(0,0,0,0.5)]"
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Status                                                            */
/* ------------------------------------------------------------------ */
const STATUS_LABELS = {
  processing: 'Processing your order',
  printing:   'Printing your receipt',
  complete:   'Receipt ready',
}

function Status({ className = '', children, ...rest }) {
  const { stage } = useReceiptPrinter('ReceiptPrinter.Status')
  const isComplete = stage === 'complete'
  const label = children ?? STATUS_LABELS[stage] ?? ''

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${className}`}
      {...rest}
    >
      <span
        aria-hidden="true"
        className="relative grid h-5 w-5 shrink-0 place-items-center"
      >
        {isComplete ? (
          <CheckCircle2
            size={18}
            strokeWidth={2.4}
            className="text-emerald-400 transition-transform duration-150"
          />
        ) : (
          <Loader2
            size={18}
            strokeWidth={2.4}
            className="animate-spin text-emerald-200 motion-reduce:animate-none"
          />
        )}
      </span>
      <div
        aria-live="polite"
        role="status"
        className="min-w-0 flex-1 truncate text-[0.72rem] font-medium leading-none text-emerald-100/90"
      >
        {label}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Paper                                                             */
/* ------------------------------------------------------------------ */
function Paper({ className = '', style, children, ...rest }) {
  return (
    <article
      className={`relative z-10 min-h-[20rem] px-6 pb-8 pt-7 font-mono text-[#0B1F33] ${className}`}
      style={{
        clipPath: receiptClipPath,
        background: CHAMETU.paper,
        backgroundImage:
          'radial-gradient(circle at 20% 10%, rgba(11,31,51,0.035), transparent 40%), radial-gradient(circle at 90% 90%, rgba(245,185,66,0.08), transparent 45%)',
        ...style,
      }}
      {...rest}
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-4 top-3 flex justify-between opacity-40"
      >
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className="h-[2px] w-[3px] rounded-full bg-[#0B1F33]/40" />
        ))}
      </div>
      {children}
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Output                                                            */
/* ------------------------------------------------------------------ */
function Output({ className = '', children, ...rest }) {
  const { stage, feedMotion } = useReceiptPrinter('ReceiptPrinter.Output')
  const isVisible = stage !== 'processing'
  const stepped = feedMotion === 'stepped' && stage === 'printing'

  const transitionStyle = {
    transitionProperty: 'transform, opacity',
    transitionDuration: stepped ? '1.75s, 0.16s' : '0.6s, 0.16s',
    transitionTimingFunction: stepped ? 'linear, ease-out' : 'cubic-bezier(0.23,1,0.32,1), ease-out',
  }

  const transform = stepped
    ? 'translateY(0%)'
    : isVisible
      ? 'translateY(0%)'
      : 'translateY(calc(-100% + 2px))'

  return (
    <div
      className={`relative z-20 -mt-4 h-[34rem] w-[calc(85%+3rem)] max-w-full overflow-hidden px-6 ${className}`}
      {...rest}
    >
      {isVisible && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 -top-1 z-20 h-2 bg-black/30 blur-[6px]"
        />
      )}

      <div
        className="relative"
        style={{
          transform,
          opacity: isVisible ? 1 : 0,
          ...transitionStyle,
        }}
        data-stepped={stepped ? 'true' : 'false'}
      >
        {stepped && (
          <style>{`
            @keyframes chametu-receipt-feed {
              ${PRINTING_KEYFRAMES.map((k, i) => `${(PRINTING_TIMES[i] * 100).toFixed(2)}% { transform: ${k}; }`).join('\n')}
            }
          `}</style>
        )}
        <div
          className={stepped ? 'chametu-receipt-feed' : ''}
          style={
            stepped
              ? {
                  animation:
                    'chametu-receipt-feed 1.75s linear forwards',
                }
              : undefined
          }
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */
export const ReceiptPrinter = {
  Root,
  Machine,
  Header,
  Screen,
  Status,
  Paper,
  Output,
}