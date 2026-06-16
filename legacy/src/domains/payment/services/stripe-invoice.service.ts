import type Stripe from 'stripe';

import { getStripeClient } from '../config/stripe.config';
import type { CreateInvoiceData, StripeApiResponse } from '../types/stripe.types';

export class StripeInvoiceService {
  async createInvoice(data: CreateInvoiceData): Promise<StripeApiResponse<Stripe.Invoice>> {
    try {
      const stripe = getStripeClient();

      const invoice = await stripe.invoices.create({
        customer: data.customerId,
        collection_method: data.collectionMethod ?? 'charge_automatically',
        days_until_due: data.collectionMethod === 'send_invoice' ? (data.daysUntilDue ?? 30) : undefined,
        auto_advance: data.autoAdvance ?? true,
        metadata: data.metadata,
      });

      for (const item of data.items) {
        await stripe.invoiceItems.create({
          customer: data.customerId,
          invoice: invoice.id,
          description: item.description,
          amount: item.amount * (item.quantity ?? 1),
        });
      }

      return { success: true, data: invoice };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async listInvoices(
    customerId?: string,
    options?: { limit?: number; status?: string; startingAfter?: string },
  ): Promise<StripeApiResponse<Stripe.Invoice[]>> {
    try {
      const stripe = getStripeClient();

      const params: Stripe.InvoiceListParams = {
        limit: options?.limit ?? 10,
      };

      if (customerId) {
        params.customer = customerId;
      }

      if (options?.status) {
        params.status = options.status as Stripe.InvoiceListParams['status'];
      }

      if (options?.startingAfter) {
        params.starting_after = options.startingAfter;
      }

      const invoices = await stripe.invoices.list(params);
      return { success: true, data: invoices.data };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async getInvoice(invoiceId: string): Promise<StripeApiResponse<Stripe.Invoice>> {
    try {
      const stripe = getStripeClient();
      const invoice = await stripe.invoices.retrieve(invoiceId);
      return { success: true, data: invoice };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async payInvoice(
    invoiceId: string,
    paymentMethodId?: string,
  ): Promise<StripeApiResponse<Stripe.Invoice>> {
    try {
      const stripe = getStripeClient();

      const params: Stripe.InvoicePayParams = {};
      if (paymentMethodId) {
        params.payment_method = paymentMethodId;
      }

      const invoice = await stripe.invoices.pay(invoiceId, params);
      return { success: true, data: invoice };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async finalizeInvoice(invoiceId: string): Promise<StripeApiResponse<Stripe.Invoice>> {
    try {
      const stripe = getStripeClient();
      const invoice = await stripe.invoices.finalizeInvoice(invoiceId);
      return { success: true, data: invoice };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async voidInvoice(invoiceId: string): Promise<StripeApiResponse<Stripe.Invoice>> {
    try {
      const stripe = getStripeClient();
      const invoice = await stripe.invoices.voidInvoice(invoiceId);
      return { success: true, data: invoice };
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
