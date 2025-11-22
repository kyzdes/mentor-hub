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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // === RECURRING AVAILABILITY ===

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create availability slot' })
  createAvailability(@Request() req, @Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilityService.createAvailability(req.user.id, createAvailabilityDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all availability slots' })
  findAllAvailability(@Request() req) {
    return this.availabilityService.findAllAvailability(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get availability slot by ID' })
  findOneAvailability(@Param('id') id: string) {
    return this.availabilityService.findOneAvailability(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update availability slot' })
  updateAvailability(@Param('id') id: string, @Body() updateAvailabilityDto: UpdateAvailabilityDto) {
    return this.availabilityService.updateAvailability(id, updateAvailabilityDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete availability slot' })
  removeAvailability(@Param('id') id: string) {
    return this.availabilityService.removeAvailability(id);
  }

  // === EXCEPTIONS (BLOCKED DATES) ===

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('exceptions')
  @ApiOperation({ summary: 'Create availability exception (block date)' })
  createException(@Request() req, @Body() createExceptionDto: CreateExceptionDto) {
    return this.availabilityService.createException(req.user.id, createExceptionDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('exceptions/list')
  @ApiOperation({ summary: 'Get all exceptions' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAllExceptions(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.availabilityService.findAllExceptions(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('exceptions/:id')
  @ApiOperation({ summary: 'Delete exception' })
  removeException(@Param('id') id: string) {
    return this.availabilityService.removeException(id);
  }

  // === AVAILABLE SLOTS (PUBLIC) ===

  @Get('slots/:mentorId/:meetingTypeId')
  @ApiOperation({ summary: 'Get available time slots for booking (PUBLIC)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  getAvailableSlots(
    @Param('mentorId') mentorId: string,
    @Param('meetingTypeId') meetingTypeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.availabilityService.getAvailableSlots(
      mentorId,
      meetingTypeId,
      new Date(startDate),
      new Date(endDate)
    );
  }
}
