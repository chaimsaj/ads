import type Stripe from 'stripe';

import { logger } from '../../../infrastructure/logging/logger';
import { getStripeClient, getStripeWebhookSecret } from '../config/stripe.config';
import type { IPaymentMethodRepository } from '../interfaces/payment-method-repository.interface';
import type { ITransactionRepository } from '../interfaces/transaction-repository.interface';
import type { WebhookEventResult } from '../types/stripe.types';

type WebhookHandler = (event: Stripe.Event) => Promise<WebhookEventResult>;

export class StripeWebhookService {
  private readonly handlers = new Map<string, WebhookHandler>();

  constructor(
    private readonly transactionRepo: ITransactionRepository,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
  ) {
    this.registerDefaultHandlers();
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event | null {
    try {
      const stripe = getStripeClient();
      const webhookSecret = getStripeWebhookSecret();
      return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: (err as Error).message });
      return null;
    }
  }

  async processEvent(event: Stripe.Event): Promise<WebhookEventResult> {
    const handler = this.handlers.get(event.type);

    if (!handler) {
      logger.info(`Unhandled webhook event type: ${event.type}`);
      return {
        handled: false,
        eventType: event.type,
        message: `No handler for event type: ${event.type}`,
      };
    }

    try {
      return await handler(event);
    } catch (err) {
      logger.error(`Error processing webhook event ${event.type}`, {
        eventId: event.id,
        error: (err as Error).message,
      });
      return {
        handled: false,
        eventType: event.type,
        message: `Error processing event: ${(err as Error).message}`,
      };
    }
  }

  async retrieveEvent(eventId: string): Promise<Stripe.Event | null> {
    try {
      const stripe = getStripeClient();
      return await stripe.events.retrieve(eventId);
    } catch {
      return null;
    }
  }

  async listRecentEvents(limit = 20): Promise<Stripe.Event[]> {
    try {
      const stripe = getStripeClient();
      const events = await stripe.events.list({ limit });
      return events.data;
    } catch {
      return [];
    }
  }

  private registerDefaultHandlers(): void {
    this.handlers.set('payment_intent.succeeded', async (event) => {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata?.[STRIPE_METADATA_KEYS_USERID];

      if (userId) {
        const existing = await this.transactionRepo.findByStripePaymentIntentId(paymentIntent.id);
        if (existing) {
          await this.transactionRepo.updateStatus(existing.id, 'COMPLETED');
        }
      }

      logger.info('Payment intent succeeded', { paymentIntentId: paymentIntent.id });
      return {
        handled: true,
        eventType: event.type,
        message: `Payment ${paymentIntent.id} succeeded`,
      };
    });

    this.handlers.set('payment_intent.payment_failed', async (event) => {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const existing = await this.transactionRepo.findByStripePaymentIntentId(paymentIntent.id);
      if (existing) {
        const failureReason = paymentIntent.last_payment_error?.message ?? 'Payment failed';
        await this.transactionRepo.updateStatus(existing.id, 'FAILED', failureReason);
      }

      logger.warn('Payment intent failed', { paymentIntentId: paymentIntent.id });
      return {
        handled: true,
        eventType: event.type,
        message: `Payment ${paymentIntent.id} failed`,
      };
    });

    this.handlers.set('charge.refunded', async (event) => {
      const charge = event.data.object as Stripe.Charge;
      logger.info('Charge refunded', { chargeId: charge.id });
      return {
        handled: true,
        eventType: event.type,
        message: `Charge ${charge.id} refunded`,
      };
    });

    this.handlers.set('charge.dispute.created', async (event) => {
      const dispute = event.data.object as Stripe.Dispute;
      logger.warn('Dispute created', { disputeId: dispute.id });
      return {
        handled: true,
        eventType: event.type,
        message: `Dispute ${dispute.id} created`,
      };
    });

    this.handlers.set('invoice.paid', async (event) => {
      const invoice = event.data.object as Stripe.Invoice;
      logger.info('Invoice paid', { invoiceId: invoice.id });
      return {
        handled: true,
        eventType: event.type,
        message: `Invoice ${invoice.id} paid`,
      };
    });

    this.handlers.set('invoice.payment_failed', async (event) => {
      const invoice = event.data.object as Stripe.Invoice;
      logger.warn('Invoice payment failed', { invoiceId: invoice.id });
      return {
        handled: true,
        eventType: event.type,
        message: `Invoice ${invoice.id} payment failed`,
      };
    });

    this.handlers.set('checkout.session.completed', async (event) => {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode !== 'setup') {
        logger.info('Ignoring non-setup checkout session', { sessionId: session.id });
        return {
          handled: true,
          eventType: event.type,
          message: `Non-setup checkout session ${session.id} ignored`,
        };
      }

      const userId = session.metadata?.myngly_user_id;
      if (!userId) {
        logger.warn('Checkout session missing myngly_user_id metadata', { sessionId: session.id });
        return {
          handled: false,
          eventType: event.type,
          message: 'Missing user ID in session metadata',
        };
      }

      const stripe = getStripeClient();

      const setupIntentId = typeof session.setup_intent === 'string'
        ? session.setup_intent
        : session.setup_intent?.id;

      if (!setupIntentId) {
        logger.warn('Checkout session missing setup_intent', { sessionId: session.id });
        return {
          handled: false,
          eventType: event.type,
          message: 'Missing setup_intent in checkout session',
        };
      }

      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      const paymentMethodId = typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

      if (!paymentMethodId) {
        logger.warn('Setup intent missing payment_method', { setupIntentId });
        return {
          handled: false,
          eventType: event.type,
          message: 'Missing payment method in setup intent',
        };
      }

      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      // Check for duplicates
      const existingMethods = await this.paymentMethodRepo.findAllForUser(userId);
      const isDuplicate = existingMethods.some(
        (m) => m.stripePaymentMethodId === paymentMethodId,
      );
      if (isDuplicate) {
        logger.info('Duplicate payment method, skipping', { paymentMethodId, userId });
        return {
          handled: true,
          eventType: event.type,
          message: `Duplicate payment method ${paymentMethodId} skipped`,
        };
      }

      // Check max limit
      const count = await this.paymentMethodRepo.countForUser(userId);
      if (count >= 10) {
        logger.warn('User has reached max payment methods', { userId, count });
        return {
          handled: false,
          eventType: event.type,
          message: `User ${userId} has reached the maximum of 10 payment methods`,
        };
      }

      const customerId = typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id ?? undefined;

      const saved = await this.paymentMethodRepo.create({
        userId,
        cardType: paymentMethod.card?.brand ?? 'unknown',
        lastFour: paymentMethod.card?.last4 ?? '0000',
        expiryMonth: paymentMethod.card?.exp_month ?? 1,
        expiryYear: paymentMethod.card?.exp_year ?? 2030,
        cardholderName: paymentMethod.billing_details?.name ?? '',
        isDefault: false,
        stripePaymentMethodId: paymentMethodId,
        stripeCustomerId: customerId,
      });

      // Always set new card as default
      await this.paymentMethodRepo.setAsDefault(saved.id, userId);

      logger.info('Payment method saved and set as default from webhook', {
        userId,
        paymentMethodId,
        sessionId: session.id,
      });

      return {
        handled: true,
        eventType: event.type,
        message: `Payment method ${paymentMethodId} saved for user ${userId}`,
      };
    });
  }
}

const STRIPE_METADATA_KEYS_USERID = 'myngly_user_id';
