"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageProvider";

export default function Footer() {
  const { lang, setLang, t } = useLanguage();

  return (
    <footer className="w-full bg-black text-gray-400 text-xs px-6 py-3 flex items-center justify-between border-t border-zinc-800">
      <p>© {new Date().getFullYear()} Papaya</p>
      <nav className="flex space-x-4">
        <Link href="/legal/terms" className="hover:text-white transition">
          {t("footer_terms")}
        </Link>
        <Link href="/legal/privacy" className="hover:text-white transition">
          {t("footer_privacy")}
        </Link>
        <Link href="/legal/refund" className="hover:text-white transition">
          {t("footer_refund")}
        </Link>
        <Link href="/legal/disclaimer" className="hover:text-white transition">
          {t("footer_disclaimer")}
        </Link>
        <Link href="/legal/contact" className="hover:text-white transition">
          {t("footer_contact")}
        </Link>
      </nav>
      <button
        onClick={() => setLang(lang === "en" ? "zh_tw" : "en")}
        className="hover:text-white transition"
      >
        {lang === "en" ? "中文" : "EN"}
      </button>
    </footer>
  );
}
