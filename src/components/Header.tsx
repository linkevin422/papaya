'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useLanguage } from '@/context/LanguageProvider'
import { useProfile } from '@/context/ProfileProvider'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const { profile, loading } = useProfile()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Close dropdown on outside click / Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!menuOpen) return
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const loggedIn = !!profile

  const label =
    profile?.handle ||
    profile?.name ||
    profile?.email?.split('@')[0] ||
    'Account'

  const plan = profile?.subscription_level || 'basic'

  return (
    <header className="w-full fixed top-0 z-50 bg-black text-white px-6 py-4 flex items-center justify-between antialiased">
      {/* Logo */}
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Papaya
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="h-8 w-24 rounded-full bg-neutral-900 border border-neutral-800 animate-pulse" />
        ) : !loggedIn ? (
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
        ) : (
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="group flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 border border-neutral-800 hover:border-neutral-700"
            >
              <span className="max-w-[160px] truncate text-sm text-gray-200 font-medium">
                {label}
              </span>
              <span className="text-[10px] rounded-full px-2 py-0.5 bg-neutral-800 text-gray-300 capitalize">
                {plan}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 20 20"
                className="opacity-70 group-hover:opacity-100"
                aria-hidden="true"
              >
                <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
              </svg>
            </button>

            {menuOpen && (
              <div
                ref={menuRef}
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-800 bg-neutral-950 shadow-lg overflow-hidden"
              >
                <div className="px-3 py-2 text-xs text-gray-400 flex items-center gap-2">
                  <span className="font-medium text-gray-200">{label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 capitalize">
                    {plan}
                  </span>
                </div>
                <div className="h-px bg-neutral-800" />

                <MenuItem href="/dashboard" onClick={() => setMenuOpen(false)}>
                  {t('dashboard')}
                </MenuItem>
                <MenuItem href="/dashboard/settings" onClick={() => setMenuOpen(false)}>
                  {t('settings')} · {t('profile')}
                </MenuItem>
                <MenuItem href="/dashboard/billing" onClick={() => setMenuOpen(false)}>
                  {t('billing') || 'Billing / Upgrade'}
                </MenuItem>

                <div className="h-px bg-neutral-800" />

                <MenuButton
                  onClick={async () => {
                    await supabase.auth.signOut()
                    setMenuOpen(false)
                    router.push('/')
                  }}
                  destructive
                >
                  {t('logout')}
                </MenuButton>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

function MenuItem({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="block px-3 py-2 text-sm text-gray-200 hover:bg-neutral-900"
    >
      {children}
    </Link>
  )
}

function MenuButton({
  children,
  onClick,
  destructive = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  destructive?: boolean
}) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-900 ${
        destructive ? 'text-red-400 hover:text-red-300' : 'text-gray-200'
      }`}
    >
      {children}
    </button>
  )
}
