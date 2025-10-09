"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageProvider";

export default function Footer() {
  const { lang, setLang, t } = useLanguage();

  return (
    <footer className="w-full border-t border-white/10 bg-black/80 backdrop-blur-sm text-gray-400 text-xs supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-5 max-w-7xl text-center sm:text-left">
        {/* left */}
        <p className="opacity-80">© {new Date().getFullYear()} Papaya</p>

        {/* center nav */}
        <nav className="flex flex-wrap justify-center sm:justify-end gap-3 sm:gap-5 text-xs">
          <Link href="/legal/terms" className="hover:text-white transition">
            {t("footer_terms")}
          </Link>
          <Link href="/legal/privacy" className="hover:text-white transition">
            {t("footer_privacy")}
          </Link>
          <Link href="/legal/refund" className="hover:text-white transition">
            {t("footer_refund")}
          </Link>
          <Link
            href="/legal/disclaimer"
            className="hover:text-white transition"
          >
            {t("footer_disclaimer")}
          </Link>
          <Link href="/legal/contact" className="hover:text-white transition">
            {t("footer_contact")}
          </Link>
        </nav>

        {/* right language toggle */}
        <button
          onClick={() => setLang(lang === "en" ? "zh_tw" : "en")}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 hover:text-white transition text-[11px] tracking-wide"
        >
          {lang === "en" ? "中文" : "EN"}
        </button>
      </div>
    </footer>
  );
}
