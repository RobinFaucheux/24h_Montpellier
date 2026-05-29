export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  
  const count = await prisma.message.count({
    where: {
      conversation: {
        OR: [
          { buyerId: session.user.id },
          { sellerId: session.user.id }
        ]
      },
      senderId: { not: session.user.id },
      isRead: false
    }
  })
  
  return { unread: count > 0 }
})
