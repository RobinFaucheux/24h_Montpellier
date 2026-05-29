import { z } from 'zod'

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).optional(),
  price: z.number().min(0).optional(),
  city: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  categoryIds: z.array(z.string()).min(1).optional(),
  imageUrls: z.array(z.string()).optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID manquant' })

  // Check ownership
  const listing = await prisma.listing.findUnique({ where: { id } })
  if (!listing) throw createError({ statusCode: 404, message: 'Annonce non trouvée' })
  if (listing.userId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Non autorisé' })
  }

  const body = await readBody(event)
  const result = updateSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0].message })
  }

  const { categoryIds, imageUrls, ...data } = result.data

  // Update listing
  const updated = await prisma.listing.update({
    where: { id },
    data: {
      ...data,
      // Replace categories if provided
      ...(categoryIds && {
        categories: {
          deleteMany: {},
          create: categoryIds.map(categoryId => ({ categoryId }))
        }
      }),
      // Replace images if provided
      ...(imageUrls && {
        images: {
          deleteMany: {},
          create: imageUrls.map((url, index) => ({ url, order: index }))
        }
      })
    },
    include: {
      images: { orderBy: { order: 'asc' } },
      categories: { include: { category: true } },
      user: { select: { id: true, name: true, city: true } }
    }
  })

  return {
    ...updated,
    categories: updated.categories.map(c => c.category)
  }
})
