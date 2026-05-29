export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  // Generate a random ticket string
  const ticket = crypto.randomUUID()
  
  // Initialize the global store if not present
  // @ts-ignore
  globalThis.wsTickets = globalThis.wsTickets || new Map<string, string>()
  
  // @ts-ignore
  globalThis.wsTickets.set(ticket, session.user.id)
  
  // Ticket expires in 30 seconds
  setTimeout(() => {
    // @ts-ignore
    globalThis.wsTickets.delete(ticket)
  }, 30000)
  
  return { ticket }
})
