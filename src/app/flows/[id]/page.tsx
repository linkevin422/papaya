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

type Flow = {
  id: string
  name: string
  user_id: string
  created_at: string
}

type NodeData = {
  id: string
  name: string
  type?: string
  x?: number
  y?: number
}

type EdgeData = {
  id: string
  source_id: string
  target_id: string
  type: string
  direction: string
}

export default function FlowPage() {
  const flowId = useParams().id as string
  const [flow, setFlow] = useState<Flow | null>(null)
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [edges, setEdges] = useState<EdgeData[]>([])
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null)
  const [showAddNode, setShowAddNode] = useState(false)

  const fetchFlow = async () => {
    const { data, error } = await supabase
      .from('flows')
      .select('*')
      .eq('id', flowId)
      .single()
    if (!error) setFlow(data)
  }

  const fetchNodes = async () => {
    const { data } = await supabase
      .from('nodes')
      .select('*')
      .eq('flow_id', flowId)
    if (data) setNodes(data)
  }

  const fetchEdges = async () => {
    const { data } = await supabase
      .from('edges')
      .select('*')
      .eq('flow_id', flowId)
    if (data) setEdges(data)
  }

  const refreshCanvas = async () => {
    await Promise.all([fetchNodes(), fetchEdges()])
  }

  useEffect(() => {
    if (flowId) {
      fetchFlow()
      refreshCanvas()
    }
  }, [flowId])

  // map DB rows -> ReactFlow nodes/edges
  const rfNodes = useMemo(
    () =>
      nodes.map((n) => ({
        id: n.id,
        data: { label: n.name },
        type: 'default',
        position: {
          x: typeof n.x === 'number' ? n.x : Math.random() * 300,
          y: typeof n.y === 'number' ? n.y : Math.random() * 300,
        },
        style: {
          backgroundColor:
            n.type === 'bank'
              ? '#10b981'
              : n.type === 'traffic'
              ? '#3b82f6'
              : '#f59e0b',
          color: 'white',
          padding: 10,
          borderRadius: 6,
        },
      })),
    [nodes]
  )

  const rfEdges = useMemo(
    () =>
      edges.map((e) => ({
        id: e.id,
        source: e.source_id,
        target: e.target_id,
        label: e.type,
        animated: true,
        markerEnd: { type: MarkerType.ArrowClosed },
        style: { stroke: '#e5e7eb' },
        data: { direction: e.direction || `${e.source_id} → ${e.target_id}` },
      })),
    [edges]
  )

  return (
    <main className="max-w-6xl mx-auto p-4 text-white relative">
      <h1 className="text-3xl font-bold mb-4">{flow?.name || 'Loading...'}</h1>

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

      {/* + Add Node */}
      <button
        onClick={() => setShowAddNode(true)}
        className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-full shadow hover:bg-green-700 transition"
      >
        + Add Node
      </button>

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
                onNodeAdded={() => {
                  refreshCanvas()
                  setShowAddNode(false)
                }}
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
