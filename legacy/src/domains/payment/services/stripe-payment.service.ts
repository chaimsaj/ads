import type Stripe from 'stripe';

import { getStripeClient, STRIPE_METADATA_KEYS } from '../config/stripe.config';
import type {
  CreatePaymentIntentData,
  ConfirmPaymentData,
  StripeApiResponse,
} from '../types/stripe.types';

export class StripePaymentService {
  async createPaymentIntent(data: CreatePaymentIntentData): Promise<StripeApiResponse<Stripe.PaymentIntent>> {
    try {
      const stripe = getStripeClient();

      const params: Stripe.PaymentIntentCreateParams = {
        customer: data.customerId,
        amount: data.amount,
        currency: data.currency ?? 'usd',
        payment_method_types: ['card'],
        metadata: {
          [STRIPE_METADATA_KEYS.platform]: 'myngly_ads',
          ...data.metadata,
        },
      };

      if (data.paymentMethodId) {
        params.payment_method = data.paymentMethodId;
      }

      if (data.description) {
        params.description = data.description;
      }

      if (data.savePaymentMethod) {
        params.setup_future_usage = 'off_session';
      }

      const paymentIntent = await stripe.paymentIntents.create(params);

      return { success: true, data: paymentIntent };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async confirmPayment(data: ConfirmPaymentData): Promise<StripeApiResponse<Stripe.PaymentIntent>> {
    try {
      const stripe = getStripeClient();

      const params: Stripe.PaymentIntentConfirmParams = {};
      if (data.paymentMethodId) {
        params.payment_method = data.paymentMethodId;
      }

      const paymentIntent = await stripe.paymentIntents.confirm(data.paymentIntentId, params);

      return { success: true, data: paymentIntent };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getPaymentIntent(paymentIntentId: string): Promise<StripeApiResponse<Stripe.PaymentIntent>> {
    try {
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return { success: true, data: paymentIntent };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<StripeApiResponse<Stripe.PaymentIntent>> {
    try {
      const stripe = getStripeClient();
      const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
      return { success: true, data: paymentIntent };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async addPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<StripeApiResponse<Stripe.PaymentMethod>> {
    try {
      const stripe = getStripeClient();

      const method = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      return { success: true, data: method };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<StripeApiResponse<Stripe.PaymentMethod>> {
    try {
      const stripe = getStripeClient();
      const method = await stripe.paymentMethods.detach(paymentMethodId);
      return { success: true, data: method };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async setDefaultPaymentMethod(
    customerId: string,
    paymentMethodId: string,
  ): Promise<StripeApiResponse<Stripe.Customer>> {
    try {
      const stripe = getStripeClient();

      const customer = await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return { success: true, data: customer };
    } catch (err) {
      return this.handleError(err);
    }
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
