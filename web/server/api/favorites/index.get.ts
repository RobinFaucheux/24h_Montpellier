export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: {
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          categories: { include: { category: true } },
          user: { select: { id: true, name: true, city: true } }
        }
      }
    }
  })

  return favorites
    .filter(f => !f.listing.isHidden)
    .map(f => ({
      ...f,
      listing: {
        ...f.listing,
        categories: f.listing.categories.map(c => c.category)
      }
    }))
})
