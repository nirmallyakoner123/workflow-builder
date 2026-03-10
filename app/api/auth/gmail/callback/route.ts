import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${BASE_URL}/api/auth/gmail/callback`
)

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code")

    if (!code) {
        return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    const { tokens } = await oauth2Client.getToken(code)

    // Store tokens in an HTTP-only cookie (works on Vercel, no filesystem needed)
    const response = NextResponse.redirect(BASE_URL)
    response.cookies.set("gmail_tokens", JSON.stringify(tokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
    })

    return response
}