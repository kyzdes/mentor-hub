import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsDecimal,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class FormFieldDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['text', 'email', 'phone', 'select', 'multiselect', 'textarea', 'file', 'url'] })
  @IsString()
  type: string;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  placeholder?: string;

  @ApiProperty()
  @IsBoolean()
  required: boolean;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  validation?: any;

  @ApiProperty()
  @IsNumber()
  order: number;
}

export class CreateMeetingTypeDto {
  @ApiProperty({ example: 'Career Consultation' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'career-consultation' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens only',
  })
  slug: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 60 })
  @IsNumber()
  @Min(15)
  @Max(240)
  duration: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({ required: false, example: '#3B82F6' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color' })
  color?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  monthlyLimit?: number;

  @ApiProperty({ required: false, type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  @IsOptional()
  formFields?: FormFieldDto[];
}
