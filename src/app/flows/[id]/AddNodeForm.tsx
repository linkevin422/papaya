'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Props = {
    flowId: string
    userId: string
    onNodeAdded: () => void
  }
  
  export default function AddNodeForm({ flowId, userId, onNodeAdded }: Props) {
    const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState('')
  const [type, setType] = useState<'bank' | 'platform' | 'store' | 'link' | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.from('nodes').insert([
      {
        name,
        type,
        flow_id: flowId,
        user_id: userId,
        x: 0,
        y: 0,
      },
    ])

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
        setName('')
        setType('')
        onNodeAdded() // refresh list
        setLoading(false)
      }
      }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 space-y-4 w-full max-w-md">
      <div>
        <Label htmlFor="name" className="text-white">
          Node Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. E.SUN Bank"
          className="mt-1"
          required
        />
      </div>

      <div>
        <Label htmlFor="type" className="text-white">
          Type
        </Label>
        <select
  id="type"
  value={type}
  onChange={e => setType(e.target.value as any)}
  className="w-full bg-black border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
  required
>
  <option value="" disabled>Select type</option>
  <option value="bank">Bank</option>
  <option value="traffic">Platform</option>
  <option value="traffic">Store</option>
  <option value="income">Link</option>
</select>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Adding...' : 'Add Node'}
      </Button>
    </form>
  )
}
