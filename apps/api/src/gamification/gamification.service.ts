import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardPoints(userId: string, points: number, reason: string, skipAchievementCheck = false) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: { increment: points },
      },
    });

    // Check for level up
    const newLevel = this.calculateLevel(user.points);
    if (newLevel > user.level) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
    }

    // Check for achievement unlocks (but not when awarding points for achievements)
    if (!skipAchievementCheck) {
      await this.checkAchievements(userId);
    }

    return { points: user.points, level: newLevel };
  }

  async checkAchievements(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: true,
        bookingsAsMentor: true,
        reviewsReceived: true,
      },
    });

    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
    });

    for (const achievement of achievements) {
      const alreadyUnlocked = user.achievements.some(
        (ua) => ua.achievementId === achievement.id
      );

      if (alreadyUnlocked) continue;

      let shouldUnlock = false;

      switch (achievement.type) {
        case 'SESSIONS_COMPLETED':
          shouldUnlock = user.totalSessions >= achievement.requirement;
          break;
        case 'REVIEWS_RECEIVED':
          shouldUnlock = user.totalReviews >= achievement.requirement;
          break;
        case 'STREAK_MAINTAINED':
          shouldUnlock = user.currentStreak >= achievement.requirement;
          break;
        default:
          break;
      }

      if (shouldUnlock) {
        await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: achievement.requirement,
          },
        });

        // Award points with skipAchievementCheck=true to prevent infinite recursion
        await this.awardPoints(userId, achievement.points, `Achievement: ${achievement.name}`, true);
      }
    }
  }

  async getUserAchievements(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async getLeaderboard(type: 'points' | 'sessions' | 'rating' = 'points', limit: number = 10) {
    const orderBy: any = {};

    switch (type) {
      case 'points':
        orderBy.points = 'desc';
        break;
      case 'sessions':
        orderBy.totalSessions = 'desc';
        break;
      case 'rating':
        orderBy.rating = 'desc';
        break;
    }

    return this.prisma.user.findMany({
      where: { role: 'MENTOR', isPublic: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        points: true,
        level: true,
        totalSessions: true,
        rating: true,
      },
      orderBy,
      take: limit,
    });
  }

  private calculateLevel(points: number): number {
    // Level formula: level = floor(points / 100) + 1
    return Math.floor(points / 100) + 1;
  }
}
