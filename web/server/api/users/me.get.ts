// Returns the full profile of the logged-in user, including their SC balance.
// Only exposes safe fields — passwordHash is never selected.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatarUrl: true,
      city: true,
      region: true,
      balance: true,
      createdAt: true
    }
  })

  if (!user) throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })

  return user
})
