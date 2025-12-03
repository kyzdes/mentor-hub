import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateParticipantDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  cameraEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  micEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  screenShared?: boolean;

  @ApiProperty({ example: 'excellent', required: false })
  @IsString()
  @IsOptional()
  connectionQuality?: string;
}
