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

const supabase = createClient()

type Flow = { id: string; name: string; user_id: string; created_at: string }
type NodeData = { id: string; name: string; type?: string; x?: number | null; y?: number | null }
type EdgeData = {
  id: string
  flow_id: string
  source_id: string
  target_id: string
  type: string
  direction: string | null // 'a->b' | 'b->a' | 'both' | 'none'
  label?: string | null
}

const NODE_COLOR: Record<string, string> = {
  Bank: '#10b981',
  Store: '#f59e0b',
  Product: '#8b5cf6',
  Platform: '#3b82f6',
  Job: '#06b6d4',
  Investment: '#22c55e',
  Sponsor: '#ec4899',
  Other: '#64748b',
}
const EDGE_COLOR: Record<string, string> = {
  Income: '#22c55e',
  Traffic: '#60a5fa',
  Fuel: '#f97316',
}

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

export default function FlowPage() {
  const flowId = useParams().id as string
  const [flow, setFlow] = useState<Flow | null>(null)
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null)
  const [showAddNode, setShowAddNode] = useState(false)
  const [layingOut, setLayingOut] = useState(false)

  // heartbeat totals
  const [daily, setDaily] = useState<number>(0)
  const [monthly, setMonthly] = useState<number>(0)
  const [yearly, setYearly] = useState<number>(0)

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
  const fetchHeadline = async () => {
    const { data } = await supabase
      .from('v_flow_headline')
      .select('daily_total,monthly_total,yearly_total')
      .eq('flow_id', flowId)
      .maybeSingle()
    setDaily(Number(data?.daily_total || 0))
    setMonthly(Number(data?.monthly_total || 0))
    setYearly(Number(data?.yearly_total || 0))
  }

  const refreshCanvas = async () => {
    await Promise.all([fetchNodes(), fetchEdges(), fetchHeadline()])
  }

  useEffect(() => {
    if (flowId) {
      fetchFlow()
      refreshCanvas()
    }
  }, [flowId])

  // ------------------------------------------------------------------
  // ORGANIC 2D LAYOUT (force-directed with directional/rightward bias)
  // ------------------------------------------------------------------
  async function organicLayoutAndPersist() {
    if (!nodes.length) return
    setLayingOut(true)

    // simulation params (tweak if you want)
    const ITER = Math.min(700, 200 + nodes.length * 15)
    const L0 = 180                 // preferred edge length
    const SPRING = 0.02            // edge spring strength
    const REPULSE = 2200           // node-node repulsion factor
    const GRAVITY = 0.02           // pull-to-center
    const FRICTION = 0.85          // velocity damping
    const BIAS_X = 0.008           // rightward bias for directed links
    const BIAS_BOTH = 0.003        // small bias for bidirectional
    const WIDTH = 1600, HEIGHT = 1000
    const MARGIN = 80

    // map ids
    const idIndex = new Map<string, number>()
    nodes.forEach((n, i) => idIndex.set(n.id, i))

    // positions & velocities
    const pos = nodes.map(n => ({
      x: (typeof n.x === 'number' ? Number(n.x) : (Math.random() - 0.5) * 800),
      y: (typeof n.y === 'number' ? Number(n.y) : (Math.random() - 0.5) * 600),
    }))
    const vel = nodes.map(() => ({ x: 0, y: 0 }))
    const center = { x: 0, y: 0 }

    // build edge list with weights/bias
    const E = edges.map(e => {
      const a = idIndex.get(e.source_id)
      const b = idIndex.get(e.target_id)
      if (a == null || b == null) return null
      const dir = normalizeDir(e.direction || undefined)
      // stronger springs for money edges
      const w =
        normalizeType(e.type) === 'Traffic' ? SPRING * 0.5 : SPRING * 1.0
      return { a, b, dir, w }
    }).filter(Boolean) as { a: number; b: number; dir: 'a->b'|'b->a'|'both'|'none'; w: number }[]

    // main loop
    for (let t = 0; t < ITER; t++) {
      // forces init
      const fx = new Array(nodes.length).fill(0)
      const fy = new Array(nodes.length).fill(0)

      // repulsion (Coulomb)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = pos[i].x - pos[j].x
          const dy = pos[i].y - pos[j].y
          const d2 = dx*dx + dy*dy + 0.01
          const f = REPULSE / d2
          const inv = 1 / Math.sqrt(d2)
          const ux = dx * inv, uy = dy * inv
          fx[i] += f * ux; fy[i] += f * uy
          fx[j] -= f * ux; fy[j] -= f * uy
        }
      }

      // attraction (springs) + directional bias
      for (const { a, b, dir, w } of E) {
        const dx = pos[b].x - pos[a].x
        const dy = pos[b].y - pos[a].y
        const dist = Math.max(0.1, Math.hypot(dx, dy))
        const ux = dx / dist
        const uy = dy / dist

        const springF = w * (dist - L0)
        fx[a] += springF * ux
        fy[a] += springF * uy
        fx[b] -= springF * ux
        fy[b] -= springF * uy

        // encourage arrows to point right-ish (or left if user reversed)
        if (dir === 'a->b') {
          fx[b] += BIAS_X * (L0 - dx)  // push b to the right of a
          fx[a] -= BIAS_X * (L0 - dx)
        } else if (dir === 'b->a') {
          fx[a] += BIAS_X * (L0 + dx)  // push a to the right of b
          fx[b] -= BIAS_X * (L0 + dx)
        } else if (dir === 'both') {
          // gentle spread to avoid perfect stacking
          fx[a] -= BIAS_BOTH * dx
          fx[b] += BIAS_BOTH * dx
          fy[a] -= BIAS_BOTH * dy
          fy[b] += BIAS_BOTH * dy
        }
      }

      // gravity to center
      for (let i = 0; i < nodes.length; i++) {
        fx[i] += -GRAVITY * (pos[i].x - center.x)
        fy[i] += -GRAVITY * (pos[i].y - center.y)
      }

      // integrate
      const step = 0.8 * (1 - t / ITER) + 0.2   // cool down
      for (let i = 0; i < nodes.length; i++) {
        vel[i].x = (vel[i].x + fx[i] * step) * FRICTION
        vel[i].y = (vel[i].y + fy[i] * step) * FRICTION
        pos[i].x += vel[i].x
        pos[i].y += vel[i].y
      }
    }

    // normalize to a nice viewport and add margins
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of pos) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    const spanX = Math.max(300, maxX - minX)
    const spanY = Math.max(300, maxY - minY)
    const sx = (WIDTH - 2*MARGIN) / spanX
    const sy = (HEIGHT - 2*MARGIN) / spanY
    const s = Math.min(sx, sy)

    const updates = pos.map((p, i) => {
      const x = (p.x - minX) * s + MARGIN
      const y = (p.y - minY) * s + MARGIN
      return { id: nodes[i].id, x: Math.round(x), y: Math.round(y) }
    })

    // persist
    await Promise.all(updates.map(u =>
      supabase.from('nodes').update({ x: u.x, y: u.y }).eq('id', u.id)
    ))

    await refreshCanvas()
    setLayingOut(false)
  }

  // ReactFlow data
  const rfNodes = useMemo(
    () =>
      nodes.map((n) => {
        const bg = NODE_COLOR[normalizeType(n.type)] || '#64748b'
        return {
          id: n.id,
          data: { label: n.name },
          type: 'default',
          position: {
            x: typeof n.x === 'number' ? Number(n.x) : Math.random() * 300,
            y: typeof n.y === 'number' ? Number(n.y) : Math.random() * 300,
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
      <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{flow?.name || 'Loading…'}</h1>
          <div className="text-sm text-white/70 mt-1">
            Heartbeat:&nbsp;
            <span className="font-semibold">${daily.toFixed(2)}</span>/day ·&nbsp;
            <span className="font-semibold">${monthly.toFixed(2)}</span>/mo ·&nbsp;
            <span className="font-semibold">${yearly.toFixed(2)}</span>/yr
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={organicLayoutAndPersist}
            disabled={layingOut}
            className="bg-indigo-600 disabled:bg-indigo-600/50 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition"
          >
            {layingOut ? 'Auto-layout…' : 'Auto-layout (Organic)'}
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
          refresh={async () => { await refreshCanvas() }}
        />
      )}
    </main>
  )
}
