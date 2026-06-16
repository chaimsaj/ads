import type Stripe from 'stripe';

import { getStripeClient } from '../config/stripe.config';
import type { CreateRefundData, StripeApiResponse } from '../types/stripe.types';

export class StripeRefundService {
  async createRefund(data: CreateRefundData): Promise<StripeApiResponse<Stripe.Refund>> {
    try {
      const stripe = getStripeClient();

      const params: Stripe.RefundCreateParams = {
        payment_intent: data.paymentIntentId,
      };

      if (data.amount) {
        params.amount = data.amount;
      }

      if (data.reason) {
        params.reason = data.reason;
      }

      if (data.metadata) {
        params.metadata = data.metadata;
      }

      const refund = await stripe.refunds.create(params);
      return { success: true, data: refund };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getRefund(refundId: string): Promise<StripeApiResponse<Stripe.Refund>> {
    try {
      const stripe = getStripeClient();
      const refund = await stripe.refunds.retrieve(refundId);
      return { success: true, data: refund };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listRefunds(
    paymentIntentId: string,
    limit = 10,
  ): Promise<StripeApiResponse<Stripe.Refund[]>> {
    try {
      const stripe = getStripeClient();

      const refunds = await stripe.refunds.list({
        payment_intent: paymentIntentId,
        limit,
      });

      return { success: true, data: refunds.data };
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
