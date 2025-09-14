'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function BillingSuccess() {
  const sp = useSearchParams()
  const router = useRouter()
  const [msg, setMsg] = useState('Finalizing…')

  useEffect(() => {
    const sessionId = sp.get('session_id')
    if (!sessionId) return
    ;(async () => {
      try {
        setMsg('Activating your Pro plan…')
        const res = await fetch(`/api/billing/sync?session_id=${encodeURIComponent(sessionId)}`, {
          method: 'GET',
          credentials: 'include',
        })
        const text = await res.text()
        // debug: show what came back
        console.log('sync raw:', text)
        const json = JSON.parse(text)
        if (!res.ok || !json.ok) throw new Error(json.error || 'sync failed')
        setMsg('Pro activated. Redirecting…')
        setTimeout(() => router.push('/pricing'), 600)
      } catch (e) {
        console.error(e)
        setMsg('Activation failed. Try refresh.')
      }
    })()
  }, [sp, router])

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-semibold">Payment successful ✅</h1>
      <p className="mt-2 text-sm text-neutral-400">{msg}</p>
    </div>
  )
}
