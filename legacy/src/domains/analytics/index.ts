import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAdminAuthenticate } from '../identity/middleware/authenticate.middleware';

import { DashboardController } from './controllers/dashboard.controller';
import { TrackingController } from './controllers/tracking.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { createDashboardRoutes } from './routes/dashboard.routes';
import { createTrackingRoutes } from './routes/tracking.routes';
import { DashboardService } from './services/dashboard.service';
import { TrackingService } from './services/tracking.service';

export function buildAnalyticsDomain(tokenService: ITokenService) {
  // Repositories
  const dashboardRepo = new DashboardRepository(prisma);

  // Services
  const dashboardService = new DashboardService(dashboardRepo);
  const trackingService = new TrackingService(prisma);

  // Controllers
  const dashboardController = new DashboardController(dashboardService);
  const trackingController = new TrackingController(trackingService);

  // Middleware
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Routes
  const dashboardRoutes = createDashboardRoutes(dashboardController, adminAuthenticate);
  const trackingRoutes = createTrackingRoutes(trackingController);

  return { dashboardRoutes, trackingRoutes };
}
