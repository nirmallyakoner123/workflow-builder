"use client"

import { useEffect, useState } from "react"

interface Profile {
  name: string
  email: string
  picture: string
}

export default function NodePalette() {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    fetch("/api/auth/gmail/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.connected) setProfile({ name: d.name, email: d.email, picture: d.picture })
      })
      .catch(() => {})
  }, [])

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  const nodes = [
    { type: "start",           label: "🚀 Start",           color: "#dcfce7" },
    { type: "read_email",      label: "📥 Read Email",      color: "#dbeafe" },
    { type: "generate_reply",  label: "🤖 Generate Reply",  color: "#fef9c3" },
    { type: "review",          label: "👁️ Review",          color: "#fce7f3" },
    { type: "send_email",      label: "📤 Send Email",      color: "#ede9fe" },
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

      <div style={{ flex: 1 }} />

      {/* === Profile card when connected, or Connect button === */}
      {profile ? (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        }}>
          <img
            src={profile.picture}
            alt={profile.name}
            width={36}
            height={36}
            style={{ borderRadius: "50%", flexShrink: 0 }}
            referrerPolicy="no-referrer"
          />
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {profile.email}
            </div>
          </div>
        </div>
      ) : (
        <a
          href="/api/auth/gmail"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "10px 12px",
            background: "white",
            border: "1px solid #cbd5e1",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            color: "#1e293b",
            textDecoration: "none",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect to Google
        </a>
      )}
    </aside>
  )
}
