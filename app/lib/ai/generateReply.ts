import OpenAI from "openai"

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function generateReply(emailText: string, prompt: string = "Write a polite and professional reply.") {

    const res = await client.responses.create({
        model: "gpt-4.1-mini",
        input: `${prompt}\n\nEmail Text:\n${emailText}`
    })

    return res.output_text
}