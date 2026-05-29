import { z } from 'zod'

const createSchema = z.object({
  listingId: z.string().min(1),
  message: z.string().min(1, 'Le message ne peut pas être vide')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  const result = createSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0].message })
  }

  const { listingId, message } = result.data

  // Get listing and seller
  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) throw createError({ statusCode: 404, message: 'Annonce non trouvée' })

  if (listing.userId === session.user.id) {
    throw createError({ statusCode: 400, message: 'Vous ne pouvez pas contacter votre propre annonce' })
  }

  // Find or create conversation
  let conversation = await prisma.conversation.findUnique({
    where: {
      listingId_buyerId: {
        listingId,
        buyerId: session.user.id
      }
    }
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        listingId,
        buyerId: session.user.id,
        sellerId: listing.userId
      }
    })
  }

  // Create message
  await prisma.message.create({
    data: {
      content: message,
      senderId: session.user.id,
      conversationId: conversation.id
    }
  })

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { updatedAt: new Date() }
  })

  return { conversationId: conversation.id }
})
