import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(100),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  price: z.number().min(0, 'Le prix doit être positif'),
  city: z.string().min(1, 'La ville est requise'),
  region: z.string().min(1, 'La région est requise'),
  categoryIds: z.array(z.string()).min(1, 'Au moins une catégorie est requise'),
  imageUrls: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  const result = createSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0].message })
  }

  const { title, description, price, city, region, categoryIds, imageUrls } = result.data

  const listing = await prisma.listing.create({
    data: {
      title,
      description,
      price,
      city,
      region,
      userId: session.user.id,
      // Create the join-table rows for each selected category in the same transaction.
      categories: { create: categoryIds.map(categoryId => ({ categoryId })) },
      // Images are optional — no images object is created if none were uploaded.
      images: imageUrls
        ? { create: imageUrls.map((url, index) => ({ url, order: index })) }
        : undefined
    },
    include: {
      images: { orderBy: { order: 'asc' } },
      categories: { include: { category: true } },
      user: { select: { id: true, name: true, city: true, phone: true } }
    }
  })

  // Flatten the join table so callers receive category objects directly.
  return { ...listing, categories: listing.categories.map(c => c.category) }
})
