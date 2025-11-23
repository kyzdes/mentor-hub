import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty()
  @IsUUID()
  conversationId: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  content: string;

  @ApiProperty({ enum: MessageType, default: MessageType.TEXT, required: false })
  @IsEnum(MessageType)
  @IsOptional()
  type?: MessageType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}
