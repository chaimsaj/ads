import { Router } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import type { TrackingController } from '../controllers/tracking.controller';
import {
  trackImpressionSchema,
  trackClickSchema,
  trackConversionSchema,
} from '../validators/tracking.validator';

export function createTrackingRoutes(controller: TrackingController): Router {
  const router = Router();

  router.post('/impression', validate(trackImpressionSchema), controller.trackImpression);
  router.post('/click', validate(trackClickSchema), controller.trackClick);
  router.post('/conversion', validate(trackConversionSchema), controller.trackConversion);
  router.get('/pixel/:campaignId', controller.pixelTrack);

  return router;
}
