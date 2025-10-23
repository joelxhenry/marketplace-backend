import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { MessageQueryDto } from './dto/message-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() createConversationDto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(userId, createConversationDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiResponse({
    status: 200,
    description: 'Conversations retrieved successfully with pagination',
  })
  getUserConversations(
    @CurrentUser('id') userId: string,
    @Query() query: ConversationQueryDto,
  ) {
    return this.chatService.getUserConversations(userId, query);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation details' })
  @ApiResponse({ status: 200, description: 'Conversation retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  getConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getConversation(conversationId, userId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get conversation messages' })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully with pagination',
  })
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query() query: MessageQueryDto,
  ) {
    return this.chatService.getMessages(conversationId, userId, query);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message (REST endpoint)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  sendMessage(
    @CurrentUser('id') userId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, sendMessageDto);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark conversation as read' })
  @ApiResponse({ status: 200, description: 'Marked as read successfully' })
  markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.markAsRead(conversationId, userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.chatService.getUnreadCount(userId);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave/archive a conversation' })
  @ApiResponse({ status: 204, description: 'Left conversation successfully' })
  @ApiResponse({ status: 403, description: 'Not a participant' })
  leaveConversation(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.leaveConversation(conversationId, userId);
  }
}
