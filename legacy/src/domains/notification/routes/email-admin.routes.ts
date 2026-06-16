import { Router } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import { emailLimiter } from '../../../infrastructure/middleware/rate-limit.middleware';
import type { EmailAdminController } from '../controllers/email-admin.controller';
import { bulkEmailSchema } from '../validators/notification.validator';

export function createEmailAdminRoutes(
  controller: EmailAdminController,
  adminAuthenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAdminAuthenticate>,
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.get('/stats', controller.stats);
  router.get('/recent', controller.recent);
  router.post('/bulk', emailLimiter, validate(bulkEmailSchema), controller.sendBulk);

  return router;
}
