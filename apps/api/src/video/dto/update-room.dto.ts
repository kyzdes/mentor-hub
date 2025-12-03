import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, IsEnum, Min, Max, MinLength, MaxLength } from 'class-validator';
import { RoomStatus } from '@prisma/client';

export class UpdateRoomDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(200)
  roomName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  maxParticipants?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  recordingEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  transcriptionEnabled?: boolean;

  @ApiProperty({ enum: RoomStatus, required: false })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;
}
