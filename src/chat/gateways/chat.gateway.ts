import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { SendMessageDto } from '../dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:4321'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(private readonly chatService: ChatService) {}

  // Handle client connection
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Extract userId from handshake (JWT auth should be added here)
    const userId =
      (client.handshake.auth.userId as string) ||
      (client.handshake.query.userId as string);

    if (userId) {
      // Store socket for this user
      const sockets = this.userSockets.get(userId) || [];
      sockets.push(client.id);
      this.userSockets.set(userId, sockets);

      // Join user's personal room
      client.join(`user:${userId}`);

      console.log(`User ${userId} connected with socket ${client.id}`);
    }
  }

  // Handle client disconnection
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Remove socket from user's sockets
    this.userSockets.forEach((sockets, userId) => {
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        console.log(`Removed socket ${client.id} from user ${userId}`);
      }
    });
  }

  // Join a conversation room
  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    try {
      // Verify user is participant
      await this.chatService.getConversation(data.conversationId, data.userId);

      // Join conversation room
      client.join(`conversation:${data.conversationId}`);

      return {
        event: 'joined_conversation',
        data: { conversationId: data.conversationId },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  // Leave a conversation room
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);

    return {
      event: 'left_conversation',
      data: { conversationId: data.conversationId },
    };
  }

  // Send a message via WebSocket
  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto & { userId: string },
  ) {
    try {
      const message = await this.chatService.sendMessage(data.userId, {
        conversationId: data.conversationId,
        content: data.content,
        attachments: data.attachments,
      });

      // Broadcast message to all participants in the conversation
      this.server
        .to(`conversation:${data.conversationId}`)
        .emit('new_message', message);

      return {
        event: 'message_sent',
        data: message,
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  // User is typing indicator
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { conversationId: string; userId: string; isTyping: boolean },
  ) {
    // Broadcast typing status to other participants
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping,
    });
  }

  // Mark messages as read
  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; userId: string },
  ) {
    try {
      await this.chatService.markAsRead(data.conversationId, data.userId);

      // Notify other participants
      client.to(`conversation:${data.conversationId}`).emit('messages_read', {
        userId: data.userId,
        conversationId: data.conversationId,
      });

      return {
        event: 'marked_as_read',
        data: { conversationId: data.conversationId },
      };
    } catch (error) {
      return {
        event: 'error',
        data: { message: error.message },
      };
    }
  }

  // Helper: Send message to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Helper: Send message to conversation
  sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
