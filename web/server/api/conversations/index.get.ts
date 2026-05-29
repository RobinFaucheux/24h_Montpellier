// Returns all conversations the logged-in user is part of (as buyer or seller),
// ordered by most recently active. Each conversation includes the last message
// and an unread count for the notification badge.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { buyerId: session.user.id },
        { sellerId: session.user.id }
      ]
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      listing: {
        select: { id: true, title: true, price: true, images: { take: 1, orderBy: { order: 'asc' } } }
      },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
      // Only the latest message — used as the preview in the conversation list.
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      // Count only unread messages sent by the OTHER user.
      _count: {
        select: {
          messages: {
            where: { isRead: false, senderId: { not: session.user.id } }
          } as never
        }
      }
    }
  })

  return conversations.map(c => ({
    ...c,
    // Resolve "other user" from the current user's perspective.
    otherUser: c.buyerId === session.user.id ? c.seller : c.buyer,
    lastMessage: c.messages[0] || null,
    unreadCount: (c._count as Record<string, number>).messages || 0
  }))
})
