// Fetches a full conversation (all messages) and marks unread messages as read.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID manquant' })

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      listing: {
        select: { id: true, title: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } }
      },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      // Messages in chronological order for the chat view.
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true } } }
      }
    }
  })

  if (!conversation) throw createError({ statusCode: 404, message: 'Conversation non trouvée' })

  // Only participants (buyer or seller) can read the conversation.
  if (conversation.buyerId !== session.user.id && conversation.sellerId !== session.user.id) {
    throw createError({ statusCode: 403, message: 'Non autorisé' })
  }

  // Mark all messages sent by the other person as read now that the user opened the conversation.
  await prisma.message.updateMany({
    where: { conversationId: id, senderId: { not: session.user.id }, isRead: false },
    data: { isRead: true }
  })

  return {
    ...conversation,
    otherUser: conversation.buyerId === session.user.id ? conversation.seller : conversation.buyer
  }
})
