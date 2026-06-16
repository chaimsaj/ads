import { Router } from 'express';

import { validate, validateParams } from '../../../infrastructure/http/validation.middleware';
import type { SettingsController } from '../controllers/settings.controller';
import { settingKeyParamSchema, updateSettingsSchema } from '../validators/administration.validator';

export function createSettingsRoutes(
  controller: SettingsController,
  adminAuthenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAdminAuthenticate>,
): Router {
  const router = Router();

  router.use(adminAuthenticate);

  router.get('/', controller.list);
  router.get('/grouped', controller.listGrouped);
  router.get('/:key', validateParams(settingKeyParamSchema), controller.show);
  router.put('/', validate(updateSettingsSchema), controller.update);

  return router;
}
