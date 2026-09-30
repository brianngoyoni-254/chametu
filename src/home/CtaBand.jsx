import { Link } from 'react-router-dom'

export default function CtaBand() {
  return (
    <section className="py-16">
      <div className="wrap">
        <div className="relative flex flex-wrap items-center justify-between gap-[26px] overflow-hidden rounded-[14px] bg-forest px-6 py-8 sm:rounded-[20px] sm:px-11 sm:py-[50px]">
          <div className="pointer-events-none absolute -left-10 -top-[60px] h-[200px] w-[200px] rounded-full bg-[rgba(217,164,65,.16)]" />

          <div className="relative">
            <h2 className="max-w-[15ch] text-[1.7rem] text-white">Bring your chama onto Chametu.</h2>
            <p className="mt-1.5 text-[#D7EBE0]">Free for groups up to 10 members. No card required to start.</p>
          </div>

          <div className="relative flex flex-wrap gap-3 max-sm:w-full">
            <Link to="/register" className="btn btn-gold max-sm:flex-auto">
              Create your chama
            </Link>
            <Link to="/login" className="btn btn-outline max-sm:flex-auto">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}