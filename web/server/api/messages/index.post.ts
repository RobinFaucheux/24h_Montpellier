import { z } from 'zod'

const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Le message ne peut pas être vide')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  const result = messageSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0].message })
  }

  const { conversationId, content } = result.data

  // Check conversation access
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation) throw createError({ statusCode: 404, message: 'Conversation non trouvée' })
  if (conversation.buyerId !== session.user.id && conversation.sellerId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Non autorisé' })
  }

  const message = await prisma.message.create({
    data: {
      content,
      senderId: session.user.id,
      conversationId
    },
    include: {
      sender: { select: { id: true, name: true } }
    }
  })

  // Update conversation timestamp
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  })

  return message
})
