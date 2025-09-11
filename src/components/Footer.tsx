'use client'

import { useLanguage } from '@/context/LanguageProvider'

export default function Footer() {
  const { lang, setLang } = useLanguage()

  return (
    <footer className="w-full bg-black text-gray-400 text-xs px-6 py-3 flex items-center justify-between border-t border-zinc-800">
      <p>© {new Date().getFullYear()} Papaya</p>
      <nav className="flex space-x-4">
        <a href="/legal/terms" className="hover:text-white transition">Terms</a>
        <a href="/legal/privacy" className="hover:text-white transition">Privacy & Cookies</a>
        <a href="/legal/refund" className="hover:text-white transition">Refund & Cancellation</a>
        <a href="/legal/disclaimer" className="hover:text-white transition">Disclaimer</a>
        <a href="/legal/contact" className="hover:text-white transition">Contact</a>
      </nav>
      <button
        onClick={() => setLang(lang === 'en' ? 'zh-TW' : 'en')}
        className="hover:text-white transition"
      >
        {lang === 'en' ? '中文' : 'EN'}
      </button>
    </footer>
  )
}
