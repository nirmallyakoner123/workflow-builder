import { sendEmailWithGmail } from "@/app/lib/gmail/readInbox"
import { NextRequest } from "next/server"

// POST /api/run-workflow/send
// Called when user approves the AI reply in the Review step
export async function POST(req: NextRequest) {
    try {
        const { from, subject, generatedReply } = await req.json()

        if (!from || !subject || !generatedReply) {
            return Response.json({ status: "error", message: "Missing fields" }, { status: 400 })
        }

        await sendEmailWithGmail(from, `Re: ${subject}`.replace(/^Re: Re:/i, "Re:"), generatedReply)

        return Response.json({ status: "ok" })
    } catch (err: any) {
        return Response.json({ status: "error", message: err.message }, { status: 500 })
    }
}
