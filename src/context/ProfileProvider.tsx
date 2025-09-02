'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

type Profile = {
  id: string
  email: string | null
  handle: string | null
  name: string | null
  subscription_level: 'basic' | 'pro' | null
  created_at: string
  updated_at: string
}

type ProfileContextType = {
  profile: Profile | null
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [initialized, setInitialized] = useState(false)
  const mountedRef = useRef(false)

  const fetchProfile = async () => {
    try {
      console.log('[debug] fetching session...')
      const { data: sessionData, error } = await supabase.auth.getSession()
      console.log('[debug] sessionData:', sessionData)
      console.log('[debug] session error:', error)

      const session = sessionData.session

      if (!session?.user) {
        console.log('[debug] no session user, setting profile null')
        setProfile(null)
      } else {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data ?? null)
      }
    } catch (err) {
      console.error('[debug] fetchProfile error:', err)
      setProfile(null)
    } finally {
      console.log('[debug] initialized true')
      setInitialized(true)
    }
  }

  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    fetchProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!session?.user) {
          setProfile(null)
        } else {
          if (session.user.id !== profile?.id) {
            fetchProfile()
          }
        }
      }
    )

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm opacity-70">Loading…</span>
      </div>
    )
  }

  return (
    <ProfileContext.Provider
      value={{
        profile,
        refresh: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
