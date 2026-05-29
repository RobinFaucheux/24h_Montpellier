import { z } from 'zod'

const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(1, 'Le message ne peut pas être vide')
})

// HTTP fallback for sending messages — the WebSocket handler is the primary path.
// This is used when the WS connection is not yet established.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const body = await readBody(event)

  const result = messageSchema.safeParse(body)
  if (!result.success) {
    throw createError({ statusCode: 400, message: result.error.issues[0].message })
  }

  const { conversationId, content } = result.data

  // Verify the user is actually part of this conversation before writing.
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } })
  if (!conversation) throw createError({ statusCode: 404, message: 'Conversation non trouvée' })
  if (conversation.buyerId !== session.user.id && conversation.sellerId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Non autorisé' })
  }

  const message = await prisma.message.create({
    data: { content, senderId: session.user.id, conversationId },
    include: { sender: { select: { id: true, name: true } } }
  })

  // Touch updatedAt so the conversation floats to the top of the list.
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() }
  })

  return message
})
