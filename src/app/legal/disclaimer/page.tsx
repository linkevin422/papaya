// src/app/legal/disclaimer/page.tsx
'use client'

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Disclaimer</h1>
      <p className="mb-4">
        The information and services provided by Papaya are for general informational 
        and organizational purposes only. We make no guarantees about accuracy, 
        completeness, or reliability.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">1. Not Financial Advice</h2>
      <p className="mb-4">
        Papaya does not provide financial, investment, legal, or tax advice. You are solely 
        responsible for your financial decisions. Always seek professional guidance 
        when making important financial or business choices.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">2. Service Availability</h2>
      <p className="mb-4">
        We strive to keep Papaya available and reliable, but we do not guarantee 
        uninterrupted or error-free operation. Downtime, bugs, or updates may occur.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">3. Limitation of Liability</h2>
      <p className="mb-4">
        To the fullest extent permitted by law, Papaya and its operators are not liable 
        for any damages, losses, or claims arising from your use or inability to use the 
        platform.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">4. External Links</h2>
      <p className="mb-4">
        Papaya may contain links to third-party websites or services. We are not 
        responsible for the content, policies, or practices of those third parties.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">5. Changes</h2>
      <p className="mb-4">
        We may update this Disclaimer from time to time. Continued use of Papaya after 
        changes means you accept the revised Disclaimer.
      </p>
    </main>
  )
}
