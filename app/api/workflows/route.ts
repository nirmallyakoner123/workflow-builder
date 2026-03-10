import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase-server"
import { createClient as createBrowserClient } from "@supabase/supabase-js"

// Admin client for DB writes that respect RLS via user JWT
function getAdminSupabaseWithToken(accessToken: string) {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
}

// GET — list all workflows for the logged-in user
export async function GET() {
    const serverClient = await createClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getAdminSupabaseWithToken(session.access_token)
    const email = session.user.email!

    const { data, error } = await supabase
        .from("workflows")
        .select("id, name, updated_at")
        .eq("user_email", email)
        .order("updated_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ workflows: data })
}

// POST — create or update a workflow
export async function POST(req: Request) {
    const serverClient = await createClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getAdminSupabaseWithToken(session.access_token)
    const email = session.user.email!
    const { id, name, nodes, edges } = await req.json()

    if (id) {
        const { data, error } = await supabase
            .from("workflows")
            .update({ name, nodes, edges, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("user_email", email)
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
