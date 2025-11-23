import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsObject, MinLength, MaxLength, Matches } from 'class-validator';
import { TenantPlan, TenantStatus } from '@prisma/client';

export class UpdateTenantDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/)
  slug?: string;

  @ApiProperty({ enum: TenantPlan, required: false })
  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @ApiProperty({ enum: TenantStatus, required: false })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  ownerName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  companySize?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ type: 'object', required: false })
  @IsObject()
  @IsOptional()
  settings?: any;
}
