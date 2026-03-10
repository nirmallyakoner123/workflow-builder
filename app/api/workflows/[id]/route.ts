import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabase } from "@/app/lib/supabase"
import { google } from "googleapis"

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

// GET a specific workflow by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
    const email = await getUserEmail()
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Since Next 15 params must be awaited
    const { id } = await params;

    const { data, error } = await supabase
        .from("workflows")
        .select("*")
        .eq("id", id)
        .eq("user_email", email)
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ workflow: data })
}
