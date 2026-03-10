export async function getEmail(gmail:any, id:string){

  const res = await gmail.users.messages.get({
    userId: "me",
    id
  })

  return res.data
}