'use client'

import { useCallback, useEffect } from 'react'
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

const supabase = createClient()

const EDGE_COLOR: Record<string, string> = {
  Income:  '#22c55e',
  Traffic: '#60a5fa',
  Fuel:    '#f97316',
}

type Props = {
  flowId: string
  nodes: Node[]
  edges: Edge[]
  onNodeClick: (node: { id: string }) => void
  onEdgeClick: (edge: { id: string }) => void
  refresh: () => void
}

export default function FlowCanvas({
  flowId,
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  refresh,
}: Props) {
  const [nodesState, setNodesState, onNodesChange] = useNodesState(nodes)
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(edges)

  useEffect(() => { setNodesState(nodes) }, [nodes, setNodesState])
  useEffect(() => { setEdgesState(edges) }, [edges, setEdgesState])

  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      // default new link: Traffic, forward
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
        show_amount: true, // new default
      })

      refresh()
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
    <div className="h-[80vh] w-full">
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
  )
}
