import { google } from "googleapis"
import { cookies } from "next/headers"

async function getTokens() {
    const cookieStore = await cookies()
    const raw = cookieStore.get("gmail_tokens")?.value
    if (!raw) {
        throw new Error("Not authenticated with Gmail. Click 'Connect to Google' first.")
    }
    return JSON.parse(raw)
}

async function getGmailClient() {
    const tokens = await getTokens()

    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/gmail/callback`
    )

    oauth2Client.setCredentials(tokens)
    return google.gmail({ version: "v1", auth: oauth2Client })
}

export async function readUnreadEmails(query: string = "is:unread") {
    const gmail = await getGmailClient()

    const res = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 5,
    })

    const messages = res.data.messages || []

    const emails = await Promise.all(
        messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: "me",
                id: msg.id!,
                format: "full",
            })

            const headers = detail.data.payload?.headers || []
            const subject = headers.find((h) => h.name === "Subject")?.value || "(no subject)"
            const from = headers.find((h) => h.name === "From")?.value || ""

            // Decode body
            const parts = detail.data.payload?.parts || []
            let body = ""
            const textPart = parts.find((p) => p.mimeType === "text/plain")
            if (textPart?.body?.data) {
                body = Buffer.from(textPart.body.data, "base64").toString("utf-8")
            } else if (detail.data.payload?.body?.data) {
                body = Buffer.from(detail.data.payload.body.data, "base64").toString("utf-8")
            }

            return { id: msg.id, subject, from, body }
        })
    )

    return emails
}

export async function sendEmailWithGmail(to: string, subject: string, body: string) {
    const gmail = await getGmailClient()

    const rawMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        ``,
        body,
    ].join("\n")

    const encodedMessage = Buffer.from(rawMessage)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")

    await gmail.users.messages.send({
        userId: "me",
        requestBody: { raw: encodedMessage },
    })
}