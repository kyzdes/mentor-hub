import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MarkAsReadDto {
  @ApiProperty()
  @IsUUID()
  conversationId: string;
}
