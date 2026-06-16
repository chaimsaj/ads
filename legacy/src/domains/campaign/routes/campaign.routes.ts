import { Router } from 'express';

import { validate, validateQuery, validateParams } from '../../../infrastructure/http/validation.middleware';
import { success } from '../../../infrastructure/http/response.helper';
import type { CampaignController } from '../controllers/campaign.controller';
import type { CampaignPerformanceController } from '../controllers/campaign-performance.controller';
import { CampaignEstimatorService } from '../services/campaign-estimator.service';
import {
  createCampaignSchema,
  updateCampaignSchema,
  updateStatusSchema,
  campaignQuerySchema,
  estimateSchema,
  idParamSchema,
} from '../validators/campaign.validator';

export function createCampaignRoutes(
  controller: CampaignController,
  performanceController: CampaignPerformanceController,
  authenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAuthenticate>,
): Router {
  const router = Router();

  // All campaign routes require authentication
  router.use(authenticate);

  // Estimation (before :id routes)
  const estimatorService = new CampaignEstimatorService();
  router.post('/estimate', validate(estimateSchema), (req, res) => {
    const estimate = estimatorService.estimate(req.body);
    return success(res, estimate);
  });

  // List & Statistics (before :id routes)
  router.get('/statistics', controller.statistics);
  router.get('/export', validateQuery(campaignQuerySchema), controller.exportCsv);
  router.get('/performance/overview', performanceController.getOverview);
  router.get('/', validateQuery(campaignQuerySchema), controller.list);

  // Single campaign CRUD
  router.post('/', validate(createCampaignSchema), controller.store);
  router.get('/:id', validateParams(idParamSchema), controller.show);
  router.get('/:id/performance', validateParams(idParamSchema), performanceController.getSummary);
  router.get('/:id/performance/daily', validateParams(idParamSchema), performanceController.getDailyPerformance);
  router.put('/:id', validateParams(idParamSchema), validate(updateCampaignSchema), controller.update);
  router.patch('/:id/status', validateParams(idParamSchema), validate(updateStatusSchema), controller.updateStatus);
  router.delete('/:id', validateParams(idParamSchema), controller.destroy);
  router.post('/:id/duplicate', validateParams(idParamSchema), controller.duplicate);

  return router;
}
