import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiPlayCircle, FiChevronDown } from 'react-icons/fi'

/* ================================================================
   PALETTE
================================================================ */
const P = {
  skin: '#E8B98A',
  skinShade: '#D29B6B',
  hair: '#0B1F33',
  shirt: '#0B7A5A',
  shirtFar: '#096149',
  shirtAccent: '#F5B942',
  pants: '#0B1F33',
  pantsFar: '#1C3852',
  shoe: '#071410',
  shoeFar: '#17332B',
}

const TELLER = {
  skin: '#F4C7A1',
  hair: '#3A2A18',
  shirt: '#0B1F33',
  shirtAccent: '#F5B942',
}

/* ================================================================
   TIMELINE
================================================================ */
const PHASE_DURATIONS = {
  'walk-in': 4800,
  arrive: 1500,
  interior: 6500,
  exit: 900,
  'walk-out': 4200,
  reset: 150,
}

const PHASE_ORDER = ['walk-in', 'arrive', 'interior', 'exit', 'walk-out', 'reset']

function formatKsh(n) {
  return 'KSh ' + Math.round(n).toLocaleString('en-KE')
}

/* ================================================================
   CHARACTER BODY
   Side-on view, always facing right (the direction he walks and the
   direction of the bank door / teller). Origin box is 0..220 x 0..300,
   hips at y=216, shoulder at (112,152).
================================================================ */
function CharacterBody({
  walking = false,
  celebrating = false,
  holding = false,
  offering = false,
}) {
  const cycle = '0.7s ease-in-out infinite'

  const nearArm = {
    animation: offering
      ? 'armOffer 1500ms cubic-bezier(0.4, 0, 0.2, 1) 300ms both'
      : walking && !holding
        ? `armNear ${cycle}`
        : 'none',
    transform: holding ? 'rotate(-62deg)' : undefined,
    transformOrigin: '112px 152px',
    transition: 'transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  return (
    <g>
      <ellipse cx="112" cy="292" rx="52" ry="7" fill="#000000" opacity="0.22" />

      {/* FAR LEG */}
      <g
        style={{
          animation: walking ? `legFar ${cycle}` : 'none',
          transformOrigin: '110px 216px',
        }}
      >
        <rect x="102" y="214" width="19" height="66" rx="9" fill={P.pantsFar} />
        <path
          d="M100 277 H122 Q138 277 141 287 Q141 292 135 292 H103 Q99 292 99 286 Z"
          fill={P.shoeFar}
        />
      </g>

      {/* NEAR LEG */}
      <g
        style={{
          animation: walking ? `legNear ${cycle}` : 'none',
          transformOrigin: '110px 216px',
        }}
      >
        <rect x="100" y="214" width="20" height="66" rx="9" fill={P.pants} />
        <path
          d="M98 277 H121 Q138 277 141 287 Q141 292 135 292 H101 Q97 292 97 286 Z"
          fill={P.shoe}
        />
      </g>

      {/* UPPER BODY (leans slightly into the walk) */}
      <g transform={walking ? 'rotate(4 112 224)' : undefined}>
        {/* Torso */}
        <path
          d="M88 148 Q88 128 108 128 L120 128 Q138 128 138 148 L138 210 Q138 224 126 224 L100 224 Q88 224 88 210 Z"
          fill={P.shirt}
        />
        <path d="M88 214 H138" stroke={P.shirtAccent} strokeWidth="3" opacity="0.9" />

        {/* Far arm */}
        <g
          style={{
            animation: walking ? `armFar ${cycle}` : 'none',
            transformOrigin: '112px 152px',
          }}
        >
          <path
            d="M112 156 Q116 178 113 196"
            stroke={P.shirtFar}
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="113" cy="204" r="8.5" fill={P.skinShade} />
        </g>

        {/* Neck + collar */}
        <rect x="106" y="112" width="18" height="24" rx="7" fill={P.skin} />
        <path
          d="M106 128 L116 141 L128 128"
          stroke={P.shirtAccent}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Head: profile, nose and eye to the right */}
        <circle cx="116" cy="80" r="40" fill={P.skin} />
        <path d="M153 82 Q166 91 154 98 Z" fill={P.skin} />
        <circle cx="103" cy="88" r="7" fill={P.skinShade} />
        <path
          d="M75 84 Q70 34 118 36 Q153 38 156 70 Q142 54 116 57 Q97 58 93 76 Q91 92 84 98 Q75 96 75 84 Z"
          fill={P.hair}
        />
        <ellipse cx="135" cy="81" rx="4" ry="4.6" fill="#0B1F33" />
        <circle cx="136.2" cy="79.4" r="1.4" fill="#FFFFFF" />
        <path
          d="M127 70 Q135 65 143 69"
          stroke={P.hair}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={celebrating ? 'M131 100 Q145 116 153 99' : 'M133 102 Q145 109 152 101'}
          stroke="#0B1F33"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="125" cy="95" r="6" fill="rgba(245,185,66,0.4)" />

        {/* Near arm */}
        <g style={nearArm}>
          <path
            d="M112 156 Q116 178 113 196"
            stroke={P.shirt}
            strokeWidth="15"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="113" cy="204" r="8.5" fill={P.skin} />
        </g>
      </g>

      {/* COIN IN HAND (carried out in front while walking in) */}
      {holding && (
        <g>
          <circle cx="170" cy="172" r="10" fill="#F5B942" stroke="#E8A21F" strokeWidth="1.4" />
          <text
            x="170"
            y="175.5"
            textAnchor="middle"
            fontFamily="Sora, system-ui"
            fontSize="9"
            fontWeight="800"
            fill="#7A5313"
          >
            K
          </text>
        </g>
      )}
    </g>
  )
}

/* ================================================================
   TELLER (behind glass, right side of counter)
================================================================ */
function TellerBody({ mode = 'idle' }) {
  // mode: 'idle' | 'reaching' | 'counting' | 'handoff'
  const reaching = mode === 'reaching' || mode === 'counting' || mode === 'handoff'
  const counting = mode === 'counting'
  const handoff = mode === 'handoff'

  return (
    <g>
      <path d="M30 90 Q30 60 65 60 L115 60 Q150 60 150 90 L150 220 L30 220 Z" fill={TELLER.shirt} />
      <path
        d="M75 60 L90 78 L105 60"
        stroke={TELLER.shirtAccent}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <rect x="80" y="42" width="20" height="22" rx="8" fill={TELLER.skin} />
      <circle cx="90" cy="14" r="40" fill={TELLER.skin} />
      <path
        d="M50 10 Q52 -32 90 -32 Q128 -32 130 10 Q124 -4 90 -8 Q56 -4 50 10 Z"
        fill={TELLER.hair}
      />
      <circle cx="76" cy="16" r="3.6" fill="#0B1F33" />
      <circle cx="104" cy="16" r="3.6" fill="#0B1F33" />
      <circle cx="77" cy="14.5" r="1.2" fill="#FFFFFF" />
      <circle cx="105" cy="14.5" r="1.2" fill="#FFFFFF" />
      <path
        d={handoff ? 'M78 26 Q90 40 102 26' : 'M78 30 Q90 42 102 30'}
        stroke="#0B1F33"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="64" cy="28" r="5" fill="rgba(245,185,66,0.32)" />
      <circle cx="116" cy="28" r="5" fill="rgba(245,185,66,0.32)" />

      {/* Badge */}
      <rect x="72" y="100" width="36" height="14" rx="3" fill="#F5B942" />
      <text
        x="90"
        y="111"
        textAnchor="middle"
        fontFamily="Sora, system-ui"
        fontSize="7"
        fontWeight="800"
        fill="#3A2A08"
        letterSpacing="1"
      >
        TELLER
      </text>

      {/* Reaching arm */}
      {reaching && (
        <g
          style={{
            animation: counting
              ? 'tellerCollect 700ms cubic-bezier(0.4, 0, 0.2, 1) both'
              : handoff
                ? 'tellerHandoff 600ms cubic-bezier(0.4, 0, 0.2, 1) both'
                : 'tellerReach 500ms cubic-bezier(0.4, 0, 0.2, 1) both',
            transformBox: 'fill-box',
            transformOrigin: '100% 50%',
          }}
          transform="translate(30, 140)"
        >
          <path
            d="M0 0 Q-30 10 -55 30"
            stroke={TELLER.shirt}
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="-58" cy="32" r="10" fill={TELLER.skin} />
        </g>
      )}
    </g>
  )
}

/* ================================================================
   MAIN
================================================================ */
export default function HeroCartoon() {
  const [phase, setPhase] = useState('walk-in')
  const [saved, setSaved] = useState(1250000)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase((p) => PHASE_ORDER[(PHASE_ORDER.indexOf(p) + 1) % PHASE_ORDER.length])
    }, PHASE_DURATIONS[phase])
    return () => clearTimeout(t)
  }, [phase])

  // Bump savings at the register-closes moment (~2.6s into interior)
  useEffect(() => {
    if (phase !== 'interior') return
    const t = setTimeout(() => setSaved((s) => s + 5000), 3200)
    return () => clearTimeout(t)
  }, [phase])

  // Phase helpers
  const inExterior = phase === 'walk-in' || phase === 'arrive' || phase === 'walk-out' || phase === 'reset'
  const inInterior = phase === 'interior'
  const walking = phase === 'walk-in' || phase === 'walk-out'
  const celebrating = inInterior || phase === 'walk-out'
  const holdingCoin = phase === 'walk-in'
  const doorOpen = phase === 'arrive' || phase === 'interior' || phase === 'exit'

  // Interior stage sub-timings
  const stage = (() => {
    if (!inInterior) return 'idle'
    return 'sequence'
  })()

  // Character class for the exterior animation
  const extCharClass =
    phase === 'walk-in'
      ? 'ext-walk-in'
      : phase === 'walk-out'
        ? 'ext-walk-out'
        : phase === 'reset'
          ? 'ext-reset'
          : 'ext-at-door'

  // Teller mode based on interior sub-timing (driven by CSS animation delays)
  const tellerMode = inInterior ? 'sequence' : 'idle'

  // Hero text visible whenever we are NOT inside the bank
  const textVisible = !inInterior

  const scrollNext = () => {
    const next =
      document.getElementById('cartoon') ||
      document.getElementById('trust-bar') ||
      document.getElementById('features')
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-navy">
      <style>{`
        /* ---------- Walking ---------- */
        @keyframes walkIn {
          from { transform: translateX(-320px); }
          to   { transform: translateX(1000px); }
        }
        @keyframes walkOut {
          from { transform: translateX(1000px); }
          to   { transform: translateX(2200px); }
        }
        @keyframes legNear {
          0%, 100% { transform: rotate(-24deg); }
          50%      { transform: rotate(24deg); }
        }
        @keyframes legFar {
          0%, 100% { transform: rotate(24deg); }
          50%      { transform: rotate(-24deg); }
        }
        @keyframes armNear {
          0%, 100% { transform: rotate(26deg); }
          50%      { transform: rotate(-26deg); }
        }
        @keyframes armFar {
          0%, 100% { transform: rotate(-26deg); }
          50%      { transform: rotate(26deg); }
        }
        @keyframes armOffer {
          0%   { transform: rotate(-14deg); }
          40%  { transform: rotate(-78deg); }
          60%  { transform: rotate(-78deg); }
          100% { transform: rotate(-14deg); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1.5px); }
        }
        @keyframes bobStep {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-4px); }
        }

        .ext-walk-in  { animation: walkIn  4.8s linear forwards; }
        .ext-walk-out { animation: walkOut 4.2s linear forwards; }
        .ext-at-door  { transform: translateX(1000px); }
        .ext-reset    { transform: translateX(-320px); opacity: 0; }

        /* ---------- Exterior ambience ---------- */
        @keyframes cloudDriftSlow {
          0%   { transform: translateX(-520px); }
          100% { transform: translateX(2100px); }
        }
        @keyframes cloudDriftMed {
          0%   { transform: translateX(-640px); }
          100% { transform: translateX(2100px); }
        }
        @keyframes sunPulse {
          0%, 100% { transform: scale(1); opacity: 0.95; }
          50%      { transform: scale(1.06); opacity: 1; }
        }
        @keyframes pigIdle {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        @keyframes pigCelebrate {
          0%   { transform: scale(1) rotate(0deg); }
          20%  { transform: scale(1.25) rotate(-8deg); }
          40%  { transform: scale(1.15) rotate(8deg); }
          60%  { transform: scale(1.22) rotate(-5deg); }
          80%  { transform: scale(1.1) rotate(3deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        /* ---------- Interior: cinematic deposit ---------- */
        /* Character hand lifts with cash */
        @keyframes cashLift {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(34px, -36px); }
        }
        @keyframes cashHide {
          to { opacity: 0; }
        }
        /* Cash bundle travels across the counter */
        @keyframes cashAcross {
          0%   { transform: translate(0, 0); opacity: 1; }
          100% { transform: translate(360px, 0); opacity: 1; }
        }
        /* Teller leans forward */
        @keyframes tellerReach {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(-58px, -10px); }
        }
        @keyframes tellerCollect {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(-58px, -10px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes tellerHandoff {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(-58px, -10px); }
          100% { transform: translate(0, 0); }
        }
        /* Cash fades as teller collects */
        @keyframes cashCollect {
          0%   { transform: translate(360px, 0) scale(1); opacity: 1; }
          100% { transform: translate(410px, -6px) scale(0.55); opacity: 0; }
        }
        /* Register drawer pops open and closes */
        @keyframes drawerOpen {
          0%   { transform: translateY(0); }
          45%  { transform: translateY(22px); }
          55%  { transform: translateY(22px); }
          100% { transform: translateY(0); }
        }
        /* Receipt slides back to character */
        @keyframes receiptBack {
          0%   { transform: translate(360px, 0) scale(0.9); opacity: 0; }
          10%  { transform: translate(360px, 0) scale(0.9); opacity: 1; }
          100% { transform: translate(0, 0) scale(1); opacity: 1; }
        }

        /* Timeline anchoring for the interior sequence */
        .t-hand-lift  { animation: cashLift 600ms cubic-bezier(0.4, 0, 0.2, 1) 300ms both, cashHide 120ms linear 880ms forwards; }
        .t-cash-a     { animation: cashAcross 900ms cubic-bezier(0.35, 0, 0.2, 1) 900ms both; }
        .t-teller-a   { animation: tellerReach 500ms cubic-bezier(0.4, 0, 0.2, 1) 1800ms both; }
        .t-cash-b     { animation: cashCollect 700ms cubic-bezier(0.4, 0, 0.2, 1) 2300ms both; }
        .t-teller-b   { animation: tellerCollect 700ms cubic-bezier(0.4, 0, 0.2, 1) 2300ms both; }
        .t-drawer     { animation: drawerOpen 1100ms cubic-bezier(0.4, 0, 0.2, 1) 3100ms both; }
        .t-teller-c   { animation: tellerHandoff 500ms cubic-bezier(0.4, 0, 0.2, 1) 4300ms both; }
        .t-receipt    { animation: receiptBack 900ms cubic-bezier(0.35, 0, 0.2, 1) 4700ms both; }

        /* ---------- Ambient interior ---------- */
        @keyframes clockTick {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 1; }
        }
        @keyframes sparklePop {
          0%   { transform: scale(0) rotate(0deg); opacity: 0; }
          40%  { transform: scale(1.2) rotate(45deg); opacity: 1; }
          100% { transform: scale(0.4) rotate(90deg); opacity: 0; }
        }
        @keyframes bubblePop {
          0%   { transform: translateY(6px) scale(0.9); opacity: 0; }
          60%  { transform: translateY(-2px) scale(1.03); opacity: 1; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes cameraPushIn {
          0%   { transform: scale(1); }
          100% { transform: scale(1.04); }
        }

        .int-cam { animation: cameraPushIn 6.5s cubic-bezier(0.4, 0, 0.2, 1) both; }

        @media (prefers-reduced-motion: reduce) {
          .hero-cartoon * { animation: none !important; }
        }
      `}</style>

      {/* ==========================================================
          EXTERIOR
      ========================================================== */}
      <div
        className={`hero-cartoon absolute inset-0 transition-opacity duration-500 ${
          inExterior ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="extSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0E3B3F" />
              <stop offset="0.5" stopColor="#1E8A73" />
              <stop offset="1" stopColor="#F6D79C" />
            </linearGradient>
            <radialGradient id="extSunGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FFF6D2" stopOpacity="1" />
              <stop offset="0.55" stopColor="#F5B942" stopOpacity="0.4" />
              <stop offset="1" stopColor="#F5B942" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="extGrass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0F9A70" />
              <stop offset="1" stopColor="#03362A" />
            </linearGradient>
            <linearGradient id="extBankWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FCF8EA" />
              <stop offset="1" stopColor="#E6DDBF" />
            </linearGradient>
            <linearGradient id="extBankRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0E8E68" />
              <stop offset="1" stopColor="#065C42" />
            </linearGradient>
            <linearGradient id="extPath" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#D4C4A0" stopOpacity="0.7" />
              <stop offset="0.5" stopColor="#EDE0C2" stopOpacity="0.9" />
              <stop offset="1" stopColor="#D4C4A0" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          <rect width="1600" height="900" fill="url(#extSky)" />

          {/* Sun */}
          <g transform="translate(1290, 195)">
            <g
              style={{
                animation: 'sunPulse 5s ease-in-out infinite',
                transformBox: 'fill-box',
                transformOrigin: 'center',
              }}
            >
              <circle cx="0" cy="0" r="160" fill="url(#extSunGlow)" />
              <circle cx="0" cy="0" r="70" fill="#F5B942" />
              <circle cx="0" cy="0" r="56" fill="#FFD87A" />
            </g>
          </g>

          {/* Clouds */}
          <g style={{ animation: 'cloudDriftSlow 115s linear infinite' }}>
            <g transform="translate(210, 165)">
              <ellipse cx="0" cy="0" rx="82" ry="30" fill="#FFFFFF" opacity="0.14" />
              <ellipse cx="-52" cy="8" rx="56" ry="24" fill="#FFFFFF" opacity="0.14" />
              <ellipse cx="56" cy="6" rx="62" ry="26" fill="#FFFFFF" opacity="0.14" />
            </g>
          </g>
          <g style={{ animation: 'cloudDriftMed 78s linear infinite', animationDelay: '-22s' }}>
            <g transform="translate(1120, 240)">
              <ellipse cx="0" cy="0" rx="102" ry="36" fill="#FFFFFF" opacity="0.18" />
              <ellipse cx="-62" cy="10" rx="72" ry="28" fill="#FFFFFF" opacity="0.18" />
              <ellipse cx="72" cy="8" rx="76" ry="30" fill="#FFFFFF" opacity="0.18" />
            </g>
          </g>

          {/* Hills */}
          <path
            d="M0 720 Q220 640 480 690 Q720 740 980 670 Q1220 600 1450 650 L1600 630 L1600 900 L0 900 Z"
            fill="#0A4F45"
            opacity="0.75"
          />
          <path
            d="M0 745 Q320 680 640 730 Q960 785 1280 715 Q1470 670 1600 700 L1600 900 L0 900 Z"
            fill="#0A6650"
            opacity="0.9"
          />

          <rect y="740" width="1600" height="160" fill="url(#extGrass)" />

          <path
            d="M0 838 Q400 818 800 828 Q1150 835 1600 820 L1600 872 Q1150 882 800 874 Q400 864 0 882 Z"
            fill="url(#extPath)"
          />

          {/* Tree */}
          <g transform="translate(180, 630)">
            <rect x="-8" y="0" width="16" height="112" fill="#5A3A1A" rx="3" />
            <circle cx="0" cy="-25" r="62" fill="#0B7A5A" />
            <circle cx="-42" cy="6" r="46" fill="#0A6E52" />
            <circle cx="42" cy="6" r="46" fill="#0A6E52" />
            <circle cx="0" cy="-52" r="42" fill="#10B981" opacity="0.9" />
          </g>

          {/* Bank building */}
          <g transform="translate(950, 400)">
            <rect x="-40" y="316" width="520" height="26" fill="#D9CDA8" rx="2" />
            <rect x="-16" y="296" width="472" height="26" fill="#E8DFC4" rx="2" />

            <rect
              x="20"
              y="120"
              width="400"
              height="180"
              fill="url(#extBankWall)"
              stroke="#C9BE9F"
              strokeWidth="2"
            />

            {[46, 108, 292, 354].map((x) => (
              <g key={x}>
                <rect
                  x={x}
                  y="130"
                  width="30"
                  height="162"
                  fill="#FDFAF0"
                  stroke="#C9BE9F"
                  strokeWidth="1.5"
                />
                <rect
                  x={x - 5}
                  y="124"
                  width="40"
                  height="12"
                  fill="#E8DFC4"
                  stroke="#C9BE9F"
                  strokeWidth="1"
                  rx="2"
                />
                <rect
                  x={x - 5}
                  y="286"
                  width="40"
                  height="12"
                  fill="#E8DFC4"
                  stroke="#C9BE9F"
                  strokeWidth="1"
                  rx="2"
                />
              </g>
            ))}

            {/* Doorway dark pocket */}
            <rect x="176" y="192" width="88" height="108" fill="#050B12" rx="2" />

            {/* Swinging door */}
            <g transform="translate(178, 196)">
              <g
                style={{
                  transform: doorOpen ? 'scaleX(0.08)' : 'scaleX(1)',
                  transformBox: 'fill-box',
                  transformOrigin: '0% 50%',
                  transition: 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <rect x="0" y="0" width="84" height="104" fill="#0B1F33" rx="6" />
                <rect x="8" y="8" width="68" height="30" fill="#F5B942" opacity="0.35" rx="4" />
                <circle cx="70" cy="56" r="3.5" fill="#F5B942" />
              </g>
            </g>

            {/* Windows */}
            <rect x="60" y="200" width="34" height="46" fill="#F5B942" rx="4" />
            <rect x="64" y="204" width="26" height="38" fill="#FFD87A" rx="3" opacity="0.7" />
            <rect x="346" y="200" width="34" height="46" fill="#F5B942" rx="4" />
            <rect x="350" y="204" width="26" height="38" fill="#FFD87A" rx="3" opacity="0.7" />

            {/* Roof */}
            <path d="M0 120 L220 30 L440 120 Z" fill="url(#extBankRoof)" />
            <path
              d="M22 120 L220 48 L418 120"
              stroke="#F5B942"
              strokeWidth="3.5"
              fill="none"
              strokeLinejoin="round"
            />

            {/* Sign */}
            <g transform="translate(220, 92)">
              <rect x="-158" y="-34" width="316" height="60" rx="12" fill="#0B1F33" />
              <rect
                x="-153"
                y="-29"
                width="306"
                height="50"
                rx="9"
                fill="none"
                stroke="#F5B942"
                strokeWidth="1.4"
                opacity="0.65"
              />
              <text
                x="0"
                y="-2"
                textAnchor="middle"
                fontFamily="Sora, system-ui"
                fontSize="30"
                fontWeight="800"
                fill="#F5B942"
                letterSpacing="6"
              >
                CHAMETU
              </text>
              <text
                x="0"
                y="18"
                textAnchor="middle"
                fontFamily="Sora, system-ui"
                fontSize="11"
                fontWeight="600"
                fill="#EAF1F6"
                letterSpacing="8"
              >
                SAVINGS BANK
              </text>
            </g>

            {/* LED ticker */}
            <g transform="translate(220, 162)">
              <rect
                x="-90"
                y="-14"
                width="180"
                height="28"
                rx="6"
                fill="#071410"
                stroke="#0E8E68"
                strokeWidth="1.4"
              />
              <circle
                cx="-76"
                cy="0"
                r="3"
                fill="#F5B942"
                style={{ animation: 'dotBlink 1.8s ease-in-out infinite' }}
              />
              <text
                x="6"
                y="4"
                textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize="15"
                fontWeight="700"
                fill="#7CF0C0"
                letterSpacing="1"
              >
                {formatKsh(saved)}
              </text>
            </g>

            {/* Piggy bank */}
            <g transform="translate(220, -22)">
              <g
                style={{
                  animation: celebrating
                    ? 'pigCelebrate 0.9s cubic-bezier(0.34,1.56,0.64,1) both'
                    : 'pigIdle 2.6s ease-in-out infinite',
                  transformBox: 'fill-box',
                  transformOrigin: 'center',
                }}
              >
                <ellipse cx="0" cy="0" rx="32" ry="24" fill="#F5B942" />
                <ellipse cx="0" cy="5" rx="27" ry="17" fill="#FFD87A" opacity="0.7" />
                <ellipse cx="-24" cy="2" rx="10" ry="9" fill="#E8A21F" />
                <circle cx="-26" cy="0" r="2" fill="#0B1F33" />
                <circle cx="-19" cy="-1" r="2" fill="#0B1F33" />
                <circle cx="-6" cy="-6" r="2.8" fill="#0B1F33" />
                <path d="M8 -22 Q16 -32 24 -22 Z" fill="#E8A21F" />
                <rect x="-18" y="20" width="7" height="12" rx="2.5" fill="#E8A21F" />
                <rect x="12" y="20" width="7" height="12" rx="2.5" fill="#E8A21F" />
                <rect x="-7" y="-27" width="14" height="4" rx="2" fill="#0B1F33" />
              </g>
            </g>
          </g>

          {/* Character */}
          <g
            transform="translate(0, 556)"
            style={{
              filter:
                'drop-shadow(0 0 1.5px rgba(255,255,255,0.75)) drop-shadow(0 8px 10px rgba(0,0,0,0.28))',
            }}
          >
            <g className={extCharClass}>
              <g
                style={{
                  animation: walking ? 'bobStep 0.35s ease-in-out infinite' : 'none',
                  transformOrigin: '112px 292px',
                }}
              >
                <CharacterBody
                  walking={walking}
                  holding={holdingCoin}
                  celebrating={phase === 'walk-out'}
                />
              </g>
            </g>
          </g>

          {/* Speech bubble at the door */}
          {phase === 'arrive' && (
            <g transform="translate(760, 320)">
<g
              style={{ animation: 'bubblePop 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}
            >
              <path
                d="M0 0 Q0 -20 20 -20 L200 -20 Q220 -20 220 0 L220 40 Q220 60 200 60 L40 60 L20 82 L28 60 L20 60 Q0 60 0 40 Z"
                fill="#FFFFFF"
                stroke="#E3E9EF"
                strokeWidth="2"
              />
              <text
                x="110"
                y="16"
                textAnchor="middle"
                fontFamily="Inter, system-ui"
                fontSize="13"
                fontWeight="600"
                fill="#0B1F33"
              >
                Time to save
              </text>
              <text
                x="110"
                y="36"
                textAnchor="middle"
                fontFamily="Inter, system-ui"
                fontSize="13"
                fontWeight="600"
                fill="#0B1F33"
              >
                for the chama!
              </text>
            </g>
</g>
          )}
        </svg>
      </div>

      {/* ==========================================================
          INTERIOR
      ========================================================== */}
      <div
        className={`hero-cartoon absolute inset-0 transition-opacity duration-500 ${
          inInterior ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <svg
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="intWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F8F1DC" />
              <stop offset="0.6" stopColor="#EFE4C4" />
              <stop offset="1" stopColor="#E2D4A8" />
            </linearGradient>
            <linearGradient id="intFloor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C8BBA0" />
              <stop offset="1" stopColor="#9C8F72" />
            </linearGradient>
            <linearGradient id="intCounterTop" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1A2F44" />
              <stop offset="1" stopColor="#0B1F33" />
            </linearGradient>
            <linearGradient id="intCounterFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5A3A1A" />
              <stop offset="1" stopColor="#3A2408" />
            </linearGradient>
            <linearGradient id="intWood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7A5230" />
              <stop offset="1" stopColor="#5A3A1A" />
            </linearGradient>
            <radialGradient id="intLight" cx="0.5" cy="0.1" r="0.7">
              <stop offset="0" stopColor="#FFF6D2" stopOpacity="0.55" />
              <stop offset="1" stopColor="#FFF6D2" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="intWarm" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0" stopColor="#FFE9B8" stopOpacity="0.35" />
              <stop offset="1" stopColor="#FFE9B8" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g className="int-cam" style={{ transformOrigin: '900px 500px' }}>
            <rect width="1600" height="900" fill="url(#intWall)" />
            <rect width="1600" height="900" fill="url(#intLight)" />
            <rect width="1600" height="900" fill="url(#intWarm)" />

            {/* Ceiling trim */}
            <rect x="0" y="0" width="1600" height="34" fill="#E2D4A8" />
            <rect x="0" y="30" width="1600" height="4" fill="#C9BE9F" />

            {/* Hanging lamps */}
            {[500, 800, 1100, 1400].map((x, i) => (
              <g key={x} transform={`translate(${x}, 34)`}>
                <line x1="0" y1="0" x2="0" y2="60" stroke="#5A3A1A" strokeWidth="2.5" />
                <path
                  d="M-30 60 L30 60 L18 84 L-18 84 Z"
                  fill="#0B1F33"
                  stroke="#F5B942"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <ellipse cx="0" cy="88" rx="14" ry="4" fill="#F5B942" opacity="0.9" />
                <ellipse cx="0" cy="120" rx="110" ry="34" fill="#FFF6D2" opacity="0.22" />
              </g>
            ))}

            {/* Wainscot */}
            <rect x="0" y="600" width="1600" height="90" fill="url(#intWood)" />
            <rect x="0" y="600" width="1600" height="4" fill="#3A2408" />

            {/* Floor */}
            <rect x="0" y="690" width="1600" height="210" fill="url(#intFloor)" />
            <rect x="0" y="690" width="1600" height="14" fill="#000000" opacity="0.08" />
            <rect x="0" y="720" width="1600" height="1" fill="#000000" opacity="0.06" />
            <rect x="0" y="760" width="1600" height="1" fill="#000000" opacity="0.06" />

            {/* ============ VAULT (background, left) ============ */}
            <g transform="translate(140, 380)">
              <rect x="0" y="0" width="200" height="220" rx="10" fill="#2B2E33" />
              <rect x="10" y="10" width="180" height="200" rx="8" fill="#4A4D52" />
              {/* Vault door circle */}
              <circle cx="100" cy="110" r="70" fill="#6B6E73" />
              <circle cx="100" cy="110" r="58" fill="#8B8E93" />
              <circle cx="100" cy="110" r="40" fill="#5A5D62" />
              {/* Vault wheel */}
              <circle cx="100" cy="110" r="30" fill="none" stroke="#F5B942" strokeWidth="5" />
              <line x1="100" y1="82" x2="100" y2="138" stroke="#F5B942" strokeWidth="4" />
              <line x1="72" y1="110" x2="128" y2="110" stroke="#F5B942" strokeWidth="4" />
              <line x1="80" y1="90" x2="120" y2="130" stroke="#F5B942" strokeWidth="4" />
              <line x1="120" y1="90" x2="80" y2="130" stroke="#F5B942" strokeWidth="4" />
              <circle cx="100" cy="110" r="10" fill="#F5B942" />
              <circle cx="100" cy="110" r="4" fill="#3A2A08" />
              {/* Sign */}
              <rect x="60" y="-30" width="80" height="20" rx="4" fill="#0B1F33" />
              <text
                x="100"
                y="-15"
                textAnchor="middle"
                fontFamily="Sora, system-ui"
                fontSize="10"
                fontWeight="700"
                fill="#F5B942"
                letterSpacing="2"
              >
                VAULT
              </text>
            </g>

            {/* ============ SECURITY CAMERA ============ */}
            <g transform="translate(700, 90)">
              <rect x="-6" y="-8" width="12" height="8" fill="#2B2E33" />
              <rect x="-22" y="0" width="44" height="20" rx="6" fill="#0B1F33" />
              <circle cx="0" cy="10" r="5" fill="#3A3D42" />
              <circle cx="0" cy="10" r="2" fill="#E84A4A" />
              <circle
                cx="0"
                cy="10"
                r="2"
                fill="#FF6B6B"
                style={{ animation: 'dotBlink 2.2s ease-in-out infinite' }}
              />
            </g>

            {/* ============ COUNTER ============ */}
            <rect x="540" y="560" width="1000" height="18" fill="url(#intCounterTop)" />
            <rect x="540" y="578" width="1000" height="6" fill="#050B12" opacity="0.6" />
            <rect x="540" y="584" width="1000" height="140" fill="url(#intCounterFront)" />
            <rect x="540" y="584" width="1000" height="6" fill="#3A2408" />
            {[600, 780, 960, 1140, 1320, 1460].map((x) => (
              <rect
                key={x}
                x={x}
                y="610"
                width="140"
                height="90"
                fill="#4A2E14"
                rx="4"
                opacity="0.6"
              />
            ))}

            {/* Glass partition above the counter */}
            <rect x="580" y="300" width="960" height="260" fill="#C7E5DE" opacity="0.35" />
            <rect
              x="580"
              y="300"
              width="960"
              height="260"
              fill="none"
              stroke="#0B1F33"
              strokeWidth="4"
            />
            {[830, 1080, 1330].map((x) => (
              <rect key={x} x={x} y="300" width="4" height="260" fill="#0B1F33" />
            ))}

            {/* Teller window opening (where the deposit happens) */}
            <rect x="1010" y="380" width="230" height="150" fill="#EFE4C4" />
            <rect
              x="1010"
              y="380"
              width="230"
              height="150"
              fill="none"
              stroke="#0B1F33"
              strokeWidth="4"
            />
            <rect x="1010" y="524" width="230" height="6" fill="#0B1F33" />

            {/* Cash tray on the counter between character and teller */}
            <g transform="translate(880, 545)">
              <rect x="-46" y="-8" width="92" height="18" rx="4" fill="#2B2E33" />
              <rect x="-42" y="-6" width="84" height="14" rx="3" fill="#0B1F33" />
              <rect x="-42" y="-6" width="84" height="2" rx="1" fill="#F5B942" opacity="0.5" />
            </g>

            {/* Register/drawer behind the teller */}
            <g transform="translate(1230, 560)">
              <rect x="-70" y="-10" width="140" height="60" rx="6" fill="#0B1F33" />
              <rect x="-64" y="-4" width="128" height="20" rx="3" fill="#1A2F44" />
              <rect x="-56" y="-2" width="50" height="8" rx="2" fill="#7CF0C0" opacity="0.9" />
              <rect x="6" y="-2" width="40" height="8" rx="2" fill="#F5B942" opacity="0.9" />
              <g
                className={inInterior ? 't-drawer' : ''}
                style={{ transformBox: 'fill-box', transformOrigin: 'center top' }}
              >
                <rect
                  x="-64"
                  y="20"
                  width="128"
                  height="42"
                  rx="4"
                  fill="#0B1F33"
                  stroke="#F5B942"
                  strokeWidth="1.5"
                />
                <rect x="-58" y="26" width="116" height="6" rx="2" fill="#2B2E33" />
                <rect x="-58" y="38" width="90" height="4" rx="2" fill="#2B2E33" />
                <rect x="-58" y="48" width="70" height="4" rx="2" fill="#2B2E33" />
              </g>
            </g>

            {/* Teller */}
            <g transform="translate(1020, 390)">
              <TellerBody
                mode={
                  !inInterior
                    ? 'idle'
                    : 'sequence' // the internal CSS keyframes handle the phases
                }
              />
            </g>

            {/* Teller nameplate */}
            <g transform="translate(1125, 270)">
              <rect x="-70" y="-14" width="140" height="26" rx="6" fill="#0B1F33" />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fontFamily="Sora, system-ui"
                fontSize="12"
                fontWeight="700"
                fill="#F5B942"
                letterSpacing="3"
              >
                TELLER 1
              </text>
            </g>

            {/* Clock */}
            <g transform="translate(320, 200)">
              <circle cx="0" cy="0" r="60" fill="#F8F1DC" stroke="#0B1F33" strokeWidth="4" />
              <circle cx="0" cy="0" r="52" fill="#FDFAF0" />
              {[0, 90, 180, 270].map((deg) => {
                const rad = (deg - 90) * (Math.PI / 180)
                return (
                  <line
                    key={deg}
                    x1={Math.cos(rad) * 38}
                    y1={Math.sin(rad) * 38}
                    x2={Math.cos(rad) * 48}
                    y2={Math.sin(rad) * 48}
                    stroke="#0B1F33"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )
              })}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="-28"
                stroke="#0B1F33"
                strokeWidth="4"
                strokeLinecap="round"
                style={{
                  animation: 'clockTick 12s linear infinite',
                  transformBox: 'fill-box',
                  transformOrigin: 'center bottom',
                }}
              />
              <line
                x1="0"
                y1="0"
                x2="22"
                y2="0"
                stroke="#0B1F33"
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  animation: 'clockTick 60s linear infinite',
                  transformBox: 'fill-box',
                  transformOrigin: 'left center',
                }}
              />
              <circle cx="0" cy="0" r="4" fill="#F5B942" />
            </g>

            {/* Plant */}
            <g transform="translate(680, 620)">
              <path d="M-28 90 L28 90 L21 36 L-21 36 Z" fill="#8A5A2A" />
              <ellipse cx="0" cy="36" rx="24" ry="5" fill="#5A3A1A" />
              <path
                d="M0 36 Q-26 -18 -34 -44"
                stroke="#0B7A5A"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M0 36 Q8 -26 3 -62"
                stroke="#0B7A5A"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M0 36 Q24 -12 38 -36"
                stroke="#0B7A5A"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="-34" cy="-44" r="19" fill="#10B981" />
              <circle cx="3" cy="-62" r="21" fill="#0B7A5A" />
              <circle cx="38" cy="-36" r="17" fill="#0E8E68" />
            </g>

            {/* Interior savings LED (behind character) */}
            <g transform="translate(340, 500)">
              <rect
                x="-150"
                y="-26"
                width="300"
                height="52"
                rx="10"
                fill="#0B1F33"
                stroke="#F5B942"
                strokeWidth="2"
              />
              <circle
                cx="-126"
                cy="0"
                r="4"
                fill="#7CF0C0"
                style={{ animation: 'dotBlink 1.6s ease-in-out infinite' }}
              />
              <text
                x="14"
                y="-4"
                textAnchor="middle"
                fontFamily="Inter, system-ui"
                fontSize="9"
                fontWeight="600"
                fill="#7CF0C0"
                letterSpacing="2"
              >
                CHAMA SAVINGS
              </text>
              <text
                x="14"
                y="16"
                textAnchor="middle"
                fontFamily="JetBrains Mono, ui-monospace, monospace"
                fontSize="17"
                fontWeight="700"
                fill="#F5B942"
                letterSpacing="1"
              >
                {formatKsh(saved)}
              </text>
            </g>

            {/* ============ CHARACTER AT THE COUNTER ============ */}
            <g transform="translate(400, 500)">
              <g
                style={{
                  animation: inInterior ? 'bob 2.6s ease-in-out infinite' : 'none',
                  transformOrigin: '110px 290px',
                }}
              >
                <CharacterBody offering={inInterior} celebrating={inInterior} />
                {/* Cash lifted in the forward hand, hands over to the counter animation */}
                {inInterior && (
                  <g className="t-hand-lift">
                    <g transform="translate(142, 196) rotate(-6)">
                      <rect x="-26" y="-12" width="52" height="24" rx="3" fill="#7A5230" />
                      <rect x="-26" y="-10" width="52" height="20" rx="3" fill="#10B981" />
                      <rect x="-18" y="-4" width="36" height="3" rx="1.5" fill="#F5B942" opacity="0.8" />
                      <rect x="-18" y="1" width="24" height="2.5" rx="1.2" fill="#F5B942" opacity="0.6" />
                      <text
                        x="0"
                        y="3"
                        textAnchor="middle"
                        fontFamily="Sora, system-ui"
                        fontSize="6"
                        fontWeight="800"
                        fill="#0B1F33"
                      >
                        KSh 5,000
                      </text>
                    </g>
                  </g>
                )}
              </g>
            </g>

            {/* ============ CASH BUNDLE CROSSING THE COUNTER ============ */}
            {inInterior && (
              <g transform="translate(660, 555)">
<g className="t-cash-a">
                <g>
                  <g transform="rotate(-6)">
                    <rect x="-30" y="-14" width="60" height="28" rx="4" fill="#7A5230" />
                    <rect x="-30" y="-12" width="60" height="24" rx="3" fill="#10B981" />
                    <rect x="-22" y="-6" width="44" height="4" rx="2" fill="#F5B942" opacity="0.8" />
                    <rect x="-22" y="0" width="30" height="3" rx="1.5" fill="#F5B942" opacity="0.6" />
                    <rect x="-22" y="5" width="36" height="3" rx="1.5" fill="#F5B942" opacity="0.5" />
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontFamily="Sora, system-ui"
                      fontSize="7"
                      fontWeight="800"
                      fill="#0B1F33"
                    >
                      KSh 5,000
                    </text>
                  </g>
                  <g transform="translate(28, -18)">
                    <circle cx="0" cy="0" r="9" fill="#F5B942" stroke="#E8A21F" strokeWidth="1.4" />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fontFamily="Sora, system-ui"
                      fontSize="9"
                      fontWeight="800"
                      fill="#7A5313"
                    >
                      K
                    </text>
                  </g>
                </g>
              </g>
</g>
            )}

            {/* Second layer: cash being collected (fades out at teller's hand) */}
            {inInterior && (
              <g transform="translate(1020, 555)">
<g className="t-cash-b">
                <g transform="rotate(-6)">
                  <rect x="-30" y="-14" width="60" height="28" rx="4" fill="#7A5230" />
                  <rect x="-30" y="-12" width="60" height="24" rx="3" fill="#10B981" />
                  <rect x="-22" y="-6" width="44" height="4" rx="2" fill="#F5B942" opacity="0.8" />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fontFamily="Sora, system-ui"
                    fontSize="7"
                    fontWeight="800"
                    fill="#0B1F33"
                  >
                    KSh 5,000
                  </text>
                </g>
              </g>
</g>
            )}

            {/* Receipt returning to character */}
            {inInterior && (
              <g transform="translate(660, 555)">
<g className="t-receipt">
                <rect
                  x="-24"
                  y="-34"
                  width="48"
                  height="68"
                  rx="3"
                  fill="#FFFFFF"
                  stroke="#E3E9EF"
                  strokeWidth="1.4"
                />
                <rect x="-16" y="-26" width="32" height="4" rx="2" fill="#0B7A5A" />
                <rect x="-16" y="-18" width="24" height="3" rx="1.5" fill="#5B6B7B" opacity="0.6" />
                <rect x="-16" y="-12" width="28" height="3" rx="1.5" fill="#5B6B7B" opacity="0.6" />
                <rect x="-16" y="-6" width="20" height="3" rx="1.5" fill="#5B6B7B" opacity="0.6" />
                <rect x="-16" y="2" width="30" height="3" rx="1.5" fill="#5B6B7B" opacity="0.6" />
                <rect x="-16" y="8" width="24" height="3" rx="1.5" fill="#5B6B7B" opacity="0.6" />
                <rect x="-16" y="16" width="34" height="6" rx="3" fill="#F5B942" />
                <text
                  x="1"
                  y="21"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, ui-monospace, monospace"
                  fontSize="6"
                  fontWeight="700"
                  fill="#3A2A08"
                >
                  PAID
                </text>
              </g>
</g>
            )}

            {/* Speech bubble (visible during the whole interior) */}
            {inInterior && (
              <g transform="translate(440, 392)">
<g
                style={{
                  animation: 'bubblePop 0.5s cubic-bezier(0.34,1.56,0.64,1) 300ms both',
                }}
              >
                <path
                  d="M0 0 Q0 -20 20 -20 L240 -20 Q260 -20 260 0 L260 40 Q260 60 240 60 L40 60 L18 84 L26 60 L20 60 Q0 60 0 40 Z"
                  fill="#FFFFFF"
                  stroke="#E3E9EF"
                  strokeWidth="2"
                />
                <text
                  x="130"
                  y="16"
                  textAnchor="middle"
                  fontFamily="Inter, system-ui"
                  fontSize="13"
                  fontWeight="600"
                  fill="#0B1F33"
                >
                  Depositing KSh 5,000
                </text>
                <text
                  x="130"
                  y="36"
                  textAnchor="middle"
                  fontFamily="Inter, system-ui"
                  fontSize="13"
                  fontWeight="600"
                  fill="#0B1F33"
                >
                  for the chama today!
                </text>
              </g>
</g>
            )}

            {/* Gold sparkles during receipt */}
            {inInterior &&
              [
                { x: 640, y: 420, d: 4700 },
                { x: 780, y: 400, d: 4850 },
                { x: 540, y: 480, d: 5000 },
                { x: 900, y: 440, d: 5150 },
              ].map((s, i) => (
                <g
                  key={i} transform={`translate(${s.x}, ${s.y})`}>
<g
                  style={{
                    animation: `sparklePop 1.4s ease-out ${s.d}ms infinite`,
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                  }}
                >
                  <path
                    d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z"
                    fill="#F5B942"
                  />
                </g>
</g>
              ))}
          </g>
        </svg>
      </div>

      {/* ============ GRADE + READABILITY ============ */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          opacity: textVisible ? 1 : 0.35,
          transition: 'opacity 500ms ease',
          background:
            'radial-gradient(ellipse 70% 62% at 16% 36%, rgba(6,22,26,0.82) 0%, rgba(6,22,26,0.6) 45%, rgba(6,22,26,0) 100%), linear-gradient(180deg, rgba(6,22,26,0.6) 0%, rgba(6,22,26,0) 22%, rgba(6,22,26,0) 80%, rgba(6,22,26,0.5) 100%)',
        }}
      />
      {/* On narrow screens the copy spans the full width, so flatten the scene behind it */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] bg-[#06161A]/35 transition-opacity duration-500 lg:hidden"
        style={{ opacity: textVisible ? 1 : 0 }}
      />

      {/* ============ HERO COPY (fades while the scene is inside the bank) ============ */}
      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col"
        style={{ opacity: textVisible ? 1 : 0, transition: 'opacity 500ms ease' }}
      >
        <div className="wrap pointer-events-auto flex w-full flex-1 flex-col justify-center pb-[22vh] pt-28 sm:pt-32">
          <div className="max-w-[640px]">
            <div
              className={`inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-[0.8rem] sm:rounded-full font-medium text-white/90 backdrop-blur-md transition-all duration-700 ${
                ready ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              Built for chamas, SACCOs and investment groups
            </div>

            <h1
              className={`mt-6 font-display text-[2.5rem] font-bold leading-[1.04] tracking-[-0.03em] text-white transition-all duration-700 delay-100 sm:text-[3.4rem] lg:text-[4.2rem] ${
                ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              Save together,
              <span className="block text-[#7CF0C0]">grow together.</span>
            </h1>

            <p
              className={`mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/80 transition-all duration-700 delay-200 sm:text-[1.08rem] ${
                ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              Contributions, M-Pesa payments, loans, investments, meetings and reports in one
              secure ledger. Every official and every member sees the same numbers.
            </p>

            <div
              className={`mt-8 flex flex-col gap-3 transition-all duration-700 delay-300 sm:flex-row sm:items-center ${
                ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full !bg-[#F5B942] !text-[#2E2200] px-7 py-3.5 text-[0.92rem] font-semibold shadow-[0_14px_34px_-10px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:!bg-[#FFC857] hover:shadow-[0_18px_40px_-10px_rgba(0,0,0,0.6)]"
              >
                Create your chama
                <FiArrowRight
                  size={16}
                  strokeWidth={2.4}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <Link
                to="/login"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/[0.08] px-7 py-3.5 text-[0.92rem] font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/[0.14]"
              >
                <FiPlayCircle size={16} strokeWidth={2.4} aria-hidden="true" />
                See a live dashboard
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={scrollNext}
          className="relative z-10 mx-auto mb-14 inline-flex sm:mb-16 flex-col items-center gap-1 text-[0.78rem] font-medium text-white/70 transition hover:text-white"
          aria-label="Scroll to see how it works"
        >
          See how it works
          <FiChevronDown size={16} className="animate-bounce-soft" aria-hidden="true" />
        </button>
      </div>

      {/* ============ LIVE LEDGER CHIP (always visible, follows the scene) ============ */}
      <div
        className={`absolute bottom-16 right-5 z-10 hidden transition-opacity duration-700 sm:block lg:right-10 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="rounded-2xl border border-white/15 bg-[#06161A]/60 px-4 py-3 text-white shadow-[0_24px_40px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[0.74rem] text-white/65">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
            </span>
            Live chama ledger
          </div>
          <div className="mt-1 font-mono text-[1.15rem] font-semibold tabular-nums">
            {formatKsh(saved)}
          </div>
          <div className="mt-0.5 text-[0.72rem] text-[#7CF0C0]">
            {inInterior ? 'Recording a deposit' : 'Updates as members pay'}
          </div>
        </div>
      </div>
    </section>
  )
}