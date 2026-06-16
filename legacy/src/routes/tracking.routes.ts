import { Router } from 'express';

import { buildAnalyticsDomain } from '../domains/analytics';
import { buildIdentityDomain } from '../domains/identity';

export function trackingRoutes(): Router {
  const router = Router();
  const identity = buildIdentityDomain();
  const analytics = buildAnalyticsDomain(identity.tokenService);

  router.use('/', analytics.trackingRoutes);

  return router;
}
