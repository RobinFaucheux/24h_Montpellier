export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID manquant' })

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: 'asc' } },
      categories: { include: { category: true } },
      user: { select: { id: true, name: true, city: true, region: true, phone: true, createdAt: true } }
    }
  })

  if (!listing) throw createError({ statusCode: 404, message: 'Annonce non trouvée' })

  // Hidden listings are invisible to everyone except their owner.
  const session = await getUserSession(event)
  if (listing.isHidden && (!session?.user || session.user.id !== listing.userId)) {
    throw createError({ statusCode: 404, message: 'Annonce non trouvée' })
  }

  // Check whether the current user has favorited this listing so the UI can show the right icon.
  let isFavorited = false
  if (session?.user) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: session.user.id, listingId: id } }
    })
    isFavorited = !!fav
  }

  return {
    ...listing,
    categories: listing.categories.map(c => c.category),
    isFavorited
  }
})
