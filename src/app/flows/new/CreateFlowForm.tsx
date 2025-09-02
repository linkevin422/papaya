'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function CreateFlowForm() {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      setLoading(false)
      alert('Not logged in')
      return
    }

    const { data, error } = await supabase
      .from('flows')
      .insert({
        user_id: user.id,
        name: name.trim(),
      })
      .select()
      .single()

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push(`/flows/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold">Start your Flow</h2>
      <div>
        <label className="block text-sm mb-1">Name</label>
        <input
          className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
          type="text"
          placeholder="e.g. Main Flow, YouTube System"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-2 rounded-lg"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Flow'}
      </button>
    </form>
  )
}
