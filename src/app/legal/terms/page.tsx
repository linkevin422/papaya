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
            3. Subscriptions & Payments
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
            7. Disclaimer & Limitation of Liability
          </h2>
          <p className="mb-4">
            Papaya is provided "as is" with no warranties. We are not liable for
            damages or losses from using the service.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            8. Changes
          </h2>
          <p className="mb-4">
            We may update these Terms. Continued use after updates means you
            accept them.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            9. Governing Law & Language
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
          <p className="mb-4">
            歡迎使用
            Papaya。使用我們的網站、應用程式或服務，即表示您同意本服務條款。
            如果您不同意，請立即停止使用。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. 服務使用
          </h2>
          <p className="mb-4">
            您必須年滿 18 歲，或已達您所在司法管轄區的成年年齡，方可使用
            Papaya。 請合法且負責地使用 Papaya，不得嘗試干擾或濫用服務。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. 帳戶
          </h2>
          <p className="mb-4">
            您需負責保護帳號安全，並對帳號下的所有活動負責。
            如有未經授權的使用，請立即通知我們。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. 訂閱與付款
          </h2>
          <p className="mb-4">
            Papaya 採用訂閱制。訂閱後，您授權我們（透過 Stripe）定期扣款，
            直到您取消為止。請於下一個計費週期前取消以避免被收費。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. 退款
          </h2>
          <p className="mb-4">除法律強制要求外，所有付款概不退還。</p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. 智慧財產權
          </h2>
          <p className="mb-4">
            Papaya 的程式碼、品牌與內容屬於我們或授權方所有。
            未經許可，不得複製、散佈或進行逆向工程。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. 使用者內容
          </h2>
          <p className="mb-4">
            當您在 Papaya 建立或分享地圖時，您仍擁有其所有權。 但發佈後，您授權
            Papaya 在平台內顯示及分享。 您需自行確保內容合法且安全。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            7. 免責聲明與責任限制
          </h2>
          <p className="mb-4">
            Papaya 依「現狀」提供，不附帶任何保證。
            我們不對因使用服務而造成的損害或損失負責。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            8. 條款變更
          </h2>
          <p className="mb-4">
            我們可能更新本條款。繼續使用即表示您接受更新後的條款。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            9. 準據法與語言
          </h2>
          <p className="mb-4">
            本條款受台灣法律管轄。如中英文版本有衝突，以英文版本為準。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            10. 聯絡方式
          </h2>
          <p className="mb-4">電子郵件：r5ayxhe8e@mozmail.com</p>
        </>
      )}
    </main>
  );
}
