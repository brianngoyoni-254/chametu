const STEPS = [
  ['01', 'Create & configure', 'Set your contribution rules, loan terms and merry‑go‑round cycle at onboarding — no hard‑coded assumptions.'],
  ['02', 'Invite & connect', 'Add members by CSV or invite link, and connect M‑Pesa for automatic payment reconciliation.'],
  ['03', 'Run & grow', 'Collect contributions, approve loans, hold meetings and track investments — all from one dashboard.'],
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-16">
      <div className="wrap">
        <div className="mb-[34px] max-w-[44ch]">
          <div className="mb-2 text-[.78rem] font-bold tracking-[.03em] text-forest">HOW IT WORKS</div>
          <h2 className="text-[1.85rem]">Live in three steps</h2>
        </div>

        <div className="rounded-2xl border border-line bg-white px-5 py-7 sm:px-[34px] sm:py-[38px]">
          <div className="grid grid-cols-1 gap-[26px] min-[761px]:grid-cols-3 min-[761px]:gap-7">
            {STEPS.map(([num, title, desc]) => (
              <div key={num}>
                <div className="font-mono text-[.8rem] text-gold">{num}</div>
                <h3 className="mt-2 text-[1.02rem]">{title}</h3>
                <p className="mt-[7px] text-[.87rem]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}