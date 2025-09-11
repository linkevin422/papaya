// src/app/legal/terms/page.tsx
'use client'

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
      <p className="mb-4">
        Welcome to Papaya. By accessing or using our website, applications, or services, 
        you agree to be bound by these Terms of Service. If you do not agree, please 
        discontinue use of Papaya immediately.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Use of Service</h2>
      <p className="mb-4">
        You must be at least 18 years old, or the age of majority in your jurisdiction, 
        to use Papaya. You agree not to misuse the service, attempt to disrupt it, or 
        use it for unlawful purposes.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Accounts</h2>
      <p className="mb-4">
        You are responsible for maintaining the confidentiality of your account login 
        credentials and for all activities under your account. Notify us immediately of 
        unauthorized use.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Subscriptions & Payments</h2>
      <p className="mb-4">
        Papaya operates on a subscription model. By subscribing, you authorize us 
        (via our payment processor, Stripe) to charge your chosen payment method on a 
        recurring basis until you cancel. Cancellations must be made before the next billing 
        cycle to avoid further charges.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Refunds</h2>
      <p className="mb-4">
        Our Refund & Cancellation Policy, available separately, governs eligibility for 
        refunds. Unless explicitly stated, all payments are non-refundable.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Intellectual Property</h2>
      <p className="mb-4">
        All content, code, and branding associated with Papaya are owned by us or our 
        licensors. You may not copy, distribute, or reverse-engineer our platform without 
        prior written consent.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Disclaimer & Limitation of Liability</h2>
      <p className="mb-4">
        Papaya is provided "as is" without warranties of any kind. We are not liable for 
        damages, losses, or issues arising from your use of the service.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Changes to Terms</h2>
      <p className="mb-4">
        We may update these Terms from time to time. Continued use of Papaya after changes 
        means you accept the revised Terms.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">8. Contact</h2>
      <p className="mb-4">
        For questions regarding these Terms, please reach out through our Contact page.
      </p>
    </main>
  )
}
