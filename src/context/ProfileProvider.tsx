'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase'

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
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setProfile(null)
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setProfile(data ?? null)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setProfile(null)
    } finally {
      setInitialized(true)
    }
  }

  useEffect(() => {
    fetchProfile()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          setProfile(null)
        } else {
          fetchProfile()
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
