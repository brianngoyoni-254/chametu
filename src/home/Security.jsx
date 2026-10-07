import { FiCheck, FiShield } from 'react-icons/fi'
import Reveal from './Reveal'

const POINTS = [
  'Collections create a new entry, never a silent overwrite',
  'Role-based sign-in for members, officials and admins',
  'Export your data as CSV, Excel or PDF, any time',
]

const AUDIT_LOG = [
  ['Treasurer · Brian', 'Contribution collected: KSh 7,000 from Kevin'],
  ['Chairperson · Ann', 'Approved loan disbursement LN-102 for KSh 100,000'],
  ['Secretary · Kevin', 'Minutes approved and locked for the September meeting'],
]

export default function Security() {
  return (
    <section id="security" className="py-16">
      <div className="wrap">
        <Reveal className="relative overflow-hidden rounded-[14px] bg-navy px-6 py-8 text-white sm:rounded-[20px] sm:px-11 sm:py-12">
          <div className="pointer-events-none absolute -bottom-[70px] -right-[70px] h-60 w-60 rounded-full bg-[rgba(18,166,106,.18)]" />

          <div className="relative grid grid-cols-1 items-center gap-[26px] nav:grid-cols-2 nav:gap-10">
            <div className="min-w-0">
              <h2 className="flex max-w-[18ch] items-start gap-2 text-[1.6rem] text-white">
                <FiShield size={22} className="mt-1 shrink-0 text-gold" aria-hidden="true" />
                <span>Everyone knows where the money is.</span>
              </h2>
              <p className="mt-3 max-w-[38ch] text-[.94rem] text-[#B9C6D2]">
                No historical transaction changes silently. Every correction, approval and login is written to an
                audit trail, and access is scoped by role and enforced at sign-in.
              </p>
              <div className="mt-5 flex flex-col gap-2.5">
                {POINTS.map((point) => (
                  <div key={point} className="flex gap-[9px] text-[.86rem] text-[#DCE6EC]">
                    <FiCheck
                      size={15}
                      strokeWidth={3}
                      className="mt-[3px] flex-none text-gold"
                      aria-hidden="true"
                    />
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="min-w-0 rounded-xl border border-white/12 bg-white/6 px-5 py-[18px]">
              <div className="mb-3 text-[.7rem] font-semibold text-[#9FB3C0]">RECENT AUDIT LOG</div>
              {AUDIT_LOG.map(([who, what]) => (
                <div
                  key={who}
                  className="relative border-l-2 border-emerald pb-3 pl-3.5 pt-0.5 last:pb-0"
                >
                  <span className="absolute -left-[5px] top-[3px] h-2 w-2 rounded-full bg-emerald" />
                  <div className="font-display text-[.82rem] font-semibold text-white">{who}</div>
                  <div className="mt-0.5 text-[.78rem] text-[#B9C6D2]">{what}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}