import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsDateString, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  meetingTypeId: string;

  @ApiProperty()
  @IsString()
  menteeName: string;

  @ApiProperty()
  @IsEmail()
  menteeEmail: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  menteePhone?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  formResponses?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;
}
