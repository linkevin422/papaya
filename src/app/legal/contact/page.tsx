// src/app/legal/contact/page.tsx
'use client'

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <h1 className="text-3xl font-bold text-white mb-6">Contact / Imprint</h1>
      <p className="mb-4">
        If you have any questions regarding Papaya, your account, or our policies, 
        please reach out using the details below.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Contact</h2>
      <p className="mb-4">
        Email: <a href="mailto:r5ayxhe8e@mozmail.com" className="text-blue-400 hover:underline">
          r5ayxhe8e@mozmail.com
        </a>
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">Imprint</h2>
      <p className="mb-4">
        Operator: <span className="text-gray-400">Link</span><br />
        Jurisdiction: <span className="text-gray-400">Canada</span>
      </p>

      <p className="mt-8 text-sm text-gray-500">
        This Contact / Imprint page is provided to meet transparency and legal requirements. 
        For privacy reasons, please only use the contact details above for official inquiries.
      </p>
    </main>
  )
}
