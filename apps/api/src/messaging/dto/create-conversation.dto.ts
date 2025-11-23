import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ description: 'ID of the other user in the conversation' })
  @IsUUID()
  otherUserId: string;
}
