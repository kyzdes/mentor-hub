import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateGoalDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  targetDate?: string;
}
