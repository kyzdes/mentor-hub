import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  async createConversation(user1Id: string, user2Id: string) {
    // Check if conversation exists between these two users
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: user1Id },
        },
      },
      include: {
        participants: true,
      },
    });

    // Find conversation with exactly these two participants
    const existing = conversations.find((conv) => {
      const userIds = conv.participants.map((p) => p.userId).sort();
      const targetIds = [user1Id, user2Id].sort();
      return (
        conv.participants.length === 2 &&
        userIds[0] === targetIds[0] &&
        userIds[1] === targetIds[1]
      );
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: user1Id }, { userId: user2Id }],
        },
      },
      include: { participants: true },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type: string = 'TEXT') {
    // Verify sender is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: senderId },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type: type as any,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });

    // Increment unread count for other participants
    await this.prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: { not: senderId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    return message;
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
    });
  }

  async getMessages(conversationId: string, userId: string, limit: number = 50) {
    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }

    return this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });
  }
}
