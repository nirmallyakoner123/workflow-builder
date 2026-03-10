import { readUnreadEmails, sendEmailWithGmail } from "../gmail/readInbox"
import { generateReply } from "../ai/generateReply"

// Types for workflow nodes/edges
interface WorkflowNode {
    id: string
    type: string
    data?: { label?: string;[key: string]: any }
}

interface WorkflowEdge {
    source: string
    target: string
}

interface Workflow {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
}

// Result returned after running the workflow
export interface WorkflowResult {
    stepResults: StepResult[]
    pendingApproval?: ApprovalPayload
}

export interface StepResult {
    nodeId: string
    type: string
    status: "success" | "skipped" | "pending_approval"
    output?: any
}

export interface ApprovalPayload {
    emailId: string
    subject: string
    from: string
    originalBody: string
    generatedReply: string
}

export async function runWorkflow(workflow: Workflow): Promise<WorkflowResult> {
    // Build an execution order by following edges from start
    const adjacency = new Map<string, string>()
    for (const edge of workflow.edges) {
        adjacency.set(edge.source, edge.target)
    }

    // Find starting node (not referenced as any edge's target)
    const targetIds = new Set(workflow.edges.map((e) => e.target))
    const nodeMap = new Map(workflow.nodes.map((n) => [n.id, n]))
    const startNode = workflow.nodes.find((n) => !targetIds.has(n.id))

    if (!startNode) throw new Error("No start node found in workflow")

    // Build ordered list of nodes
    const orderedNodes: WorkflowNode[] = []
    let current: string | undefined = startNode.id
    while (current) {
        const node = nodeMap.get(current)
        if (!node) break
        orderedNodes.push(node)
        current = adjacency.get(current)
    }

    const context: {
        emails?: Awaited<ReturnType<typeof readUnreadEmails>>
        currentEmail?: Awaited<ReturnType<typeof readUnreadEmails>>[0]
        reply?: string
    } = {}

    const stepResults: StepResult[] = []

    for (const node of orderedNodes) {
        switch (node.type) {
            case "start": {
                stepResults.push({ nodeId: node.id, type: "start", status: "success" })
                break
            }

            case "read_email": {
                const query = (node.data?.query as string) || "is:unread"
                context.emails = await readUnreadEmails(query)
                // Use first email matching the query (if any)
                context.currentEmail = context.emails[0]
                stepResults.push({
                    nodeId: node.id,
                    type: "read_email",
                    status: "success",
                    output: { count: context.emails.length, emails: context.emails },
                })
                break
            }

            case "generate_reply": {
                if (!context.currentEmail) {
                    stepResults.push({ nodeId: node.id, type: "generate_reply", status: "skipped" })
                    break
                }
                const prompt = (node.data?.prompt as string) || "Write a polite and professional reply."
                context.reply = await generateReply(context.currentEmail.body, prompt)
                stepResults.push({
                    nodeId: node.id,
                    type: "generate_reply",
                    status: "success",
                    output: { reply: context.reply },
                })
                break
            }

            case "review": {
                // Pause and return so the user can approve before sending
                stepResults.push({ nodeId: node.id, type: "review", status: "pending_approval" })
                return {
                    stepResults,
                    pendingApproval: {
                        emailId: context.currentEmail?.id ?? "",
                        subject: context.currentEmail?.subject ?? "",
                        from: context.currentEmail?.from ?? "",
                        originalBody: context.currentEmail?.body ?? "",
                        generatedReply: context.reply ?? "",
                    },
                }
            }

            case "send_email": {
                if (!context.currentEmail || !context.reply) {
                    stepResults.push({ nodeId: node.id, type: "send_email", status: "skipped" })
                    break
                }
                await sendEmailWithGmail(
                    context.currentEmail.from,
                    `Re: ${context.currentEmail.subject}`,
                    context.reply
                )
                stepResults.push({ nodeId: node.id, type: "send_email", status: "success" })
                break
            }

            default: {
                stepResults.push({ nodeId: node.id, type: node.type, status: "skipped" })
            }
        }
    }

    return { stepResults }
}