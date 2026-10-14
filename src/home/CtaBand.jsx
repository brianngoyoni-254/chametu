import { Link } from 'react-router-dom'
import { FiArrowRight, FiLogIn, FiCheckCircle } from 'react-icons/fi'
import Reveal from './Reveal'

export default function CtaBand() {
  return (
    <section className="pb-20 pt-4 sm:pb-24">
      <div className="wrap">
        <Reveal className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0B7A5A,#075540)] px-6 py-10 sm:px-12 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 60% 100% at 100% 0%, #000, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 60% 100% at 100% 0%, #000, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[rgba(245,185,66,.18)] blur-xl" />

          <div className="relative flex flex-wrap items-center justify-between gap-8">
            <div className="min-w-0">
              <h2 className="max-w-[16ch] font-display text-[1.9rem] font-bold leading-tight tracking-tight text-white sm:text-[2.4rem]">
                Bring your chama onto Chametu.
              </h2>
              <p className="mt-3 flex max-w-[52ch] items-start gap-2 text-[.98rem] leading-relaxed text-[#D7EBE0]">
                <FiCheckCircle size={16} className="mt-[3px] shrink-0 text-gold" aria-hidden="true" />
                <span>Set up in minutes. Every contribution, loan and meeting in one secure ledger.</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3 max-sm:w-full">
              <Link to="/register" className="btn btn-gold max-sm:flex-auto">
                Create your chama
                <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn-outline max-sm:flex-auto">
                <FiLogIn size={15} strokeWidth={2.5} aria-hidden="true" />
                Log in
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}