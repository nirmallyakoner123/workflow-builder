export async function sendEmail(gmail:any, rawMessage:string){

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: rawMessage
    }
  })
}