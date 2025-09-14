'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useProfile } from '@/context/ProfileProvider'

type Row = {
  feature: string
  basic: string
  pro: string
}

// extend the Profile type so TS knows about these fields
type Profile = {
  handle: string
  display_name: string
  locale: string
  subscription_level?: string | null
  stripe_customer_id?: string | null
}

export default function PricingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile } = useProfile() as { profile: Profile | null }

  const isLoggedIn = !!profile
  const plan = profile?.subscription_level ?? 'basic'
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const rows: Row[] = [
    { feature: 'Max flows', basic: '1', pro: '10' },
    { feature: 'Export quality', basic: 'Watermark', pro: 'Clean PNG, PDF, CSV, JSON' },
    { feature: 'Public sharing', basic: 'Yes', pro: 'Yes' },
    { feature: 'Nodes and edges', basic: 'No cap', pro: 'No cap' },
  ]

  const handleUpgrade = async (cycle: 'monthly' | 'yearly') => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    if (plan === 'pro') return

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    // Select the right priceId
    const priceId =
      cycle === 'monthly'
        ? process.env.NEXT_PUBLIC_PRICE_PAPAYA_MONTHLY
        : process.env.NEXT_PUBLIC_PRICE_PAPAYA_YEARLY

    const payload: any = {
      priceId,
      successUrl: `${window.location.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/pricing`,
      mode: 'subscription',
      metadata: { userId },
    }

    if (profile?.stripe_customer_id) {
      payload.customerId = profile.stripe_customer_id
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (json.url) {
      window.location.href = json.url
    } else {
      console.error(json.error || 'Checkout failed')
    }
  }

  const proButtonText = useMemo(() => {
    if (!isLoggedIn) return 'Sign in to upgrade'
    if (plan === 'pro') return 'You are on Pro'
    return billingCycle === 'monthly' ? 'Upgrade – Monthly' : 'Upgrade – Yearly'
  }, [isLoggedIn, plan, billingCycle])

  const proButtonDisabled = isLoggedIn && plan === 'pro'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      {/* Hero */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Pricing</h1>
        <p className="mx-auto mt-3 max-w-2xl text-neutral-300">
          Start free, build your first flow, then upgrade when you are ready to export clean and scale to ten flows.
        </p>
      </div>

      {/* Plan cards */}
      <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-2">
        {/* Basic */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Basic</h2>
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
              Free
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-300">
            Try the core builder. One flow. Watermarked exports.
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Check /> Create 1 flow
            </li>
            <li className="flex items-start gap-2">
              <Check /> Export with watermark
            </li>
            <li className="flex items-start gap-2">
              <Check /> Public sharing
            </li>
            <li className="flex items-start gap-2">
              <Check /> No cap on nodes or edges
            </li>
          </ul>

          <button
            onClick={() => router.push(isLoggedIn ? '/flows' : '/login')}
            className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-black hover:opacity-90"
          >
            {isLoggedIn ? 'Go to your flows' : 'Get started free'}
          </button>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-neutral-700 bg-neutral-900 p-6 ring-1 ring-neutral-700">
          <div className="absolute -top-3 left-6 rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
            Recommended
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pro</h2>
            <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
              Paid
            </span>
          </div>
          <p className="mt-2 text-sm text-neutral-300">
            Build seriously. Ten flows. Clean exports in all formats.
          </p>

          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Check /> Create up to 10 flows
            </li>
            <li className="flex items-start gap-2">
              <Check /> Clean exports, PNG, PDF, CSV, JSON
            </li>
            <li className="flex items-start gap-2">
              <Check /> Public sharing
            </li>
            <li className="flex items-start gap-2">
              <Check /> No cap on nodes or edges
            </li>
          </ul>

          {/* Billing cycle selector */}
          <div className="mt-6 flex items-center justify-center gap-2 rounded-full bg-neutral-800 p-1 text-xs">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 rounded-full px-3 py-1 ${
                billingCycle === 'monthly' ? 'bg-white text-black' : 'text-neutral-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 rounded-full px-3 py-1 ${
                billingCycle === 'yearly' ? 'bg-white text-black' : 'text-neutral-400'
              }`}
            >
              Yearly
            </button>
          </div>

          <button
            disabled={proButtonDisabled}
            onClick={() => handleUpgrade(billingCycle)}
            className={`mt-6 w-full rounded-xl px-4 py-3 text-center text-sm font-medium ${
              proButtonDisabled
                ? 'cursor-not-allowed bg-neutral-800 text-neutral-500'
                : 'bg-white text-black hover:opacity-90'
            }`}
            title={proButtonText}
          >
            {proButtonText}
          </button>

          {isLoggedIn && plan === 'pro' && (
            <p className="mt-3 text-center text-xs text-neutral-400">
              Thanks for supporting the project.
            </p>
          )}
        </div>
      </div>

      {/* Comparison table */}
      <div className="mt-12 overflow-hidden rounded-2xl border border-neutral-800">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-neutral-950/60">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-neutral-300">Feature</th>
              <th className="px-4 py-3 font-medium text-neutral-300">Basic</th>
              <th className="px-4 py-3 font-medium text-neutral-300">Pro</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feature} className="border-t border-neutral-800">
                <td className="px-4 py-3 text-neutral-200">{r.feature}</td>
                <td className="px-4 py-3 text-neutral-300">{r.basic}</td>
                <td className="px-4 py-3 text-neutral-300">{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Check() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-none"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.6a1 1 0 0 1-1.43.02L3.3 10.88a1 1 0 1 1 1.4-1.43l3.09 3.02 6.79-6.884a1 1 0 0 1 1.424-.296Z"
        clipRule="evenodd"
      />
    </svg>
  )
}
