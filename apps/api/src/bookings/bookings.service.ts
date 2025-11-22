import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async create(createBookingDto: CreateBookingDto) {
    const { meetingTypeId, startTime, endTime, menteeEmail, menteeName, ...data } =
      createBookingDto;

    // Validate meeting type exists
    const meetingType = await this.prisma.meetingType.findUnique({
      where: { id: meetingTypeId },
      include: { mentor: true },
    });

    if (!meetingType) {
      throw new NotFoundException('Meeting type not found');
    }

    if (!meetingType.isActive) {
      throw new BadRequestException('This meeting type is not available');
    }

    // Check if slot is available
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        mentorId: meetingType.mentorId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [
              { startTime: { lte: new Date(startTime) } },
              { endTime: { gt: new Date(startTime) } },
            ],
          },
          {
            AND: [
              { startTime: { lt: new Date(endTime) } },
              { endTime: { gte: new Date(endTime) } },
            ],
          },
          {
            AND: [
              { startTime: { gte: new Date(startTime) } },
              { endTime: { lte: new Date(endTime) } },
            ],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictException('This time slot is no longer available');
    }

    // Check if start time is in the future
    if (new Date(startTime) <= new Date()) {
      throw new BadRequestException('Cannot book meetings in the past');
    }

    // Find or create mentee user
    let mentee = await this.prisma.user.findUnique({
      where: { email: menteeEmail },
    });

    // Create booking
    const status = meetingType.requiresApproval ? BookingStatus.PENDING : BookingStatus.CONFIRMED;

    const booking = await this.prisma.booking.create({
      data: {
        meetingTypeId,
        mentorId: meetingType.mentorId,
        menteeId: mentee?.id,
        menteeName,
        menteeEmail,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status,
        ...data,
      },
      include: {
        meetingType: true,
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Schedule notifications
    await this.notificationsService.scheduleBookingNotifications(booking);

    return booking;
  }

  async findAll(filters?: {
    mentorId?: string;
    menteeId?: string;
    status?: BookingStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { mentorId, menteeId, status, startDate, endDate } = filters || {};

    return this.prisma.booking.findMany({
      where: {
        ...(mentorId && { mentorId }),
        ...(menteeId && { menteeId }),
        ...(status && { status }),
        ...(startDate &&
          endDate && {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
      include: {
        meetingType: true,
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        meetingType: true,
        mentor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        mentee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto) {
    await this.findOne(id);

    return this.prisma.booking.update({
      where: { id },
      data: updateBookingDto,
      include: {
        meetingType: true,
        mentor: true,
        mentee: true,
      },
    });
  }

  async approve(id: string) {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be approved');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        meetingType: true,
        mentor: true,
        mentee: true,
      },
    });

    // Send approval notification
    await this.notificationsService.sendBookingApprovalNotification(updated);

    return updated;
  }

  async reject(id: string, reason: string) {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be rejected');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
      },
      include: {
        meetingType: true,
        mentor: true,
        mentee: true,
      },
    });

    // Send rejection notification
    await this.notificationsService.sendBookingCancellationNotification(updated, reason);

    return updated;
  }

  async cancel(id: string, reason?: string) {
    const booking = await this.findOne(id);

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
      },
      include: {
        meetingType: true,
        mentor: true,
        mentee: true,
      },
    });

    // Send cancellation notification
    await this.notificationsService.sendBookingCancellationNotification(updated, reason);

    return updated;
  }

  async reschedule(id: string, newStartTime: Date, newEndTime: Date) {
    const booking = await this.findOne(id);

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Cannot reschedule this booking');
    }

    // Check if new slot is available
    const conflictingBooking = await this.prisma.booking.findFirst({
      where: {
        id: { not: id },
        mentorId: booking.mentorId,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          {
            AND: [{ startTime: { lte: newStartTime } }, { endTime: { gt: newStartTime } }],
          },
          {
            AND: [{ startTime: { lt: newEndTime } }, { endTime: { gte: newEndTime } }],
          },
          {
            AND: [{ startTime: { gte: newStartTime } }, { endTime: { lte: newEndTime } }],
          },
        ],
      },
    });

    if (conflictingBooking) {
      throw new ConflictException('The new time slot is not available');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: {
        startTime: newStartTime,
        endTime: newEndTime,
      },
      include: {
        meetingType: true,
        mentor: true,
        mentee: true,
      },
    });

    // Send reschedule notification
    await this.notificationsService.sendBookingRescheduleNotification(updated);

    return updated;
  }

  async complete(id: string) {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be marked as completed');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });
  }

  async markNoShow(id: string) {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be marked as no-show');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.NO_SHOW },
    });
  }

  async addNotes(id: string, notes: string) {
    await this.findOne(id);

    return this.prisma.booking.update({
      where: { id },
      data: { mentorNotes: notes },
    });
  }

  // Statistics
  async getStats(mentorId: string, startDate?: Date, endDate?: Date) {
    const where: any = { mentorId };

    if (startDate && endDate) {
      where.startTime = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [total, pending, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.booking.count({ where: { ...where, status: 'NO_SHOW' } }),
    ]);

    const completionRate =
      total > 0 ? ((completed / (total - cancelled)) * 100).toFixed(1) : '0';

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      noShow,
      completionRate: `${completionRate}%`,
    };
  }
}
