import { Router } from 'express';
import type { RequestHandler } from 'express';

import { validate, validateParams } from '../../../infrastructure/http/validation.middleware';
import type { StripeController } from '../controllers/stripe.controller';
import type { WebhookController } from '../controllers/webhook.controller';
import { requireStripeConfig } from '../middleware/stripe-webhook.middleware';
import {
  createCheckoutSessionSetupSchema,
  checkoutSessionIdParamSchema,
  createCustomerSchema,
  createPaymentIntentSchema,
  confirmPaymentSchema,
  createInvoiceSchema,
  payInvoiceSchema,
  stripeIdParamSchema,
  invoiceIdParamSchema,
} from '../validators/payment.validator';

export function createStripeRoutes(
  stripeController: StripeController,
  webhookController: WebhookController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  // Webhook endpoint — no auth, uses Stripe signature verification
  router.post('/webhooks', requireStripeConfig, webhookController.handleWebhook);

  // Config — returns publishable key (requires auth but not Stripe secret)
  router.get('/config', authenticate, stripeController.getConfig);

  // All other Stripe routes require authentication + Stripe config
  router.use(authenticate);
  router.use(requireStripeConfig);

  // Checkout Sessions
  router.post(
    '/checkout-sessions/setup',
    validate(createCheckoutSessionSetupSchema),
    stripeController.createCheckoutSessionSetup,
  );
  router.post(
    '/checkout-sessions/:sessionId/process',
    validateParams(checkoutSessionIdParamSchema),
    stripeController.processCheckoutSession,
  );

  // Customers
  router.post('/customers', validate(createCustomerSchema), stripeController.createCustomer);

  // Payment Intents (user-scoped: resolves customer from authenticated user)
  router.post(
    '/payment-intents',
    validate(createPaymentIntentSchema),
    stripeController.createPaymentIntentForUser,
  );

  // Payment Intents (admin/explicit customer)
  router.post(
    '/customers/:customerId/payment-intents',
    validateParams(stripeIdParamSchema),
    validate(createPaymentIntentSchema),
    stripeController.createPaymentIntent,
  );

  // Confirm Payment
  router.post('/payments/confirm', validate(confirmPaymentSchema), stripeController.confirmPayment);

  // Invoices
  router.post(
    '/customers/:customerId/invoices',
    validateParams(stripeIdParamSchema),
    validate(createInvoiceSchema),
    stripeController.createInvoice,
  );
  router.get('/invoices', stripeController.listInvoices);
  router.post(
    '/invoices/:id/pay',
    validateParams(invoiceIdParamSchema),
    validate(payInvoiceSchema),
    stripeController.payInvoice,
  );

  return router;
}
