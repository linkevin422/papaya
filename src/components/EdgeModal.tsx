'use client'

import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'

type Props = {
  open: boolean
  onClose: () => void
  edge: {
    id: string
    source_id: string
    target_id: string
    type: string | null         // Income | Traffic | Fuel
    direction: string | null    // a->b | b->a | both | none
    label?: string | null
  }
  nodes: { id: string; name: string }[]
  refresh: () => void           // parent will refresh canvas + headline
}

type Entry = {
  id: string
  edge_id: string
  entry_date: string   // ISO date (YYYY-MM-DD)
  amount: number
  note: string | null
  created_at: string
}

type EdgeRecurring = {
  edge_id: string
  daily_flow: number | null
  monthly_flow: number | null
  yearly_flow: number | null
  entries_count: number
}

const supabase = createClient()

export default function EdgeModal({ open, onClose, edge, nodes, refresh }: Props) {
  // ------- edge props -------
  const [type, setType] = useState<'Income' | 'Traffic' | 'Fuel'>((edge.type as any) || 'Traffic')
  const [dir, setDir]   = useState<'a->b' | 'b->a' | 'both' | 'none'>((edge.direction as any) || 'a->b')
  const [label, setLabel] = useState<string>(edge.label || '')

  // ------- entries state -------
  const [entries, setEntries] = useState<Entry[]>([])
  const [recurring, setRecurring] = useState<EdgeRecurring | null>(null)
  const [newAmount, setNewAmount] = useState<string>('')
  const [newDate, setNewDate]     = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [newNote, setNewNote]     = useState<string>('')

  // fetch helpers
  const loadEntries = async () => {
    const { data } = await supabase
      .from('edge_entries')
      .select('*')
      .eq('edge_id', edge.id)
      .order('entry_date', { ascending: false })
    setEntries((data as any) || [])
  }
  const loadRecurring = async () => {
    const { data } = await supabase
      .from('v_edge_recurring_flow')
      .select('edge_id,daily_flow,monthly_flow,yearly_flow,entries_count')
      .eq('edge_id', edge.id)
      .maybeSingle()
    setRecurring((data as any) || null)
  }

  useEffect(() => {
    setType(((edge.type as any) || 'Traffic') as any)
    setDir(((edge.direction as any) || 'a->b') as any)
    setLabel(edge.label || '')
    if (open && edge.id) {
      loadEntries()
      loadRecurring()
    }
  }, [open, edge])

  const nameOf = (id: string) => nodes.find(n => n.id === id)?.name || 'Unknown'
  const aName = useMemo(() => nameOf(edge.source_id), [edge.source_id, nodes])
  const bName = useMemo(() => nameOf(edge.target_id), [edge.target_id, nodes])

  // ------- actions -------
  const handleSaveMeta = async () => {
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

  const handleDeleteEdge = async () => {
    await supabase.from('edges').delete().eq('id', edge.id)
    await refresh()
    onClose()
  }

  const addEntry = async () => {
    const amt = parseFloat(newAmount)
    if (!newDate || isNaN(amt)) return
    await supabase.from('edge_entries').insert({
      edge_id: edge.id,
      entry_date: newDate,
      amount: amt,
      note: newNote.trim() || null,
    })
    setNewAmount('')
    setNewNote('')
    await loadEntries()
    await loadRecurring()
    await refresh()
  }

  const deleteEntry = async (id: string) => {
    await supabase.from('edge_entries').delete().eq('id', id)
    await loadEntries()
    await loadRecurring()
    await refresh()
  }

  const fmt = (n: number | null | undefined) =>
    typeof n === 'number' ? `$${n.toFixed(2)}` : '—'

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="bg-zinc-900 text-white p-6 rounded-xl w-full max-w-2xl border border-white/10 space-y-6">
          <Dialog.Title className="text-lg font-semibold">Edit Link</Dialog.Title>

          {/* Direction + Type + Label */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-black border border-zinc-700 text-white rounded-md px-3 py-2 mt-1"
              >
                <option value="Income">Income</option>
                <option value="Traffic">Traffic</option>
                <option value="Fuel">Fuel</option>
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
          </div>

          {/* Money entries */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Money Entries</h3>
              <div className="text-sm text-white/70">
                {recurring?.entries_count && recurring.entries_count >= 2
                  ? <>Recurring: <span className="font-semibold">{fmt(recurring?.daily_flow)}</span>/day · <span className="font-semibold">{fmt(recurring?.monthly_flow)}</span>/mo · <span className="font-semibold">{fmt(recurring?.yearly_flow)}</span>/yr</>
                  : <>Add at least <b>2</b> entries to compute recurring.</>}
              </div>
            </div>

            {/* add row */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr_auto] gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="bg-black border-zinc-700"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="bg-black border-zinc-700"
              />
              <Input
                placeholder="Note (optional)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="bg-black border-zinc-700"
              />
              <Button onClick={addEntry}>Add</Button>
            </div>

            {/* list */}
            <div className="border border-white/10 rounded-lg divide-y divide-white/5">
              {entries.length === 0 && (
                <div className="p-3 text-sm text-white/60">No entries yet.</div>
              )}
              {entries.map((en) => (
                <div key={en.id} className="p-3 flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium">{en.entry_date}</div>
                    <div className="text-white/70">
                      {en.note || <span className="italic">—</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">${Number(en.amount).toFixed(2)}</div>
                    <button
                      onClick={() => deleteEntry(en.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* footer actions */}
          <div className="flex justify-between pt-2">
            <Button onClick={handleDeleteEdge} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Edge
            </Button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="bg-transparent text-white hover:text-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <Button onClick={handleSaveMeta}>Save</Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
