'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)

      if (error) {
        console.error('Error exchanging code for session:', error.message)
        router.replace('/login')
        return
      }

      if (data?.session) {
        // ✅ Session is now set in cookies
        router.replace('/dashboard')
      } else {
        router.replace('/login')
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Signing you in...
    </div>
  )
}
