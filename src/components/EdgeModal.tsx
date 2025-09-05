'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { Trash2, PlusCircle, ArrowUpDown } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  edge: {
    id: string
    source_id: string
    target_id: string
    type: string | null        // 'Income' | 'Traffic' | 'Fuel'
    direction: string | null   // 'a->b' | 'b->a' | 'both' | 'none'
    label?: string | null
    show_amount?: boolean | null
  }
  nodes: { id: string; name: string }[]
  refresh: () => void
}

type Entry = {
  id: string
  edge_id: string
  entry_date: string
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

function cx(...cls: Array<string | false | null | undefined>) {
  return cls.filter(Boolean).join(' ')
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-zinc-800 px-2.5 py-1 text-xs text-white/80">
      {children}
    </span>
  )
}

export default function EdgeModal({ open, onClose, edge, nodes, refresh }: Props) {
  // edge meta
  const [type, setType] = useState<'Income' | 'Traffic' | 'Fuel'>((edge.type as any) || 'Traffic')
  const [dir, setDir]   = useState<'a->b' | 'b->a' | 'both' | 'none'>((edge.direction as any) || 'a->b')
  const [label, setLabel] = useState<string>(edge.label || '')
  const [showAmount, setShowAmount] = useState<boolean>(edge.show_amount ?? true)

  // entries
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [loadingRecurring, setLoadingRecurring] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [sortAsc, setSortAsc] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [recurring, setRecurring] = useState<EdgeRecurring | null>(null)
  const [newAmount, setNewAmount] = useState<string>('')
  const [newDate, setNewDate]     = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [newNote, setNewNote]     = useState<string>('')

  // delete confirm
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  const nameOf = (id: string) => nodes.find(n => n.id === id)?.name || 'Unknown'
  const aName = useMemo(() => nameOf(edge.source_id), [edge.source_id, nodes])
  const bName = useMemo(() => nameOf(edge.target_id), [edge.target_id, nodes])

  const hasEntries = entries.length > 0

  // loaders
  const loadEntries = useCallback(async () => {
    if (!edge.id) return
    setLoadingEntries(true)
    const { data } = await supabase
      .from('edge_entries')
      .select('*')
      .eq('edge_id', edge.id)
      .order('entry_date', { ascending: false })
    setEntries((data as any) || [])
    setSelectedIds(new Set())
    setSelectAll(false)
    setLoadingEntries(false)
  }, [edge.id])

  const loadRecurring = useCallback(async () => {
    if (!edge.id) return
    setLoadingRecurring(true)
    const { data } = await supabase
      .from('v_edge_recurring_flow')
      .select('edge_id,daily_flow,monthly_flow,yearly_flow,entries_count')
      .eq('edge_id', edge.id)
      .maybeSingle()
    setRecurring((data as any) || null)
    setLoadingRecurring(false)
  }, [edge.id])

  useEffect(() => {
    setType(((edge.type as any) || 'Traffic') as any)
    setDir(((edge.direction as any) || 'a->b') as any)
    setLabel(edge.label || '')
    setShowAmount(edge.show_amount ?? true)
    if (open && edge.id) {
      loadEntries()
      loadRecurring()
    }
  }, [open, edge, loadEntries, loadRecurring])

  // keyboard UX
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'enter') handleSaveMeta()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, type, dir, label, showAmount])

  // actions
  const handleSaveMeta = async () => {
    setSavingMeta(true)
    const update: any = { type, direction: dir, label: label.trim() || null, show_amount: showAmount }

    // handle direction swap for persisted source/target
    if (dir === 'a->b') {
      update.source_id = edge.source_id
      update.target_id = edge.target_id
    } else if (dir === 'b->a') {
      update.source_id = edge.target_id
      update.target_id = edge.source_id
    }

    await supabase.from('edges').update(update).eq('id', edge.id)
    setSavingMeta(false)
    await refresh()
    onClose()
  }

  const tryDeleteEdge = () => {
    if (hasEntries) setConfirmDeleteOpen(true)
    else void handleDeleteEdgeConfirmed()
  }

  const handleDeleteEdgeConfirmed = async () => {
    await supabase.from('edges').delete().eq('id', edge.id)
    setConfirmDeleteOpen(false)
    await refresh()
    onClose()
  }

  const addEntry = async () => {
    if (type === 'Traffic') return
    const normalized = newAmount.replace(/,/g, '.').replace(/[^\d.]/g, '')
    const amt = Number(normalized)
    if (!newDate || !normalized || Number.isNaN(amt)) return
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

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
    setSelectAll(next.size === entries.length && entries.length > 0)
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)))
      setSelectAll(true)
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return
    await supabase.from('edge_entries').delete().in('id', Array.from(selectedIds))
    await loadEntries()
    await loadRecurring()
    await refresh()
  }

  const fmtMoney = (n: number | null | undefined) =>
    typeof n === 'number' ? `$${n.toFixed(2)}` : 'N/A'

  const sortedFiltered = useMemo(() => {
    const filtered = filterText
      ? entries.filter(e => (e.note || '').toLowerCase().includes(filterText.toLowerCase()))
      : entries
    const sorted = [...filtered].sort((a, b) => {
      const da = a.entry_date
      const db = b.entry_date
      return sortAsc ? da.localeCompare(db) : db.localeCompare(da)
    })
    return sorted
  }, [entries, sortAsc, filterText])

  return (
    <Dialog open={open} onClose={onClose} className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/70" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-zinc-950 text-white w-full max-w-3xl rounded-2xl border border-white/10 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-white/10">
            <div className="min-w-0">
              <Dialog.Title className="text-xl font-semibold tracking-tight truncate">
                Edit Link
              </Dialog.Title>
              <div className="text-sm text-white/70 truncate">
                <span className="font-medium">{aName}</span>
                <span className="mx-2 text-white/50">↔</span>
                <span className="font-medium">{bName}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Badge>⌘/Ctrl + Enter to save</Badge>
              <Badge>Esc to close</Badge>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Direction + Type + Label + Show amount */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="min-w-0">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Direction
                </label>
                <select
                  value={dir}
                  onChange={(e) => setDir(e.target.value as any)}
                  className="w-full h-10 rounded-lg bg-zinc-900 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="a->b">{aName} → {bName}</option>
                  <option value="b->a">{bName} → {aName}</option>
                  <option value="both">Both directions</option>
                  <option value="none">No direction</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-10 rounded-lg bg-zinc-900 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="Income">Income</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Fuel">Fuel</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Label (optional)
                </label>
                <Input
                  placeholder="Label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="min-w-0">
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">
                  Show amount on link
                </label>
                <select
                  value={showAmount ? 'yes' : 'no'}
                  onChange={(e) => setShowAmount(e.target.value === 'yes')}
                  className="w-full h-10 rounded-lg bg-zinc-900 border border-white/10 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            {/* Money entries */}
            {type === 'Traffic' ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/80">
                  This link is marked as Traffic. It carries no money entries.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Money Entries</h3>
                  {loadingRecurring ? (
                    <Badge>Calculating...</Badge>
                  ) : recurring?.entries_count && recurring.entries_count >= 2 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{fmtMoney(recurring?.daily_flow)} / day</Badge>
                      <Badge>{fmtMoney(recurring?.monthly_flow)} / mo</Badge>
                      <Badge>{fmtMoney(recurring?.yearly_flow)} / yr</Badge>
                    </div>
                  ) : (
                    <Badge>Add at least 2 entries to compute recurring</Badge>
                  )}
                </div>

                {/* add row */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_1fr_auto] gap-2">
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-10"
                  />
                  <Input
                    type="text"
                    inputMode="decimal"
                    pattern="^[0-9]*[.,]?[0-9]*$"
                    placeholder="Amount"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="h-10"
                  />
                  <Input
                    placeholder="Note (optional)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="h-10"
                  />
                  <button
                    onClick={addEntry}
                    disabled={!newDate || !newAmount || Number.isNaN(Number(newAmount.replace(/,/g, '.').replace(/[^\d.]/g, '')))}
                    className={cx(
                      'h-10 rounded-lg px-3 inline-flex items-center gap-2 border transition',
                      'border-white/20 text-white/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {/* list + bulk tools */}
                <div className="rounded-lg border border-white/10 overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-3 py-2 text-sm bg-white/5">
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                          className="accent-white"
                        />
                        Select All
                      </label>
                      <span className="text-white/60">{selectedIds.size} selected</span>
                      <button
                        onClick={deleteSelected}
                        className={cx(
                          'inline-flex items-center gap-1 rounded px-2 py-1 text-red-300 hover:text-red-200',
                          selectedIds.size === 0 && 'opacity-40 cursor-not-allowed'
                        )}
                        disabled={selectedIds.size === 0}
                        title="Delete selected"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                      </button>
                    </div>

                    <div className="flex items-center gap-2 md:ml-auto">
                      <Input
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                        placeholder="Filter notes"
                        className="h-9 w-full md:w-64"
                      />
                      <button
                        onClick={() => setSortAsc((s) => !s)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-white/80 hover:text-white hover:bg-white/5"
                        title={sortAsc ? 'Oldest first' : 'Newest first'}
                      >
                        <ArrowUpDown className="h-4 w-4" />
                        {sortAsc ? 'Oldest' : 'Newest'}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-white/5">
                    {loadingEntries ? (
                      <div className="p-4 text-sm text-white/70">Loading entries...</div>
                    ) : sortedFiltered.length === 0 ? (
                      <div className="p-4 text-sm text-white/70">No entries.</div>
                    ) : (
                      sortedFiltered.map((en) => (
                        <div key={en.id} className="px-3 py-3 flex items-center justify-between hover:bg-white/[0.03]">
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(en.id)}
                              onChange={() => toggleSelect(en.id)}
                              className="accent-white"
                            />
                            <div className="text-sm">
                              <div className="font-medium">{en.entry_date}</div>
                              <div className="text-white/70">
                                {en.note || <span className="italic text-white/50">No note</span>}
                              </div>
                            </div>
                          </label>
                          <div className="flex items-center gap-3">
                            <div className="font-semibold">
                              ${Number(en.amount).toFixed(2)}
                            </div>
                            <button
                              onClick={() => deleteEntry(en.id)}
                              className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-t border-white/10">
            <div className="space-y-2">
              <button
                onClick={tryDeleteEdge}
                className="inline-flex items-center justify-center rounded-md border border-red-500/50 px-4 py-2 text-red-300 hover:text-red-200 hover:border-red-400 transition"
              >
                Delete Edge
              </button>
              {hasEntries && (
                <div className="text-xs text-red-300">
                  This will also permanently delete {entries.length} related entr{entries.length === 1 ? 'y' : 'ies'}.
                </div>
              )}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="bg-transparent text-white hover:text-gray-300 px-4 py-2 rounded-md border border-white/10"
              >
                Cancel
              </button>
              <Button onClick={handleSaveMeta} disabled={savingMeta} className="min-w-[96px]">
                {savingMeta ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>

      {/* confirm delete mini-dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} className="fixed inset-0 z-[60]">
        <div className="fixed inset-0 bg-black/80" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-zinc-950 text-white p-6 rounded-xl w-full max-w-md border border-white/10 space-y-4">
            <Dialog.Title className="text-lg font-semibold">Delete Edge?</Dialog.Title>
            <p className="text-sm text-white/80">
              This edge has <b>{entries.length}</b> money entr{entries.length === 1 ? 'y' : 'ies'}.
              Deleting the edge will permanently delete those entries too.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="bg-transparent text-white hover:text-gray-300 px-4 py-2 rounded-md border border-white/10"
              >
                Cancel
              </button>
              <Button onClick={handleDeleteEdgeConfirmed} className="bg-red-600 hover:bg-red-700">
                Delete Anyway
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Dialog>
  )
}
