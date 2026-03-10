import OpenAI from "openai"

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function generateReply(emailText: string, prompt: string) {
    let systemPrompt = `You are an AI email assistant.`

    systemPrompt += `\n\n<instructions>\n${prompt}\n</instructions>\n\nHere is the email you need to reply to:\n<email_text>\n${emailText}\n</email_text>\n\nPlease generate ONLY the body of the reply email. Do not include subject lines, placeholders, or preamble.`

    const res = await client.responses.create({
        model: "gpt-4.1-mini",
        input: systemPrompt
    })

    return res.output_text
}