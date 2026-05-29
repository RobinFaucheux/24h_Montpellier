// WebSocket handler for real-time messaging and typing indicators.
//
// Auth flow:
//   1. Client fetches a short-lived ticket from /api/auth/ws-ticket (HTTP, authenticated).
//   2. Client opens the WS connection and immediately sends { type: 'auth', ticket }.
//   3. Server validates the ticket, attaches userId to the peer, and subscribes it to
//      its personal channel (user:<id>) for global notifications.
//
// Message types the client can send:
//   auth        — authenticate with a one-time ticket
//   subscribe   — join a conversation room after verifying membership
//   message     — send a chat message (saved to DB, broadcast to room)
//   typing      — broadcast a typing indicator to the other participant

export default defineWebSocketHandler({
  open(_peer) {
    // Nothing to do on connect — wait for the client to authenticate first.
  },

  async message(peer, message) {
    let data: Record<string, unknown>
    try {
      data = JSON.parse(message.text())
    } catch {
      return peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
    }

    if (data.type === 'auth') {
      // @ts-ignore — peer is extended with userId at runtime
      const userId = globalThis.wsTickets?.get(data.ticket)
      if (userId) {
        // @ts-ignore
        peer.userId = userId
        // @ts-ignore
        globalThis.wsTickets.delete(data.ticket) // tickets are single-use
        peer.subscribe(`user:${userId}`) // personal channel for notifications
        peer.send(JSON.stringify({ type: 'authenticated' }))
      } else {
        peer.send(JSON.stringify({ type: 'error', message: 'Invalid or expired ticket' }))
      }
    }

    else if (data.type === 'subscribe') {
      // @ts-ignore
      if (!peer.userId) return peer.send(JSON.stringify({ type: 'error', message: 'Unauthenticated' }))

      const convId = data.conversationId as string
      if (!convId) return

      // Verify the user is a participant before adding them to the room.
      const conv = await prisma.conversation.findUnique({ where: { id: convId } })
      if (!conv) return peer.send(JSON.stringify({ type: 'error', message: 'Conversation not found' }))

      // @ts-ignore
      if (conv.buyerId === peer.userId || conv.sellerId === peer.userId) {
        peer.subscribe(convId)
      } else {
        peer.send(JSON.stringify({ type: 'error', message: 'Unauthorized for this conversation' }))
      }
    }

    else if (data.type === 'message') {
      // @ts-ignore
      if (!peer.userId) return peer.send(JSON.stringify({ type: 'error', message: 'Unauthenticated' }))

      const convId = data.conversationId as string
      const content = (data.content as string)?.trim()
      if (!convId || !content) return

      // Re-verify membership on every message — the subscribe check alone isn't sufficient
      // since a peer could theoretically subscribe to a room before being removed.
      const conv = await prisma.conversation.findUnique({ where: { id: convId } })
      // @ts-ignore
      if (!conv || (conv.buyerId !== peer.userId && conv.sellerId !== peer.userId)) {
        return peer.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
      }

      const newMsg = await prisma.message.create({
        // @ts-ignore
        data: { content, senderId: peer.userId, conversationId: convId },
        include: { sender: { select: { id: true, name: true } } }
      })

      // Touch updatedAt so the conversation floats to the top of the sidebar.
      await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() }
      })

      const payload = JSON.stringify({ type: 'new_message', message: newMsg })
      peer.publish(convId, payload) // broadcast to the other participant
      peer.send(payload)            // echo back to the sender

      // Push a notification to the recipient's personal channel (for the header badge).
      // @ts-ignore
      const recipientId = conv.buyerId === peer.userId ? conv.sellerId : conv.buyerId
      peer.publish(`user:${recipientId}`, JSON.stringify({ type: 'notification', message: newMsg }))
    }

    else if (data.type === 'typing') {
      // @ts-ignore
      if (!peer.userId) return
      const convId = data.conversationId as string
      if (!convId) return

      // Broadcast the typing indicator to others in the room (sender excluded by publish).
      // @ts-ignore
      peer.publish(convId, JSON.stringify({ type: 'user_typing', userId: peer.userId }))
    }
  },

  close(_peer, _details) {
    // Nitro automatically unsubscribes the peer from all channels on close.
  }
})
