import { google } from "googleapis"
import { NextResponse } from "next/server"

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  `${BASE_URL}/api/auth/gmail/callback`
)

export async function GET() {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })

  return NextResponse.redirect(url)
}