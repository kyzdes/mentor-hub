import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async searchMentors(filters?: {
    category?: string;
    minRating?: number;
    maxPrice?: number;
    expertise?: string;
    search?: string;
    sortBy?: 'rating' | 'price' | 'sessions' | 'reviews';
    page?: number;
    limit?: number;
  }) {
    const {
      category,
      minRating,
      maxPrice,
      expertise,
      search,
      sortBy = 'rating',
      page = 1,
      limit = 20,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {
      role: 'MENTOR',
      isPublic: true,
      isActive: true,
    };

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { headline: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'rating':
        orderBy.rating = 'desc';
        break;
      case 'sessions':
        orderBy.totalSessions = 'desc';
        break;
      case 'reviews':
        orderBy.totalReviews = 'desc';
        break;
      case 'price':
        orderBy.hourlyRate = 'asc';
        break;
    }

    const [mentors, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          mentorProfile: true,
          categories: {
            include: {
              category: true,
            },
          },
          meetingTypes: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              duration: true,
              price: true,
              currency: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: mentors,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMentorProfile(mentorId: string) {
    const mentor = await this.prisma.user.findUnique({
      where: { id: mentorId },
      include: {
        mentorProfile: true,
        categories: {
          include: {
            category: true,
          },
        },
        meetingTypes: {
          where: { isActive: true },
        },
        reviewsReceived: {
          where: { isPublic: true },
          include: {
            mentee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!mentor || !mentor.isPublic) {
      throw new NotFoundException('Mentor not found');
    }

    return mentor;
  }

  async getFeaturedMentors(limit: number = 6) {
    return this.prisma.user.findMany({
      where: {
        role: 'MENTOR',
        isPublic: true,
        isPremium: true,
        isActive: true,
      },
      include: {
        mentorProfile: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        rating: 'desc',
      },
      take: limit,
    });
  }

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      include: {
        children: {
          where: { isActive: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
