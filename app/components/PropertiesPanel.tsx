"use client"

import { Node } from "@xyflow/react"

interface PropertiesPanelProps {
  selectedNode: Node | null
  updateNodeData: (id: string, data: any) => void
}

export default function PropertiesPanel({ selectedNode, updateNodeData }: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <aside style={{
        width: 250,
        borderLeft: "1px solid #e2e8f0",
        padding: "20px",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        fontSize: 13,
      }}>
        Select a node to edit its properties
      </aside>
    )
  }

  const handleChange = (field: string, value: string) => {
    updateNodeData(selectedNode.id, { ...selectedNode.data, [field]: value })
  }

  const renderFields = () => {
    const { type, data } = selectedNode

    switch (type) {
      case "read_email":
        return (
          <>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
              Search Query
            </label>
            <input
              type="text"
              value={(data?.query as string) || "is:unread"}
              onChange={(e) => handleChange("query", e.target.value)}
              placeholder="e.g., from:boss@company.com"
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 13,
                boxSizing: "border-box"
              }}
            />
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
              Standard Gmail search syntax. Leave as <code>is:unread</code> to get the latest unread emails.
            </p>
          </>
        )
      
      case "generate_reply":
        return (
          <>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
              AI Instructions
            </label>
            <textarea
              value={(data?.prompt as string) || "Write a polite and professional reply."}
              onChange={(e) => handleChange("prompt", e.target.value)}
              placeholder="e.g., Reply in a sarcastic pirate tone..."
              rows={4}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                fontSize: 13,
                boxSizing: "border-box",
                resize: "vertical"
              }}
            />
          </>
        )

      case "send_email":
        return (
          <p style={{ fontSize: 12, color: "#64748b" }}>
            This node will automatically send the email produced by the previous steps.
          </p>
        )

      case "review":
        return (
          <p style={{ fontSize: 12, color: "#64748b" }}>
            This node will pause the workflow and spawn the approval modal.
          </p>
        )

      default:
        return <p style={{ fontSize: 12, color: "#64748b" }}>No properties to configure for this node type.</p>
    }
  }

  return (
    <aside style={{
      width: 250,
      borderLeft: "1px solid #e2e8f0",
      padding: "20px 16px",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      boxSizing: "border-box",
    }}>
      <h3 style={{ margin: 0, fontSize: 15, color: "#0f172a", fontWeight: 600 }}>
        Properties
      </h3>
      
      <div style={{ padding: "8px 12px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 500, color: "#334155" }}>
        Type: <span style={{ color: "#3b82f6" }}>{selectedNode.type}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {renderFields()}
      </div>
    </aside>
  )
}
