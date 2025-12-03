import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsDateString, IsUUID, Min, Max, MinLength, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'React Advanced Session' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  roomName: string;

  @ApiProperty({ example: 'secret123', required: false })
  @IsString()
  @IsOptional()
  @MinLength(4)
  @MaxLength(50)
  password?: string;

  @ApiProperty({ example: 10, default: 10, required: false })
  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  maxParticipants?: number;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  recordingEnabled?: boolean;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  transcriptionEnabled?: boolean;

  @ApiProperty({ example: '2025-11-23T15:00:00Z' })
  @IsDateString()
  scheduledStart: Date;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  bookingId?: string;
}
