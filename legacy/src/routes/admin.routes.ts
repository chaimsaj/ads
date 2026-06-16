import { Router } from 'express';

import { buildAdministrationDomain } from '../domains/administration';
import { buildAnalyticsDomain } from '../domains/analytics';
import { buildCampaignDomain } from '../domains/campaign';
import { buildIdentityDomain } from '../domains/identity';
import { buildNotificationDomain } from '../domains/notification';
import { buildPaymentDomain } from '../domains/payment';
import { buildUserDomain } from '../domains/user';
import { generalLimiter } from '../infrastructure/middleware/rate-limit.middleware';

export function adminRoutes(): Router {
  const router = Router();
  const identity = buildIdentityDomain();
  const campaign = buildCampaignDomain(identity.tokenService, identity.auditLogRepo);
  const user = buildUserDomain(identity.tokenService, identity.passwordService, identity.auditLogRepo);
  const payment = buildPaymentDomain(identity.tokenService);
  const administration = buildAdministrationDomain(identity.tokenService);
  const analytics = buildAnalyticsDomain(identity.tokenService);
  const notification = buildNotificationDomain(identity.tokenService);

  router.use(generalLimiter);

  // Identity domain
  router.use('/auth', identity.adminAuthRoutes);

  // Campaign domain
  router.use('/campaigns', campaign.adminCampaignRoutes);

  // User domain
  router.use('/users', user.adminUserRoutes);

  // Payment domain
  router.use('/payments', payment.adminPaymentRoutes);

  // Administration domain
  router.use('/audit-logs', administration.auditLogRoutes);
  router.use('/settings', administration.settingsRoutes);

  // Analytics domain
  router.use('/dashboard', analytics.dashboardRoutes);

  // Notification domain
  router.use('/email', notification.emailAdminRoutes);

  return router;
}
