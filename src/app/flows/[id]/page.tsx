  'use client'

  import { useEffect, useMemo, useState } from 'react'
  import { useParams, useSearchParams } from 'next/navigation'
  import { createClient } from '@/lib/supabase'
  import FlowCanvas from './FlowCanvas'
  import NodeModal from '@/components/NodeModal'
  import EdgeModal from '@/components/EdgeModal'
  import AddNodeForm from './AddNodeForm'
  import { MarkerType } from 'reactflow'
  import { Dialog, Popover, Transition } from '@headlessui/react'
  import { Button } from '@/components/ui/button'
  import FlowSwitcher from '@/components/FlowSwitcher'
  import TimeframeSwitcher from '@/components/TimeframeSwitcher'
  import { useProfile } from '@/context/ProfileProvider'
  import { getLatestRates } from '@/lib/rates'



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
    show_amount?: boolean | null
    // attached recurring summary from view
    daily_flow?: number | null
    monthly_flow?: number | null
    yearly_flow?: number | null
    entries_count?: number | null
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

  type ViewMode = 'daily' | 'monthly' | 'yearly'

  export default function FlowPage() {
    const urlParam = useParams().id as string
    const qs = useSearchParams()
    const { profile } = useProfile()  // ✅ get profile so master_currency works

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

  // exchange rates
  const [rates, setRates] = useState<Record<string, number>>({})
  useEffect(() => {
    getLatestRates().then(setRates)
  }, [])

    // global view controls
    const [viewMode, setViewMode] = useState<ViewMode>('monthly')
    const [showAmounts, setShowAmounts] = useState<boolean>(true) // owner local toggle
    const [shareNoAmounts, setShareNoAmounts] = useState<boolean>(false)

    // read "no_amounts" in share links
    const noAmountsParam = qs?.get('no_amounts') === '1'

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
      const { data, error } = await supabase.from('flows').select('*').eq('id', urlParam).maybeSingle()
      let flowData = data

      if (!flowData && !error) {
        // try by share_id
        const res = await supabase.from('flows').select('*').eq('share_id', urlParam).maybeSingle()
        flowData = res.data || null
      }

      if (flowData) {
        setFlow(flowData as Flow)
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
      // 1) base edges, include show_amount
      const { data: base } = await supabase
        .from('edges')
        .select('id,flow_id,source_id,target_id,type,direction,label,show_amount')
        .eq('flow_id', fid)

      const baseEdges = (base as EdgeData[]) || []

      if (baseEdges.length === 0) {
        setEdges([])
        return
      }

      // 2) attach recurring flows from view for all edges in one shot
      const ids = baseEdges.map(e => e.id)
      const { data: rec } = await supabase
        .from('v_edge_recurring_flow')
        .select('edge_id,daily_flow,monthly_flow,yearly_flow,entries_count')
        .in('edge_id', ids)

      const byId = new Map<string, any>()
      ;(rec || []).forEach((r: any) => byId.set(r.edge_id, r))

      const merged = baseEdges.map(e => {
        const r = byId.get(e.id)
        return {
          ...e,
          daily_flow: r?.daily_flow ?? null,
          monthly_flow: r?.monthly_flow ?? null,
          yearly_flow: r?.yearly_flow ?? null,
          entries_count: r?.entries_count ?? null,
        }
      })

      setEdges(merged)
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

    // global rules for showing amounts on edges
    const showAmountsForViewer =
      (!isPublicViewer && showAmounts) ||
      (isPublicViewer && publicMode >= 2 && !noAmountsParam)

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
        ? `${window.location.origin}/flows/${flow.share_id}${shareNoAmounts ? '?no_amounts=1' : ''}`
        : ''

        function fmtCurrency(n: number, currency: string) {
          if (!n || !isFinite(n)) return '-'
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(n)
        }
                

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

          const springF = w * (dist - 180)
          fx[a] += springF * ux; fy[a] += springF * uy
          fx[b] -= springF * ux; fy[b] -= springF * uy

          if (dir === 'a->b') {
            fx[b] += 0.008 * (180 - dx)
            fx[a] -= 0.008 * (180 - dx)
          } else if (dir === 'b->a') {
            fx[a] += 0.008 * (180 + dx)
            fx[b] -= 0.008 * (180 + dx)
          } else if (dir === 'both') {
            fx[a] -= 0.003 * dx; fy[a] -= 0.003 * dy
            fx[b] += 0.003 * dx; fy[b] += 0.003 * dy
          }
        }

        for (let i = 0; i < nodes.length; i++) {
          fx[i] += -0.02 * (pos[i].x - center.x)
          fy[i] += -0.02 * (pos[i].y - center.y)
        }

        const step = 0.8 * (1 - t / ITER) + 0.2
        for (let i = 0; i < nodes.length; i++) {
          vel[i].x = (vel[i].x + fx[i] * step) * 0.85
          vel[i].y = (vel[i].y + fy[i] * step) * 0.85
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

          // how the edge decides to show amount
// how the edge decides to show amount
let amountText: string | null = null
const shouldShow = e.show_amount !== false && showAmountsForViewer

if (shouldShow) {
  const val =
    viewMode === 'daily'
      ? e.daily_flow
      : viewMode === 'monthly'
      ? e.monthly_flow
      : e.yearly_flow

  if (typeof val === 'number' && isFinite(val)) {
    const suffix = viewMode === 'daily' ? '/d' : viewMode === 'monthly' ? '/mo' : '/yr'
    const prefix = val < 0 ? '-' : ''
    const abs = Math.abs(val).toFixed(2)
    amountText = `${prefix}NT$${abs} ${suffix}`
  }
}
                              
          const finalLabel =
            amountText && e.label
              ? `${e.label} • ${amountText}`
              : amountText || e.label || undefined

          return {
            id: e.id,
            source: e.source_id,
            target: e.target_id,
            label: finalLabel,
            animated: !isBoth && !isNone,
            markerStart: isBoth ? { type: MarkerType.ArrowClosed, color: stroke } : undefined,
            markerEnd: isNone ? undefined : { type: MarkerType.ArrowClosed, color: stroke },
            style: isNone
              ? { stroke, strokeDasharray: '6 6', strokeWidth: 2 }
              : { stroke, strokeWidth: 2 },
            data: { direction: dir, linkType: e.type },
          }
        }),
      [edges, viewMode, showAmountsForViewer]
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
        <FlowSwitcher />
    
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
    <div className="mt-2 flex items-center gap-3">
      <span className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium">
      {viewMode === 'daily'
    ? `${fmtCurrency(daily, profile?.master_currency || 'USD')} / day`
    : viewMode === 'monthly'
    ? `${fmtCurrency(monthly, profile?.master_currency || 'USD')} / mo`
    : `${fmtCurrency(yearly, profile?.master_currency || 'USD')} / yr`}
      </span>

      {isOwner && profile && (
        <select
          value={profile.master_currency || 'USD'}
          onChange={async (e) => {
            const nextCurrency = e.target.value
            await supabase
              .from('profiles')
              .update({ master_currency: nextCurrency })
              .eq('id', profile.id)
            // reload profile so UI updates
            window.location.reload()
          }}
          className="rounded-md bg-black/40 border border-white/10 px-2 py-1 text-xs text-white"
        >
          <option value="USD">USD</option>
          <option value="TWD">TWD</option>
          <option value="CAD">CAD</option>
          <option value="EUR">EUR</option>
        </select>
      )}
    </div>
  )}
              </div>

  {/* Right: grouped controls */}
  <div className="flex items-center gap-3 overflow-x-auto flex-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
    {isOwner && (
      <>
        {/* Group 0: Timeframe + owner show amounts toggle */}
        <div className="flex flex-none items-center gap-2 rounded-md border border-white/15 bg-black/40 p-1">
          <TimeframeSwitcher viewMode={viewMode} setViewMode={setViewMode} />
          <div className="h-6 w-px bg-white/10" />
          <label className="flex items-center gap-1 text-sm px-2">
            <input
              type="checkbox"
              checked={showAmounts}
              onChange={(e) => setShowAmounts(e.target.checked)}
              className="accent-white"
            />
            Show amounts
          </label>
        </div>

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

                    {/* Group 2: Share popover */}
                    {flow?.privacy === 'public' && (
                      <Popover className="relative flex-none">
                        {({ open }) => (
                          <>
                            <Popover.Button
                              className={`h-9 rounded-md border border-white/15 px-3 text-sm ${
                                open ? 'bg-white/10' : 'hover:bg-white/10'
                              }`}
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
                                    onClick={async () => {
                                      if (shareUrl) await navigator.clipboard.writeText(shareUrl)
                                    }}
                                    className="h-9 flex-none rounded-md border border-white/15 px-3 text-sm hover:bg-white/10"
                                  >
                                    Copy
                                  </button>
                                </div>

                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <label className="inline-flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      className="accent-white"
                                      checked={shareNoAmounts}
                                      onChange={(e) => setShareNoAmounts(e.target.checked)}
                                    />
                                    Hide all amounts in shared link
                                  </label>
                                  <span className="text-xs text-white/60">
                                    You can also switch public mode above.
                                  </span>
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
      const real = edges.find(n => n.id === rfNode.id)
      const actual = nodes.find(n => n.id === rfNode.id)
      if (actual) setSelectedNode(actual)
    }}
    onEdgeClick={(rfEdge) => {
      if (!canOpenDetails) return
      const real = edges.find(e => e.id === rfEdge.id)
      if (real) setSelectedEdge(real)
    }}
    refresh={() => (flow?.id ? refreshCanvas(flow.id) : Promise.resolve())}
    viewMode={viewMode} // ✅ ← ADD THIS LINE
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