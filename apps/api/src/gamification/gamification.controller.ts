import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  getUserAchievements(@Request() req) {
    return this.gamificationService.getUserAchievements(req.user.id);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get leaderboard' })
  @ApiQuery({ name: 'type', enum: ['points', 'sessions', 'rating'], required: false })
  @ApiQuery({ name: 'limit', required: false })
  getLeaderboard(
    @Query('type') type?: 'points' | 'sessions' | 'rating',
    @Query('limit') limit?: string
  ) {
    return this.gamificationService.getLeaderboard(
      type || 'points',
      limit ? parseInt(limit) : 10
    );
  }
}
