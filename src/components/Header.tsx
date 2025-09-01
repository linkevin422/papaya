'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageProvider'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [loggedIn, setLoggedIn] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setLoggedIn(!!data.session)
    }
    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <header className="w-full fixed top-0 z-50 bg-black text-white px-6 py-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="text-lg font-bold">
        Papaya
      </Link>

      {/* Auth Section */}
      <div className="flex items-center gap-4">
        {loggedIn ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white">
              {t('dashboard')}
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                setLoggedIn(false)
                router.push('/')
              }}
              className="text-sm font-medium text-gray-300 hover:text-white"
            >
              {t('logout')}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white">
              {t('login')}
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-white text-black px-4 py-1.5 rounded-full hover:bg-gray-200 transition"
            >
              {t('signup')}
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
