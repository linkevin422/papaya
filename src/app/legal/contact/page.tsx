// src/app/legal/contact/page.tsx
"use client";

import { useState } from "react";

export default function ContactPage() {
  const [lang, setLang] = useState<"en" | "zh">("en");

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          {lang === "en" ? "Contact / Imprint" : "聯絡方式 / 出版資訊"}
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
            If you have questions about Papaya, your account, or our policies,
            please reach out using the details below.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            Contact
          </h2>
          <p className="mb-4">
            Email:{" "}
            <a
              href="mailto:r5ayxhe8e@mozmail.com"
              className="text-blue-400 hover:underline"
            >
              r5ayxhe8e@mozmail.com
            </a>
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            Imprint
          </h2>
          <p className="mb-4">
            Operator: <span className="text-gray-400">Link 林沛儒</span>
            <br />
            Jurisdiction: <span className="text-gray-400">Taiwan</span>
          </p>

          <p className="mt-8 text-sm text-gray-500">
            This Contact / Imprint page is provided for transparency and legal
            compliance. Please only use the contact details above for official
            inquiries.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            若您對 Papaya、帳號或我們的政策有任何問題，請使用以下方式聯絡我們。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            聯絡方式
          </h2>
          <p className="mb-4">
            電子郵件：{" "}
            <a
              href="mailto:r5ayxhe8e@mozmail.com"
              className="text-blue-400 hover:underline"
            >
              r5ayxhe8e@mozmail.com
            </a>
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            出版資訊
          </h2>
          <p className="mb-4">
            營運者：<span className="text-gray-400">Link 林沛儒</span>
            <br />
            司法管轄：<span className="text-gray-400">台灣</span>
          </p>

          <p className="mt-8 text-sm text-gray-500">
            本「聯絡方式 / 出版資訊」頁面依透明度與法律需求而提供。
            請僅將以上聯絡方式用於正式查詢。
          </p>
        </>
      )}
    </main>
  );
}
