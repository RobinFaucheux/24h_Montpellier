export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const listingId = getRouterParam(event, 'listingId')
  if (!listingId) throw createError({ statusCode: 400, message: 'ID annonce manquant' })

  // Check listing exists
  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw createError({ statusCode: 404, message: 'Annonce non trouvée' })

  // Upsert to handle duplicate
  await prisma.favorite.upsert({
    where: {
      userId_listingId: {
        userId: session.user.id,
        listingId
      }
    },
    update: {},
    create: {
      userId: session.user.id,
      listingId
    }
  })

  return { success: true, favorited: true }
})
