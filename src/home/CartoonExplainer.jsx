import { useEffect, useRef, useState } from 'react'
import {
  FiUserPlus,
  FiMessageCircle,
  FiSmartphone,
  FiBarChart2,
} from 'react-icons/fi'

/* ============================================================
   Cartoon character - flat, friendly, uses the Chametu palette
   ============================================================ */

const PALETTES = {
  chairman: {
    skin: '#E8B98A',
    hair: '#3D5A80',
    shirt: '#0B7A5A',
    pants: '#2F5D8A',
    accent: '#F5B942',
  },
  treasurer: {
    skin: '#F4C7A1',
    hair: '#6B4A2B',
    shirt: '#F5B942',
    pants: '#2F5D8A',
    accent: '#0B7A5A',
  },
  secretary: {
    skin: '#B87A4A',
    hair: '#3D5A80',
    shirt: '#10B981',
    pants: '#2F5D8A',
    accent: '#F5B942',
  },
  member: {
    skin: '#F4C7A1',
    hair: '#5B2A18',
    shirt: '#2F5D8A',
    pants: '#0B7A5A',
    accent: '#F5B942',
  },
}

function Character({ variant = 'chairman', size = 200, delay = 0, className = '' }) {
  const c = PALETTES[variant] || PALETTES.chairman
  return (
    <svg
      viewBox="0 0 220 300"
      width={size}
      height={(size * 300) / 220}
      className={`animate-float ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      role="img"
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <ellipse cx="110" cy="288" rx="66" ry="7" fill="rgba(0,0,0,0.09)" />

      {/* Legs */}
      <rect x="78" y="228" width="20" height="52" rx="9" fill={c.pants} />
      <rect x="122" y="228" width="20" height="52" rx="9" fill={c.pants} />

      {/* Shoes */}
      <ellipse cx="88" cy="284" rx="16" ry="7" fill="#3D5A80" />
      <ellipse cx="132" cy="284" rx="16" ry="7" fill="#3D5A80" />

      {/* Body */}
      <path
        d="M70 150 Q70 128 92 128 L128 128 Q150 128 150 150 L150 226 Q150 236 140 236 L80 236 Q70 236 70 226 Z"
        fill={c.shirt}
      />

      {/* Collar accent */}
      <path d="M100 128 L110 140 L120 128" stroke={c.accent} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Arms */}
      <path
        d="M70 156 Q52 168 46 196"
        stroke={c.shirt}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M150 156 Q168 168 174 196"
        stroke={c.shirt}
        strokeWidth="16"
        strokeLinecap="round"
        fill="none"
      />

      {/* Hands */}
      <circle cx="46" cy="200" r="9" fill={c.skin} />
      <circle cx="174" cy="200" r="9" fill={c.skin} />

      {/* Neck */}
      <rect x="100" y="112" width="20" height="22" rx="8" fill={c.skin} />

      {/* Head */}
      <circle cx="110" cy="82" r="46" fill={c.skin} />

      {/* Hair */}
      <path
        d="M64 78 Q66 30 110 30 Q154 30 156 78 Q150 62 110 58 Q70 62 64 78 Z"
        fill={c.hair}
      />

      {/* Eyes */}
      <g>
        <circle cx="94" cy="84" r="4.2" fill="#0B1F33" />
        <circle cx="126" cy="84" r="4.2" fill="#0B1F33" />
        <circle cx="95.5" cy="82.5" r="1.4" fill="#ffffff" />
        <circle cx="127.5" cy="82.5" r="1.4" fill="#ffffff" />
      </g>

      {/* Smile */}
      <path
        d="M96 100 Q110 114 124 100"
        stroke="#0B1F33"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Cheeks */}
      <circle cx="80" cy="98" r="6" fill="rgba(245,185,66,0.32)" />
      <circle cx="140" cy="98" r="6" fill="rgba(245,185,66,0.32)" />
    </svg>
  )
}

/* ============================================================
   Scene props
   ============================================================ */

function PhoneProp({ className = '' }) {
  return (
    <svg viewBox="0 0 90 150" width="72" height="120" className={className} aria-hidden="true">
      <rect x="4" y="4" width="82" height="142" rx="14" fill="#3D5A80" />
      <rect x="9" y="12" width="72" height="126" rx="10" fill="#F3F6F9" />
      <rect x="14" y="20" width="62" height="16" rx="6" fill="#0B7A5A" />
      <rect x="14" y="42" width="42" height="6" rx="3" fill="#0B1F33" opacity="0.55" />
      <rect x="14" y="54" width="58" height="6" rx="3" fill="#0B1F33" opacity="0.3" />
      <rect x="14" y="68" width="62" height="30" rx="8" fill="#10B981" />
      <rect x="18" y="76" width="30" height="5" rx="2.5" fill="#ffffff" />
      <rect x="18" y="86" width="46" height="5" rx="2.5" fill="#ffffff" opacity="0.65" />
      <rect x="14" y="106" width="62" height="24" rx="8" fill="#F5B942" />
      <rect x="18" y="114" width="40" height="5" rx="2.5" fill="#2E2200" />
    </svg>
  )
}

function CoinProp({ className = '' }) {
  return (
    <svg viewBox="0 0 60 60" width="40" height="40" className={className} aria-hidden="true">
      <circle cx="30" cy="30" r="26" fill="#F5B942" />
      <circle cx="30" cy="30" r="20" fill="#F2CE7A" />
      <text
        x="30"
        y="37"
        textAnchor="middle"
        fontSize="18"
        fontFamily="Sora, system-ui"
        fontWeight="700"
        fill="#7A5313"
      >
        KSh
      </text>
    </svg>
  )
}

function ChartProp({ className = '' }) {
  return (
    <svg viewBox="0 0 160 110" width="140" height="96" className={className} aria-hidden="true">
      <rect x="0" y="0" width="160" height="110" rx="10" fill="#16293D" stroke="#3D5A80" strokeWidth="2" />
      <rect x="12" y="14" width="60" height="6" rx="3" fill="#7CF0C0" />
      <rect x="12" y="26" width="40" height="4" rx="2" fill="#ffffff" opacity="0.4" />
      <rect x="14" y="60" width="14" height="34" rx="3" fill="#10B981" />
      <rect x="34" y="48" width="14" height="46" rx="3" fill="#0B7A5A" />
      <rect x="54" y="38" width="14" height="56" rx="3" fill="#F5B942" />
      <rect x="74" y="54" width="14" height="40" rx="3" fill="#10B981" />
      <rect x="94" y="30" width="14" height="64" rx="3" fill="#0B7A5A" />
      <rect x="114" y="44" width="14" height="50" rx="3" fill="#F5B942" />
      <path
        d="M20 66 L40 54 L60 44 L80 58 L100 36 L122 50"
        stroke="#7CF0C0"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="20" cy="66" r="3" fill="#7CF0C0" />
      <circle cx="40" cy="54" r="3" fill="#7CF0C0" />
      <circle cx="60" cy="44" r="3" fill="#7CF0C0" />
      <circle cx="80" cy="58" r="3" fill="#7CF0C0" />
      <circle cx="100" cy="36" r="3" fill="#7CF0C0" />
      <circle cx="122" cy="50" r="3" fill="#7CF0C0" />
    </svg>
  )
}

function InviteProp({ className = '' }) {
  return (
    <svg viewBox="0 0 140 110" width="120" height="94" className={className} aria-hidden="true">
      <rect x="4" y="14" width="132" height="88" rx="10" fill="#F3F6F9" stroke="#0B7A5A" strokeWidth="2" />
      <path d="M4 22 L70 66 L136 22" stroke="#0B7A5A" strokeWidth="2" fill="none" />
      <circle cx="30" cy="70" r="10" fill="#0B7A5A" />
      <circle cx="56" cy="70" r="10" fill="#10B981" />
      <circle cx="82" cy="70" r="10" fill="#F5B942" />
      <circle cx="108" cy="70" r="10" fill="#3D5A80" />
    </svg>
  )
}

/* ============================================================
   Speech bubble
   ============================================================ */

const BUBBLE_TONES = {
  forest: 'bg-[#0B7A5A] text-white border-[#0B7A5A]',
  gold: 'bg-[#F5B942] text-[#2E2200] border-[#F5B942]',
  light: '!bg-[#EEF3F7] !text-[#0B1F33] !border-[#EEF3F7]',
}

function SpeechBubble({ text, tone = 'light', side = 'left', delay = 0 }) {
  const cls = BUBBLE_TONES[tone] || BUBBLE_TONES.light
  return (
    <div
      className={`relative max-w-full rounded-2xl border-2 px-3.5 py-2.5 text-[0.82rem] font-medium leading-snug shadow-[0_14px_28px_rgba(11,31,51,0.12)] animate-bubble-in sm:max-w-[280px] sm:px-4 sm:py-3 sm:text-[0.85rem] ${
        side === 'left' ? 'bubble-tail-left' : 'bubble-tail-right'
      } ${cls}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {text}
    </div>
  )
}

/* ============================================================
   Steps
   ============================================================ */

const STEPS = [
  {
    id: 'register',
    label: 'Register',
    icon: FiUserPlus,
    title: 'Create your chama in minutes',
    subtitle: 'Pick a plan, name your chama and set your contribution rules. No paperwork.',
    bubble: 'Let me set up our new chama in Chametu. It takes two minutes.',
    bubbleTone: 'forest',
    scene: 'register',
  },
  {
    id: 'invite',
    label: 'Invite members',
    icon: FiMessageCircle,
    title: 'Bring in your officials and members',
    subtitle: 'Invite by phone or email. Each person lands straight on the right role.',
    bubble: 'I will invite Brian as treasurer and Kevin as secretary using their phone numbers.',
    bubbleTone: 'gold',
    scene: 'invite',
  },
  {
    id: 'contribute',
    label: 'Contribute',
    icon: FiSmartphone,
    title: 'Members pay via M-Pesa',
    subtitle: 'Paybill and STK payments match to the right member automatically. No spreadsheets.',
    bubble: 'Every member pays via M-Pesa. The system matches each payment to the right person.',
    bubbleTone: 'forest',
    scene: 'contribute',
  },
  {
    id: 'grow',
    label: 'Track and grow',
    icon: FiBarChart2,
    title: 'One ledger for everything',
    subtitle: 'Loans, investments, meetings and reports. Every shilling, accounted for.',
    bubble: 'Now I can see every shilling, approve loans and track our investments in one place.',
    bubbleTone: 'light',
    scene: 'grow',
  },
]

/* ============================================================
   Scenes
   ============================================================ */

function SceneRegister() {
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-2 sm:gap-3">
      <Character variant="chairman" size={150} delay={0} className="max-h-full" />
      <div className="mb-10 hidden animate-float sm:mb-12 sm:block" style={{ animationDelay: '600ms' }}>
        <ChartProp />
      </div>
    </div>
  )
}

function SceneInvite() {
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-1.5 sm:gap-2">
      <Character variant="chairman" size={130} delay={0} className="max-h-full" />
      <div className="mb-6 hidden sm:mb-8 sm:block">
        <InviteProp className="animate-float" />
      </div>
      <Character variant="treasurer" size={115} delay={300} className="hidden max-h-full sm:block" />
      <Character variant="secretary" size={115} delay={550} className="hidden max-h-full md:block" />
    </div>
  )
}

function SceneContribute() {
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-2 sm:gap-3">
      <Character variant="member" size={125} delay={0} className="max-h-full" />
      <div className="mb-6 flex flex-col items-center gap-2 sm:mb-8">
        <CoinProp className="animate-float" />
        <PhoneProp className="animate-float" />
      </div>
      <Character variant="treasurer" size={125} delay={350} className="hidden max-h-full sm:block" />
    </div>
  )
}

function SceneGrow() {
  return (
    <div className="relative flex h-full w-full items-end justify-center gap-2 sm:gap-4">
      <Character variant="treasurer" size={150} delay={0} className="max-h-full" />
      <div className="mb-4 sm:mb-6">
        <ChartProp />
      </div>
    </div>
  )
}

const SCENES = {
  register: SceneRegister,
  invite: SceneInvite,
  contribute: SceneContribute,
  grow: SceneGrow,
}

/* ============================================================
   Main section
   ============================================================ */

export default function CartoonExplainer() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (paused) return
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % STEPS.length)
    }, 5500)
    return () => clearInterval(timer.current)
  }, [paused])

  const jump = (i) => {
    setActive(i)
    setPaused(true)
    setTimeout(() => setPaused(false), 60)
  }

  const step = STEPS[active]
  const Scene = SCENES[step.scene]
  const Icon = step.icon

  return (
    <section
      id="cartoon"
      className="relative overflow-hidden py-16 sm:py-20 md:py-24"
    >
      {/* Soft themed wash */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(700px 400px at 15% 10%, rgba(16,185,129,0.10), transparent 60%), radial-gradient(700px 400px at 90% 90%, rgba(245,185,66,0.10), transparent 60%)',
        }}
      />

      <div className="wrap">
        {/* Heading */}
        <div className="mx-auto max-w-[60ch] text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-[0.76rem] font-semibold text-forest sm:text-[0.8rem]">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            How Chametu works
          </div>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4.6vw,2.6rem)] font-bold leading-tight tracking-tight text-navy">
            Watch your chama come to life
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-[0.94rem] sm:text-[0.96rem]">
            Meet your chairman, treasurer, secretary and members. Every step of Chametu, explained in their own words.
          </p>
        </div>

        {/* Timeline tabs */}
        <div className="mx-auto mt-8 grid max-w-[920px] grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-4 sm:gap-3">
          {STEPS.map((s, i) => {
            const TabIcon = s.icon
            const isActive = i === active
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => jump(i)}
                aria-pressed={isActive}
                className={`group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-3 text-left transition-all sm:flex-row sm:items-center sm:gap-3 sm:p-3.5 ${
                  isActive
                    ? 'border-forest bg-card shadow-[0_14px_30px_rgba(11,122,90,0.14)]'
                    : 'border-line bg-card/60 hover:border-forest/40 hover:bg-card'
                }`}
              >
                <span
                  className={`grid h-8 w-8 flex-none place-items-center rounded-xl transition sm:h-9 sm:w-9 ${
                    isActive
                      ? 'bg-gradient-to-br from-forest to-emerald text-white shadow-[0_8px_18px_rgba(11,122,90,0.3)]'
                      : 'bg-paper text-ink-soft'
                  }`}
                >
                  <TabIcon size={15} strokeWidth={2.4} />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[0.66rem] font-semibold sm:text-[0.7rem] ${
                      isActive ? 'text-forest' : 'text-ink-soft'
                    }`}
                  >
                    Step {i + 1}
                  </span>
                  <span
                    className={`block truncate text-[0.82rem] font-semibold sm:text-[0.84rem] ${
                      isActive ? 'text-navy' : 'text-ink-soft group-hover:text-navy'
                    }`}
                  >
                    {s.label}
                  </span>
                </span>
                {isActive && (
                  <span className="absolute inset-x-3 -bottom-[3px] h-1 rounded-full bg-forest" />
                )}
              </button>
            )
          })}
        </div>

        {/* Stage */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative mx-auto mt-6 max-w-[920px] overflow-hidden rounded-3xl border border-line bg-card shadow-[0_30px_70px_-34px_rgba(11,31,51,0.35)]"
        >
          {/* Stage grid pattern */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(11,31,51,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(11,31,51,0.4) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          {/* Progress bar */}
          <div className="relative h-1 w-full bg-line">
            <div
              className="h-full bg-gradient-to-r from-forest to-emerald transition-[width] duration-300"
              style={{ width: `${((active + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          <div className="relative grid gap-5 p-4 sm:gap-6 sm:p-6 md:grid-cols-[1fr_auto] md:items-center md:gap-8 md:p-8">
            {/* Left: text */}
            <div className="order-2 min-w-0 md:order-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-forest/10 px-3 py-1.5 text-[0.72rem] font-semibold text-forest sm:text-[0.78rem]">
                <Icon size={11} strokeWidth={2.4} />
                Step {active + 1} of {STEPS.length}
              </div>
              <h3 className="mt-3 text-[1.2rem] font-bold leading-tight text-navy sm:text-[1.35rem] md:text-[1.55rem]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[46ch] text-[0.9rem] leading-relaxed sm:text-[0.92rem]">
                {step.subtitle}
              </p>

              <div className="mt-5 hidden sm:block">
                <SpeechBubble
                  key={step.id}
                  text={step.bubble}
                  tone={step.bubbleTone}
                  side="left"
                  delay={150}
                />
              </div>
            </div>

            {/* Right: scene */}
            <div className="relative order-1 h-[220px] min-[420px]:h-[250px] sm:h-[300px] md:order-2 md:h-[360px] md:w-[400px]">
              <div className="absolute inset-0 grid place-items-center">
                <Scene key={step.id} />
              </div>
            </div>

            {/* Mobile bubble */}
            <div className="order-3 sm:hidden">
              <SpeechBubble text={step.bubble} tone={step.bubbleTone} side="left" delay={150} />
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[0.74rem] text-ink-soft sm:text-[0.78rem]">
          {paused ? 'Paused while you explore' : 'Auto-playing. Click a step to jump ahead.'}
        </p>
      </div>
    </section>
  )
}