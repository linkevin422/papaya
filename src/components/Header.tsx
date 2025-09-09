'use client'

import Link from 'next/link'
import { useProfile } from '@/context/ProfileProvider'
import { useLanguage } from '@/context/LanguageProvider'
import { createClient } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

export default function Header() {
  const { profile } = useProfile()
  const { t } = useLanguage()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [firstFlowId, setFirstFlowId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  // Fetch user's first flow
  useEffect(() => {
    const fetchFirstFlow = async () => {
      if (!profile) return
      const { data } = await supabase
        .from('flows')
        .select('id')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      if (data) setFirstFlowId(data.id)
    }
    fetchFirstFlow()
  }, [profile, supabase])

  return (
    <header className="fixed top-0 left-0 right-0 z-20 border-b border-neutral-800 bg-black/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo + Primary nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Papaya
          </Link>

          <Link
            href={profile ? (firstFlowId ? `/flows/${firstFlowId}` : '/flows') : '/login'}
            className="text-sm opacity-80 hover:opacity-100"
          >
            My Flow
          </Link>

          {/* New: Pricing link */}
          <Link
            href="/pricing"
            className="text-sm opacity-80 hover:opacity-100"
          >
            Pricing
          </Link>
        </div>

        {/* Right side */}
        {profile ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-neutral-900"
            >
              <span className="text-sm">
                {profile.handle ?? profile.email}
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${
                  menuOpen ? 'rotate-180 opacity-100' : 'opacity-70'
                }`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 shadow-xl">
                <Link
                  href="/dashboard"
                  className="block px-4 py-2 text-sm hover:bg-neutral-900"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('dashboard')}
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-sm hover:bg-neutral-900"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('settings')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-900"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm opacity-80 hover:opacity-100"
            >
              {t('login')}
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black hover:bg-gray-200"
            >
              {t('signup')}
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
