'use client'

import { useState } from 'react'

const PRICE_MONTHLY = process.env.NEXT_PUBLIC_PRICE_PAPAYA_MONTHLY || 'price_test_monthly_REPLACE_ME'
const PRICE_YEARLY  = process.env.NEXT_PUBLIC_PRICE_PAPAYA_YEARLY  || 'price_test_yearly_REPLACE_ME'

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function go(priceId: string) {
    try {
      setLoading(priceId)
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          customerEmail: 'test@example.com',
          userId: 'TEST_USER_ID' // optional; helps your webhook map to a profile
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Checkout failed')
    } finally {
      setLoading(null)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center gap-4 p-8">
      <button
        onClick={() => go(PRICE_MONTHLY)}
        disabled={loading === PRICE_MONTHLY}
        className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20"
      >
        {loading === PRICE_MONTHLY ? 'Loading…' : 'Subscribe Monthly'}
      </button>

      <button
        onClick={() => go(PRICE_YEARLY)}
        disabled={loading === PRICE_YEARLY}
        className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20"
      >
        {loading === PRICE_YEARLY ? 'Loading…' : 'Subscribe Yearly'}
      </button>
    </main>
  )
}
