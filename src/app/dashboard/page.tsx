/* eslint-disable react/no-unescaped-entities */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 p-4">
        <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
        <p className="text-sm text-neutral-400">
          Here's your dashboard. Start with the checklist below to get set up.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-800 p-4">
        <h3 className="text-base font-medium mb-1">📋 Onboarding Checklist</h3>
        <ul className="list-disc list-inside text-sm text-neutral-400 space-y-1">
          <li>Set your handle</li>
          <li>Choose your language</li>
          <li>Connect Stripe (coming soon)</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-800 p-4">
        <h3 className="text-base font-medium mb-1">🧩 Your First Widget</h3>
        <p className="text-sm text-neutral-400">
          Drop in something useful here — maybe analytics, a graph, a shortcut.
        </p>
      </section>
    </div>
  )
}
