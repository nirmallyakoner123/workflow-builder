"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/lib/supabase"

export default function AuthCallbackPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(() => {
      router.push("/")
      router.refresh()
    })
  }, [])

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontSize: 16,
      color: "#64748b"
    }}>
      Connecting your account…
    </div>
  )
}
