'use client'

import { useLanguage } from '@/context/LanguageProvider'

export default function Footer() {
  const { lang, setLang } = useLanguage()

  return (
    <footer className="w-full bg-black text-gray-400 text-xs px-6 py-3 flex items-center justify-between border-t border-zinc-800">
      <p>© {new Date().getFullYear()} Papaya</p>
      <button
        onClick={() => setLang(lang === 'en' ? 'zh-TW' : 'en')}
        className="hover:text-white transition"
      >
        {lang === 'en' ? '中文' : 'EN'}
      </button>
    </footer>
  )
}
