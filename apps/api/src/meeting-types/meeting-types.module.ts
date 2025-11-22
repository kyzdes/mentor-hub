import { Module } from '@nestjs/common';
import { MeetingTypesService } from './meeting-types.service';
import { MeetingTypesController } from './meeting-types.controller';

@Module({
  controllers: [MeetingTypesController],
  providers: [MeetingTypesService],
  exports: [MeetingTypesService],
})
export class MeetingTypesModule {}
