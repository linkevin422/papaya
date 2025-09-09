'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()
  const [errMsg, setErrMsg] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error('exchangeCodeForSession:', error)
        setErrMsg(error.message)
        return
      }
      if (!data?.session) {
        setErrMsg('No session after exchange')
        return
      }

      const user = data.session.user
      const meta = user.user_metadata || {}

      try {
        const resp = await fetch('/api/profile/upsert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            name: meta.name ?? null,
            handle: meta.handle ?? null,
          }),
        })
        const body = await resp.json().catch(() => ({} as any))
        if (!resp.ok) {
          console.error('profile upsert error:', body)
          setErrMsg(body.error || 'Profile upsert failed')
          return
        }
      } catch (e: any) {
        console.error('profile upsert threw:', e)
        setErrMsg(e.message || 'Profile upsert threw')
        return
      }

      router.replace('/dashboard')
    }
    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      {errMsg ? `Error: ${errMsg}` : 'Signing you in...'}
    </div>
  )
}
