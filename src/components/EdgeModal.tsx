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
import { Trash2, PlusCircle } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  edge: {
    id: string
    source_id: string
    target_id: string
    type: string | null
    direction: string | null
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
  original_amount?: number
  original_currency?: string
  converted_amount?: number
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
  const [dir, setDir] = useState<'a->b' | 'b->a' | 'both' | 'none'>((edge.direction as any) || 'a->b')
  const [label, setLabel] = useState<string>(edge.label || '')
  const [showAmount, setShowAmount] = useState<boolean>(edge.show_amount ?? true)

  // entries
  const [entries, setEntries] = useState<Entry[]>([])
  const [loadingEntries, setLoadingEntries] = useState(false)
  const [loadingRecurring, setLoadingRecurring] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sortAsc, setSortAsc] = useState(false)
  const [filterText, setFilterText] = useState('')

  const [recurring, setRecurring] = useState<EdgeRecurring | null>(null)

  // new entry inputs
  const [newAmount, setNewAmount] = useState<string>('')
  const [newCurrency, setNewCurrency] = useState<string>('TWD')
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [newNote, setNewNote] = useState<string>('')

  // profile master currency
  const [masterCurrency, setMasterCurrency] = useState<string>('TWD')

  const nameOf = (id: string) => nodes.find((n) => n.id === id)?.name || 'Unknown'
  const aName = useMemo(() => nameOf(edge.source_id), [edge.source_id, nodes])
  const bName = useMemo(() => nameOf(edge.target_id), [edge.target_id, nodes])

  const hasEntries = entries.length > 0

  // load profile master currency
  useEffect(() => {
    ;(async () => {
      const { data: userData } = await supabase.auth.getUser()
      const id = userData.user?.id
      if (!id) return
      const { data } = await supabase
        .from('profiles')
        .select('master_currency')
        .eq('id', id)
        .single()
      if (data?.master_currency) {
        setMasterCurrency(data.master_currency)
        setNewCurrency(data.master_currency)
      }
    })()
  }, [])

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

  // ✅ fixed addEntry with RPC
  const addEntry = async () => {
    if (type === 'Traffic') return
  
    const normalized = newAmount.replace(/,/g, '.').replace(/[^\d.]/g, '')
    const amt = Number(normalized)
    if (!newDate || !normalized || Number.isNaN(amt)) return
  
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr) {
      console.error('Auth error', userErr)
      return
    }
    const userId = userData.user?.id
    if (!userId) {
      console.error('No user ID found')
      return
    }
  
    const { error } = await supabase.rpc('add_edge_entry', {
      p_user_id: userId,
      p_edge_id: String(edge.id), // 👈 force to text
      p_entry_date: newDate,
      p_original_amount: amt,
      p_original_currency: newCurrency,
      p_note: newNote.trim() || null,
    })
  
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('RPC error', error)
      }
      return
    }
        
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

  const fmtMoney = (n: number | null | undefined, cur?: string) =>
    typeof n === 'number' ? `${cur || ''} ${n.toFixed(2)}` : 'N/A'

  const sortedFiltered = useMemo(() => {
    const filtered = filterText
      ? entries.filter((e) => (e.note || '').toLowerCase().includes(filterText.toLowerCase()))
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
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {type === 'Traffic' ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/80">
                  This link is marked as Traffic. It carries no money entries.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* add row */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr_1fr_auto] gap-2">
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="h-10"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Amount"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      className="h-10 flex-1"
                    />
                    <select
                      value={newCurrency}
                      onChange={(e) => setNewCurrency(e.target.value)}
                      className="rounded-lg bg-zinc-900 border border-white/10 px-2 text-sm text-white"
                    >
                      <option value={masterCurrency}>{masterCurrency}</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="JPY">JPY</option>
                      <option value="CAD">CAD</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <Input
                    placeholder="Note (optional)"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="h-10"
                  />
                  <button
                    onClick={addEntry}
                    disabled={!newDate || !newAmount || Number.isNaN(Number(newAmount))}
                    className={cx(
                      'h-10 rounded-lg px-3 inline-flex items-center gap-2 border transition',
                      'border-white/20 text-white/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
                    )}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add
                  </button>
                </div>

                {/* list */}
                <div className="divide-y divide-white/5">
                  {loadingEntries ? (
                    <div className="p-4 text-sm text-white/70">Loading entries...</div>
                  ) : sortedFiltered.length === 0 ? (
                    <div className="p-4 text-sm text-white/70">No entries.</div>
                  ) : (
                    sortedFiltered.map((en) => (
                      <div
                        key={en.id}
                        className="px-3 py-3 flex items-center justify-between hover:bg-white/[0.03]"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{en.entry_date}</div>
                          <div className="text-white/70">
                            {en.note || <span className="italic text-white/50">No note</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">
                            {fmtMoney(en.original_amount ?? en.amount, en.original_currency)}
                            {en.original_currency !== masterCurrency && en.converted_amount
                              ? ` ≈ ${fmtMoney(en.converted_amount, masterCurrency)}`
                              : ''}
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
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="bg-transparent text-white hover:text-gray-300 px-4 py-2 rounded-md border border-white/10"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
