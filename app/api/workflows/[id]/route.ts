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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const serverClient = await createClient()
    const { data: { session } } = await serverClient.auth.getSession()

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = getAdminSupabaseWithToken(session.access_token)
    const email = session.user.email!
    const { id } = await params

    const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .eq("user_email", email)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ workflow: data })
}
