import { google } from "googleapis"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
    try {
        const cookieStore = await cookies()
        const raw = cookieStore.get("gmail_tokens")?.value

        if (!raw) {
            return NextResponse.json({ connected: false })
        }

        const tokens = JSON.parse(raw)

        const oauth2Client = new google.auth.OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/gmail/callback`
        )
        oauth2Client.setCredentials(tokens)

        const peopleService = google.oauth2({ version: "v2", auth: oauth2Client })
        const { data } = await peopleService.userinfo.get()

        return NextResponse.json({
            connected: true,
            name: data.name,
            email: data.email,
            picture: data.picture,
        })
    } catch {
        return NextResponse.json({ connected: false })
    }
}
