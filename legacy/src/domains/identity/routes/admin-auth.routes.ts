import { Router } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import { adminAuthLimiter } from '../../../infrastructure/middleware/rate-limit.middleware';
import type { AdminAuthController } from '../controllers/admin-auth.controller';
import type { ITokenService } from '../interfaces/token-service.interface';
import { createAdminAuthenticate } from '../middleware/authenticate.middleware';
import {
  adminLoginSchema,
  adminChangePasswordSchema,
  twoFactorVerifySchema,
} from '../validators/admin-auth.validator';

export function createAdminAuthRoutes(
  controller: AdminAuthController,
  tokenService: ITokenService,
): Router {
  const router = Router();
  const adminAuthenticate = createAdminAuthenticate(tokenService);

  // Public routes (rate-limited)
  router.post('/login', adminAuthLimiter, validate(adminLoginSchema), controller.login);

  // Protected routes
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/profile', adminAuthenticate, controller.getProfile);
  router.post('/change-password', adminAuthenticate, validate(adminChangePasswordSchema), controller.changePassword);

  // 2FA management
  router.post('/2fa/setup', adminAuthenticate, controller.setupTwoFactor);
  router.post('/2fa/enable', adminAuthenticate, validate(twoFactorVerifySchema), controller.enableTwoFactor);
  router.post('/2fa/disable', adminAuthenticate, validate(twoFactorVerifySchema), controller.disableTwoFactor);

  return router;
}
