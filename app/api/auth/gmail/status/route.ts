import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
    const cookieStore = await cookies()
    const connected = !!cookieStore.get("gmail_tokens")?.value
    return NextResponse.json({ connected })
}
