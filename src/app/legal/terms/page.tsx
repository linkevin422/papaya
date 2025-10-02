// src/app/legal/terms/page.tsx
"use client";

import { useState } from "react";

export default function TermsPage() {
  const [lang, setLang] = useState<"en" | "zh">("en");

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          {lang === "en" ? "Terms of Service" : "服務條款"}
        </h1>
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          {lang === "en" ? "中文" : "EN"}
        </button>
      </div>

      {lang === "en" ? (
        <>
          <p className="mb-4">
            Welcome to Papaya. By using our website, applications, or services,
            you agree to these Terms. If you do not agree, please stop using
            Papaya.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. Use of Service
          </h2>
          <p className="mb-4">
            You must be at least 18 years old, or the age of majority in your
            jurisdiction, to use Papaya. Use Papaya responsibly and legally. Do
            not attempt to disrupt or misuse the service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. Accounts
          </h2>
          <p className="mb-4">
            You are responsible for keeping your login secure and for all
            activity on your account. Notify us immediately if you suspect
            unauthorized use.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. Subscriptions &amp; Payments
          </h2>
          <p className="mb-4">
            Papaya uses subscriptions. By subscribing, you allow us (through
            Stripe) to charge your payment method on a recurring basis until you
            cancel. Cancel before your next billing cycle to avoid charges.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. Refunds
          </h2>
          <p className="mb-4">
            All payments are non-refundable except where required by law.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. Intellectual Property
          </h2>
          <p className="mb-4">
            Papaya’s code, branding, and content belong to us or our licensors.
            Do not copy, distribute, or reverse-engineer without permission.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. User Content
          </h2>
          <p className="mb-4">
            When you create or share maps on Papaya, you keep ownership of your
            content. By posting, you grant Papaya a license to display and share
            it within the platform. You are responsible for ensuring your
            content is legal and safe.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            7. Disclaimer &amp; Limitation of Liability
          </h2>
          <p className="mb-4">
            Papaya is provided &quot;as is&quot; with no warranties. We are not
            liable for damages or losses from using the service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            8. Changes
          </h2>
          <p className="mb-4">
            We may update these Terms. Continued use after updates means you
            accept them.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            9. Governing Law &amp; Language
          </h2>
          <p className="mb-4">
            These Terms are governed by the laws of Taiwan. In case of conflict,
            the English version controls.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            10. Contact
          </h2>
          <p className="mb-4">Email: r5ayxhe8e@mozmail.com</p>
        </>
      ) : (
        <>
          {/* Chinese section unchanged */}
          <p className="mb-4">
            歡迎使用
            Papaya。使用我們的網站、應用程式或服務，即表示您同意本服務條款。
            如果您不同意，請立即停止使用。
          </p>
          {/* ... rest unchanged */}
        </>
      )}
    </main>
  );
}
