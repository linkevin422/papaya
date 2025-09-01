'use client'

import { useLanguage } from '@/context/LanguageProvider'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section className="flex flex-col items-center justify-center text-center px-6 pt-32 pb-24">
      <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
        {t('hero_title')}
      </h1>
      <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10">
        {t('hero_subtitle')}
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <a
          href="/register"
          className="bg-white text-black text-sm font-semibold px-6 py-3 rounded-full hover:bg-gray-200 transition"
        >
          {t('get_started')}
        </a>
        <a
          href="#features"
          className="border border-white text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-white hover:text-black transition"
        >
          {t('learn_more')}
        </a>
      </div>
    </section>
  )
}
