'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useProfile } from '@/context/ProfileProvider'
import UpgradeModal from '@/components/UpgradeModal'

type Flow = {
  id: string
  name: string
  user_id: string
  created_at: string
}

export default function FlowsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const flowLimit = useMemo(() => {
    const level = profile?.subscription_level ?? 'basic'
    return level === 'pro' ? 10 : 1
  }, [profile?.subscription_level])

  const atLimit = flows.length >= flowLimit

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData.session
        if (!session) {
          setFlows([])
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('flows')
          .select('id,name,user_id,created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setFlows(data ?? [])
      } catch {
        setFlows([])
      } finally {
        setLoading(false)
      }
    }
    if (!profileLoading) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading])

  const handleCreate = async () => {
    if (atLimit) {
      setUpgradeOpen(true)
      return
    }

    try {
      setCreating(true)
      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      if (!session) return

      // Generate a friendly default name
      const base = 'Untitled Flow'
      const existing = flows
        .map((f) => f.name)
        .filter((n) => n === base || n.startsWith(`${base} `))
      const nextIndex = existing.length ? existing.length + 1 : 1
      const defaultName = existing.length ? `${base} ${nextIndex}` : base

      const { data, error } = await supabase
        .from('flows')
        .insert({
          name: defaultName,
          user_id: session.user.id,
        })
        .select('id')
        .single()

      if (error) throw error
      router.push(`/flows/${data.id}`)
    } catch (e) {
      console.error(e)
      // optional: surface a toast
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Flows</h1>
        <div className="text-sm text-neutral-400">
          {profile?.subscription_level
            ? `Plan: ${profile.subscription_level} • ${flows.length}/${flowLimit}`
            : ' '}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-neutral-900"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* New Flow card */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className={`flex h-28 items-center justify-center rounded-xl border border-dashed ${
              atLimit
                ? 'border-neutral-800 text-neutral-600 cursor-not-allowed'
                : 'border-neutral-700 hover:border-neutral-500 hover:bg-neutral-900'
            }`}
            title={atLimit ? 'Upgrade to create more flows' : 'Create a new flow'}
          >
            <div className="text-center">
              <div className="text-lg">+ New Flow</div>
              <div className="text-xs text-neutral-400">
                {atLimit
                  ? 'Basic supports 1 flow. Upgrade for more.'
                  : creating
                  ? 'Creating...'
                  : 'Create a new flow'}
              </div>
            </div>
          </button>

          {/* Existing flows */}
          {flows.map((f) => (
            <button
              key={f.id}
              onClick={() => router.push(`/flows/${f.id}`)}
              className="h-28 rounded-xl bg-neutral-900 p-4 text-left hover:bg-neutral-800"
            >
              <div className="line-clamp-1 text-base font-medium">{f.name}</div>
              <div className="mt-1 text-xs text-neutral-400">
                {new Date(f.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  )
}
