import { Router } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import { emailLimiter } from '../../../infrastructure/middleware/rate-limit.middleware';
import type { EmailController } from '../controllers/email.controller';
import { sendEmailSchema } from '../validators/notification.validator';

export function createEmailRoutes(
  controller: EmailController,
  authenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAuthenticate>,
): Router {
  const router = Router();

  router.use(authenticate);
  router.use(emailLimiter);

  router.post('/send-verification', validate(sendEmailSchema), controller.sendVerification);
  router.post('/send-password-reset', validate(sendEmailSchema), controller.sendPasswordReset);

  return router;
}
