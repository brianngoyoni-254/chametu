import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowRight, FiKey } from 'react-icons/fi'
import Reveal from './Reveal'

export default function Join() {
  const [code, setCode] = useState('')
  const navigate = useNavigate()

  function handleJoin(e) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    // TODO(backend): validate chama code before redirecting
    navigate(`/login?join=${encodeURIComponent(trimmed)}`)
  }

  return (
    <section id="join" className="pb-2.5 pt-[70px]">
      <div className="wrap">
        <Reveal>
          <div className="card-v2 mx-auto max-w-[560px] text-center">
            <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#E9F5EF] text-forest">
              <FiKey size={19} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <h3 className="mb-1.5 text-[1.02rem]">Already part of a chama?</h3>
            <p className="text-[.9rem]">
              Enter the chama code your chairman sent you to join instantly. No plan to choose, it&rsquo;s already
              covered by your chama.
            </p>

            <form onSubmit={handleJoin} className="mt-[18px] flex flex-wrap justify-center gap-2.5">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CHM-XXXXXX"
                aria-label="Chama code"
                className="min-w-[180px] flex-1 rounded-[10px] border border-line bg-white px-3.5 py-3 text-[1rem] text-ink outline-none focus:border-forest"
              />
              <button type="submit" className="btn btn-primary whitespace-nowrap max-[420px]:w-full">
                Join my chama
                <FiArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
              </button>
            </form>

            <p className="mt-3.5 text-[.82rem]">
              Every member gets a personal M-Pesa account number, late-fee reminders, loan voting and monthly
              statements.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}