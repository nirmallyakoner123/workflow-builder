"use client"

import NodePalette from "./components/NodePalette";
import Workflow from "./components/Workflow";
import { ReactFlowProvider } from "@xyflow/react";

export default function App() {
  return (
    <div style={{ display: "flex", width: "100%", height: "100vh", overflow: "hidden" }}>
      <NodePalette />
      <Workflow />
    </div>
  )
}
