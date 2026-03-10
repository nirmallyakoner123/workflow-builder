import { google } from "googleapis"
import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

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

    // Store tokens to a local file (for dev purposes)
    // In production, store in a DB tied to the user's session
    const tokenPath = path.join(process.cwd(), "gmail_tokens.json")
    fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2))

    return NextResponse.redirect(BASE_URL)
}