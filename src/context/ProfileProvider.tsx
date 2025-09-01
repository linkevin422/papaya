'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    if (!session) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle<Profile>()

    if (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchProfile()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setProfile(null)
      } else {
        fetchProfile()
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [supabase])

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
