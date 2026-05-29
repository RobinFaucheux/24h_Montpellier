// Returns all listings belonging to the logged-in user, newest first.
// Includes favorite and conversation counts so the dashboard can show engagement stats.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const listings = await prisma.listing.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      images: { orderBy: { order: 'asc' }, take: 1 },
      categories: { include: { category: true } },
      _count: { select: { favorites: true, conversations: true } }
    }
  })

  return listings.map(l => ({
    ...l,
    categories: l.categories.map(c => c.category)
  }))
})
