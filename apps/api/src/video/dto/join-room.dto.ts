import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsUUID, MinLength, MaxLength } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  displayName: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isHost?: boolean;

  @ApiProperty({ example: 'web', required: false })
  @IsString()
  @IsOptional()
  deviceType?: string;
}
