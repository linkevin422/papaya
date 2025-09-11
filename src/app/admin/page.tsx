'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Users, UserCheck, Crown } from 'lucide-react' // icons

const supabase = createClient()

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<{ basic: number; pro: number } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || user.email !== 'peijulink@gmail.com') {
        router.replace('/')
        return
      }

      const { count: basicCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_level', 'basic')

      const { count: proCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('subscription_level', 'pro')

      setStats({
        basic: basicCount ?? 0,
        pro: proCount ?? 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [router])

  if (loading) return <p className="p-4">Loading...</p>
  if (!stats) return <p className="p-4">No data available</p>

  const total = stats.basic + stats.pro

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col items-center shadow">
          <Users className="w-8 h-8 text-blue-400 mb-2" />
          <p className="text-3xl font-semibold text-white">{total}</p>
          <p className="text-sm text-neutral-400">Total Users</p>
        </div>

        {/* Basic */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col items-center shadow">
          <UserCheck className="w-8 h-8 text-green-400 mb-2" />
          <p className="text-3xl font-semibold text-white">{stats.basic}</p>
          <p className="text-sm text-neutral-400">Basic Users</p>
        </div>

        {/* Pro */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 flex flex-col items-center shadow">
          <Crown className="w-8 h-8 text-yellow-400 mb-2" />
          <p className="text-3xl font-semibold text-white">{stats.pro}</p>
          <p className="text-sm text-neutral-400">Pro Users</p>
        </div>
      </div>
    </div>
  )
}
