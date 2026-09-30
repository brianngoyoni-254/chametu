import { FiUsers, FiPercent, FiRepeat, FiTrendingUp, FiCalendar, FiFileText } from 'react-icons/fi'

const FEATURES = [
  [FiUsers, 'Members', 'Roles and permissions from day one, with a private profile for every member.'],
  [FiPercent, 'Contributions', 'Weekly, monthly or custom cycles, reconciled automatically against M‑Pesa, bank or cash.'],
  [FiRepeat, 'Loans', 'Application, guarantors, approval and repayment, with interest calculated for you.'],
  [FiTrendingUp, 'Investments', 'A real portfolio ledger for MMFs, land, shares and business ventures.'],
  [FiCalendar, 'Meetings & voting', 'Agendas, attendance, locked minutes, and proposals members vote on from their phones.'],
  [FiFileText, 'Reports', 'Member statements and financial reports, ready for your next AGM.'],
]

export default function Features() {
  return (
    <section id="features" className="py-16">
      <div className="wrap">
        <div className="mb-[34px] max-w-[44ch]">
          <div className="mb-2 text-[.78rem] font-bold tracking-[.03em] text-forest">EVERYTHING YOUR CHAMA RUNS ON</div>
          <h2 className="text-[1.85rem]">Six modules. One connected ledger.</h2>
          <p className="mt-2.5 text-[.96rem]">
            Every contribution, loan, expense and investment flows through the same ledger, so nothing needs
            reconciling by hand.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[561px]:grid-cols-2 nav:grid-cols-3">
          {FEATURES.map(([Icon, title, desc]) => (
            <div
              key={title}
              className="rounded-[13px] border border-line bg-white p-[22px] transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-forest"
            >
              <div className="mb-3.5 grid h-9 w-9 place-items-center rounded-[9px] bg-[#E9F5EF] text-forest">
                <Icon size={18} aria-hidden="true" />
              </div>
              <h3 className="text-[1.02rem]">{title}</h3>
              <p className="mt-[7px] text-[.86rem]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}