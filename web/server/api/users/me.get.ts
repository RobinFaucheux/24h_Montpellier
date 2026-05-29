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
      createdAt: true
    }
  })

  if (!user) {
    throw createError({ statusCode: 404, message: 'Utilisateur non trouvé' })
  }

  return user
})
