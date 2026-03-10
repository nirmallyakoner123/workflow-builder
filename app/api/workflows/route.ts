import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/app/lib/supabase"
import { google } from "googleapis"

// Helper to get user email from existing Gmail OAuth cookie
async function getUserEmail() {
    const cookieStore = await cookies()
    const raw = cookieStore.get("gmail_tokens")?.value
    if (!raw) return null

    try {
        const tokens = JSON.parse(raw)
        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/gmail/callback`
        )
        oauth2Client.setCredentials(tokens)

        const peopleService = google.oauth2({ version: "v2", auth: oauth2Client })
        const { data } = await peopleService.userinfo.get()
        return data.email || null
    } catch {
        return null
    }
}

// GET all workflows for the logged-in user
export async function GET() {
    const email = await getUserEmail()
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data, error } = await supabase
        .from("workflows")
        .select("id, name, updated_at")
        .eq("user_email", email)
        .order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ workflows: data })
}

// POST to save a workflow
export async function POST(req: Request) {
    const email = await getUserEmail()
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { id, name, nodes, edges } = body

    // If ID is provided, update existing. Else insert new.
    if (id) {
        const { data, error } = await supabase
            .from("workflows")
            .update({ name, nodes, edges, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_email", email) // extra security check
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ workflow: data })
    } else {
        const { data, error } = await supabase
            .from("workflows")
            .insert({ user_email: email, name: name || "Untitled Workflow", nodes, edges })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ workflow: data })
    }
}
