import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAuthenticate, createAdminAuthenticate } from '../identity/middleware/authenticate.middleware';

import { AdminPaymentController } from './controllers/admin-payment.controller';
import { PaymentController } from './controllers/payment.controller';
import { StripeController } from './controllers/stripe.controller';
import { WebhookController } from './controllers/webhook.controller';
import { PaymentMethodRepository } from './repositories/payment-method.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { createAdminPaymentRoutes } from './routes/admin-payment.routes';
import { createPaymentRoutes } from './routes/payment.routes';
import { createStripeRoutes } from './routes/stripe.routes';
import { PaymentMethodService } from './services/payment-method.service';
import { StripeAdminService } from './services/stripe-admin.service';
import { StripeCustomerService } from './services/stripe-customer.service';
import { StripeInvoiceService } from './services/stripe-invoice.service';
import { StripePaymentService } from './services/stripe-payment.service';
import { StripeRefundService } from './services/stripe-refund.service';
import { StripeWebhookService } from './services/stripe-webhook.service';

export function buildPaymentDomain(tokenService: ITokenService) {
  // Repositories
  const paymentMethodRepo = new PaymentMethodRepository(prisma);
  const transactionRepo = new TransactionRepository(prisma);

  // Services
  const paymentMethodService = new PaymentMethodService(paymentMethodRepo);
  const customerService = new StripeCustomerService(prisma, paymentMethodRepo);
  const paymentService = new StripePaymentService();
  const invoiceService = new StripeInvoiceService();
  const refundService = new StripeRefundService();
  const webhookService = new StripeWebhookService(transactionRepo, paymentMethodRepo);
  const adminService = new StripeAdminService();

  // Controllers
  const paymentController = new PaymentController(paymentMethodService);
  const stripeController = new StripeController(customerService, paymentService, invoiceService);
  const webhookController = new WebhookController(webhookService);
  const adminPaymentController = new AdminPaymentController(adminService, refundService);

  // Middleware
  const authenticate = createAuthenticate(tokenService);
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Routes
  const paymentRoutes = createPaymentRoutes(paymentController, authenticate);
  const stripeRoutes = createStripeRoutes(stripeController, webhookController, authenticate);
  const adminPaymentRoutes = createAdminPaymentRoutes(
    adminPaymentController,
    webhookController,
    adminAuthenticate,
  );

  return { paymentRoutes, stripeRoutes, adminPaymentRoutes };
}
