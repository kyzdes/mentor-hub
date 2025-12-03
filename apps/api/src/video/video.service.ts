import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoRoom, VideoParticipant, VideoRecording, RoomStatus, ParticipantRole } from '@prisma/client';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AgoraService } from './providers/agora.service';
import { ConfigService } from '@nestjs/config';

/**
 * Video Service
 *
 * Manages video conferencing rooms, participants, and recordings.
 * Supports both WebRTC (peer-to-peer) and Agora (cloud-based) modes.
 *
 * Features:
 * - Create/manage video rooms
 * - Participant tracking
 * - Recording management
 * - Real-time connection quality monitoring
 * - Automatic room cleanup
 */
@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private agoraService: AgoraService,
    private config: ConfigService,
  ) {}

  /**
   * Create a new video room
   */
  async createRoom(data: CreateRoomDto, hostUserId?: string): Promise<VideoRoom> {
    // Generate unique room ID
    const roomId = this.generateRoomId();

    // Create room in Agora
    const agoraToken = await this.agoraService.generateToken(roomId, hostUserId || 'host');

    // Create room in database
    const room = await this.prisma.videoRoom.create({
      data: {
        roomName: data.roomName,
        roomId,
        provider: 'agora',
        joinUrl: this.generateJoinUrl(roomId),
        password: data.password,
        maxParticipants: data.maxParticipants || 10,
        recordingEnabled: data.recordingEnabled ?? true,
        transcriptionEnabled: data.transcriptionEnabled ?? false,
        scheduledStart: data.scheduledStart,
        ...(data.bookingId && { bookingId: data.bookingId }),
      },
    });

    return room;
  }

  /**
   * Get room by ID
   */
  async findRoomById(id: string): Promise<VideoRoom> {
    const room = await this.prisma.videoRoom.findUnique({
      where: { id },
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
        recordings: true,
        booking: {
          include: {
            mentor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            mentee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Video room with ID "${id}" not found`);
    }

    return room;
  }

  /**
   * Get room by room ID (external ID)
   */
  async findRoomByRoomId(roomId: string): Promise<VideoRoom> {
    const room = await this.prisma.videoRoom.findUnique({
      where: { roomId },
      include: {
        participants: true,
        recordings: true,
      },
    });

    if (!room) {
      throw new NotFoundException(`Video room "${roomId}" not found`);
    }

    return room;
  }

  /**
   * Get room by booking ID
   */
  async findRoomByBookingId(bookingId: string): Promise<VideoRoom | null> {
    return this.prisma.videoRoom.findUnique({
      where: { bookingId },
      include: {
        participants: true,
        recordings: true,
      },
    });
  }

  /**
   * Update room settings
   */
  async updateRoom(id: string, data: UpdateRoomDto): Promise<VideoRoom> {
    await this.findRoomById(id); // Ensure exists

    return this.prisma.videoRoom.update({
      where: { id },
      data: {
        ...(data.roomName && { roomName: data.roomName }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.maxParticipants && { maxParticipants: data.maxParticipants }),
        ...(data.recordingEnabled !== undefined && { recordingEnabled: data.recordingEnabled }),
        ...(data.transcriptionEnabled !== undefined && { transcriptionEnabled: data.transcriptionEnabled }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  /**
   * Start a room (mark as active)
   */
  async startRoom(id: string): Promise<VideoRoom> {
    const room = await this.findRoomById(id);

    if (room.status === RoomStatus.ACTIVE) {
      throw new BadRequestException('Room is already active');
    }

    if (room.status === RoomStatus.ENDED) {
      throw new BadRequestException('Room has already ended');
    }

    return this.prisma.videoRoom.update({
      where: { id },
      data: {
        status: RoomStatus.ACTIVE,
        actualStart: new Date(),
      },
    });
  }

  /**
   * End a room
   */
  async endRoom(id: string): Promise<VideoRoom> {
    const room = await this.findRoomById(id);

    if (room.status === RoomStatus.ENDED) {
      throw new BadRequestException('Room has already ended');
    }

    const now = new Date();
    const duration = room.actualStart
      ? Math.floor((now.getTime() - room.actualStart.getTime()) / 1000)
      : 0;

    // End all active participants
    await this.prisma.videoParticipant.updateMany({
      where: {
        roomId: id,
        leftAt: null,
      },
      data: {
        leftAt: now,
      },
    });

    return this.prisma.videoRoom.update({
      where: { id },
      data: {
        status: RoomStatus.ENDED,
        actualEnd: now,
        duration,
      },
    });
  }

  /**
   * Join a room
   */
  async joinRoom(roomId: string, data: JoinRoomDto): Promise<{ participant: VideoParticipant; token: string }> {
    const room = await this.findRoomByRoomId(roomId);

    // Check room status
    if (room.status === RoomStatus.ENDED) {
      throw new BadRequestException('This room has ended');
    }

    // Check password
    if (room.password && room.password !== data.password) {
      throw new BadRequestException('Invalid room password');
    }

    // Check max participants
    const activeParticipants = await this.prisma.videoParticipant.count({
      where: {
        roomId: room.id,
        leftAt: null,
      },
    });

    if (activeParticipants >= room.maxParticipants) {
      throw new BadRequestException('Room is full');
    }

    // Generate Agora token for participant
    const token = await this.agoraService.generateToken(
      room.roomId,
      data.userId || `guest-${Date.now()}`,
    );

    // Create participant record
    const participant = await this.prisma.videoParticipant.create({
      data: {
        roomId: room.id,
        userId: data.userId,
        displayName: data.displayName,
        role: data.isHost ? ParticipantRole.HOST : ParticipantRole.PARTICIPANT,
        deviceType: data.deviceType,
      },
    });

    // Update participant count
    await this.prisma.videoRoom.update({
      where: { id: room.id },
      data: {
        participantCount: activeParticipants + 1,
      },
    });

    // Auto-start room if not started
    if (room.status === RoomStatus.SCHEDULED) {
      await this.startRoom(room.id);
    }

    return { participant, token };
  }

  /**
   * Leave a room
   */
  async leaveRoom(participantId: string): Promise<VideoParticipant> {
    const participant = await this.prisma.videoParticipant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (participant.leftAt) {
      throw new BadRequestException('Participant already left');
    }

    const now = new Date();
    const duration = Math.floor((now.getTime() - participant.joinedAt.getTime()) / 1000);

    const updated = await this.prisma.videoParticipant.update({
      where: { id: participantId },
      data: {
        leftAt: now,
        duration,
      },
    });

    // Update participant count
    const activeCount = await this.prisma.videoParticipant.count({
      where: {
        roomId: participant.roomId,
        leftAt: null,
      },
    });

    await this.prisma.videoRoom.update({
      where: { id: participant.roomId },
      data: {
        participantCount: activeCount,
      },
    });

    // Auto-end room if all participants left
    if (activeCount === 0) {
      await this.autoEndRoom(participant.roomId);
    }

    return updated;
  }

  /**
   * Update participant status (camera, mic, screen share)
   */
  async updateParticipant(participantId: string, data: any): Promise<VideoParticipant> {
    return this.prisma.videoParticipant.update({
      where: { id: participantId },
      data: {
        ...(data.cameraEnabled !== undefined && { cameraEnabled: data.cameraEnabled }),
        ...(data.micEnabled !== undefined && { micEnabled: data.micEnabled }),
        ...(data.screenShared !== undefined && { screenShared: data.screenShared }),
        ...(data.connectionQuality && { connectionQuality: data.connectionQuality }),
      },
    });
  }

  /**
   * Get room participants
   */
  async getParticipants(roomId: string): Promise<VideoParticipant[]> {
    return this.prisma.videoParticipant.findMany({
      where: { roomId },
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
      orderBy: {
        joinedAt: 'asc',
      },
    });
  }

  /**
   * Create recording
   */
  async createRecording(roomId: string, data: any): Promise<VideoRecording> {
    const room = await this.findRoomById(roomId);

    return this.prisma.videoRecording.create({
      data: {
        roomId: room.id,
        fileUrl: data.fileUrl,
        thumbnailUrl: data.thumbnailUrl,
        duration: data.duration,
        fileSize: data.fileSize,
        format: data.format || 'mp4',
        isPublic: data.isPublic ?? false,
      },
    });
  }

  /**
   * Get room recordings
   */
  async getRecordings(roomId: string): Promise<VideoRecording[]> {
    return this.prisma.videoRecording.findMany({
      where: { roomId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get room statistics
   */
  async getRoomStats(roomId: string) {
    const room = await this.findRoomById(roomId);

    const participants = await this.prisma.videoParticipant.findMany({
      where: { roomId: room.id },
    });

    const totalDuration = participants.reduce((sum, p) => sum + (p.duration || 0), 0);
    const avgDuration = participants.length > 0 ? totalDuration / participants.length : 0;

    return {
      totalParticipants: participants.length,
      peakParticipants: room.participantCount,
      avgParticipantDuration: avgDuration,
      totalDuration: room.duration || 0,
      recordingCount: await this.prisma.videoRecording.count({ where: { roomId: room.id } }),
      status: room.status,
    };
  }

  /**
   * Cleanup old rooms (background job)
   */
  async cleanupOldRooms(): Promise<number> {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const result = await this.prisma.videoRoom.deleteMany({
      where: {
        status: RoomStatus.ENDED,
        actualEnd: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Auto-end room if all participants left
   */
  private async autoEndRoom(roomId: string): Promise<void> {
    const room = await this.prisma.videoRoom.findUnique({
      where: { id: roomId },
    });

    if (room && room.status === RoomStatus.ACTIVE) {
      // Wait 5 minutes before auto-ending (grace period for rejoining)
      setTimeout(async () => {
        const activeCount = await this.prisma.videoParticipant.count({
          where: {
            roomId,
            leftAt: null,
          },
        });

        if (activeCount === 0) {
          await this.endRoom(roomId);
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  }

  /**
   * Generate unique room ID
   */
  private generateRoomId(): string {
    return `room-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Generate join URL
   */
  private generateJoinUrl(roomId: string): string {
    const baseUrl = this.config.get('APP_URL') || 'http://localhost:3000';
    return `${baseUrl}/video/join/${roomId}`;
  }
}
