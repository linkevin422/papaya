'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'

type Props = {
  open: boolean
  onClose: () => void
  node: { id: string; name: string; type?: string }
  refresh: () => void
}

export default function NodeModal({ open, onClose, node, refresh }: Props) {
  const supabase = createClient()
  const [name, setName] = useState(node.name)
  const [type, setType] = useState(node.type || 'platform')

  useEffect(() => {
    setName(node.name)
    setType(node.type || 'platform')
  }, [node])

  const handleSave = async () => {
    await supabase.from('nodes').update({ name, type }).eq('id', node.id)
    refresh()
    onClose()
  }

  const handleDelete = async () => {
    await supabase.from('nodes').delete().eq('id', node.id)
    refresh()
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="bg-zinc-900 text-white p-6 rounded-xl w-full max-w-md border border-white/10 space-y-4">
          <Dialog.Title className="text-lg font-semibold">Edit Node</Dialog.Title>

          <div className="space-y-2">
            <label className="block text-sm">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />

            <label className="block text-sm mt-4">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-zinc-800 text-white rounded px-3 py-2 w-full"
            >
              <option value="bank">Bank</option>
              <option value="platform">Platform</option>
              <option value="store">Store</option>
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
