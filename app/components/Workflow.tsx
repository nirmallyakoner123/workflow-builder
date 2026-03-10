"use client"

import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Connection,
  Edge,
  Node,
  Panel,
} from "@xyflow/react"

import "@xyflow/react/dist/style.css"

import { useCallback, useRef, useState } from "react"
import CustomNode from "./CustomNode"
import PropertiesPanel from "./PropertiesPanel"

const nodeTypes = {
  custom: CustomNode,
}

// Map node type to workflow engine type
const nodeTypeMap: Record<string, string> = {
  start:          "start",
  read_email:     "read_email",
  generate_reply: "generate_reply",
  review:         "review",
  send_email:     "send_email",
  http:           "http",
  llm:            "llm",
}

let id = 0
const getId = () => `node_${id++}`

interface ApprovalPayload {
  emailId: string
  subject: string
  from: string
  originalBody: string
  generatedReply: string
}

export default function Workflow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition } = useReactFlow()

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const [running, setRunning] = useState(false)
  const [runLog, setRunLog] = useState<string[]>([])
  const [approval, setApproval] = useState<ApprovalPayload | null>(null)

  const [workflowId, setWorkflowId] = useState<string | null>(null)
  const [workflowName, setWorkflowName] = useState("My Workflow")
  const [isSaving, setIsSaving] = useState(false)

  const selectedNode = nodes.find((n) => n.selected) || null

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === nodeId) {
          return { ...n, data: newData }
        }
        return n
      })
    )
  }, [setNodes])

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const type = event.dataTransfer.getData("application/reactflow")
      if (!type) return

      // Uses ReactFlow's built-in converter that accounts for pan + zoom
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      const labelMap: Record<string, string> = {
        start:          "Start",
        read_email:     "Read Email",
        generate_reply: "Generate Reply",
        review:         "Review",
        send_email:     "Send Email",
        http:           "HTTP",
        llm:            "LLM",
      }

      const newNode: Node = {
        id: getId(),
        type: "custom",
        position,
        data: { label: labelMap[type] ?? type.toUpperCase(), nodeType: type },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

  const isValidConnection = (connection: Edge | Connection) => {
    return connection.source !== connection.target
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: workflowId,
          name: workflowName,
          nodes,
          edges,
        }),
      })
      const data = await res.json()
      if (data.workflow) {
        setWorkflowId(data.workflow.id)
        alert("Workflow saved successfully!")
      } else {
        alert("Error saving workflow: " + data.error)
      }
    } catch (err: any) {
      alert("Network error: " + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLoad = async () => {
    try {
      const res = await fetch("/api/workflows")
      const data = await res.json()
      
      if (data.workflows && data.workflows.length > 0) {
        // Just load the most recently updated one for now
        const latest = data.workflows[0]
        const detailRes = await fetch(`/api/workflows/${latest.id}`)
        const detailData = await detailRes.json()

        if (detailData.workflow) {
          setWorkflowId(detailData.workflow.id)
          setWorkflowName(detailData.workflow.name)
          setNodes(detailData.workflow.nodes)
          setEdges(detailData.workflow.edges)
        }
      } else {
        alert("No saved workflows found.")
      }
    } catch (err: any) {
      alert("Error loading workflow: " + err.message)
    }
  }

  const handleRun = async () => {
    setRunning(true)
    setRunLog([])
    setApproval(null)

    // Build workflow payload with proper node types
    const workflowNodes = nodes.map((n) => ({
      id: n.id,
      type: (n.data as any).nodeType ?? n.id,
      data: n.data,
    }))

    const workflowEdges = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }))

    try {
      const res = await fetch("/api/run-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: workflowNodes, edges: workflowEdges }),
      })

      const data = await res.json()

      if (data.status === "error") {
        setRunLog([`❌ Error: ${data.message}`])
      } else {
        const logs = (data.stepResults ?? []).map(
          (r: any) => `${statusIcon(r.status)} [${r.type}] → ${r.status}`
        )
        setRunLog(logs)

        if (data.pendingApproval) {
          setApproval(data.pendingApproval)
        }
      }
    } catch (err: any) {
      setRunLog([`❌ Network error: ${err.message}`])
    } finally {
      setRunning(false)
    }
  }

  const handleApprove = async () => {
    if (!approval) return
    setRunning(true)

    // Re-run workflow but skip review gate by sending directly
    try {
      const res = await fetch("/api/run-workflow/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approval),
      })
      const data = await res.json()
      setRunLog((prev) => [...prev, data.status === "ok" ? "✅ Email sent!" : `❌ ${data.message}`])
    } catch (err: any) {
      setRunLog((prev) => [...prev, `❌ Network error: ${err.message}`])
    } finally {
      setApproval(null)
      setRunning(false)
    }
  }

  return (
    <>
      <div ref={reactFlowWrapper} style={{ flex: 1, height: "100vh", position: "relative" }}>
        <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        isValidConnection={isValidConnection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />

        {/* ── RUN button ── */}
        <Panel position="top-right">
          <button
            onClick={handleRun}
            disabled={running || nodes.length === 0}
            style={{
              padding: "10px 22px",
              background: running ? "#94a3b8" : "#6366f1",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: running ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 14,
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
              transition: "background 0.2s",
            }}
          >
            {running ? "⏳ Running…" : "▶ Run Workflow"}
          </button>
        </Panel>

        {/* ── SAVE/LOAD ── */}
        <Panel position="top-left" style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
          >
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
          <button
            onClick={handleLoad}
            style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #cbd5e1", background: "white", cursor: "pointer", fontWeight: 600, fontSize: 13 }}
          >
            📂 Load Latest
          </button>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 13, width: 200 }}
          />
        </Panel>

        {/* ── Run log panel ── */}
        {runLog.length > 0 && (
          <Panel position="bottom-right">
            <div style={{
              background: "#0f172a",
              color: "#e2e8f0",
              padding: "12px 16px",
              borderRadius: 10,
              minWidth: 280,
              maxWidth: 360,
              fontSize: 12,
              fontFamily: "monospace",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            }}>
              <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 13, color: "#a5b4fc" }}>
                📋 Run Log
              </div>
              {runLog.map((line, i) => (
                <div key={i} style={{ marginBottom: 4 }}>{line}</div>
              ))}
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* ── Approval modal ── */}
      {approval && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}>
          <div style={{
            background: "white",
            borderRadius: 14,
            padding: 28,
            width: 520,
            maxWidth: "90vw",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 18 }}>👁️ Review Before Sending</h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
              AI generated a reply. Approve to send or discard.
            </p>

            <label style={labelStyle}>From</label>
            <div style={fieldStyle}>{approval.from}</div>

            <label style={labelStyle}>Subject</label>
            <div style={fieldStyle}>{approval.subject}</div>

            <label style={labelStyle}>Original Email</label>
            <div style={{ ...fieldStyle, maxHeight: 100, overflowY: "auto", whiteSpace: "pre-wrap" }}>
              {approval.originalBody}
            </div>

            <label style={labelStyle}>AI Generated Reply</label>
            <textarea
              defaultValue={approval.generatedReply}
              rows={5}
              style={{
                width: "100%",
                padding: 10,
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontFamily: "inherit",
                fontSize: 13,
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: 16,
              }}
              onChange={(e) => setApproval({ ...approval, generatedReply: e.target.value })}
            />

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setApproval(null); setRunLog((p) => [...p, "⛔ Reply discarded."]) }}
                style={{ padding: "9px 18px", borderRadius: 8, border: "1px solid #e2e8f0", cursor: "pointer", background: "white" }}
              >
                Discard
              </button>
              <button
                onClick={handleApprove}
                style={{ padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", background: "#6366f1", color: "white", fontWeight: 700 }}
              >
                ✅ Approve & Send
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      <PropertiesPanel selectedNode={selectedNode} updateNodeData={updateNodeData} />
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#64748b",
  textTransform: "uppercase",
  marginBottom: 4,
  letterSpacing: "0.05em",
}

const fieldStyle: React.CSSProperties = {
  padding: "8px 10px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 8,
  fontSize: 13,
  marginBottom: 12,
  color: "#1e293b",
}

function statusIcon(status: string) {
  if (status === "success") return "✅"
  if (status === "skipped") return "⏭️"
  if (status === "pending_approval") return "⏸️"
  return "•"
}
