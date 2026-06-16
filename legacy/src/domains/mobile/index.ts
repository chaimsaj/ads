import { prisma } from '../../infrastructure/database/prisma.client';

import { MobileCampaignController } from './controllers/mobile-campaign.controller';
import { MobileCampaignRepository } from './repositories/mobile-campaign.repository';
import { createMobileRoutes } from './routes/mobile.routes';
import { MobileCampaignService } from './services/mobile-campaign.service';

export function buildMobileDomain() {
  const campaignRepo = new MobileCampaignRepository(prisma);
  const campaignService = new MobileCampaignService(campaignRepo);
  const controller = new MobileCampaignController(campaignService);
  const mobileRoutes = createMobileRoutes(controller);

  return { mobileRoutes };
}
