import type { PaymentMethod, PrismaClient } from '@prisma/client';
import type Stripe from 'stripe';

import { logger } from '../../../infrastructure/logging/logger';
import { getStripeClient, STRIPE_METADATA_KEYS } from '../config/stripe.config';
import type { IPaymentMethodRepository } from '../interfaces/payment-method-repository.interface';
import type { StripeCustomerData, StripeApiResponse } from '../types/stripe.types';

export class StripeCustomerService {
  constructor(
    private readonly db: PrismaClient,
    private readonly paymentMethodRepo: IPaymentMethodRepository,
  ) {}

  async createCustomer(data: StripeCustomerData): Promise<StripeApiResponse<Stripe.Customer>> {
    try {
      const stripe = getStripeClient();

      const customer = await stripe.customers.create({
        email: data.email,
        name: data.name,
        phone: data.phone,
        metadata: {
          [STRIPE_METADATA_KEYS.userId]: data.userId,
          [STRIPE_METADATA_KEYS.platform]: 'myngly_ads',
          ...data.metadata,
        },
      });

      return { success: true, data: customer };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getCustomer(customerId: string): Promise<StripeApiResponse<Stripe.Customer>> {
    try {
      const stripe = getStripeClient();
      const customer = await stripe.customers.retrieve(customerId);

      if (customer.deleted) {
        return { success: false, error: 'Customer has been deleted' };
      }

      return { success: true, data: customer as Stripe.Customer };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async updateCustomer(
    customerId: string,
    data: Partial<Pick<StripeCustomerData, 'email' | 'name' | 'phone' | 'metadata'>>,
  ): Promise<StripeApiResponse<Stripe.Customer>> {
    try {
      const stripe = getStripeClient();

      const customer = await stripe.customers.update(customerId, {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.metadata && { metadata: data.metadata }),
      });

      return { success: true, data: customer };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createSetupIntent(customerId: string): Promise<StripeApiResponse<Stripe.SetupIntent>> {
    try {
      const stripe = getStripeClient();

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });

      return { success: true, data: setupIntent };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listPaymentMethods(customerId: string): Promise<StripeApiResponse<Stripe.PaymentMethod[]>> {
    try {
      const stripe = getStripeClient();

      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return { success: true, data: methods.data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getOrCreateCustomer(userId: string): Promise<string> {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    if (user.stripeCustomerId) {
      return user.stripeCustomerId;
    }

    const stripe = getStripeClient();
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        [STRIPE_METADATA_KEYS.userId]: userId,
        [STRIPE_METADATA_KEYS.platform]: 'myngly_ads',
      },
    });

    await this.db.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  async createCheckoutSessionForSetup(
    customerId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string; sessionId: string }> {
    const stripe = getStripeClient();

    // Append Stripe's session ID template so the frontend receives it on redirect
    const separator = successUrl.includes('?') ? '&' : '?';
    const finalSuccessUrl = `${successUrl}${separator}session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customerId,
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
      success_url: finalSuccessUrl,
      cancel_url: cancelUrl,
      metadata: { [STRIPE_METADATA_KEYS.userId]: userId },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    return { url: session.url, sessionId: session.id };
  }

  /**
   * Process a completed Checkout Session: retrieve the payment method from Stripe,
   * save it to the database, and set it as the user's default.
   * Idempotent — returns existing card if already processed.
   */
  async processCheckoutSession(sessionId: string, userId: string): Promise<PaymentMethod> {
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.mode !== 'setup') {
      throw new Error('Checkout session is not a setup session');
    }

    // Verify user ownership via metadata
    const sessionUserId = session.metadata?.[STRIPE_METADATA_KEYS.userId];
    if (sessionUserId !== userId) {
      throw new Error('Checkout session does not belong to this user');
    }

    const setupIntentId = typeof session.setup_intent === 'string'
      ? session.setup_intent
      : session.setup_intent?.id;

    if (!setupIntentId) {
      throw new Error('Checkout session has no setup intent');
    }

    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method?.id;

    if (!paymentMethodId) {
      throw new Error('Setup intent has no payment method');
    }

    // Check if already processed (idempotent)
    const existingMethods = await this.paymentMethodRepo.findAllForUser(userId);
    const existing = existingMethods.find(
      (m) => m.stripePaymentMethodId === paymentMethodId,
    );
    if (existing) {
      // Already saved — ensure it's set as default and return
      if (!existing.isDefault) {
        return this.paymentMethodRepo.setAsDefault(existing.id, userId);
      }
      return existing;
    }

    // Check max limit
    const count = await this.paymentMethodRepo.countForUser(userId);
    if (count >= 10) {
      throw new Error('Maximum of 10 payment methods reached');
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

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

    // Set as default
    const result = await this.paymentMethodRepo.setAsDefault(saved.id, userId);

    logger.info('Payment method saved and set as default via process endpoint', {
      userId,
      paymentMethodId,
      sessionId,
    });

    return result;
  }

  private handleError<T>(err: unknown): StripeApiResponse<T> {
    if (err && typeof err === 'object' && 'type' in err) {
      const stripeErr = err as Stripe.errors.StripeError;
      return {
        success: false,
        error: stripeErr.message,
        stripeErrorCode: stripeErr.code,
      };
    }
    return { success: false, error: (err as Error).message };
  }
}
