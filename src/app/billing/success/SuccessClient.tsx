// src/app/billing/success/success-client.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingSuccessClient({ sessionId }: { sessionId?: string }) {
  const router = useRouter()
  const [msg, setMsg] = useState('Finalizing…')

  useEffect(() => {
    if (!sessionId) {
      setMsg('Missing session ID ❌')
      return
    }

    ;(async () => {
      try {
        setMsg('Activating your Pro plan…')
        const res = await fetch(`/api/billing/sync?session_id=${encodeURIComponent(sessionId)}`, {
          method: 'GET',
          credentials: 'include',
        })
        const json = await res.json()
        if (!res.ok || !json.ok) throw new Error(json.error || 'sync failed')
        setMsg('Pro activated. Redirecting…')
        setTimeout(() => router.push('/pricing'), 600)
      } catch (e) {
        console.error(e)
        setMsg('Activation failed. Try refresh.')
      }
    })()
  }, [sessionId, router])

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Payment successful ✅</h1>
      <p className="mt-2 text-sm text-neutral-400">{msg}</p>
    </div>
  )
}
