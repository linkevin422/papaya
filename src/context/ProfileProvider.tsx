'use client'

import {
  createContext,
  useContext,
  useEffect,
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

  const fetchProfile = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session

      if (!session?.user) {
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
      console.error('Profile fetch error:', err)
      setProfile(null)
    } finally {
      setInitialized(true)
    }
  }

  useEffect(() => {
    let isMounted = true

    fetchProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!session?.user) {
          if (isMounted) setProfile(null)
        } else {
          fetchProfile()
        }
      }
    )

    return () => {
      isMounted = false
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
