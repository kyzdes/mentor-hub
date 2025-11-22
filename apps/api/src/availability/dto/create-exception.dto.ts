import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsOptional, Matches } from 'class-validator';

export class CreateExceptionDto {
  @ApiProperty({ example: '2024-12-25' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '09:00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiProperty({ example: '17:00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiProperty({ example: 'Holiday', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
