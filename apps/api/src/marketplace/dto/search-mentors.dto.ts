import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsNumber, IsEnum, Min, Max } from 'class-validator';

export class SearchMentorsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  minRating?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  expertise?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, enum: ['rating', 'price', 'sessions', 'reviews'] })
  @IsEnum(['rating', 'price', 'sessions', 'reviews'])
  @IsOptional()
  sortBy?: 'rating' | 'price' | 'sessions' | 'reviews';

  @ApiProperty({ required: false, minimum: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
