import { Router } from 'express';

import { apiRoutes } from './api.routes';
import { adminRoutes } from './admin.routes';
import { mobileRoutes } from './mobile.routes';
import { trackingRoutes } from './tracking.routes';

export function createRoutes(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
      },
    });
  });

  router.use('/api/v1', apiRoutes());
  router.use('/api/v1/mobile', mobileRoutes());
  router.use('/admin/v1', adminRoutes());

  // Tracking routes (no auth required - used by ads and third-party pixels)
  router.use('/api/v1/tracking', trackingRoutes());

  return router;
}
