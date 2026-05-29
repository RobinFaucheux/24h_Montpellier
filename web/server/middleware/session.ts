export default defineEventHandler(async (event) => {
  // Only check API routes that require session validation
  // Skip /api/auth routes as they handle login/logout/registration
  if (event.path.startsWith('/api/') && !event.path.startsWith('/api/auth/')) {
    const session = await getUserSession(event)

    if (session?.user?.id) {
      const userExists = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      })

      // If user was deleted from DB but session cookie still exists
      if (!userExists) {
        await clearUserSession(event)
        // The session is now cleared. Subsequent requireUserSession calls will throw 401.
      }
    }
  }
})
