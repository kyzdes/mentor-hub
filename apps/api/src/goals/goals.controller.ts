import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create goal' })
  create(@Request() req, @Body() data: any) {
    return this.goalsService.create(req.user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all goals' })
  findAll(@Request() req, @Query('status') status?: string) {
    return this.goalsService.findAll(req.user.id, status);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get progress summary' })
  getProgress(@Request() req) {
    return this.goalsService.getProgress(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get goal by ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.goalsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update goal' })
  update(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.goalsService.update(id, req.user.id, data);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete goal' })
  complete(@Param('id') id: string, @Request() req) {
    return this.goalsService.complete(id, req.user.id);
  }

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add milestone to goal' })
  addMilestone(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.goalsService.addMilestone(id, req.user.id, data);
  }

  @Post('milestones/:id/complete')
  @ApiOperation({ summary: 'Complete milestone' })
  completeMilestone(@Param('id') id: string, @Request() req) {
    return this.goalsService.completeMilestone(id, req.user.id);
  }
}
