import { Router } from 'express';
import type { RequestHandler } from 'express';

import { validate, validateParams } from '../../../infrastructure/http/validation.middleware';
import type { PaymentController } from '../controllers/payment.controller';
import { paymentMethodIdParamSchema, addPaymentMethodSchema } from '../validators/payment.validator';

export function createPaymentRoutes(
  controller: PaymentController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  // List payment methods
  router.get('/', controller.listMethods);

  // Add payment method
  router.post('/', validate(addPaymentMethodSchema), controller.addMethod);

  // Remove payment method
  router.delete('/:id', validateParams(paymentMethodIdParamSchema), controller.removeMethod);

  // Set default payment method
  router.patch('/:id/default', validateParams(paymentMethodIdParamSchema), controller.setDefault);

  return router;
}
