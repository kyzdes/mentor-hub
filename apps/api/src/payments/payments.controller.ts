import { Controller, Post, Get, Body, UseGuards, Request, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  @ApiOperation({ summary: 'Create payment intent for booking' })
  createPaymentIntent(@Request() req, @Body('bookingId') bookingId: string) {
    return this.paymentsService.createPaymentForBooking(bookingId, req.user.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    const event = this.stripeService.verifyWebhookSignature(body, signature);
    await this.paymentsService.handleWebhook(event);
    return { received: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  getHistory(@Request() req) {
    return this.paymentsService.getPaymentHistory(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('earnings')
  @ApiOperation({ summary: 'Get mentor earnings' })
  getEarnings(@Request() req) {
    return this.paymentsService.getEarnings(req.user.id);
  }
}
