import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get('STRIPE_SECRET_KEY');
    this.webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');

    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-11-20.acacia',
        typescript: true,
      });
      this.logger.log('Stripe initialized successfully');
    } else {
      this.logger.warn('Stripe not configured - Payment features will not work');
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'USD', metadata?: any) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
    });
  }

  async createCustomer(email: string, name: string, metadata?: any) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  async createConnectedAccount(email: string, country: string = 'US') {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.accounts.create({
      type: 'express',
      email,
      country,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  async createTransfer(amount: number, destination: string, metadata?: any) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      destination,
      metadata,
    });
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });
  }

  verifyWebhookSignature(payload: any, signature: string): any {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
