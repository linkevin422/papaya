"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageProvider";

export default function Footer() {
  const { lang, setLang } = useLanguage();

  return (
    <footer className="w-full bg-black text-gray-400 text-xs px-6 py-3 flex items-center justify-between border-t border-zinc-800">
      <p>© {new Date().getFullYear()} Papaya</p>
      <nav className="flex space-x-4">
        <Link href="/legal/terms" className="hover:text-white transition">
          Terms
        </Link>
        <Link href="/legal/privacy" className="hover:text-white transition">
          Privacy & Cookies
        </Link>
        <Link href="/legal/refund" className="hover:text-white transition">
          Refund & Cancellation
        </Link>
        <Link href="/legal/disclaimer" className="hover:text-white transition">
          Disclaimer
        </Link>
        <Link href="/legal/contact" className="hover:text-white transition">
          Contact
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
