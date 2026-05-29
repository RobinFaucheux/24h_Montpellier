export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const listingId = getRouterParam(event, 'listingId')
  if (!listingId) throw createError({ statusCode: 400, message: 'ID annonce manquant' })

  await prisma.favorite.deleteMany({
    where: {
      userId: session.user.id,
      listingId
    }
  })

  return { success: true, favorited: false }
})
