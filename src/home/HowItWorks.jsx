const STEPS = [
  ['01', 'Create & configure', 'Set your contribution rules, loan terms and merry‑go‑round cycle at onboarding — no hard‑coded assumptions.'],
  ['02', 'Invite & connect', 'Add members by CSV or invite link, and connect M‑Pesa for automatic payment reconciliation.'],
  ['03', 'Run & grow', 'Collect contributions, approve loans, hold meetings and track investments — all from one dashboard.'],
]

export default function HowItWorks() {
  return (
    <section id="how" className="py-16">
      <div className="mx-auto max-w-[1160px] px-7 sm:px-4">
        <div className="mb-8.5 max-w-[44ch]">
          <div className="mb-2 text-xs font-bold tracking-wide text-forest">HOW IT WORKS</div>
          <h2 className="text-3xl text-navy">Live in three steps</h2>
        </div>

        <div className="rounded-2xl border border-line bg-white p-9 sm:p-6">
          <div className="grid grid-cols-3 gap-7 sm:grid-cols-1 sm:gap-6.5">
            {STEPS.map(([num, title, desc]) => (
              <div key={num}>
                <div className="font-mono text-sm text-gold">{num}</div>
                <h3 className="mt-2 text-base font-semibold text-navy">{title}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
