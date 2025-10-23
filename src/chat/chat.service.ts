import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { MessageQueryDto } from './dto/message-query.dto';

@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService) {}

  // Create a new conversation
  async createConversation(userId: string, dto: CreateConversationDto) {
    const { participantIds, initialMessage } = dto;

    // Add current user to participants if not included
    if (!participantIds.includes(userId)) {
      participantIds.push(userId);
    }

    // Create conversation with participants
    const conversation = await this.db.conversation.create({
      data: {
        participants: {
          create: participantIds.map((id) => ({
            userId: id,
          })),
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
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Send initial message if provided
    if (initialMessage) {
      await this.sendMessage(userId, {
        conversationId: conversation.id,
        content: initialMessage,
      });
    }

    return conversation;
  }

  // Get user's conversations
  async getUserConversations(userId: string, query: ConversationQueryDto) {
    const { page = 1, limit = 20, isActive } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      participants: {
        some: {
          userId,
        },
      },
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [conversations, total] = await Promise.all([
      this.db.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          lastMessageAt: 'desc',
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              content: true,
              createdAt: true,
              senderId: true,
            },
          },
        },
      }),
      this.db.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get single conversation
  async getConversation(conversationId: string, userId: string) {
    const conversation = await this.db.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Check if user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return conversation;
  }

  // Get conversation messages
  async getMessages(
    conversationId: string,
    userId: string,
    query: MessageQueryDto,
  ) {
    // Verify user is participant
    await this.getConversation(conversationId, userId);

    const { page = 1, limit = 50, beforeMessageId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      conversationId,
    };

    // For infinite scroll: get messages before a certain message
    if (beforeMessageId) {
      const beforeMessage = await this.db.message.findUnique({
        where: { id: beforeMessageId },
        select: { createdAt: true },
      });

      if (beforeMessage) {
        where.createdAt = {
          lt: beforeMessage.createdAt,
        };
      }
    }

    const [messages, total] = await Promise.all([
      this.db.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          senderParticipant: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      }),
      this.db.message.count({ where: { conversationId } }),
    ]);

    // Update last read timestamp for the user
    await this.markAsRead(conversationId, userId);

    return {
      data: messages.reverse(), // Return in chronological order
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Send a message
  async sendMessage(userId: string, dto: SendMessageDto) {
    const { conversationId, content, attachments } = dto;

    // Verify user is participant
    await this.getConversation(conversationId, userId);

    const message = await this.db.message.create({
      data: {
        conversationId,
        senderId: userId,
        content,
        attachments: attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update conversation lastMessageAt
    await this.db.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    return message;
  }

  // Mark conversation as read
  async markAsRead(conversationId: string, userId: string) {
    const participant = await this.db.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (participant) {
      await this.db.conversationParticipant.update({
        where: { id: participant.id },
        data: {
          lastReadAt: new Date(),
        },
      });
    }
  }

  // Get unread message count for user
  async getUnreadCount(userId: string) {
    const participants = await this.db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              where: {
                senderId: { not: userId },
              },
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
      },
    });

    let totalUnread = 0;

    for (const participant of participants) {
      if (participant.conversation.messages.length > 0) {
        const lastMessage = participant.conversation.messages[0];
        const lastReadAt = participant.lastReadAt || new Date(0);

        if (lastMessage.createdAt > lastReadAt) {
          // Count unread messages in this conversation
          const unreadCount = await this.db.message.count({
            where: {
              conversationId: participant.conversationId,
              senderId: { not: userId },
              createdAt: { gt: lastReadAt },
            },
          });
          totalUnread += unreadCount;
        }
      }
    }

    return { unreadCount: totalUnread };
  }

  // Leave/archive conversation
  async leaveConversation(conversationId: string, userId: string) {
    await this.getConversation(conversationId, userId);

    await this.db.conversationParticipant.deleteMany({
      where: {
        conversationId,
        userId,
      },
    });

    return { message: 'Left conversation successfully' };
  }
}
