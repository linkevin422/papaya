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
import 'reactflow/dist/style.css'
import { createClient } from '@/lib/supabase'

const supabase = createClient()

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

  // keep local RF state in sync with props
  useEffect(() => { setNodesState(nodes) }, [nodes, setNodesState])
  useEffect(() => { setEdgesState(edges) }, [edges, setEdgesState])

  const onConnect: OnConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return

      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}-${Date.now()}`,
        source: connection.source,
        target: connection.target,
        label: 'traffic',
        markerEnd: { type: MarkerType.ArrowClosed },
        animated: true,
        style: { stroke: '#e5e7eb' },
        data: { direction: `${connection.source} → ${connection.target}` },
      }

      setEdgesState((eds) => addEdge(newEdge, eds))

      await supabase.from('edges').insert({
        id: newEdge.id,
        flow_id: flowId,                 // ✅ correct flow id
        source_id: connection.source,
        target_id: connection.target,
        type: 'traffic',
        direction: newEdge.data.direction as string,
      })

      refresh()
    },
    [flowId, setEdgesState, refresh]
  )

  const onNodeDragStop = useCallback(
    async (_e: any, node: Node) => {
      // persist position
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
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
