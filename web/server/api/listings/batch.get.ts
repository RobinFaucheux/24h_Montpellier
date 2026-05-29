import { z } from 'zod'

const querySchema = z.object({
  ids: z.preprocess(
    value => Array.isArray(value) ? value.join(',') : value,
    z.string().optional().default('')
  )
})

const MAX_IDS = 50

export default defineEventHandler(async (event) => {
  const parsed = querySchema.safeParse(getQuery(event))

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Paramètres invalides' })
  }

  const requestedIds = Array.from(
    new Set(
      parsed.data.ids
        .split(',')
        .map(id => id.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_IDS)

  if (!requestedIds.length) {
    return { listings: [] }
  }

  const listings = await prisma.listing.findMany({
    where: {
      id: { in: requestedIds },
      isHidden: false
    },
    select: {
      id: true,
      title: true,
      price: true,
      city: true,
      region: true,
      createdAt: true,
      images: {
        orderBy: { order: 'asc' },
        take: 1,
        select: { url: true }
      },
      categories: {
        select: {
          category: {
            select: {
              name: true,
              slug: true,
              icon: true
            }
          }
        }
      },
      user: { select: { name: true, city: true } }
    }
  })

  const byId = new Map(listings.map(listing => [listing.id, listing]))

  return {
    listings: requestedIds
      .map(id => byId.get(id))
      .filter((listing): listing is (typeof listings)[number] => Boolean(listing))
      .map(listing => ({
        ...listing,
        categories: listing.categories.map(category => category.category)
      }))
  }
})
