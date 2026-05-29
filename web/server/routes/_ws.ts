export default defineWebSocketHandler({
  open(peer) {
    // Wait for the client to authenticate
  },

  async message(peer, message) {
    let data;
    try {
      data = JSON.parse(message.text());
    } catch (e) {
      return peer.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }

    if (data.type === 'auth') {
      // @ts-ignore
      const userId = globalThis.wsTickets?.get(data.ticket);
      if (userId) {
        // @ts-ignore
        peer.userId = userId;
        // @ts-ignore
        globalThis.wsTickets.delete(data.ticket);
        peer.subscribe(`user:${userId}`);
        peer.send(JSON.stringify({ type: 'authenticated' }));
      } else {
        peer.send(JSON.stringify({ type: 'error', message: 'Invalid or expired ticket' }));
      }
    } 
    else if (data.type === 'subscribe') {
      // @ts-ignore
      if (!peer.userId) return peer.send(JSON.stringify({ type: 'error', message: 'Unauthenticated' }));
      
      const convId = data.conversationId;
      if (!convId) return;

      const conv = await prisma.conversation.findUnique({ where: { id: convId } });
      if (!conv) return peer.send(JSON.stringify({ type: 'error', message: 'Conversation not found' }));
      
      // @ts-ignore
      if (conv.buyerId === peer.userId || conv.sellerId === peer.userId) {
        peer.subscribe(convId);
      } else {
        peer.send(JSON.stringify({ type: 'error', message: 'Unauthorized for this conversation' }));
      }
    }
    else if (data.type === 'message') {
      // @ts-ignore
      if (!peer.userId) return peer.send(JSON.stringify({ type: 'error', message: 'Unauthenticated' }));
      
      const convId = data.conversationId;
      const content = data.content?.trim();
      if (!convId || !content) return;

      // Verify membership again just to be safe
      const conv = await prisma.conversation.findUnique({ where: { id: convId } });
      // @ts-ignore
      if (!conv || (conv.buyerId !== peer.userId && conv.sellerId !== peer.userId)) {
        return peer.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
      }

      // Save message to DB
      const newMsg = await prisma.message.create({
        data: {
          content,
          // @ts-ignore
          senderId: peer.userId,
          conversationId: convId
        },
        include: {
          sender: { select: { id: true, name: true } }
        }
      });

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() }
      });

      const payload = JSON.stringify({ type: 'new_message', message: newMsg });
      // Send to other peers in the room
      peer.publish(convId, payload);
      // Send back to the sender
      peer.send(payload);

      // Send global notification to the recipient
      const recipientId = conv.buyerId === peer.userId ? conv.sellerId : conv.buyerId;
      peer.publish(`user:${recipientId}`, JSON.stringify({ type: 'notification', message: newMsg }));
    }
    else if (data.type === 'typing') {
      // @ts-ignore
      if (!peer.userId) return;
      const convId = data.conversationId;
      if (!convId) return;

      // Send to other peers
      // @ts-ignore
      peer.publish(convId, JSON.stringify({ type: 'user_typing', userId: peer.userId }));
    }
  },

  close(peer, details) {
    // Automatically unsubscribes from channels
  }
});
