'use client'

import { useState, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Globe, Users, Briefcase, HelpCircle } from 'lucide-react'

type Props = {
  flowId: string
  userId: string
  onNodeAdded: () => void
}

const NODE_TYPES = [
  { value: 'Pocket', label: 'Pocket', icon: Wallet, hint: 'Cash, Bank Account, PayPal' },
  { value: 'Platform', label: 'Platform', icon: Globe, hint: 'Shopee, YouTube, Stripe' },
  { value: 'People', label: 'People', icon: Users, hint: 'Employer, Client, Sponsor' },
  { value: 'Portfolio', label: 'Portfolio', icon: Briefcase, hint: 'ETF, Crypto Wallet, Royalties' },
  { value: 'Other', label: 'Other', icon: HelpCircle, hint: 'Anything else' },
]

export default function AddNodeForm({ flowId, userId, onNodeAdded }: Props) {
  const supabase = createClient()

  const [name, setName] = useState('')
  const [type, setType] = useState<string>(NODE_TYPES[0].value) // default to first
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)

  // derived validity
  const nameClean = useMemo(() => name.trim(), [name])
  const valid = nameClean.length > 0 && NODE_TYPES.some((t) => t.value === type)

  useEffect(() => {
    if (touched) setError(null)
  }, [name, type, touched])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    setType(NODE_TYPES[0].value) // reset to default
    setLoading(false)
    onNodeAdded()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label
          htmlFor="node-name"
          className="text-white/80 text-xs uppercase tracking-wider"
        >
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
        <Label
          htmlFor="node-type"
          className="text-white/80 text-xs uppercase tracking-wider"
        >
          Type
        </Label>
        <div className="flex items-center gap-2">
          <select
            id="node-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="h-10 flex-1 rounded-lg bg-zinc-900 px-3 text-sm text-white outline-none border border-white/10 focus:ring-2 focus:ring-white/20"
          >
            {NODE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {(() => {
            const CurrentIcon =
              NODE_TYPES.find((t) => t.value === type)?.icon || HelpCircle
            return <CurrentIcon className="h-5 w-5 text-white/70" />
          })()}
        </div>
        <p className="mt-1 text-xs text-white/50">
          {NODE_TYPES.find((t) => t.value === type)?.hint}
        </p>
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
