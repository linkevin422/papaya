import { NodeProps, Handle, Position } from "reactflow";

export default function PocketNode({ data }: NodeProps) {
  // fallback to emerald green if no color provided
  const auraColor = data.color || "rgba(34,197,94,1)";

  return (
    <div className="relative">
      {/* Blurred glowing aura */}
      <div
        className="absolute -inset-1 rounded-lg blur-md opacity-60 pointer-events-none"
        style={{ backgroundColor: auraColor }}
      />

      {/* Main content box */}
      <div className="relative px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-md">
        {data.label || data.name}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
