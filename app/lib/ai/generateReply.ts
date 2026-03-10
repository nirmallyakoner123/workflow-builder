import OpenAI from "openai"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateReply(emailText:string){

  const res = await client.responses.create({
    model:"gpt-4.1-mini",
    input:`Reply politely to this email:\n\n${emailText}`
  })

  return res.output_text
}