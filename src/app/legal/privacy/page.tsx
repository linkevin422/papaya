// src/app/legal/privacy/page.tsx
'use client'

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy & Cookies</h1>
      <p className="mb-4">
        Papaya values your privacy. This policy explains what information we collect, how
        we use it, and your rights regarding your data. By using Papaya, you consent to
        this Privacy & Cookies Policy.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Information We Collect</h2>
      <p className="mb-4">
        We collect information you provide when creating an account (such as email), 
        payment details processed securely through Stripe, and usage data through 
        analytics tools like Google Analytics.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. How We Use Information</h2>
      <p className="mb-4">
        We use your information to provide and improve our services, process payments, 
        communicate with you, and ensure platform security. We do not sell your personal 
        data to third parties.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Data Storage & Security</h2>
      <p className="mb-4">
        Your data is stored securely via our hosting providers and Supabase. While we 
        implement industry-standard safeguards, no method of storage or transmission is 
        100% secure.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. Cookies & Tracking</h2>
      <p className="mb-4">
        Papaya uses cookies and similar technologies to improve your experience and 
        analyze usage through Google Analytics. You may adjust your browser settings 
        to block or delete cookies, but some features may not function properly.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Third-Party Services</h2>
      <p className="mb-4">
        We rely on third-party services such as Stripe for payment processing and Google 
        Analytics for usage tracking. These providers may collect information in 
        accordance with their own privacy policies.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">6. Your Rights</h2>
      <p className="mb-4">
        Depending on your location, you may have rights to access, correct, or delete 
        your personal data. To exercise these rights, please contact us through our 
        Contact page.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">7. Changes to this Policy</h2>
      <p className="mb-4">
        We may update this Privacy & Cookies Policy over time. Continued use of Papaya 
        means you accept the revised policy.
      </p>
    </main>
  )
}
