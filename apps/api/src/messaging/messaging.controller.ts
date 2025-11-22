import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messaging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all conversations' })
  getConversations(@Request() req) {
    return this.messagingService.getConversations(req.user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create conversation' })
  createConversation(@Request() req, @Body('recipientId') recipientId: string) {
    return this.messagingService.createConversation(req.user.id, recipientId);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages in conversation' })
  getMessages(
    @Param('id') id: string,
    @Request() req,
    @Query('limit') limit?: string
  ) {
    return this.messagingService.getMessages(id, req.user.id, limit ? parseInt(limit) : 50);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send message' })
  sendMessage(
    @Param('id') id: string,
    @Request() req,
    @Body('content') content: string
  ) {
    return this.messagingService.sendMessage(id, req.user.id, content);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagingService.markAsRead(id, req.user.id);
  }
}
