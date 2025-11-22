import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MeetingTypesService } from './meeting-types.service';
import { CreateMeetingTypeDto } from './dto/create-meeting-type.dto';
import { UpdateMeetingTypeDto } from './dto/update-meeting-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('meeting-types')
@Controller('meeting-types')
export class MeetingTypesController {
  constructor(private readonly meetingTypesService: MeetingTypesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create new meeting type' })
  create(@Request() req, @Body() createMeetingTypeDto: CreateMeetingTypeDto) {
    return this.meetingTypesService.create(req.user.id, createMeetingTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all meeting types' })
  @ApiQuery({ name: 'mentorId', required: false })
  @ApiQuery({ name: 'isActive', required: false })
  findAll(@Query('mentorId') mentorId?: string, @Query('isActive') isActive?: string) {
    return this.meetingTypesService.findAll(
      mentorId,
      isActive !== undefined ? isActive === 'true' : undefined
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting type by ID' })
  findOne(@Param('id') id: string) {
    return this.meetingTypesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update meeting type' })
  update(@Param('id') id: string, @Body() updateMeetingTypeDto: UpdateMeetingTypeDto) {
    return this.meetingTypesService.update(id, updateMeetingTypeDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete meeting type (mark as inactive)' })
  remove(@Param('id') id: string) {
    return this.meetingTypesService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/hard')
  @ApiOperation({ summary: 'Permanently delete meeting type' })
  hardDelete(@Param('id') id: string) {
    return this.meetingTypesService.hardDelete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate meeting type' })
  duplicate(@Param('id') id: string, @Request() req) {
    return this.meetingTypesService.duplicate(id, req.user.id);
  }
}
