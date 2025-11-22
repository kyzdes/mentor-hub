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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create review for completed booking' })
  create(@Request() req, @Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews (public)' })
  @ApiQuery({ name: 'mentorId', required: false })
  @ApiQuery({ name: 'menteeId', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  findAll(
    @Query('mentorId') mentorId?: string,
    @Query('menteeId') menteeId?: string,
    @Query('minRating') minRating?: string
  ) {
    return this.reviewsService.findAll({
      mentorId,
      menteeId,
      minRating: minRating ? parseInt(minRating) : undefined,
      isPublic: true,
    });
  }

  @Get('mentor/:mentorId/stats')
  @ApiOperation({ summary: 'Get mentor rating statistics' })
  getMentorStats(@Param('mentorId') mentorId: string) {
    return this.reviewsService.getMentorStats(mentorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Update review' })
  update(@Param('id') id: string, @Request() req, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, req.user.id, updateReviewDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mentor responds to review' })
  respond(@Param('id') id: string, @Request() req, @Body('response') response: string) {
    return this.reviewsService.respondToReview(id, req.user.id, response);
  }

  @Post(':id/helpful')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark review as helpful' })
  markHelpful(@Param('id') id: string) {
    return this.reviewsService.markHelpful(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete review' })
  remove(@Param('id') id: string, @Request() req) {
    return this.reviewsService.remove(id, req.user.id);
  }
}
