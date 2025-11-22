import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';

@WebSocketGateway({ namespace: '/messaging', cors: true })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private messagingService: MessagingService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(client: Socket, conversationId: string) {
    client.join(`conversation:${conversationId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    data: { conversationId: string; senderId: string; content: string }
  ) {
    const message = await this.messagingService.sendMessage(
      data.conversationId,
      data.senderId,
      data.content
    );

    this.server.to(`conversation:${data.conversationId}`).emit('newMessage', message);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, data: { conversationId: string; userId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('userTyping', data);
  }
}
