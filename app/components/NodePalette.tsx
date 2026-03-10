"use client"

export default function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const nodes = [
    { type: "start",           label: "Start",           color: "#dcfce7" },
    { type: "read_email",      label: "Read Email",      color: "#dbeafe" },
    { type: "generate_reply",  label: "Generate Reply",  color: "#fef9c3" },
    { type: "review",          label: "Review",          color: "#fce7f3" },
    { type: "send_email",      label: "Send Email",      color: "#ede9fe" },
  ]

  return (
    <aside style={{
      width: 210,
      borderRight: "1px solid #e2e8f0",
      padding: "16px 12px",
      height: "100vh",
      background: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      gap: 8,
      boxSizing: "border-box",
    }}>
      <h4 style={{ margin: "0 0 12px", fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Nodes
      </h4>

      {nodes.map((n) => (
        <div
          key={n.type}
          draggable
          onDragStart={(e) => onDragStart(e, n.type)}
          style={{
            padding: "10px 12px",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            cursor: "grab",
            background: n.color,
            fontSize: 13,
            fontWeight: 500,
            color: "#1e293b",
            userSelect: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.06)")}
        >
          {n.label}
        </div>
      ))}

      <div style={{ marginTop: 12, padding: "10px 12px", background: "#f0fdf4", border: "1px dashed #86efac", borderRadius: 8, fontSize: 11, color: "#166534", lineHeight: 1.5 }}>
        <strong>Safety:</strong> Always add a <em>Review</em> node before <em>Send Email</em> to approve AI replies.
      </div>
    </aside>
  )
}
