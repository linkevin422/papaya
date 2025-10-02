// src/app/legal/disclaimer/page.tsx
"use client";

import { useState } from "react";

export default function DisclaimerPage() {
  const [lang, setLang] = useState<"en" | "zh">("en");

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 text-gray-300">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">
          {lang === "en" ? "Disclaimer" : "免責聲明"}
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
            The information and services provided by Papaya are for general
            informational and organizational purposes only. We make no
            guarantees about accuracy, completeness, or reliability.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. Not Financial Advice
          </h2>
          <p className="mb-4">
            Papaya does not provide financial, investment, legal, or tax advice.
            You are solely responsible for your decisions. Always seek
            professional guidance for important financial or business choices.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. Service Availability
          </h2>
          <p className="mb-4">
            We strive to keep Papaya reliable, but we do not guarantee
            uninterrupted or error-free operation. Downtime, bugs, or updates
            may occur.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. No Warranties
          </h2>
          <p className="mb-4">
            Papaya is provided on an “as is” and “as available” basis without
            warranties of any kind, express or implied, including but not
            limited to warranties of merchantability, fitness for a particular
            purpose, or non-infringement.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. Limitation of Liability
          </h2>
          <p className="mb-4">
            To the fullest extent permitted by law, Papaya and its operators are
            not liable for any damages, losses, or claims arising from your use
            or inability to use the platform.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. External Links
          </h2>
          <p className="mb-4">
            Papaya may contain links to third-party websites or services. We are
            not responsible for the content, policies, or practices of those
            third parties.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. Changes
          </h2>
          <p className="mb-4">
            We may update this Disclaimer over time. Continued use of Papaya
            means you accept the revised Disclaimer.
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            7. Governing Language
          </h2>
          <p className="mb-4">
            This Disclaimer is provided in multiple languages for convenience.
            In case of conflict, the English version controls.
          </p>
        </>
      ) : (
        <>
          <p className="mb-4">
            Papaya 提供的資訊與服務僅供一般參考與組織用途。我們不保證其準確性、
            完整性或可靠性。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            1. 非財務建議
          </h2>
          <p className="mb-4">
            Papaya 不提供財務、投資、法律或稅務建議。您需自行對您的決策負責。
            在做出重大財務或商業選擇前，請務必尋求專業建議。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            2. 服務可用性
          </h2>
          <p className="mb-4">
            我們努力維持 Papaya 的穩定，但不保證服務不間斷或無錯誤。
            停機、漏洞或更新皆有可能發生。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            3. 無擔保
          </h2>
          <p className="mb-4">
            Papaya 依「現狀」及「可用性」提供，不附帶任何明示或暗示的保證，
            包括但不限於適售性、特定用途適用性或不侵權之保證。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            4. 責任限制
          </h2>
          <p className="mb-4">
            在法律允許的最大範圍內，Papaya 及其運營者不對因使用或無法使用
            平台所產生的任何損害、損失或索賠承擔責任。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            5. 外部連結
          </h2>
          <p className="mb-4">
            Papaya 可能包含第三方網站或服務的連結。我們不對這些第三方的內容、
            政策或做法負責。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            6. 變更
          </h2>
          <p className="mb-4">
            我們可能隨時更新本《免責聲明》。繼續使用 Papaya
            即表示您接受更新後的內容。
          </p>

          <h2 className="text-xl font-semibold text-white mt-8 mb-3">
            7. 準據語言
          </h2>
          <p className="mb-4">
            本《免責聲明》提供多語版本以方便閱讀。如有衝突，以英文版本為準。
          </p>
        </>
      )}
    </main>
  );
}
