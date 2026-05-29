import { z } from 'zod'

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  priceMin: z.string().optional(),
  priceMax: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.enum(['recent', 'price_asc', 'price_desc']).optional()
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const parsed = querySchema.safeParse(query)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Paramètres invalides' })
  }

  const { q, category, city, region, priceMin, priceMax, sort } = parsed.data
  const page = Math.max(1, parseInt(parsed.data.page || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(parsed.data.limit || '20')))
  const skip = (page - 1) * limit

  // Build where clause
  const where: Record<string, unknown> = {
    isHidden: false
  }

  if (q) {
    const words = q.trim().split(/\s+/).filter(Boolean)
    where.AND = words.map(word => ({
      OR: [
        { title: { contains: word, mode: 'insensitive' } },
        { description: { contains: word, mode: 'insensitive' } },
        { city: { contains: word, mode: 'insensitive' } },
        { region: { contains: word, mode: 'insensitive' } },
        { categories: { some: { category: { name: { contains: word, mode: 'insensitive' } } } } },
        { user: { name: { contains: word, mode: 'insensitive' } } }
      ]
    }))
  }

  if (category) {
    where.categories = {
      some: {
        category: { slug: category }
      }
    }
  }

  if (city) {
    where.city = { contains: city, mode: 'insensitive' }
  }

  if (region) {
    where.region = { contains: region, mode: 'insensitive' }
  }

  if (priceMin || priceMax) {
    where.price = {}
    if (priceMin) (where.price as Record<string, unknown>).gte = parseFloat(priceMin)
    if (priceMax) (where.price as Record<string, unknown>).lte = parseFloat(priceMax)
  }

  // Build orderBy
  let orderBy: Record<string, string> = { createdAt: 'desc' }
  if (sort === 'price_asc') orderBy = { price: 'asc' }
  else if (sort === 'price_desc') orderBy = { price: 'desc' }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        categories: { include: { category: true } },
        user: { select: { id: true, name: true, city: true } }
      }
    }),
    prisma.listing.count({ where })
  ])

  return {
    listings: listings.map(l => ({
      ...l,
      categories: l.categories.map(c => c.category)
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
})
