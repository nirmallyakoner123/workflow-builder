import { runWorkflow } from "@/app/lib/workflow/runWorkflow"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
    try {
        const workflow = await req.json()
        const result = await runWorkflow(workflow)
        return Response.json({ status: "ok", ...result })
    } catch (err: any) {
        return Response.json({ status: "error", message: err.message }, { status: 500 })
    }
}