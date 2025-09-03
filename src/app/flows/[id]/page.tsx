'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import FlowCanvas from './FlowCanvas'
import NodeModal from '@/components/NodeModal'
import EdgeModal from '@/components/EdgeModal'
import AddNodeForm from './AddNodeForm'
import { MarkerType } from 'reactflow'
import { Dialog } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import {
  Landmark,
  Store as StoreIcon,
  Package,
  Megaphone,
  Briefcase,
  TrendingUp,
  HandCoins,
  Circle
} from 'lucide-react'

const supabase = createClient()

type Flow = { id: string; name: string; user_id: string; created_at: string }
type NodeData = { id: string; name: string; type?: string; x?: number; y?: number }
type EdgeData = {
  id: string
  flow_id: string
  source_id: string
  target_id: string
  type: string            // Income | Traffic | Fuel
  direction: string | null // a->b | b->a | both | none
  label?: string | null
}

/** Colors */
const NODE_COLOR: Record<string, string> = {
  Bank: '#10b981',
  Store: '#f59e0b',
  Product: '#8b5cf6',
  Platform: '#3b82f6',
  Job: '#06b6d4',
  Investment: '#22c55e',
  Sponsor: '#ec4899',
}
const EDGE_COLOR: Record<string, string> = {
  Income: '#22c55e',
  Traffic: '#60a5fa',
  Fuel: '#f97316',
}

/** Icons */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Bank: Landmark,
  Store: StoreIcon,
  Product: Package,
  Platform: Megaphone,
  Job: Briefcase,
  Investment: TrendingUp,
  Sponsor: HandCoins,
}

/** Helpers */
const normalizeType = (t?: string) => (t || '').trim()
const normalizeDir = (d?: string | null): 'a->b' | 'b->a' | 'both' | 'none' => {
  if (!d) return 'a->b'
  const s = d.toLowerCase().trim()
  if (s === 'a->b' || s.includes('a → b')) return 'a->b'
  if (s === 'b->a' || s.includes('b → a')) return 'b->a'
  if (s === 'both' || s.includes('↔')) return 'both'
  if (s === 'none') return 'none'
  return 'a->b'
}

/** Small label component with lucide icon */
function NodeLabel({ name, type }: { name: string; type?: string }) {
  const t = normalizeType(type)
  const Icon = ICONS[t] || Circle
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4" />
      <span className="font-semibold">{name}</span>
    </div>
  )
}

export default function FlowPage() {
  const flowId = useParams().id as string
  const [flow, setFlow] = useState<Flow | null>(null)
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null)
  const [showAddNode, setShowAddNode] = useState(false)
  const [layingOut, setLayingOut] = useState(false)

  const fetchFlow = async () => {
    const { data } = await supabase.from('flows').select('*').eq('id', flowId).single()
    if (data) setFlow(data)
  }
  const fetchNodes = async () => {
    const { data } = await supabase.from('nodes').select('*').eq('flow_id', flowId)
    if (data) setNodes(data)
  }
  const fetchEdges = async () => {
    const { data } = await supabase.from('edges').select('*').eq('flow_id', flowId)
    if (data) setEdges(data as any)
  }
  const refreshCanvas = async () => { await Promise.all([fetchNodes(), fetchEdges()]) }

  useEffect(() => {
    if (flowId) { fetchFlow(); refreshCanvas() }
  }, [flowId])

  /** Auto-sort: simple layered layout by direction */
  const autoSort = async () => {
    if (!nodes.length) return
    setLayingOut(true)

    type Pair = { u: string; v: string }
    const directed: Pair[] = []
    const idSet = new Set(nodes.map(n => n.id))
    for (const e of edges) {
      const dir = normalizeDir(e.direction || undefined)
      if (!idSet.has(e.source_id) || !idSet.has(e.target_id)) continue
      if (dir === 'a->b') directed.push({ u: e.source_id, v: e.target_id })
      else if (dir === 'b->a') directed.push({ u: e.target_id, v: e.source_id })
    }

    const rank = new Map<string, number>(nodes.map(n => [n.id, 0]))
    const N = nodes.length
    for (let i = 0; i < N; i++) {
      let changed = false
      for (const { u, v } of directed) {
        const ru = rank.get(u)!; const rv = rank.get(v)!
        if (rv < ru + 1) { rank.set(v, ru + 1); changed = true }
      }
      if (!changed) break
    }

    const H = 260, V = 160
    const layers = new Map<number, string[]>()
    for (const n of nodes) {
      const r = rank.get(n.id) ?? 0
      const arr = layers.get(r) ?? []
      arr.push(n.id)
      layers.set(r, arr)
    }
    for (const [r, arr] of layers) {
      arr.sort((a, b) => {
        const na = nodes.find(n => n.id === a)?.name || ''
        const nb = nodes.find(n => n.id === b)?.name || ''
        return na.localeCompare(nb)
      })
      layers.set(r, arr)
    }

    const updates: { id: string; x: number; y: number }[] = []
    const ranks = Array.from(layers.keys())
    const minRank = Math.min(...ranks), maxRank = Math.max(...ranks)
    for (let r = minRank; r <= maxRank; r++) {
      const arr = layers.get(r) || []
      const k = arr.length
      const yStart = -((k - 1) * V) / 2
      arr.forEach((id, i) => updates.push({ id, x: r * H, y: yStart + i * V }))
    }

    await Promise.all(updates.map(u => supabase.from('nodes').update({ x: u.x, y: u.y }).eq('id', u.id)))
    await refreshCanvas()
    setLayingOut(false)
  }

  /** ReactFlow nodes/edges */
  const rfNodes = useMemo(
    () =>
      nodes.map((n) => {
        const t = normalizeType(n.type)
        const bg = NODE_COLOR[t] || '#64748b'
        return {
          id: n.id,
          data: { label: <NodeLabel name={n.name} type={n.type} /> },
          type: 'default',
          position: {
            x: typeof n.x === 'number' ? n.x : Math.random() * 300,
            y: typeof n.y === 'number' ? n.y : Math.random() * 300,
          },
          style: {
            backgroundColor: bg,
            color: 'white',
            padding: 10,
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontWeight: 600,
          },
        }
      }),
    [nodes]
  )

  const rfEdges = useMemo(
    () =>
      edges.map((e) => {
        const dir = normalizeDir(e.direction || undefined)
        const isBoth = dir === 'both'
        const isNone = dir === 'none'
        const stroke = EDGE_COLOR[normalizeType(e.type)] || '#e5e7eb'
        return {
          id: e.id,
          source: e.source_id,
          target: e.target_id,
          label: e.label || undefined,
          animated: !isBoth && !isNone,
          markerStart: isBoth ? { type: MarkerType.ArrowClosed, color: stroke } : undefined,
          markerEnd: isNone ? undefined : { type: MarkerType.ArrowClosed, color: stroke },
          style: isNone
            ? { stroke, strokeDasharray: '6 6', strokeWidth: 2 }
            : { stroke, strokeWidth: 2 },
          data: { direction: dir, linkType: e.type },
        }
      }),
    [edges]
  )

  return (
    <main className="max-w-6xl mx-auto p-4 text-white relative">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{flow?.name || 'Loading…'}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={autoSort}
            disabled={layingOut}
            className="bg-indigo-600 disabled:bg-indigo-600/50 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            {layingOut ? 'Auto-sorting…' : 'Auto-sort'}
          </button>
          <button
            onClick={() => setShowAddNode(true)}
            className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition"
          >
            + Add Node
          </button>
        </div>
      </div>

      <FlowCanvas
        flowId={flowId}
        nodes={rfNodes}
        edges={rfEdges}
        onNodeClick={(rfNode) => {
          const real = nodes.find(n => n.id === rfNode.id)
          if (real) setSelectedNode(real)
        }}
        onEdgeClick={(rfEdge) => {
          const real = edges.find(e => e.id === rfEdge.id)
          if (real) setSelectedEdge(real)
        }}
        refresh={refreshCanvas}
      />

      {/* Add Node Modal */}
      <Dialog open={showAddNode} onClose={() => setShowAddNode(false)} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/70" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-zinc-900 p-6 rounded-xl w-full max-w-md border border-white/10">
            <Dialog.Title className="text-lg font-semibold text-white mb-4">Add New Node</Dialog.Title>
            {flow && flow.user_id && (
              <AddNodeForm
                flowId={flow.id}
                userId={flow.user_id}
                onNodeAdded={() => { refreshCanvas(); setShowAddNode(false) }}
              />
            )}
            <div className="mt-4 text-right">
              <Button
                onClick={() => setShowAddNode(false)}
                className="bg-transparent text-white hover:text-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {selectedNode && (
        <NodeModal
          open={true}
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          refresh={refreshCanvas}
        />
      )}

      {selectedEdge && (
        <EdgeModal
          open={true}
          edge={selectedEdge}
          nodes={nodes}
          onClose={() => setSelectedEdge(null)}
          refresh={refreshCanvas}
        />
      )}
    </main>
  )
}
