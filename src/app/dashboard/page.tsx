/* eslint-disable react/no-unescaped-entities */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useProfile } from '@/context/ProfileProvider'

type Flow = {
  id: string
  name: string
  created_at: string
  privacy: 'private' | 'public'
  public_mode: number | null
}

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile } = useProfile()
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      // ensure user is logged in
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        router.replace('/login')
        return
      }

      // fetch flows for this user
      const { data, error } = await supabase
        .from('flows')
        .select('id, name, created_at, privacy, public_mode')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setFlows(data ?? [])
      setLoading(false)
    }

    load()
  }, [supabase, router])

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-800 p-4">
        <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
        <p className="text-sm text-neutral-400">
          Here's your dashboard. Start with the checklist below to get set up.
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-800 p-4">
        <h3 className="text-base font-medium mb-1">📋 Onboarding Checklist</h3>
        <ul className="list-disc list-inside text-sm text-neutral-400 space-y-1">
          <li>Set your handle</li>
          <li>Choose your language</li>
          <li>Connect Stripe (coming soon)</li>
        </ul>
      </section>

      {/* Flows */}
      <section className="rounded-2xl border border-neutral-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-medium">🗺️ Your Flows</h3>

          {/* Guarded New Flow button */}
          {!loading && (
            profile?.subscription_level === 'pro' || flows.length === 0 ? (
              <Link
                href="/flows/new"
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm hover:bg-neutral-900"
              >
                New Flow
              </Link>
            ) : (
              <button
                disabled
                className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm text-neutral-600 cursor-not-allowed"
              >
                New Flow (Upgrade to unlock)
              </button>
            )
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="h-10 rounded-lg bg-neutral-900/70 animate-pulse" />
            <div className="h-10 rounded-lg bg-neutral-900/70 animate-pulse" />
            <div className="h-10 rounded-lg bg-neutral-900/70 animate-pulse" />
          </div>
        )}

        {!loading && error && (
          <p className="text-sm text-red-400">Error loading flows: {error}</p>
        )}

        {!loading && !error && flows.length === 0 && (
          <div className="rounded-lg border border-neutral-800 p-4 text-sm text-neutral-400">
            You don't have any flows yet.
            {profile?.subscription_level === 'pro' && (
              <Link href="/flows/new" className="ml-2 underline hover:no-underline">
                Create your first flow
              </Link>
            )}
          </div>
        )}

        {!loading && !error && flows.length > 0 && (
          <ul className="divide-y divide-neutral-800 rounded-lg border border-neutral-800">
            {flows.map((f) => (
              <li key={f.id} className="group">
                <Link
                  href={`/flows/${f.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {f.name || 'Untitled Flow'}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      {new Date(f.created_at).toLocaleString()}
                      <span className="mx-2">•</span>
                      {f.privacy === 'public' ? 'Public' : 'Private'}
                    </p>
                  </div>
                  <svg
                    className="h-4 w-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-800 p-4">
        <h3 className="text-base font-medium mb-1">🧩 Your First Widget</h3>
        <p className="text-sm text-neutral-400">
          Drop in something useful here, maybe analytics, a graph, a shortcut.
        </p>
      </section>
    </div>
  )
}
