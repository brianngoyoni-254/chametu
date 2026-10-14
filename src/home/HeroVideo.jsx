import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiPlayCircle, FiChevronDown, FiCheck } from 'react-icons/fi'

/* ============================================================
   HERO BACKGROUND MEDIA

   Swap VIDEO_URL with your own savings video whenever you like.
   POSTER_URL shows instantly, and stays visible if the video
   fails to load or the visitor prefers reduced motion.
   ============================================================ */

const VIDEO_URL =
  'https://cdn.pixabay.com/video/2023/10/12/184584-875018039_large.mp4'

const POSTER_URL =
  'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1920&q=80'

export default function HeroVideo() {
  const [ready, setReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const t = setTimeout(() => setReady(true), 200)
    return () => clearTimeout(t)
  }, [])

  const scrollNext = () => {
    const next =
      document.getElementById('cartoon') ||
      document.getElementById('trust-bar') ||
      document.getElementById('features')
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const rise = (delay) =>
    `transition-all duration-700 ${delay} ${
      ready ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    }`

  return (
    <section className="relative h-screen min-h-[600px] w-full overflow-hidden bg-navy">
      {/* Poster layer, always behind the video */}
      <img
        src={POSTER_URL}
        alt=""
        aria-hidden="true"
        className="hero-video"
        style={{ objectFit: 'cover' }}
      />

      {!videoFailed && !reduceMotion && (
        <video
          className="hero-video"
          src={VIDEO_URL}
          poster={POSTER_URL}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          onError={() => setVideoFailed(true)}
        />
      )}

      {/* Colour grade: deep forest-navy from the left for legibility, clear on the right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(6,22,26,0.92) 0%, rgba(6,22,26,0.7) 36%, rgba(6,22,26,0.25) 70%, rgba(6,22,26,0.1) 100%), linear-gradient(180deg, rgba(6,22,26,0.55) 0%, rgba(6,22,26,0) 26%, rgba(6,22,26,0) 70%, rgba(6,22,26,0.75) 100%)',
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[#06161A]/40 lg:hidden" />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            'radial-gradient(900px 500px at 85% 10%, rgba(245,185,66,0.35), transparent 60%), radial-gradient(800px 500px at 0% 100%, rgba(16,185,129,0.3), transparent 60%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="wrap flex w-full flex-1 flex-col justify-center pb-[18vh] pt-28 sm:pt-32">
          <div className="max-w-[640px]">
            <div
              className={`inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-3.5 py-1.5 text-[0.8rem] sm:rounded-full font-medium text-white/90 backdrop-blur-md ${rise('')}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
              </span>
              Built for chamas, SACCOs and investment groups
            </div>

            <h1
              className={`mt-6 font-display text-[2.5rem] font-bold leading-[1.04] tracking-[-0.03em] text-white sm:text-[3.4rem] lg:text-[4.2rem] ${rise('delay-100')}`}
            >
              Save together,
              <span className="block text-[#7CF0C0]">grow together.</span>
            </h1>

            <p
              className={`mt-5 max-w-[46ch] text-[1.02rem] leading-relaxed text-white/80 sm:text-[1.08rem] ${rise('delay-200')}`}
            >
              Contributions, M-Pesa payments, loans, investments, meetings and reports in one secure
              ledger. Every official and every member sees the same numbers.
            </p>

            <div className={`mt-8 flex flex-col gap-3 sm:flex-row sm:items-center ${rise('delay-300')}`}>
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[0.92rem] font-semibold text-[#0B1F33] shadow-[0_14px_34px_-10px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5"
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
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 bg-white/[0.08] px-7 py-3.5 text-[0.92rem] font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/[0.14]"
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
          className="relative z-10 mx-auto mb-14 inline-flex flex-col items-center gap-1 text-[0.78rem] font-medium text-white/70 transition hover:text-white sm:mb-16"
          aria-label="Scroll to see how it works"
        >
          See how it works
          <FiChevronDown size={16} className="animate-bounce-soft" aria-hidden="true" />
        </button>
      </div>

      {/* Floating product moment */}
      <div
        className={`absolute bottom-16 right-5 z-10 hidden transition-opacity duration-1000 sm:block lg:right-10 ${
          ready ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#06161A]/60 px-4 py-3 text-white shadow-[0_24px_40px_-18px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald/20 text-[#7CF0C0]">
            <FiCheck size={16} strokeWidth={3} aria-hidden="true" />
          </span>
          <div>
            <div className="text-[0.84rem] font-semibold">KSh 5,000 matched</div>
            <div className="text-[0.72rem] text-white/65">M-Pesa payment from Kevin</div>
          </div>
        </div>
      </div>
    </section>
  )
}