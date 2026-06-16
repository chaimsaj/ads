import type { Request, Response, NextFunction } from 'express';

import { getEnv } from '../../../config/environment';
import { success, created } from '../../../infrastructure/http/response.helper';
import type { StripeCustomerService } from '../services/stripe-customer.service';
import type { StripePaymentService } from '../services/stripe-payment.service';
import type { StripeInvoiceService } from '../services/stripe-invoice.service';

export class StripeController {
  constructor(
    private readonly customerService: StripeCustomerService,
    private readonly paymentService: StripePaymentService,
    private readonly invoiceService: StripeInvoiceService,
  ) {}

  // ---- Config ----

  getConfig = (_req: Request, res: Response): void => {
    const env = getEnv();
    success(res, { publishableKey: env.STRIPE_PUBLISHABLE_KEY || '' });
  };

  // ---- Checkout Sessions ----

  createCheckoutSessionSetup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const env = getEnv();

      const defaultUrl = `${env.APP_URL}/settings`;
      const successUrl = req.body.successUrl || defaultUrl;
      const cancelUrl = req.body.cancelUrl || defaultUrl;

      const customerId = await this.customerService.getOrCreateCustomer(userId);

      const result = await this.customerService.createCheckoutSessionForSetup(
        customerId,
        userId,
        successUrl,
        cancelUrl,
      );

      created(res, result, 'Checkout session created');
    } catch (err) {
      next(err);
    }
  };

  processCheckoutSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const sessionId = String(req.params.sessionId);

      const paymentMethod = await this.customerService.processCheckoutSession(sessionId, userId);

      success(res, paymentMethod, 'Payment method saved and set as default');
    } catch (err) {
      next(err);
    }
  };

  // ---- Customer ----

  createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.customerService.createCustomer({
        userId: String(req.user!.sub),
        email: req.body.email,
        name: req.body.name,
        phone: req.body.phone,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      created(res, result.data, 'Stripe customer created');
    } catch (err) {
      next(err);
    }
  };

  // ---- Payment Intents ----

  createPaymentIntent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = String(req.params.customerId);

      const result = await this.paymentService.createPaymentIntent({
        customerId,
        amount: req.body.amount,
        currency: req.body.currency,
        paymentMethodId: req.body.paymentMethodId,
        description: req.body.description,
        savePaymentMethod: req.body.savePaymentMethod,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      created(res, result.data, 'Payment intent created');
    } catch (err) {
      next(err);
    }
  };

  createPaymentIntentForUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const customerId = await this.customerService.getOrCreateCustomer(userId);

      const result = await this.paymentService.createPaymentIntent({
        customerId,
        amount: req.body.amount,
        currency: req.body.currency,
        paymentMethodId: req.body.paymentMethodId,
        description: req.body.description,
        savePaymentMethod: req.body.savePaymentMethod,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      created(res, result.data, 'Payment intent created');
    } catch (err) {
      next(err);
    }
  };

  confirmPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.paymentService.confirmPayment({
        paymentIntentId: req.body.paymentIntentId,
        paymentMethodId: req.body.paymentMethodId,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data, 'Payment confirmed');
    } catch (err) {
      next(err);
    }
  };

  // ---- Invoices ----

  createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = String(req.params.customerId);

      const result = await this.invoiceService.createInvoice({
        customerId,
        items: req.body.items,
        daysUntilDue: req.body.daysUntilDue,
        autoAdvance: req.body.autoAdvance,
        collectionMethod: req.body.collectionMethod,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      created(res, result.data, 'Invoice created');
    } catch (err) {
      next(err);
    }
  };

  listInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.invoiceService.listInvoices(undefined, {
        limit: Number(req.query.limit) || 10,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data);
    } catch (err) {
      next(err);
    }
  };

  payInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invoiceId = String(req.params.id);
      const result = await this.invoiceService.payInvoice(invoiceId, req.body.paymentMethodId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      success(res, result.data, 'Invoice paid');
    } catch (err) {
      next(err);
    }
  };
}
