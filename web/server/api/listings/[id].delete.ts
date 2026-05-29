// Deletes a listing — only its owner can do this.
// Cascade rules in the schema automatically remove images, favorites, and conversations.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID manquant' })

  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw createError({ statusCode: 404, message: 'Annonce non trouvée' })
  if (listing.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Non autorisé' })
  }

  await prisma.listing.delete({ where: { id } })

  return { success: true }
})
