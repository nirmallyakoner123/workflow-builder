import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function GET() {
    const tokenPath = path.join(process.cwd(), "gmail_tokens.json")
    const connected = fs.existsSync(tokenPath)
    return NextResponse.json({ connected })
}
