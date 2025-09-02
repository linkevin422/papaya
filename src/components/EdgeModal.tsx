'use client'

import { useEffect, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'

type Props = {
  open: boolean
  onClose: () => void
  edge: {
    id: string
    source_id: string
    target_id: string
    type: string
    direction: string
  }
  nodes: { id: string; name: string }[]
  refresh: () => void
}

export default function EdgeModal({ open, onClose, edge, nodes, refresh }: Props) {
  const supabase = createClient()
  const [type, setType] = useState(edge.type)
  const [direction, setDirection] = useState(edge.direction)

  const sourceName = nodes.find((n) => n.id === edge.source_id)?.name || 'Source'
  const targetName = nodes.find((n) => n.id === edge.target_id)?.name || 'Target'

  const handleSave = async () => {
    await supabase.from('edges').update({ type, direction }).eq('id', edge.id)
    refresh()
    onClose()
  }

  const handleDelete = async () => {
    await supabase.from('edges').delete().eq('id', edge.id)
    refresh()
    onClose()
  }

  useEffect(() => {
    setType(edge.type)
    setDirection(edge.direction)
  }, [edge])

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="bg-zinc-900 text-white p-6 rounded-xl w-full max-w-md border border-white/10 space-y-4">
          <Dialog.Title className="text-lg font-semibold">Edit Connection</Dialog.Title>

          <div>
            <label className="text-sm">Direction</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-black border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
            >
              <option value={`${sourceName} → ${targetName}`}>{sourceName} → {targetName}</option>
              <option value={`${targetName} → ${sourceName}`}>{targetName} → {sourceName}</option>
              <option value="↔">↔ Both directions</option>
              <option value="none">No Direction</option>
            </select>
          </div>

          <div>
            <label className="text-sm">Link Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-black border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
            >
              <option value="traffic">Traffic</option>
              <option value="income">Income</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
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
