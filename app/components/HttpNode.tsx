"use client"

export default function HttpNode({ data }: any) {
  return (
    <div style={{
      padding: 10,
      border: "1px solid #333",
      borderRadius: 5,
      background: "white"
    }}>
      🌐 HTTP Request
      <div>{data.url}</div>
    </div>
  )
}
