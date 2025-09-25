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

const supabase = createClient()

const EDGE_COLOR: Record<string, string> = {
  Income: '#22c55e',
  Traffic: '#60a5fa',
  Fuel: '#ef4444', // bright red
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
  const decorateEdge = (e: Edge): Edge => ({
    ...e,
    labelStyle: {
      fill: '#f5f5f5',
      fontSize: 13,
      fontWeight: 600,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI',
    },
    labelBgStyle: {
      fill: 'rgba(24,24,27,0.85)',
      stroke: 'rgba(255,255,255,0.12)',
      strokeWidth: 1,
      borderRadius: 8,
      padding: 6,
    },
  })
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges.map(decorateEdge))
    const { profile } = useProfile()

  useEffect(() => { setNodesState(nodes) }, [nodes, setNodesState])
  useEffect(() => { setEdgesState(edges.map(decorateEdge)) }, [edges, setEdgesState])

  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return
  
      const newId = `${connection.source}-${connection.target}-${Date.now()}`
      const type = 'Traffic' // <- MUST match DB constraint exactly (capital T)
      const strokeColor = EDGE_COLOR.Traffic || '#e5e7eb'
  
      // optimistic edge
      const newEdge: Edge = decorateEdge({
        id: newId,
        source: connection.source,
        target: connection.target,
        markerEnd: { type: MarkerType.ArrowClosed, color: strokeColor },
        animated: true,
        style: { stroke: strokeColor, strokeWidth: 2 },
        // no label here; DB/refresh will supply the calculated text
        data: { direction: 'a->b', linkType: type },
      })
            setEdgesState(eds => addEdge(newEdge, eds))
  
      // insert (include id because edges.id is NOT NULL)
      const { error } = await supabase.from('edges').insert({
        id: newId,
        flow_id: flowId,
        source_id: connection.source,
        target_id: connection.target,
        type,                // 'Traffic' with capital T
        direction: 'a->b',
        label: null,
        show_amount: true,
      })
  
      if (error) {
        console.error('Edge insert failed:', error)
        setEdgesState(eds => eds.filter(e => e.id !== newId)) // rollback
        return
      }
  
      await refresh()
    },
    [flowId, setEdgesState, refresh]
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
  return (
    <div className="relative h-[80vh] w-full">
      
      {/* Export scope wrapper */}
      <div className="h-full w-full">
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
