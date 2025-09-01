'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import en from '@/locales/en.json'
import zhTW from '@/locales/zh-TW.json'

type Locale = 'en' | 'zh-TW'
type Translations = typeof en

const dictionaries: Record<Locale, Translations> = {
  en,
  'zh-TW': zhTW,
}

type LanguageContextType = {
  lang: Locale
  setLang: (lang: Locale) => void
  t: (key: keyof Translations, vars?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Locale>('en')

  const t = (key: keyof Translations, vars?: Record<string, string>) => {
    let text = dictionaries[lang][key] || key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        text = text.replace(`{{${k}}}`, v)
      })
    }
    return text
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}