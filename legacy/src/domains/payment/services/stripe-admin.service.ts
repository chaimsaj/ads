import type Stripe from 'stripe';

import { getStripeClient } from '../config/stripe.config';
import type {
  StripePaymentStats,
  StripeBalanceInfo,
  DisputeInfo,
  StripeApiResponse,
} from '../types/stripe.types';

export class StripeAdminService {
  async getBalance(): Promise<StripeApiResponse<StripeBalanceInfo>> {
    try {
      const stripe = getStripeClient();
      const balance = await stripe.balance.retrieve();

      return {
        success: true,
        data: {
          available: balance.available.map((b: { amount: number; currency: string }) => ({
            amount: b.amount,
            currency: b.currency,
          })),
          pending: balance.pending.map((b: { amount: number; currency: string }) => ({
            amount: b.amount,
            currency: b.currency,
          })),
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getPaymentStats(
    startDate: Date,
    endDate: Date,
  ): Promise<StripeApiResponse<StripePaymentStats>> {
    try {
      const stripe = getStripeClient();

      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      const periodLength = endTimestamp - startTimestamp;
      const prevStartTimestamp = startTimestamp - periodLength;

      const [currentCharges, previousCharges, refunds] = await Promise.all([
        stripe.charges.list({
          created: { gte: startTimestamp, lte: endTimestamp },
          limit: 100,
        }),
        stripe.charges.list({
          created: { gte: prevStartTimestamp, lte: startTimestamp },
          limit: 100,
        }),
        stripe.refunds.list({
          created: { gte: startTimestamp, lte: endTimestamp },
          limit: 100,
        }),
      ]);

      const currentRevenue = currentCharges.data
        .filter((c: Stripe.Charge) => c.status === 'succeeded')
        .reduce((sum: number, c: Stripe.Charge) => sum + c.amount, 0);

      const previousRevenue = previousCharges.data
        .filter((c: Stripe.Charge) => c.status === 'succeeded')
        .reduce((sum: number, c: Stripe.Charge) => sum + c.amount, 0);

      const successfulPayments = currentCharges.data.filter((c: Stripe.Charge) => c.status === 'succeeded').length;
      const failedPayments = currentCharges.data.filter((c: Stripe.Charge) => c.status === 'failed').length;
      const refundedAmount = refunds.data.reduce((sum: number, r: Stripe.Refund) => sum + (r.amount ?? 0), 0);

      const revenueGrowth = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      const prevTransactions = previousCharges.data.length;
      const currentTransactions = currentCharges.data.length;
      const transactionGrowth = prevTransactions > 0
        ? ((currentTransactions - prevTransactions) / prevTransactions) * 100
        : 0;

      return {
        success: true,
        data: {
          totalRevenue: currentRevenue,
          totalTransactions: currentTransactions,
          successfulPayments,
          failedPayments,
          refundedAmount,
          averageTransactionValue: successfulPayments > 0 ? currentRevenue / successfulPayments : 0,
          periodComparison: {
            revenueGrowth: Math.round(revenueGrowth * 100) / 100,
            transactionGrowth: Math.round(transactionGrowth * 100) / 100,
          },
        },
      };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listDisputes(limit = 10): Promise<StripeApiResponse<DisputeInfo[]>> {
    try {
      const stripe = getStripeClient();

      const disputes = await stripe.disputes.list({ limit });

      const mapped = disputes.data.map((d: Stripe.Dispute) => ({
        id: d.id,
        paymentIntentId: typeof d.payment_intent === 'string' ? d.payment_intent : d.payment_intent?.id ?? '',
        amount: d.amount,
        currency: d.currency,
        status: d.status,
        reason: d.reason,
        evidenceDueBy: d.evidence_details?.due_by
          ? new Date(d.evidence_details.due_by * 1000).toISOString()
          : undefined,
        createdAt: new Date(d.created * 1000).toISOString(),
      }));

      return { success: true, data: mapped };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listTransactions(options?: {
    limit?: number;
    startingAfter?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<StripeApiResponse<Stripe.PaymentIntent[]>> {
    try {
      const stripe = getStripeClient();

      const created: Record<string, number> = {};
      if (options?.startDate) {
        created.gte = Math.floor(options.startDate.getTime() / 1000);
      }
      if (options?.endDate) {
        created.lte = Math.floor(options.endDate.getTime() / 1000);
      }

      const paymentIntents = await stripe.paymentIntents.list({
        limit: options?.limit ?? 20,
        ...(options?.startingAfter && { starting_after: options.startingAfter }),
        ...(Object.keys(created).length > 0 && { created }),
      });

      return { success: true, data: paymentIntents.data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer',
  ): Promise<StripeApiResponse<Stripe.Refund>> {
    try {
      const stripe = getStripeClient();

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        ...(amount && { amount }),
        ...(reason && { reason }),
      });

      return { success: true, data: refund };
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
