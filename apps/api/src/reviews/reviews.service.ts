import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createReviewDto: CreateReviewDto) {
    const { bookingId, overallRating, knowledgeRating, communicationRating,
            helpfulnessRating, valueRating, title, comment } = createReviewDto;

    // Verify booking exists and is completed
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { mentor: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Can only review completed sessions');
    }

    if (booking.menteeId !== userId) {
      throw new ForbiddenException('Only the mentee can review this session');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    // Calculate overall rating if not provided
    const calculatedOverallRating = overallRating || Math.round(
      (knowledgeRating + communicationRating + helpfulnessRating + valueRating) / 4
    );

    // Create review
    const review = await this.prisma.review.create({
      data: {
        bookingId,
        mentorId: booking.mentorId,
        menteeId: userId,
        overallRating: calculatedOverallRating,
        knowledgeRating,
        communicationRating,
        helpfulnessRating,
        valueRating,
        title,
        comment,
      },
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
    });

    // Update mentor stats
    await this.updateMentorStats(booking.mentorId);

    // Award points to mentee for leaving review
    await this.awardPoints(userId, 20, 'Review submitted');

    return review;
  }

  async findAll(filters?: {
    mentorId?: string;
    menteeId?: string;
    minRating?: number;
    isPublic?: boolean;
  }) {
    const { mentorId, menteeId, minRating, isPublic } = filters || {};

    return this.prisma.review.findMany({
      where: {
        ...(mentorId && { mentorId }),
        ...(menteeId && { menteeId }),
        ...(minRating && { overallRating: { gte: minRating } }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            startTime: true,
            meetingType: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            meetingType: {
              select: {
                name: true,
                duration: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async update(id: string, userId: string, updateReviewDto: UpdateReviewDto) {
    const review = await this.findOne(id);

    if (review.menteeId !== userId) {
      throw new ForbiddenException('Can only update your own reviews');
    }

    // Can't edit after 7 days
    const daysSinceCreation = Math.floor(
      (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreation > 7) {
      throw new BadRequestException('Cannot edit reviews older than 7 days');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: updateReviewDto,
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
    });

    // Update mentor stats
    await this.updateMentorStats(review.mentorId);

    return updated;
  }

  async respondToReview(reviewId: string, mentorId: string, response: string) {
    const review = await this.findOne(reviewId);

    if (review.mentorId !== mentorId) {
      throw new ForbiddenException('Can only respond to your own reviews');
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        mentorResponse: response,
        respondedAt: new Date(),
      },
    });
  }

  async markHelpful(reviewId: string) {
    await this.findOne(reviewId);

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        helpfulCount: {
          increment: 1,
        },
      },
    });
  }

  async remove(id: string, userId: string) {
    const review = await this.findOne(id);

    if (review.menteeId !== userId) {
      throw new ForbiddenException('Can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id },
    });

    // Update mentor stats
    await this.updateMentorStats(review.mentorId);

    return { message: 'Review deleted successfully' };
  }

  async getMentorStats(mentorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { mentorId, isPublic: true },
      select: {
        overallRating: true,
        knowledgeRating: true,
        communicationRating: true,
        helpfulnessRating: true,
        valueRating: true,
      },
    });

    if (reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: {
          knowledge: 0,
          communication: 0,
          helpfulness: 0,
          value: 0,
        },
        ratingDistribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const totalReviews = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + r.overallRating, 0);
    const averageRating = (sum / totalReviews).toFixed(2);

    const knowledgeAvg = (reviews.reduce((acc, r) => acc + r.knowledgeRating, 0) / totalReviews).toFixed(1);
    const communicationAvg = (reviews.reduce((acc, r) => acc + r.communicationRating, 0) / totalReviews).toFixed(1);
    const helpfulnessAvg = (reviews.reduce((acc, r) => acc + r.helpfulnessRating, 0) / totalReviews).toFixed(1);
    const valueAvg = (reviews.reduce((acc, r) => acc + r.valueRating, 0) / totalReviews).toFixed(1);

    const distribution = reviews.reduce((acc, r) => {
      acc[r.overallRating] = (acc[r.overallRating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      averageRating: parseFloat(averageRating),
      totalReviews,
      ratingBreakdown: {
        knowledge: parseFloat(knowledgeAvg),
        communication: parseFloat(communicationAvg),
        helpfulness: parseFloat(helpfulnessAvg),
        value: parseFloat(valueAvg),
      },
      ratingDistribution: {
        5: distribution[5] || 0,
        4: distribution[4] || 0,
        3: distribution[3] || 0,
        2: distribution[2] || 0,
        1: distribution[1] || 0,
      },
    };
  }

  private async updateMentorStats(mentorId: string) {
    const stats = await this.getMentorStats(mentorId);

    await this.prisma.user.update({
      where: { id: mentorId },
      data: {
        rating: stats.averageRating,
        totalReviews: stats.totalReviews,
      },
    });
  }

  private async awardPoints(userId: string, points: number, reason: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: points,
        },
      },
    });

    // TODO: Check for achievement unlocks
  }
}
