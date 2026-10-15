import { FiCheck, FiShield } from 'react-icons/fi'
import Reveal from './Reveal'

const POINTS = [
  'Collections create a new entry, never a silent overwrite',
  'Role-based sign-in for members, officials and admins',
  'Export your data as CSV, Excel or PDF, any time',
]

const AUDIT_LOG = [
  ['BR', 'Treasurer \u00b7 Brian', 'Contribution collected: KSh 7,000 from Kevin', '09:42'],
  ['AN', 'Chairperson \u00b7 Ann', 'Approved loan disbursement LN-102 for KSh 100,000', '10:05'],
  ['KV', 'Secretary \u00b7 Kevin', 'Minutes approved and locked for the September meeting', '10:31'],
]

export default function Security() {
  return (
    <section id="security" className="py-16 sm:py-20 md:py-24">
      <div className="wrap">
        {/*
          Fixed "product highlight" surface: light text on dark navy in both
          themes. Hardcoded #0B1F33 keeps it dark; `bg-navy` would flip to a
          light colour in dark mode and hide the pale content.
        */}
        <Reveal className="relative overflow-hidden rounded-3xl bg-[#0B1F33] px-5 py-10 text-white sm:px-11 sm:py-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '44px 44px',
              maskImage: 'radial-gradient(ellipse 70% 80% at 85% 100%, #000, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 85% 100%, #000, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[rgba(18,166,106,.2)] blur-2xl" />

          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14">
            <div className="min-w-0">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-gold">
                <FiShield size={20} aria-hidden="true" />
              </span>
              <h2 className="mt-5 max-w-[18ch] font-display text-[clamp(1.5rem,4.6vw,2.3rem)] font-bold leading-tight tracking-tight text-white">
                Everyone knows where the money is.
              </h2>
              <p className="mt-3 max-w-[42ch] text-[0.94rem] leading-relaxed text-[#B9C6D2] sm:text-[.98rem]">
                No historical transaction changes silently. Every correction, approval and login is written to
                an audit trail, and access is scoped by role and enforced at sign-in.
              </p>
              <ul className="mt-6 flex flex-col gap-3">
                {POINTS.map((point) => (
                  <li key={point} className="flex gap-3 text-[0.88rem] text-[#DCE6EC] sm:text-[.9rem]">
                    <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-emerald/20 text-[#7CF0C0]">
                      <FiCheck size={12} strokeWidth={3} aria-hidden="true" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[.05] p-4 backdrop-blur-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-display text-[0.9rem] font-semibold text-white sm:text-[.92rem]">
                  Audit log
                </span>
                <span className="flex items-center gap-1.5 text-[0.72rem] text-[#9FB3C0] sm:text-[.74rem]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                  Recording
                </span>
              </div>

              <ul className="divide-y divide-white/10">
                {AUDIT_LOG.map(([initials, who, what, time]) => (
                  <li
                    key={who}
                    className="flex items-start gap-3 py-3 first:pt-0 last:pb-0 sm:gap-3.5 sm:py-3.5"
                  >
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-forest font-display text-[0.7rem] font-bold text-white sm:h-9 sm:w-9 sm:text-[.74rem]">
                      {initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate font-display text-[0.84rem] font-semibold text-white sm:text-[.86rem]">
                          {who}
                        </span>
                        <span className="font-mono text-[0.7rem] text-[#9FB3C0] sm:text-[.72rem]">
                          {time}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[0.8rem] leading-snug text-[#B9C6D2] sm:text-[.82rem]">
                        {what}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}