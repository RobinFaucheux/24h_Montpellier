export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  await prisma.user.delete({ where: { id: session.user.id } })
  await clearUserSession(event)

  return { success: true, message: 'Compte supprimé avec succès' }
})
