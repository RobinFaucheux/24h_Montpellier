// Clears the session cookie — the client is then treated as unauthenticated.
export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  return { success: true }
})
