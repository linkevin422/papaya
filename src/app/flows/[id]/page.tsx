'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import FlowCanvas from './FlowCanvas'
import NodeModal from '@/components/NodeModal'
import EdgeModal from '@/components/EdgeModal'
import AddNodeForm from './AddNodeForm'
import { MarkerType } from 'reactflow'
import { Dialog, Popover, Transition } from '@headlessui/react'
import { Button } from '@/components/ui/button'

const supabase = createClient()

type Flow = {
  id: string
  name: string
  user_id: string
  created_at: string
  privacy: 'private' | 'public'
  public_mode: number | null
  share_id: string
}

type NodeData = {
  id: string
  name: string
  type?: string
  x?: number | null
  y?: number | null
}

type EdgeData = {
  id: string
  flow_id: string
  source_id: string
  target_id: string
  type: string
  direction: string | null
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

const fmtUSD = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function FlowPage() {
  const urlParam = useParams().id as string

  const [flow, setFlow] = useState<Flow | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [viewerId, setViewerId] = useState<string | null>(null)

  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null)
  const [showAddNode, setShowAddNode] = useState(false)
  const [layingOut, setLayingOut] = useState(false)

  // headline totals
  const [daily, setDaily] = useState<number>(0)
  const [monthly, setMonthly] = useState<number>(0)
  const [yearly, setYearly] = useState<number>(0)

  // session user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setViewerId(data.session?.user?.id ?? null)
    })
  }, [])

  // --- fetchers ---
  const fetchFlow = async () => {
    setNotFound(false)
    // try by real id
    let { data, error } = await supabase.from('flows').select('*').eq('id', urlParam).maybeSingle()
    if (!data && !error) {
      // try by share_id
      const res = await supabase.from('flows').select('*').eq('share_id', urlParam).maybeSingle()
      data = res.data || null
    }
    if (data) {
      setFlow(data as Flow)
    } else {
      setFlow(null)
      setNotFound(true)
    }
  }

  const fetchNodes = async (fid: string) => {
    const { data } = await supabase.from('nodes').select('*').eq('flow_id', fid)
    if (data) setNodes(data)
  }

  const fetchEdges = async (fid: string) => {
    const { data } = await supabase.from('edges').select('*').eq('flow_id', fid)
    if (data) setEdges(data as any)
  }

  const fetchHeadline = async (fid: string) => {
    const { data } = await supabase
      .from('v_flow_headline')
      .select('daily_total,monthly_total,yearly_total')
      .eq('flow_id', fid)
      .maybeSingle()
    setDaily(Number(data?.daily_total || 0))
    setMonthly(Number(data?.monthly_total || 0))
    setYearly(Number(data?.yearly_total || 0))
  }

  const refreshCanvas = async (fid: string) => {
    await Promise.all([fetchNodes(fid), fetchEdges(fid), fetchHeadline(fid)])
  }

  // initial load
  useEffect(() => {
    if (!urlParam) return
    ;(async () => {
      await fetchFlow()
    })()
  }, [urlParam])

  // load nodes/edges once we know the real flow id
  useEffect(() => {
    if (flow?.id) {
      refreshCanvas(flow.id)
    } else {
      setNodes([])
      setEdges([])
    }
  }, [flow?.id])

  // permissions and public view mode
  const isOwner = !!flow && !!viewerId && flow.user_id === viewerId
  const isPublicViewer = !!flow && flow.privacy === 'public' && !isOwner
  const publicMode = flow?.public_mode ?? 1
  const canOpenDetails = isOwner || (isPublicViewer && publicMode >= 3)

  // rename flow
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')

  useEffect(() => {
    if (flow?.name) setNameDraft(flow.name)
  }, [flow?.name])

  const saveName = async () => {
    if (!flow) return
    await supabase.from('flows').update({ name: nameDraft }).eq('id', flow.id)
    await fetchFlow()
    setEditingName(false)
  }

  // privacy and public mode
  const updatePrivacy = async (next: 'private' | 'public') => {
    if (!flow) return
    const patch: any = { privacy: next }
    if (next === 'public' && !flow.public_mode) patch.public_mode = 1
    await supabase.from('flows').update(patch).eq('id', flow.id)
    await fetchFlow()
  }

  const updatePublicMode = async (m: number) => {
    if (!flow) return
    await supabase.from('flows').update({ public_mode: m }).eq('id', flow.id)
    await fetchFlow()
  }

  // share url constructed from share_id
  const shareUrl =
    typeof window !== 'undefined' && flow
      ? `${window.location.origin}/flows/${flow.share_id}`
      : ''

  // auto layout and persist node positions
  async function organicLayoutAndPersist() {
    if (!nodes.length || !flow?.id) return
    setLayingOut(true)

    const ITER = Math.min(700, 200 + nodes.length * 15)
    const L0 = 180
    const SPRING = 0.02
    const REPULSE = 2200
    const GRAVITY = 0.02
    const FRICTION = 0.85
    const BIAS_X = 0.008
    const BIAS_BOTH = 0.003
    const WIDTH = 1600, HEIGHT = 1000
    const MARGIN = 80

    const idIndex = new Map<string, number>()
    nodes.forEach((n, i) => idIndex.set(n.id, i))

    const pos = nodes.map(n => ({
      x: (typeof n.x === 'number' ? Number(n.x) : (Math.random() - 0.5) * 800),
      y: (typeof n.y === 'number' ? Number(n.y) : (Math.random() - 0.5) * 600),
    }))
    const vel = nodes.map(() => ({ x: 0, y: 0 }))
    const center = { x: 0, y: 0 }

    const E = edges.map(e => {
      const a = idIndex.get(e.source_id)
      const b = idIndex.get(e.target_id)
      if (a == null || b == null) return null
      const dir = normalizeDir(e.direction || undefined)
      const w = normalizeType(e.type) === 'Traffic' ? SPRING * 0.5 : SPRING * 1.0
      return { a, b, dir, w }
    }).filter(Boolean) as { a: number; b: number; dir: 'a->b'|'b->a'|'both'|'none'; w: number }[]

    for (let t = 0; t < ITER; t++) {
      const fx = new Array(nodes.length).fill(0)
      const fy = new Array(nodes.length).fill(0)

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

      for (const { a, b, dir, w } of E) {
        const dx = pos[b].x - pos[a].x
        const dy = pos[b].y - pos[a].y
        const dist = Math.max(0.1, Math.hypot(dx, dy))
        const ux = dx / dist
        const uy = dy / dist

        const springF = w * (dist - L0)
        fx[a] += springF * ux; fy[a] += springF * uy
        fx[b] -= springF * ux; fy[b] -= springF * uy

        if (dir === 'a->b') {
          fx[b] += BIAS_X * (L0 - dx)
          fx[a] -= BIAS_X * (L0 - dx)
        } else if (dir === 'b->a') {
          fx[a] += BIAS_X * (L0 + dx)
          fx[b] -= BIAS_X * (L0 + dx)
        } else if (dir === 'both') {
          fx[a] -= BIAS_BOTH * dx; fy[a] -= BIAS_BOTH * dy
          fx[b] += BIAS_BOTH * dx; fy[b] += BIAS_BOTH * dy
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        fx[i] += -GRAVITY * (pos[i].x - center.x)
        fy[i] += -GRAVITY * (pos[i].y - center.y)
      }

      const step = 0.8 * (1 - t / ITER) + 0.2
      for (let i = 0; i < nodes.length; i++) {
        vel[i].x = (vel[i].x + fx[i] * step) * FRICTION
        vel[i].y = (vel[i].y + fy[i] * step) * FRICTION
        pos[i].x += vel[i].x
        pos[i].y += vel[i].y
      }
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of pos) {
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }
    const spanX = Math.max(300, maxX - minX)
    const spanY = Math.max(300, maxY - minY)
    const sx = (1600 - 2*80) / spanX
    const sy = (1000 - 2*80) / spanY
    const s = Math.min(sx, sy)

    const updates = pos.map((p, i) => {
      const x = (p.x - minX) * s + 80
      const y = (p.y - minY) * s + 80
      return { id: nodes[i].id, x: Math.round(x), y: Math.round(y) }
    })

    await Promise.all(updates.map(u =>
      supabase.from('nodes').update({ x: u.x, y: u.y }).eq('id', u.id)
    ))

    await refreshCanvas(flow.id)
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

  if (notFound) {
    return (
      <main className="flex h-[70vh] items-center justify-center text-white">
        <div className="rounded-xl border border-white/10 bg-zinc-950/60 px-6 py-5">
          <p className="text-sm text-white/80">This flow is private or does not exist.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative w-full text-white">
      {/* Header with stats and controls */}
      <div className="sticky top-0 z-30 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/30">
  <div className="mx-auto max-w-6xl px-4 py-4">
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
      {/* Left: title + totals */}
      <div className="min-w-0">
        {isOwner ? (
          <div className="flex items-center gap-2">
            {editingName ? (
              <>
                <input
                  className="rounded-md border border-white/15 bg-black/40 px-2 py-1"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                />
                <button onClick={saveName} className="rounded-md border border-white/15 px-2 py-1">
                  Save
                </button>
                <button
                  onClick={() => { setEditingName(false); setNameDraft(flow?.name || '') }}
                  className="rounded-md border border-white/15 px-2 py-1"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h1 className="truncate text-2xl font-semibold">{flow?.name || '…'}</h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="rounded-md border border-white/15 px-2 py-1 text-xs"
                >
                  Rename
                </button>
              </>
            )}
          </div>
        ) : (
          <h1 className="truncate text-2xl font-semibold">{flow?.name || '…'}</h1>
        )}

        {(!isPublicViewer || publicMode >= 2) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {fmtUSD(daily)} <span className="text-white/60">/ day</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {fmtUSD(monthly)} <span className="text-white/60">/ mo</span>
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              {fmtUSD(yearly)} <span className="text-white/60">/ yr</span>
            </span>
          </div>
        )}
      </div>

{/* Right: grouped controls */}
<div className="flex items-center gap-3">
  {/* scroller for most controls (keeps horizontal scroll) */}
  <div className="flex items-center gap-3 overflow-x-auto flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {isOwner && (
      <>
        {/* Group 1: Visibility */}
        <div className="flex flex-none items-center gap-1 rounded-md border border-white/15 bg-black/40 p-1">
          <select
            value={flow?.privacy || 'private'}
            onChange={(e) => updatePrivacy(e.target.value as 'private' | 'public')}
            className="h-8 rounded-md bg-transparent px-2 text-sm outline-none"
            title="Privacy"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>

          {flow?.privacy === 'public' && <div className="h-6 w-px bg-white/10" />}

          {flow?.privacy === 'public' && (
            <select
              value={flow.public_mode ?? 1}
              onChange={(e) => updatePublicMode(Number(e.target.value))}
              className="h-8 rounded-md bg-transparent px-2 text-sm outline-none"
              title="Public view mode"
            >
              <option value={1}>No earnings</option>
              <option value={2}>Show earnings</option>
              <option value={3}>Earnings + details</option>
            </select>
          )}
        </div>

        {/* Group 3: Actions */}
        <button
          onClick={organicLayoutAndPersist}
          disabled={layingOut}
          className="h-9 flex-none rounded-md border border-white/15 px-3 text-sm hover:bg-white/10 disabled:opacity-50"
          title="Re-arrange nodes organically"
        >
          {layingOut ? 'Auto-layout…' : 'Auto-layout'}
        </button>
        <Button
          onClick={() => setShowAddNode(true)}
          className="h-9 flex-none bg-emerald-600 px-3 text-sm hover:bg-emerald-700"
          title="Add a new node"
        >
          + Add Node
        </Button>
      </>
    )}
  </div>

  {/* Share popover OUTSIDE the scroller so it isn’t clipped */}
  {isOwner && flow?.privacy === 'public' && (
    <Popover className="relative flex-none">
      {({ open }) => (
        <>
          <Popover.Button
            type="button"
            className={`h-9 rounded-md border border-white/15 px-3 text-sm ${open ? 'bg-white/10' : 'hover:bg-white/10'}`}
          >
            Share
          </Popover.Button>

          <Transition
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-[min(90vw,28rem)] rounded-lg border border-white/10 bg-zinc-950 p-3 shadow-xl">
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="h-9 flex-1 truncate rounded-md border border-white/15 bg-black/40 px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!shareUrl) return
                    try {
                      await navigator.clipboard.writeText(shareUrl)
                    } catch {
                      // fallback for http / older browsers
                      const ta = document.createElement('textarea')
                      ta.value = shareUrl
                      document.body.appendChild(ta)
                      ta.select()
                      document.execCommand('copy')
                      document.body.removeChild(ta)
                    }
                  }}
                  className="h-9 flex-none rounded-md border border-white/15 px-3 text-sm hover:bg-white/10"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-xs text-white/60">
                Anyone with the link can view according to the selected mode.
              </p>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )}
</div>

    </div>
  </div>
</div>

      {/* Canvas */}
      <div className="mx-auto max-w-6xl px-4 py-4">
        <FlowCanvas
          flowId={flow?.id || urlParam}
          nodes={rfNodes}
          edges={rfEdges}
          onNodeClick={(rfNode) => {
            if (!canOpenDetails) return
            const real = nodes.find(n => n.id === rfNode.id)
            if (real) setSelectedNode(real)
          }}
          onEdgeClick={(rfEdge) => {
            if (!canOpenDetails) return
            const real = edges.find(e => e.id === rfEdge.id)
            if (real) setSelectedEdge(real)
          }}
          refresh={() => (flow?.id ? refreshCanvas(flow.id) : Promise.resolve())}
        />
      </div>

      {/* Add Node Modal, owner only */}
      <Dialog open={showAddNode} onClose={() => setShowAddNode(false)} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/70" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white">
            <Dialog.Title className="mb-4 text-lg font-semibold">Add New Node</Dialog.Title>
            {isOwner && flow && flow.user_id && (
              <AddNodeForm
                flowId={flow.id}
                userId={flow.user_id}
                onNodeAdded={() => {
                  if (flow?.id) refreshCanvas(flow.id)
                  setShowAddNode(false)
                }}
              />
            )}
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowAddNode(false)}
                className="rounded-md border border-white/10 px-4 py-2 text-white hover:text-gray-300"
              >
                Cancel
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Modals: open details for owner, or for public viewers only in mode 3 */}
      {selectedNode && canOpenDetails && (
        <NodeModal
          open={true}
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          refresh={() => (flow?.id ? refreshCanvas(flow.id) : Promise.resolve())}
        />
      )}

      {selectedEdge && canOpenDetails && (
        <EdgeModal
          open={true}
          edge={selectedEdge}
          nodes={nodes}
          onClose={() => setSelectedEdge(null)}
          refresh={() => (flow?.id ? refreshCanvas(flow.id) : Promise.resolve())}
        />
      )}
    </main>
  )
}
