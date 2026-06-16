import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAuthenticate, createAdminAuthenticate } from '../identity/middleware/authenticate.middleware';

import { AdminCampaignController } from './controllers/admin-campaign.controller';
import { CampaignController } from './controllers/campaign.controller';
import { CampaignPerformanceController } from './controllers/campaign-performance.controller';
import { CampaignRepository } from './repositories/campaign.repository';
import { createAdminCampaignRoutes } from './routes/admin-campaign.routes';
import { createCampaignRoutes } from './routes/campaign.routes';
import { CampaignExportService } from './services/campaign-export.service';
import { CampaignPerformanceService } from './services/campaign-performance.service';
import { CampaignReviewService } from './services/campaign-review.service';
import { CampaignService } from './services/campaign.service';

export function buildCampaignDomain(tokenService: ITokenService, auditLogRepo: import('../identity/interfaces/audit-log-repository.interface').IAuditLogRepository) {
  // Repositories
  const campaignRepo = new CampaignRepository(prisma);

  // Services
  const campaignService = new CampaignService(campaignRepo);
  const reviewService = new CampaignReviewService(campaignRepo, auditLogRepo);
  const exportService = new CampaignExportService(campaignRepo);
  const performanceService = new CampaignPerformanceService(prisma);

  // Controllers
  const campaignController = new CampaignController(campaignService, exportService);
  const adminCampaignController = new AdminCampaignController(reviewService, exportService);
  const performanceController = new CampaignPerformanceController(performanceService);

  // Middleware
  const authenticate = createAuthenticate(tokenService);
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Routes
  const campaignRoutes = createCampaignRoutes(campaignController, performanceController, authenticate);
  const adminCampaignRoutes = createAdminCampaignRoutes(adminCampaignController, adminAuthenticate);

  return { campaignRoutes, adminCampaignRoutes };
}
