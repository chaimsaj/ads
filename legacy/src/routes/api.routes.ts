import { Router } from 'express';

import { buildCampaignDomain } from '../domains/campaign';
import { buildEventDomain } from '../domains/event';
import { buildIdentityDomain } from '../domains/identity';
import { buildNotificationDomain } from '../domains/notification';
import { buildPaymentDomain } from '../domains/payment';
import { buildPlatformDomain } from '../domains/platform';
import { buildUserDomain } from '../domains/user';
import { generalLimiter } from '../infrastructure/middleware/rate-limit.middleware';

export function apiRoutes(): Router {
  const router = Router();
  const identity = buildIdentityDomain();
  const campaign = buildCampaignDomain(identity.tokenService, identity.auditLogRepo);
  const user = buildUserDomain(identity.tokenService, identity.passwordService, identity.auditLogRepo);
  const payment = buildPaymentDomain(identity.tokenService);
  const platform = buildPlatformDomain(identity.tokenService);
  const event = buildEventDomain(identity.tokenService);
  const notification = buildNotificationDomain(identity.tokenService);

  router.use(generalLimiter);

  // Identity domain
  router.use('/auth', identity.authRoutes);

  // Campaign domain
  router.use('/campaigns', campaign.campaignRoutes);

  // User domain
  router.use('/user', user.userRoutes);

  // Event domain
  router.use('/events', event.eventRoutes);

  // Payment domain
  router.use('/user/payment-methods', payment.paymentRoutes);
  router.use('/stripe', payment.stripeRoutes);

  // Platform domain
  router.use('/ads', platform.platformRoutes);

  // Notification domain
  router.use('/email', notification.emailRoutes);

  return router;
}
