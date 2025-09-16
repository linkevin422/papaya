'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

type Flow = {
  id: string
  name: string
}

export default function FlowSwitcher() {
  const [flows, setFlows] = useState<Flow[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const currentFlowId = pathname.split('/')[2] || ''

  useEffect(() => {
    const fetchFlows = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('flows')
        .select('id, name')
        .order('created_at', { ascending: true })
      if (!error && data) setFlows(data)
      setLoading(false)
    }

    fetchFlows()
  }, []) // once on mount

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value
    if (selectedId !== currentFlowId) {
      router.push(`/flows/${selectedId}`)
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <Loader2 className="animate-spin w-4 h-4" />
        Loading flows...
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="flow" className="text-gray-400">Flow:</label>
      <select
        id="flow"
        className="bg-zinc-900 border border-zinc-700 rounded px-3 py-1 text-white text-sm"
        value={currentFlowId}
        onChange={handleChange}
      >
        {flows.map((flow) => (
          <option key={flow.id} value={flow.id}>
            {flow.name}
          </option>
        ))}
      </select>
    </div>
  )
}
