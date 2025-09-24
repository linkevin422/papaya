'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import en from '@/locales/en.json'
import zhTW from '@/locales/zh_tw.json'

type Locale = 'en' | 'zh_tw'
type Translations = typeof en

const dictionaries: Record<Locale, Translations> = {
  en,
  zh_tw: zhTW,
}

type LanguageContextType = {
  lang: Locale
  setLang: (lang: Locale) => void
  t: (key: keyof Translations | string, vars?: Record<string, string>) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Locale>('en')

  // hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lang') as Locale | null
    if (stored && (stored === 'en' || stored === 'zh_tw')) {
      setLangState(stored)
    }
  }, [])

  // wrapper to set both state and storage
  const setLang = (newLang: Locale) => {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
  }

  const t = (key: string, vars?: Record<string, string>) => {
    const dict = dictionaries[lang]
    let text = (dict as any)[key] || key
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
