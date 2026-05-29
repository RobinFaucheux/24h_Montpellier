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
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: { not: session.user.id }
            }
          } as never
        }
      }
    }
  })

  return conversations.map(c => ({
    ...c,
    otherUser: c.buyerId === session.user.id ? c.seller : c.buyer,
    lastMessage: c.messages[0] || null,
    unreadCount: (c._count as Record<string, number>).messages || 0
  }))
})
