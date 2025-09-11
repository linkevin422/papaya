// src/app/legal/refund/page.tsx
'use client'

export default function RefundPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Refund & Cancellation Policy</h1>
      <p className="mb-4">
        This policy explains how refunds and cancellations work for Papaya subscriptions. 
        By subscribing, you agree to the terms below.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Subscriptions</h2>
      <p className="mb-4">
        Papaya operates on a recurring subscription model, billed through our payment 
        processor, Stripe. Your subscription will automatically renew unless canceled 
        before the next billing cycle.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Cancellations</h2>
      <p className="mb-4">
        You may cancel your subscription at any time from your account settings. 
        Cancellations take effect at the end of the current billing period. You will 
        continue to have access to Papaya until that period ends.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Refunds</h2>
      <p className="mb-4">
        All subscription payments are generally non-refundable. Refunds will only be 
        granted in cases required by law or at our sole discretion (e.g., duplicate 
        charges, proven technical errors).
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Trials</h2>
      <p className="mb-4">
        If Papaya offers a free trial, you will not be charged until the trial ends. 
        To avoid charges, you must cancel before the trial period finishes.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Contact</h2>
      <p className="mb-4">
        For any billing or refund questions, please reach out through our Contact page.
      </p>
    </main>
  )
}
