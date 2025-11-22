import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty()
  @IsUUID()
  bookingId: string;

  @ApiProperty({ required: false, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  overallRating?: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  knowledgeRating: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  communicationRating: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  helpfulnessRating: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  valueRating: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty()
  @IsString()
  comment: string;
}
