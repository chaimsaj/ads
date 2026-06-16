import { Router } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import type { AdminPaymentController } from '../controllers/admin-payment.controller';
import type { WebhookController } from '../controllers/webhook.controller';
import { requireStripeConfig } from '../middleware/stripe-webhook.middleware';
import { createRefundSchema } from '../validators/payment.validator';

export function createAdminPaymentRoutes(
  adminPaymentController: AdminPaymentController,
  webhookController: WebhookController,
  adminAuthenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(adminAuthenticate);
  router.use(requireStripeConfig);

  // Balance & Stats
  router.get('/balance', adminPaymentController.getBalance);
  router.get('/stats', adminPaymentController.getStats);

  // Disputes
  router.get('/disputes', adminPaymentController.listDisputes);

  // Transactions
  router.get('/transactions', adminPaymentController.listTransactions);

  // Refunds
  router.post('/refunds', validate(createRefundSchema), adminPaymentController.createRefund);

  // Webhook management
  router.get('/webhooks/:eventId', webhookController.getEvent);
  router.post('/webhooks/:eventId/retry', webhookController.retryEvent);

  return router;
}
