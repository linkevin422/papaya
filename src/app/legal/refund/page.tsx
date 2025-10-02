// src/app/legal/refund/page.tsx
"use client";

import { useState } from "react";

export default function RefundPage() {
  const [lang, setLang] = useState<"en" | "zh">("en");

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          {lang === "en" ? "Refund & Cancellation Policy" : "退款與取消政策"}
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
            This policy explains how refunds and cancellations work for Papaya
            subscriptions. By subscribing, you agree to the terms below.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. Subscriptions
          </h2>
          <p className="mb-4">
            Papaya operates on a recurring subscription model, billed through
            Stripe. Your subscription will automatically renew unless canceled
            before the next billing cycle.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. Cancellations
          </h2>
          <p className="mb-4">
            You may cancel your subscription at any time from your account
            settings. Cancellations take effect at the end of the current
            billing period. We do not issue pro-rated refunds for unused time.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. Refunds
          </h2>
          <p className="mb-4">
            All subscription payments are non-refundable except where required
            by law or at our discretion (e.g., duplicate charges, confirmed
            technical errors).
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. Trials
          </h2>
          <p className="mb-4">
            If Papaya offers a free trial, you will not be charged until the
            trial ends. To avoid charges, cancel before the trial period
            finishes.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. Updates
          </h2>
          <p className="mb-4">
            We may update this policy at any time. The updated version will
            apply to future billing cycles.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. Contact
          </h2>
          <p className="mb-4">
            For billing or refund questions, email us at{" "}
            <a href="mailto:r5ayxhe8e@mozmail.com" className="underline">
              r5ayxhe8e@mozmail.com
            </a>
            .
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            本政策說明 Papaya 訂閱的退款與取消方式。訂閱即表示您同意以下條款。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. 訂閱
          </h2>
          <p className="mb-4">
            Papaya 採用循環訂閱制，透過 Stripe 收費。
            除非您在下個計費週期前取消，否則訂閱將自動續訂。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. 取消
          </h2>
          <p className="mb-4">
            您可以隨時在帳號設定中取消訂閱。取消將於目前計費週期結束時生效。
            未使用的時間不會提供部分退款。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. 退款
          </h2>
          <p className="mb-4">
            所有訂閱付款概不退還，除非法律要求或我們自行判斷（例如重複扣款、經證實的技術錯誤）。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. 試用
          </h2>
          <p className="mb-4">
            若 Papaya 提供免費試用，試用結束前不會收費。
            若要避免收費，您必須在試用期結束前取消。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. 政策更新
          </h2>
          <p className="mb-4">
            我們可能隨時更新本政策。更新後的版本將適用於未來的計費週期。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. 聯絡方式
          </h2>
          <p className="mb-4">
            若有帳單或退款相關問題，請聯絡：
            <a href="mailto:r5ayxhe8e@mozmail.com" className="underline ml-1">
              r5ayxhe8e@mozmail.com
            </a>
          </p>
        </>
      )}
    </main>
  );
}
