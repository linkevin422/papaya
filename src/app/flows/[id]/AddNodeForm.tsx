'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  flowId: string
  userId: string
  onNodeAdded: () => void
}

const NODE_TYPES = [
  'Bank',
  'Store',
  'Product',
  'Platform',
  'Job',
  'Investment',
  'Sponsor',
  'Other',
]

export default function AddNodeForm({ flowId, userId, onNodeAdded }: Props) {
  const supabase = createClient()

  const [name, setName] = useState('')
  const [type, setType] = useState<string>('Platform')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  // derived validity
  const nameClean = useMemo(() => name.trim(), [name])
  const valid = nameClean.length > 0 && NODE_TYPES.includes(type)

  useEffect(() => {
    if (touched) setError(null)
  }, [name, type, touched])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // prevent native tooltip
    setTouched(true)
    if (!valid) return

    setLoading(true)
    setError(null)

    const { error } = await supabase.from('nodes').insert([
      {
        name: nameClean,
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
      return
    }

    setName('')
    setType('Platform')
    setLoading(false)
    onNodeAdded()
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full space-y-5"
    >
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="node-name" className="text-white/80 text-xs uppercase tracking-wider">
          Node Name
        </Label>
        <Input
          id="node-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-invalid={touched && !nameClean ? 'true' : 'false'}
          className="h-10"
        />
        {touched && !nameClean ? (
          <p className="text-xs text-red-300">Please enter a name.</p>
        ) : null}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label htmlFor="node-type" className="text-white/80 text-xs uppercase tracking-wider">
          Type
        </Label>
        <select
          id="node-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-10 w-full rounded-lg bg-zinc-900 px-3 text-sm text-white outline-none border border-white/10 focus:ring-2 focus:ring-white/20"
        >
          {NODE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Errors */}
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end">
        <Button
          type="submit"
          disabled={!valid || loading}
          className="h-10 min-w-[110px]"
        >
          {loading ? 'Adding…' : 'Add Node'}
        </Button>
      </div>
    </form>
  )
}
