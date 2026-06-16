import { Router } from 'express';

import { validate, validateQuery, validateParams } from '../../../infrastructure/http/validation.middleware';
import type { AdminCampaignController } from '../controllers/admin-campaign.controller';
import {
  rejectCampaignSchema,
  adminUpdateStatusSchema,
  bulkStatusSchema,
  bulkDeleteSchema,
  adminCampaignQuerySchema,
  adminIdParamSchema,
} from '../validators/admin-campaign.validator';

export function createAdminCampaignRoutes(
  controller: AdminCampaignController,
  adminAuthenticate: ReturnType<typeof import('../../identity/middleware/authenticate.middleware').createAdminAuthenticate>,
): Router {
  const router = Router();

  // All admin campaign routes require admin authentication
  router.use(adminAuthenticate);

  // Bulk operations (before :id routes)
  router.post('/bulk/status', validate(bulkStatusSchema), controller.bulkUpdateStatus);
  router.post('/bulk/delete', validate(bulkDeleteSchema), controller.bulkDelete);

  // Status counts & export
  router.get('/status-counts', controller.statusCounts);
  router.get('/export', validateQuery(adminCampaignQuerySchema), controller.exportCsv);

  // List & single campaign
  router.get('/', validateQuery(adminCampaignQuerySchema), controller.list);
  router.get('/:id', validateParams(adminIdParamSchema), controller.show);

  // Review actions
  router.post('/:id/approve', validateParams(adminIdParamSchema), controller.approve);
  router.post('/:id/reject', validateParams(adminIdParamSchema), validate(rejectCampaignSchema), controller.reject);
  router.patch('/:id/status', validateParams(adminIdParamSchema), validate(adminUpdateStatusSchema), controller.updateStatus);
  router.delete('/:id', validateParams(adminIdParamSchema), controller.destroy);

  return router;
}
