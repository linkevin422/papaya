'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase'

export type SubscriptionLevel = 'basic' | 'pro'

type Profile = {
  id: string
  email: string | null
  handle: string | null
  name: string | null
  subscription_level: SubscriptionLevel | null
  created_at: string
  updated_at: string
}

type ProfileContextType = {
  profile: Profile | null
  loading: boolean
  refresh: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) {
        setProfile(null)
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id,email,handle,name,subscription_level,created_at,updated_at'
        )
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      setProfile({
        ...data,
        subscription_level: (data.subscription_level ??
          'basic') as SubscriptionLevel,
      })
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event) => {
      fetchProfile()
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
