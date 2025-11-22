import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { title: string; description?: string; category?: string; targetDate?: Date }) {
    return this.prisma.goal.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async findAll(userId: string, status?: string) {
    return this.prisma.goal.findMany({
      where: {
        userId,
        ...(status && { status: status as any }),
      },
      include: {
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: {
        milestones: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    if (goal.userId !== userId) {
      throw new ForbiddenException('Cannot access this goal');
    }

    return goal;
  }

  async update(id: string, userId: string, data: any) {
    await this.findOne(id, userId);

    return this.prisma.goal.update({
      where: { id },
      data,
    });
  }

  async complete(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.goal.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async addMilestone(goalId: string, userId: string, data: { title: string; description?: string }) {
    await this.findOne(goalId, userId);

    const count = await this.prisma.milestone.count({
      where: { goalId },
    });

    return this.prisma.milestone.create({
      data: {
        goalId,
        ...data,
        sortOrder: count,
      },
    });
  }

  async completeMilestone(milestoneId: string, userId: string) {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { goal: true },
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    if (milestone.goal.userId !== userId) {
      throw new ForbiddenException('Cannot access this milestone');
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
      },
    });
  }

  async getProgress(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      include: {
        milestones: true,
      },
    });

    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE').length;

    const totalMilestones = goals.reduce((sum, g) => sum + g.milestones.length, 0);
    const completedMilestones = goals.reduce(
      (sum, g) => sum + g.milestones.filter((m) => m.isCompleted).length,
      0
    );

    return {
      totalGoals,
      completedGoals,
      activeGoals,
      totalMilestones,
      completedMilestones,
      completionRate:
        totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    };
  }
}
