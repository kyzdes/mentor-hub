import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class AwardPointsDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty()
  @IsString()
  reason: string;
}
