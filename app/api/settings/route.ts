import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase-server"
import { createClient as createBrowserClient } from "@supabase/supabase-js"

function getAdminSupabaseWithToken(accessToken: string) {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    )
}

// GET /api/settings
export async function GET() {
    const serverClient = await createClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getAdminSupabaseWithToken(session.access_token)
    const email = session.user.email!

    const { data, error } = await supabase
        .from("user_settings")
        .select("github_username, github_token")
        .eq("user_email", email)
        .single()

    // If no settings exist yet, return empty but 200 OK
    if (error && error.code === 'PGRST116') {
        return NextResponse.json({ settings: { github_username: "", github_token: "" } })
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
}

// POST /api/settings
export async function POST(req: Request) {
    const serverClient = await createClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getAdminSupabaseWithToken(session.access_token)
    const email = session.user.email!
    const { github_username, github_token } = await req.json()

    const { data, error } = await supabase
        .from("user_settings")
        .upsert({
            user_email: email,
            github_username,
            github_token,
            updated_at: new Date().toISOString()
        }, { onConflict: "user_email" })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ settings: data })
}
