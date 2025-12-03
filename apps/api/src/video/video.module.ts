import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { AgoraService } from './providers/agora.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Video Module
 *
 * Provides native video conferencing capabilities using Agora RTC.
 *
 * Features:
 * - Create and manage video rooms
 * - Real-time participant tracking
 * - Cloud recording with Agora
 * - WebRTC with ultra-low latency
 * - Cross-platform support (Web, iOS, Android)
 *
 * Configuration:
 * - AGORA_APP_ID: Your Agora application ID
 * - AGORA_APP_CERTIFICATE: Your Agora app certificate
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [VideoController],
  providers: [VideoService, AgoraService],
  exports: [VideoService, AgoraService],
})
export class VideoModule {}
