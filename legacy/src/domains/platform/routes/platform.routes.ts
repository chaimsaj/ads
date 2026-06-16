import { Router } from 'express';

import { validateParams } from '../../../infrastructure/http/validation.middleware';
import type { PlatformController } from '../controllers/platform.controller';
import { platformIdParamSchema } from '../validators/platform.validator';

export function createPlatformRoutes(
  controller: PlatformController,
  authenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAuthenticate>,
): Router {
  const router = Router();

  router.use(authenticate);

  // Ad formats
  router.get('/formats', controller.listFormats);
  router.get('/formats/:id', validateParams(platformIdParamSchema), controller.showFormat);

  // Boost types
  router.get('/boost-types', controller.listBoostTypes);
  router.get('/boost-types/:id', validateParams(platformIdParamSchema), controller.showBoostType);

  return router;
}
