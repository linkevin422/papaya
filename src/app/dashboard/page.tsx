'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type Profile = {
  id: string
  email: string
  subscription_level: string
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, subscription_level')
        .eq('id', sessionData.session.user.id)
        .single()

      if (!error) setProfile(data as Profile)
      setLoading(false)
    }

    load()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-6 text-white">
        <div className="h-6 w-48 bg-zinc-800 animate-pulse rounded"></div>
        <div className="h-4 w-32 bg-zinc-800 animate-pulse rounded"></div>
        <div className="h-10 w-24 bg-zinc-800 animate-pulse rounded"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Could not load profile
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Welcome, {profile.email}</h1>
      <p className="mb-4">Subscription: {profile.subscription_level}</p>
      <button
        onClick={async () => {
          await supabase.auth.signOut()
          router.push('/login')
        }}
        className="py-2 px-4 bg-white text-black rounded hover:bg-gray-200 transition"
      >
        Log out
      </button>
    </div>
  )
}
