'use client'

import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'

type Props = {
  open: boolean
  onClose: () => void
  edge: {
    id: string
    source_id: string
    target_id: string
    type: string | null         // Income | Traffic | Fuel
    direction: string | null    // a->b | b->a | both | none
    label?: string | null       // optional text
  }
  nodes: { id: string; name: string }[]
  refresh: () => void
}

const supabase = createClient()

const LINK_TYPES = ['Income', 'Traffic', 'Fuel'] as const
type LinkType = (typeof LINK_TYPES)[number]

export default function EdgeModal({ open, onClose, edge, nodes, refresh }: Props) {
  const [type, setType] = useState<LinkType>((edge.type as LinkType) || 'Traffic')
  const [dir, setDir] = useState<'a->b' | 'b->a' | 'both' | 'none'>((edge.direction as any) || 'a->b')
  const [label, setLabel] = useState<string>(edge.label || '')

  useEffect(() => {
    setType(((edge.type as LinkType) || 'Traffic') as LinkType)
    setDir(((edge.direction as any) || 'a->b') as any)
    setLabel(edge.label || '')
  }, [edge])

  const nameOf = (id: string) => nodes.find(n => n.id === id)?.name || 'Unknown'
  const aName = nameOf(edge.source_id)
  const bName = nameOf(edge.target_id)

  const handleSave = async () => {
    const update: any = { type, direction: dir, label: label.trim() || null }

    if (dir === 'a->b') {
      update.source_id = edge.source_id
      update.target_id = edge.target_id
    } else if (dir === 'b->a') {
      update.source_id = edge.target_id
      update.target_id = edge.source_id
    }
    // both/none keep endpoints

    await supabase.from('edges').update(update).eq('id', edge.id)
    await refresh()
    onClose()
  }

  const handleDelete = async () => {
    await supabase.from('edges').delete().eq('id', edge.id)
    await refresh()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="bg-zinc-900 text-white p-6 rounded-xl w-full max-w-md border border-white/10 space-y-4">
          <Dialog.Title className="text-lg font-semibold">Edit Link</Dialog.Title>

          <div>
            <label className="text-sm">Direction</label>
            <select
              value={dir}
              onChange={(e) => setDir(e.target.value as any)}
              className="w-full bg-black border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
            >
              <option value="a->b">{aName} → {bName}</option>
              <option value="b->a">{bName} → {aName}</option>
              <option value="both">↔ Both directions</option>
              <option value="none">No Direction</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as LinkType)}
              className="w-full bg-black border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
            >
              {LINK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm">Label (optional)</label>
            <Input
              placeholder="e.g. Ad spend, Royalty, Affiliate, Organic"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </Button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="bg-transparent text-white hover:text-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
