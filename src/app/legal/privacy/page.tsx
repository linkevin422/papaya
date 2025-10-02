// src/app/legal/privacy/page.tsx
"use client";

import { useState } from "react";

export default function PrivacyPage() {
  const [lang, setLang] = useState<"en" | "zh">("en");

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          {lang === "en" ? "Privacy & Cookies Policy" : "隱私與 Cookie 政策"}
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
            Papaya values your privacy. This policy explains what information we
            collect, how we use it, and your rights regarding your data. By
            using Papaya, you consent to this Privacy & Cookies Policy.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. Information We Collect
          </h2>
          <p className="mb-4">
            We collect information you provide when creating an account (such as
            email), payment details processed securely through Stripe, and usage
            data through analytics tools like Google Analytics.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. How We Use Information
          </h2>
          <p className="mb-4">
            We use your information to provide and improve services, process
            payments, communicate with you, and ensure platform security. We do
            not sell your personal data to third parties.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. Data Storage & Security
          </h2>
          <p className="mb-4">
            Your data is stored securely via our hosting providers and Supabase.
            While we implement industry-standard safeguards, no method of
            storage or transmission is 100% secure. We retain personal data only
            as long as necessary to provide services or comply with legal
            obligations.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. Cookies & Tracking
          </h2>
          <p className="mb-4">
            Papaya uses cookies and similar technologies to improve your
            experience and analyze usage through Google Analytics. You may
            adjust browser settings to block or delete cookies, but some
            features may not function properly.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. Third-Party Services
          </h2>
          <p className="mb-4">
            We rely on third-party services such as Stripe for payment
            processing and Google Analytics for usage tracking. These providers
            may collect information in accordance with their own privacy
            policies.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. Your Rights
          </h2>
          <p className="mb-4">
            Depending on your location, you may have rights to access, correct,
            or delete your personal data. To exercise these rights, email us at{" "}
            <a href="mailto:r5ayxhe8e@mozmail.com" className="underline">
              r5ayxhe8e@mozmail.com
            </a>
            .
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            7. Changes to this Policy
          </h2>
          <p className="mb-4">
            We may update this Privacy & Cookies Policy over time. Continued use
            of Papaya means you accept the revised policy.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            8. Governing Language
          </h2>
          <p className="mb-4">
            This policy is provided in multiple languages for convenience. In
            case of conflict, the English version controls.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            Papaya
            重視您的隱私。本政策說明我們收集哪些資訊、如何使用，以及您對個人資料的權利。
            使用 Papaya 即表示您同意本《隱私與 Cookie 政策》。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. 我們收集的資訊
          </h2>
          <p className="mb-4">
            當您建立帳號時（如電子郵件）、透過 Stripe 處理付款，以及使用 Google
            Analytics 等分析工具時，我們會收集相關資訊。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. 我們如何使用資訊
          </h2>
          <p className="mb-4">
            我們使用您的資訊來提供與改進服務、處理付款、與您溝通，以及確保平台安全。
            我們不會將您的個人資料販售給第三方。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. 資料儲存與安全
          </h2>
          <p className="mb-4">
            您的資料會透過我們的主機供應商與 Supabase 安全儲存。
            雖然我們採用業界標準的防護措施，但任何傳輸或儲存方式都無法保證 100%
            安全。 我們僅在提供服務或符合法律要求的期間內保留個人資料。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. Cookies 與追蹤
          </h2>
          <p className="mb-4">
            Papaya 使用 Cookies 與類似技術來改善體驗，並透過 Google Analytics
            分析使用情況。 您可在瀏覽器中調整設定以封鎖或刪除
            Cookies，但部分功能可能無法正常運作。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. 第三方服務
          </h2>
          <p className="mb-4">
            我們依賴第三方服務，例如 Stripe（付款處理）與 Google
            Analytics（使用追蹤）。 這些服務提供商可能依其隱私政策收集資訊。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. 您的權利
          </h2>
          <p className="mb-4">
            視您所在的地區，您可能擁有存取、更正或刪除個人資料的權利。
            若要行使這些權利，請透過電子郵件聯絡我們：
            <a href="mailto:r5ayxhe8e@mozmail.com" className="underline ml-1">
              r5ayxhe8e@mozmail.com
            </a>
            。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            7. 政策變更
          </h2>
          <p className="mb-4">
            我們可能隨時更新本《隱私與 Cookie 政策》。繼續使用 Papaya
            即表示您接受更新後的政策。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            8. 準據語言
          </h2>
          <p className="mb-4">
            本政策提供多語版本以方便閱讀。如有衝突，以英文版本為準。
          </p>
        </>
      )}
    </main>
  );
}
