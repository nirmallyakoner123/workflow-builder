import { createClient } from "@/app/lib/supabase-server"
import { runWorkflow } from "@/app/lib/workflow/runWorkflow"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.provider_token) {
            return Response.json({ status: "error", message: "Not authenticated. Please connect your Google account first." }, { status: 401 })
        }

        const workflow = await req.json()

        const { data: settings } = await supabase
            .from("user_settings")
            .select("github_username, github_token")
            .eq("user_email", session.user.email)
            .single()

        const result = await runWorkflow(workflow, session.provider_token, settings)
        return Response.json({ status: "ok", ...result })
    } catch (err: any) {
        return Response.json({ status: "error", message: err.message }, { status: 500 })
    }
}