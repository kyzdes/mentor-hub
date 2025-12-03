import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { VideoService } from './video.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgoraService } from './providers/agora.service';

/**
 * Video Controller
 *
 * Manages video conferencing rooms, participants, and recordings.
 * Provides REST API for:
 * - Creating and managing video rooms
 * - Joining/leaving rooms
 * - Participant management
 * - Recording management
 * - Room statistics
 */
@ApiTags('video')
@Controller('video')
export class VideoController {
  constructor(
    private videoService: VideoService,
    private agoraService: AgoraService,
  ) {}

  /**
   * Get Agora App ID (for client SDK initialization)
   */
  @Get('config')
  @ApiOperation({ summary: 'Get video config', description: 'Get Agora App ID for client-side SDK' })
  @ApiResponse({ status: 200, description: 'Config returned' })
  getConfig() {
    return {
      success: true,
      config: {
        appId: this.agoraService.getAppId(),
        provider: 'agora',
      },
    };
  }

  /**
   * Create a new video room
   */
  @Post('rooms')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create video room', description: 'Create a new video conference room' })
  @ApiResponse({ status: 201, description: 'Room created' })
  async createRoom(@Body() dto: CreateRoomDto, @CurrentUser() user: any) {
    const room = await this.videoService.createRoom(dto, user?.id);

    return {
      success: true,
      room,
    };
  }

  /**
   * Get room by ID
   */
  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get room by ID', description: 'Get video room details' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getRoomById(@Param('id') id: string) {
    const room = await this.videoService.findRoomById(id);

    return {
      success: true,
      room,
    };
  }

  /**
   * Get room by room ID (external ID)
   */
  @Get('rooms/by-room-id/:roomId')
  @ApiOperation({ summary: 'Get room by room ID', description: 'Get room by external room ID' })
  @ApiParam({ name: 'roomId', description: 'External room ID' })
  @ApiResponse({ status: 200, description: 'Room found' })
  async getRoomByRoomId(@Param('roomId') roomId: string) {
    const room = await this.videoService.findRoomByRoomId(roomId);

    return {
      success: true,
      room,
    };
  }

  /**
   * Get room by booking ID
   */
  @Get('rooms/by-booking/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get room by booking', description: 'Get video room for a booking' })
  @ApiParam({ name: 'bookingId', description: 'Booking UUID' })
  @ApiResponse({ status: 200, description: 'Room found or null' })
  async getRoomByBookingId(@Param('bookingId') bookingId: string) {
    const room = await this.videoService.findRoomByBookingId(bookingId);

    return {
      success: true,
      room,
    };
  }

  /**
   * Update room settings
   */
  @Patch('rooms/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update room', description: 'Update room settings' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room updated' })
  async updateRoom(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    const room = await this.videoService.updateRoom(id, dto);

    return {
      success: true,
      room,
    };
  }

  /**
   * Start a room
   */
  @Post('rooms/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start room', description: 'Mark room as active' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @HttpCode(HttpStatus.OK)
  async startRoom(@Param('id') id: string) {
    const room = await this.videoService.startRoom(id);

    return {
      success: true,
      room,
      message: 'Room started',
    };
  }

  /**
   * End a room
   */
  @Post('rooms/:id/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End room', description: 'End an active room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @HttpCode(HttpStatus.OK)
  async endRoom(@Param('id') id: string) {
    const room = await this.videoService.endRoom(id);

    return {
      success: true,
      room,
      message: 'Room ended',
    };
  }

  /**
   * Join a room
   */
  @Post('rooms/:roomId/join')
  @ApiOperation({ summary: 'Join room', description: 'Join a video room and get access token' })
  @ApiParam({ name: 'roomId', description: 'External room ID' })
  @ApiResponse({ status: 200, description: 'Joined successfully' })
  @ApiResponse({ status: 400, description: 'Room full or invalid password' })
  @HttpCode(HttpStatus.OK)
  async joinRoom(@Param('roomId') roomId: string, @Body() dto: JoinRoomDto) {
    const result = await this.videoService.joinRoom(roomId, dto);

    return {
      success: true,
      participant: result.participant,
      token: result.token,
      roomId,
    };
  }

  /**
   * Leave a room
   */
  @Post('participants/:id/leave')
  @ApiOperation({ summary: 'Leave room', description: 'Leave a video room' })
  @ApiParam({ name: 'id', description: 'Participant UUID' })
  @HttpCode(HttpStatus.OK)
  async leaveRoom(@Param('id') id: string) {
    const participant = await this.videoService.leaveRoom(id);

    return {
      success: true,
      participant,
      message: 'Left room',
    };
  }

  /**
   * Update participant status
   */
  @Patch('participants/:id')
  @ApiOperation({ summary: 'Update participant', description: 'Update participant status (camera, mic, etc.)' })
  @ApiParam({ name: 'id', description: 'Participant UUID' })
  async updateParticipant(@Param('id') id: string, @Body() dto: UpdateParticipantDto) {
    const participant = await this.videoService.updateParticipant(id, dto);

    return {
      success: true,
      participant,
    };
  }

  /**
   * Get room participants
   */
  @Get('rooms/:id/participants')
  @ApiOperation({ summary: 'Get participants', description: 'Get all participants in a room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  async getParticipants(@Param('id') id: string) {
    const participants = await this.videoService.getParticipants(id);

    return {
      success: true,
      participants,
      count: participants.length,
    };
  }

  /**
   * Get room recordings
   */
  @Get('rooms/:id/recordings')
  @ApiOperation({ summary: 'Get recordings', description: 'Get all recordings for a room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  async getRecordings(@Param('id') id: string) {
    const recordings = await this.videoService.getRecordings(id);

    return {
      success: true,
      recordings,
      count: recordings.length,
    };
  }

  /**
   * Get room statistics
   */
  @Get('rooms/:id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get room stats', description: 'Get statistics for a room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  async getRoomStats(@Param('id') id: string) {
    const stats = await this.videoService.getRoomStats(id);

    return {
      success: true,
      stats,
    };
  }

  /**
   * Generate access token (for existing participant)
   */
  @Post('token/generate')
  @ApiOperation({ summary: 'Generate token', description: 'Generate a new access token for a room' })
  @HttpCode(HttpStatus.OK)
  async generateToken(
    @Body() body: { roomId: string; userId: string; role?: 'PUBLISHER' | 'SUBSCRIBER' },
  ) {
    const token = await this.agoraService.generateToken(
      body.roomId,
      body.userId,
      body.role || 'PUBLISHER',
    );

    return {
      success: true,
      token,
      roomId: body.roomId,
      userId: body.userId,
    };
  }
}
