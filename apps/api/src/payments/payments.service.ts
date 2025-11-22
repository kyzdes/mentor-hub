import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService
  ) {}

  async createPaymentForBooking(bookingId: string, payerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        meetingType: true,
        mentor: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const amount = parseFloat(booking.meetingType.price.toString());
    const platformFeePercent = 0.10; // 10% platform fee
    const platformFee = amount * platformFeePercent;
    const mentorEarnings = amount - platformFee;

    // Create Stripe payment intent
    const paymentIntent = await this.stripeService.createPaymentIntent(
      amount,
      booking.meetingType.currency,
      {
        bookingId,
        mentorId: booking.mentorId,
        payerId,
      }
    );

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        payerId,
        recipientId: booking.mentorId,
        amount,
        currency: booking.meetingType.currency,
        platformFee,
        mentorEarnings,
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return {
      payment,
      clientSecret: paymentIntent.client_secret,
    };
  }

  async handleWebhook(event: any) {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { booking: true },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        stripeChargeId: paymentIntent.charges.data[0]?.id,
      },
    });

    // Confirm booking if it was pending
    if (payment.bookingId && payment.booking.status === 'PENDING') {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CONFIRMED' },
      });
    }

    // Update mentor revenue
    await this.prisma.user.update({
      where: { id: payment.recipientId },
      data: {
        totalRevenue: {
          increment: payment.mentorEarnings,
        },
      },
    });

    // Transfer to mentor (if connected account exists)
    const mentor = await this.prisma.user.findUnique({
      where: { id: payment.recipientId },
      select: { stripeAccountId: true },
    });

    if (mentor?.stripeAccountId) {
      await this.stripeService.createTransfer(
        parseFloat(payment.mentorEarnings.toString()),
        mentor.stripeAccountId,
        { paymentId: payment.id }
      );
    }
  }

  private async handlePaymentFailure(paymentIntent: any) {
    await this.prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'FAILED' },
    });
  }

  private async handleRefund(charge: any) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeChargeId: charge.id },
    });

    if (!payment) return;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAmount: charge.amount_refunded / 100,
        refundedAt: new Date(),
      },
    });
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        OR: [{ payerId: userId }, { recipientId: userId }],
      },
      include: {
        booking: {
          include: {
            meetingType: {
              select: { name: true },
            },
          },
        },
        payer: {
          select: { firstName: true, lastName: true, email: true },
        },
        recipient: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEarnings(mentorId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      recipientId: mentorId,
      status: 'COMPLETED',
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const payments = await this.prisma.payment.findMany({ where });

    const totalEarnings = payments.reduce(
      (sum, p) => sum + parseFloat(p.mentorEarnings.toString()),
      0
    );

    const totalPlatformFees = payments.reduce(
      (sum, p) => sum + parseFloat(p.platformFee.toString()),
      0
    );

    return {
      totalEarnings,
      totalPlatformFees,
      totalPayments: payments.length,
      averagePerSession: payments.length > 0 ? totalEarnings / payments.length : 0,
    };
  }
}
