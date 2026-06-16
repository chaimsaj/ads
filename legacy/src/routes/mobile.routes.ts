import { Router } from 'express';

import { buildMobileDomain } from '../domains/mobile';
import { generalLimiter } from '../infrastructure/middleware/rate-limit.middleware';

export function mobileRoutes(): Router {
  const router = Router();
  const mobile = buildMobileDomain();

  router.use(generalLimiter);
  router.use('/', mobile.mobileRoutes);

  return router;
}
