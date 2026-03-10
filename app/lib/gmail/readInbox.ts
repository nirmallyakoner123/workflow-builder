import { google } from "googleapis"

// Token is now passed in from the Supabase session (provider_token),
// not read from cookies anymore.
function getGmailClient(providerToken: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
    )
    oauth2Client.setCredentials({ access_token: providerToken })
    return google.gmail({ version: "v1", auth: oauth2Client })
}

export async function readUnreadEmails(providerToken: string, query: string = "is:unread") {
    const gmail = getGmailClient(providerToken)

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

            const parts = detail.data.payload?.parts || []
            let body = ""
            const textPart = parts.find((p) => p.mimeType === "text/plain")
            if (textPart?.body?.data) {
                body = Buffer.from(textPart.body.data, "base64").toString("utf-8")
            } else if (detail.data.payload?.body?.data) {
                body = Buffer.from(detail.data.payload.body.data, "base64").toString("utf-8")
            }

            // Simple cleanup: try to remove quoted history lines (lines starting with '>')
            // and trim excessive whitespace to give the AI a cleaner email to read.
            body = body.split('\n')
                .filter(line => !line.trim().startsWith('>'))
                .join('\n')
                .trim()

            return { id: msg.id, subject, from, body }
        })
    )

    return emails
}

export async function sendEmailWithGmail(providerToken: string, to: string, subject: string, body: string) {
    const gmail = getGmailClient(providerToken)

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