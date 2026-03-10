import OpenAI from "openai"

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function generateReply(emailText: string, prompt: string = "Write a polite and professional reply.") {

    const res = await client.responses.create({
        model: "gpt-4.1-mini",
        input: `You are an AI email assistant. 

<instructions>
${prompt}
</instructions>

Here is the email you need to reply to:
<email_text>
${emailText}
</email_text>

Please generate ONLY the body of the reply email. Do not include subject lines, placeholders, or preamble.`
    })

    return res.output_text
}