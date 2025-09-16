'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  OnConnect,
  Node,
  Edge,
} from 'reactflow'
import { BackgroundVariant } from '@reactflow/background'
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase'
import { useProfile } from '@/context/ProfileProvider'
import { exportPNG, exportPDF, exportJSON, exportCSV } from '@/lib/exporters'

const supabase = createClient()

const EDGE_COLOR: Record<string, string> = {
  Income: '#22c55e',
  Traffic: '#60a5fa',
  Fuel: '#f97316',
}

type Props = {
  flowId: string
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (node: { id: string }) => void
  onEdgeClick: (edge: { id: string }) => void
  refresh: () => void
  viewMode: 'daily' | 'monthly' | 'yearly'
}

export default function FlowCanvas({
  flowId,
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  refresh,
  viewMode,
}: Props) {
  const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes)
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges)
  const { profile } = useProfile()

  // Capture area for PNG/PDF
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setNodesState(nodes) }, [nodes, setNodesState])
  useEffect(() => { setEdgesState(edges) }, [edges, setEdgesState])

  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return
  
      // 1. Check in local edges
      const alreadyExists = edgesState.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.data?.linkType === 'Traffic' // optional type check
      )
      if (alreadyExists) {
        console.log('Edge already exists locally, skipping insert.')
        return
      }
  
      // 2. Check in DB
      const { data: existing } = await supabase
        .from('edges')
        .select('id')
        .eq('flow_id', flowId)
        .eq('source_id', connection.source)
        .eq('target_id', connection.target)
        .maybeSingle()
  
      if (existing) {
        console.log('Edge already exists in DB, skipping insert:', existing.id)
        return
      }
  
      // 3. Otherwise create
      const type = 'Traffic'
      const stroke = EDGE_COLOR[type] || '#e5e7eb'
  
      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        label: undefined,
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke },
        animated: true,
        style: { stroke, strokeWidth: 2 },
        data: { direction: 'a->b', linkType: type },
      }
  
      setEdgesState((eds) => addEdge(newEdge, eds))
  
      await supabase.from('edges').insert({
        id: newEdge.id,
        flow_id: flowId,
        source_id: connection.source,
        target_id: connection.target,
        type,
        direction: 'a->b',
        label: null,
        show_amount: true,
      })
  
      refresh()
    },
    [flowId, setEdgesState, refresh, edgesState]
  )
    
  const onNodeDragStop = useCallback(
    async (_e: any, node: Node) => {
      await supabase
        .from('nodes')
        .update({ x: node.position.x, y: node.position.y })
        .eq('id', node.id)
      refresh()
    },
    [refresh]
  )

  // Export helpers
  const isPro = (profile?.subscription_level ?? 'basic') === 'pro'
  const watermarkText = useMemo(() => (isPro ? undefined : 'Papaya • Basic'), [isPro])

  const basename = useMemo(() => {
    const first = nodesState[0]?.data as any
    const name = (first?.label || first?.name || 'flow').toString()
    return name.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_').slice(0, 40)
  }, [nodesState])

  const handleExportPNG = async () => {
    if (!exportRef.current) return
    await exportPNG(exportRef.current, {
      filename: `${basename}.png`,
      watermarkText,
    })
  }

  const handleExportPDF = async () => {
    if (!exportRef.current) return
    await exportPDF(exportRef.current, {
      filename: `${basename}.pdf`,
      watermarkText,
    })
  }

  const handleExportJSON = () => {
    exportJSON(nodesState, edgesState, `${basename}.json`)
  }

  const handleExportCSV = () => {
    exportCSV(nodesState, edgesState, basename)
  }

  return (
    <div className="relative h-[80vh] w-full">
      
      {/* Tiny export menu (ignored in exports) */}
{/* Tiny export menu (ignored in exports) */}
<div
  data-export-ignore="true"
  className="absolute right-3 top-3 z-10"
>
  <details className="group relative">
    <summary
      className="flex h-9 w-9 cursor-pointer select-none items-center justify-center rounded-lg border border-white/10 bg-zinc-900/80 text-white hover:bg-zinc-800/80"
      title={isPro ? 'Export' : 'Export (watermark)'}
    >
      {/* download icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 3a1 1 0 0 1 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4.004 4.004a1 1 0 0 1-1.414 0L7.286 11.707a1 1 0 1 1 1.414-1.414L11 12.586V4a1 1 0 0 1 1-1Z"/>
        <path d="M4 15a1 1 0 0 1 1 1v2h14v-2a1 1 0 1 1 2 0v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 2 0v2h2v-2a1 1 0 1 1 1-1Z"/>
      </svg>
    </summary>

    <div className="absolute right-0 mt-2 w-40 rounded-xl border border-white/10 bg-zinc-900/95 p-1 shadow-xl backdrop-blur">
      {/* Always available: PNG */}
      <button
        onClick={handleExportPNG}
        className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
      >
        PNG {isPro ? '' : '(wm)'}
      </button>

      {/* Pro-only options */}
      {isPro && (
        <>
          <button
            onClick={handleExportPDF}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            PDF
          </button>
          <div className="my-1 h-px bg-white/10" />
          <button
            onClick={handleExportJSON}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-white/10"
          >
            CSV
          </button>
        </>
      )}
    </div>
  </details>
</div>

      {/* Export scope wrapper */}
      <div ref={exportRef} className="h-full w-full">
        <ReactFlow
          nodes={nodesState}
          edges={edgesState}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onNodeClick={(_, node) => onNodeClick({ id: node.id })}
          onEdgeClick={(_, edge) => onEdgeClick({ id: edge.id })}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          {/* Keep your original UI */}
          <MiniMap
            position="top-right"
            zoomable
            pannable
            className="!bg-transparent !border !border-white/10 !backdrop-blur-sm rounded-lg shadow-lg"
            style={{ width: 160, height: 110 }}
            maskColor="rgba(10,10,10,0.55)"
            nodeStrokeColor={(n) => (n?.data as any)?.stroke || '#52525b'}
            nodeColor={(n) => (n?.data as any)?.fill || '#3f3f46'}
            nodeBorderRadius={8}
          />

          <Controls
            position="bottom-left"
            showInteractive={false}
            style={{ bottom: 32, left: 32 }}
            className="
              !bg-zinc-800/80
              !border !border-white/10
              !rounded-xl
              !shadow-lg
              !p-1
              [&_button]:!bg-transparent
              [&_button]:!text-white
              [&_button]:!border-0
              [&_button:hover]:!bg-white/10
            "
          />

          <Background
            id="grid"
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="rgba(255,255,255,0.08)"
            className="pointer-events-none"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
