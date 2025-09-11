'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/context/ProfileProvider'
import { createClient } from '@/lib/supabase'
import CreateFlowForm from './CreateFlowForm'

export default function NewFlowPage() {
  const { profile, loading } = useProfile()
  const router = useRouter()
  const supabase = createClient()
  const [flowCount, setFlowCount] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && profile) {
      const fetchCount = async () => {
        const { count, error } = await supabase
          .from('flows')
          .select('*', { count: 'exact', head: true })
        if (!error) setFlowCount(count ?? 0)
      }
      fetchCount()
    }
  }, [loading, profile, supabase])

  useEffect(() => {
    if (flowCount !== null && profile) {
      if (profile.subscription_level === 'basic' && flowCount > 0) {
        router.replace('/pricing')
      }
      if (profile.subscription_level === 'pro' && flowCount >= 10) {
        router.replace('/pricing')
      }
    }
  }, [flowCount, profile, router])

  if (loading || flowCount === null) {
    return null
  }

  return (
    <div className="p-6">
      <CreateFlowForm />
    </div>
  )
}
