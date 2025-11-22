import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { addHours, subHours } from 'date-fns';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue
  ) {}

  async scheduleBookingNotifications(booking: any) {
    const { id, mentorId, menteeId, startTime, menteeEmail } = booking;

    // Immediate confirmation email to mentee
    await this.scheduleNotification({
      userId: mentorId,
      bookingId: id,
      type: NotificationType.NEW_BOOKING,
      channel: NotificationChannel.EMAIL,
      scheduledAt: new Date(),
      recipientEmail: menteeEmail,
      data: booking,
    });

    // 24 hours before reminder
    const reminder24h = subHours(new Date(startTime), 24);
    if (reminder24h > new Date()) {
      await this.scheduleNotification({
        userId: mentorId,
        bookingId: id,
        type: NotificationType.REMINDER_24H,
        channel: NotificationChannel.EMAIL,
        scheduledAt: reminder24h,
        recipientEmail: menteeEmail,
        data: booking,
      });

      if (menteeId) {
        await this.scheduleNotification({
          userId: menteeId,
          bookingId: id,
          type: NotificationType.REMINDER_24H,
          channel: NotificationChannel.EMAIL,
          scheduledAt: reminder24h,
          data: booking,
        });
      }
    }

    // 1 hour before reminder
    const reminder1h = subHours(new Date(startTime), 1);
    if (reminder1h > new Date()) {
      await this.scheduleNotification({
        userId: mentorId,
        bookingId: id,
        type: NotificationType.REMINDER_1H,
        channel: NotificationChannel.EMAIL,
        scheduledAt: reminder1h,
        recipientEmail: menteeEmail,
        data: booking,
      });

      if (menteeId) {
        await this.scheduleNotification({
          userId: menteeId,
          bookingId: id,
          type: NotificationType.REMINDER_1H,
          channel: NotificationChannel.EMAIL,
          scheduledAt: reminder1h,
          data: booking,
        });
      }
    }
  }

  async sendBookingApprovalNotification(booking: any) {
    await this.scheduleNotification({
      userId: booking.mentorId,
      bookingId: booking.id,
      type: NotificationType.NEW_BOOKING,
      channel: NotificationChannel.EMAIL,
      scheduledAt: new Date(),
      recipientEmail: booking.menteeEmail,
      data: booking,
    });
  }

  async sendBookingCancellationNotification(booking: any, reason?: string) {
    await this.scheduleNotification({
      userId: booking.mentorId,
      bookingId: booking.id,
      type: NotificationType.CANCELLATION,
      channel: NotificationChannel.EMAIL,
      scheduledAt: new Date(),
      recipientEmail: booking.menteeEmail,
      data: { ...booking, cancellationReason: reason },
    });
  }

  async sendBookingRescheduleNotification(booking: any) {
    await this.scheduleNotification({
      userId: booking.mentorId,
      bookingId: booking.id,
      type: NotificationType.RESCHEDULE,
      channel: NotificationChannel.EMAIL,
      scheduledAt: new Date(),
      recipientEmail: booking.menteeEmail,
      data: booking,
    });
  }

  private async scheduleNotification(data: {
    userId: string;
    bookingId: string;
    type: NotificationType;
    channel: NotificationChannel;
    scheduledAt: Date;
    recipientEmail?: string;
    data?: any;
  }) {
    const { userId, bookingId, type, channel, scheduledAt, recipientEmail, data: notifData } = data;

    // Create notification record
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        bookingId,
        type,
        channel,
        scheduledAt,
        status: NotificationStatus.PENDING,
      },
    });

    // Add to queue
    const delay = scheduledAt.getTime() - Date.now();

    if (channel === NotificationChannel.EMAIL) {
      await this.emailQueue.add(
        'send-email',
        {
          notificationId: notification.id,
          recipientEmail,
          type,
          data: notifData,
        },
        {
          delay: delay > 0 ? delay : 0,
        }
      );
    }

    return notification;
  }

  async markAsSent(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      },
    });
  }

  async markAsFailed(notificationId: string, error: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: NotificationStatus.FAILED,
        errorMessage: error,
      },
    });
  }
}
