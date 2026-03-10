import OpenAI from "openai"

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function generateReply(emailText: string, prompt: string, githubContext: string | null = null) {
    let systemPrompt = `You are an AI email assistant.`

    if (githubContext) {
        systemPrompt += `\n\n<context>\nUser's recent GitHub activity (use this context to craft accurate replies when asked what the user is working on):\n${githubContext}\n</context>`
    }

    systemPrompt += `\n\n<instructions>\n${prompt}\n</instructions>\n\nHere is the email you need to reply to:\n<email_text>\n${emailText}\n</email_text>\n\nPlease generate ONLY the body of the reply email. Do not include subject lines, placeholders, or preamble.`

    const res = await client.responses.create({
        model: "gpt-4.1-mini",
        input: systemPrompt
    })

    return res.output_text
}