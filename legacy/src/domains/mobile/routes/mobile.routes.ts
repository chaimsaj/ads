import { Router } from 'express';

import { validateParams, validateQuery } from '../../../infrastructure/http/validation.middleware';
import type { MobileCampaignController } from '../controllers/mobile-campaign.controller';
import { apiKeyAuth } from '../middleware/api-key.middleware';
import { mobileCampaignQuerySchema, mobileIdParamSchema } from '../validators/mobile.validator';

export function createMobileRoutes(controller: MobileCampaignController): Router {
  const router = Router();

  router.use(apiKeyAuth);

  router.get('/campaigns', validateQuery(mobileCampaignQuerySchema), controller.list);
  router.get('/campaigns/:id', validateParams(mobileIdParamSchema), controller.show);

  return router;
}
