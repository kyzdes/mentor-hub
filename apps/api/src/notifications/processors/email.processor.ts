import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '@prisma/client';

@Processor('email')
@Injectable()
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT', '587')),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { notificationId, recipientEmail, type, data } = job.data;

    try {
      this.logger.log(`Sending email notification ${notificationId} to ${recipientEmail}`);

      const { subject, html } = this.getEmailContent(type, data);

      await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM'),
        to: recipientEmail,
        subject,
        html,
      });

      await this.notificationsService.markAsSent(notificationId);

      this.logger.log(`Email sent successfully: ${notificationId}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      await this.notificationsService.markAsFailed(notificationId, error.message);
      throw error;
    }
  }

  private getEmailContent(
    type: NotificationType,
    data: any
  ): { subject: string; html: string } {
    switch (type) {
      case NotificationType.NEW_BOOKING:
        return {
          subject: `Meeting Confirmed - ${data.meetingType.name}`,
          html: this.getNewBookingTemplate(data),
        };

      case NotificationType.REMINDER_24H:
        return {
          subject: `Reminder: Meeting Tomorrow - ${data.meetingType.name}`,
          html: this.getReminderTemplate(data, '24 hours'),
        };

      case NotificationType.REMINDER_1H:
        return {
          subject: `Reminder: Meeting in 1 Hour - ${data.meetingType.name}`,
          html: this.getReminderTemplate(data, '1 hour'),
        };

      case NotificationType.CANCELLATION:
        return {
          subject: `Meeting Cancelled - ${data.meetingType.name}`,
          html: this.getCancellationTemplate(data),
        };

      case NotificationType.RESCHEDULE:
        return {
          subject: `Meeting Rescheduled - ${data.meetingType.name}`,
          html: this.getRescheduleTemplate(data),
        };

      default:
        return {
          subject: 'MentorHub Notification',
          html: '<p>You have a new notification from MentorHub.</p>',
        };
    }
  }

  private getNewBookingTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3B82F6; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .button { background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Meeting Confirmed!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.menteeName},</p>
              <p>Your meeting has been successfully booked!</p>

              <div class="details">
                <h3>${data.meetingType.name}</h3>
                <p><strong>📅 Date:</strong> ${new Date(data.startTime).toLocaleDateString()}</p>
                <p><strong>🕐 Time:</strong> ${new Date(data.startTime).toLocaleTimeString()} - ${new Date(data.endTime).toLocaleTimeString()}</p>
                <p><strong>⏱️ Duration:</strong> ${data.meetingType.duration} minutes</p>
                ${data.videoUrl ? `<p><strong>🔗 Meeting Link:</strong> <a href="${data.videoUrl}">${data.videoUrl}</a></p>` : ''}
                ${data.location ? `<p><strong>📍 Location:</strong> ${data.location}</p>` : ''}
              </div>

              <p>We'll send you a reminder 24 hours and 1 hour before your meeting.</p>

              <p>Looking forward to seeing you!</p>
              <p>Best regards,<br>MentorHub Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getReminderTemplate(data: any, timeframe: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>⏰ Meeting Reminder</h2>
            <p>Hi ${data.menteeName},</p>
            <p>This is a friendly reminder that you have a meeting in ${timeframe}.</p>
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${data.meetingType.name}</h3>
              <p><strong>📅 Date:</strong> ${new Date(data.startTime).toLocaleDateString()}</p>
              <p><strong>🕐 Time:</strong> ${new Date(data.startTime).toLocaleTimeString()}</p>
              ${data.videoUrl ? `<p><strong>🔗 Join:</strong> <a href="${data.videoUrl}">${data.videoUrl}</a></p>` : ''}
            </div>
            <p>See you soon!</p>
          </div>
        </body>
      </html>
    `;
  }

  private getCancellationTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>❌ Meeting Cancelled</h2>
            <p>Hi ${data.menteeName},</p>
            <p>Your meeting has been cancelled.</p>
            <div style="background: #fee; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${data.meetingType.name}</h3>
              <p><strong>📅 Was scheduled for:</strong> ${new Date(data.startTime).toLocaleString()}</p>
              ${data.cancellationReason ? `<p><strong>Reason:</strong> ${data.cancellationReason}</p>` : ''}
            </div>
            <p>If you'd like to reschedule, please visit our booking page.</p>
          </div>
        </body>
      </html>
    `;
  }

  private getRescheduleTemplate(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>📅 Meeting Rescheduled</h2>
            <p>Hi ${data.menteeName},</p>
            <p>Your meeting has been rescheduled to a new time.</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${data.meetingType.name}</h3>
              <p><strong>📅 New Date:</strong> ${new Date(data.startTime).toLocaleDateString()}</p>
              <p><strong>🕐 New Time:</strong> ${new Date(data.startTime).toLocaleTimeString()}</p>
            </div>
            <p>See you at the new time!</p>
          </div>
        </body>
      </html>
    `;
  }
}
