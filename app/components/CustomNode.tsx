"use client"

import { Handle, Position, useReactFlow } from "@xyflow/react"

export default function CustomNode({ id, data }: any) {
  const { setNodes, setEdges } = useReactFlow()

  const deleteNode = () => {
    // remove node
    setNodes((nodes) => nodes.filter((node) => node.id !== id))

    // remove connected edges
    setEdges((edges) =>
      edges.filter(
        (edge) => edge.source !== id && edge.target !== id
      )
    )
  }

  return (
    <div
      style={{
        padding: 10,
        border: "1px solid #333",
        borderRadius: 5,
        background: "white",
        width: 150,
        position: "relative"
      }}
    >
      {/* Delete button */}
      <button
        onClick={deleteNode}
        style={{
          position: "absolute",
          right: -8,
          top: -8,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "none",
          background: "red",
          color: "white",
          cursor: "pointer",
          fontSize: 12
        }}
      >
        ×
      </button>

      <Handle type="target" position={Position.Top} />

      <div style={{ textAlign: "center" }}>
        {data.label}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}
