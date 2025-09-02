'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

type Flow = {
  id: string
  name: string
  emoji: string | null
  color: string | null
  created_at: string
}

export default function FlowsPage() {
  const supabase = createClient()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFlows = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const user_id = userData.user?.id

      if (!user_id) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (data) setFlows(data)
      setLoading(false)
    }

    fetchFlows()
  }, [])

  if (loading) return <p className="p-6 text-sm opacity-70">Loading flows…</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Your Flows</h1>
        <Link
          href="/flows/new"
          className="text-sm px-4 py-2 rounded-lg bg-sky-500 text-black hover:bg-sky-400"
        >
          + New Flow
        </Link>
      </div>

      {flows.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 p-6 text-center">
          <p className="text-sm opacity-80 mb-4">You don’t have any Flows yet.</p>
          <Link
            href="/flows/new"
            className="text-sm font-medium underline hover:text-sky-400"
          >
            Start your first Flow →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flows.map((flow) => (
            <Link
              key={flow.id}
              href={`/flows/${flow.id}`}
              className="rounded-xl border border-neutral-800 p-4 hover:bg-neutral-900 transition"
              style={{ borderColor: flow.color || '#888' }}
            >
              <div className="text-2xl mb-2">
                {flow.emoji || '📦'}
              </div>
              <div className="text-sm font-semibold">{flow.name}</div>
              <div className="text-xs opacity-50 mt-1">
                Created {new Date(flow.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
