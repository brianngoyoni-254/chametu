import { Link } from 'react-router-dom'
import { FiArrowRight, FiLogIn, FiCheckCircle } from 'react-icons/fi'
import Reveal from './Reveal'

export default function CtaBand() {
  return (
    <section className="py-16">
      <div className="wrap">
        <Reveal className="relative flex flex-wrap items-center justify-between gap-[26px] overflow-hidden rounded-[14px] bg-forest px-6 py-8 sm:rounded-[20px] sm:px-11 sm:py-[50px]">
          <div className="pointer-events-none absolute -left-10 -top-[60px] h-[200px] w-[200px] rounded-full bg-[rgba(217,164,65,.16)]" />
          <div className="pointer-events-none absolute -bottom-[80px] -right-[60px] h-[220px] w-[220px] rounded-full bg-[rgba(255,255,255,.06)]" />

          <div className="relative min-w-0">
            <h2 className="max-w-[15ch] text-[1.7rem] text-white">
              Bring your chama onto Chametu.
            </h2>
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[#D7EBE0]">
              <FiCheckCircle size={14} className="shrink-0 text-gold" aria-hidden="true" />
              <span>Set up in minutes. Every contribution, loan and meeting in one secure ledger.</span>
            </p>
          </div>

          <div className="relative flex flex-wrap gap-3 max-sm:w-full">
            <Link to="/register" className="btn btn-gold max-sm:flex-auto">
              Create your chama
              <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
            </Link>
            <Link to="/login" className="btn btn-outline max-sm:flex-auto">
              <FiLogIn size={15} strokeWidth={2.5} aria-hidden="true" />
              Log in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}