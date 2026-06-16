import { Router } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import { authLimiter, forgotPasswordLimiter } from '../../../infrastructure/middleware/rate-limit.middleware';
import type { AuthController } from '../controllers/auth.controller';
import type { ITokenService } from '../interfaces/token-service.interface';
import { createAuthenticate } from '../middleware/authenticate.middleware';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

export function createAuthRoutes(
  controller: AuthController,
  tokenService: ITokenService,
): Router {
  const router = Router();
  const authenticate = createAuthenticate(tokenService);

  // Public routes (rate-limited)
  router.post('/register', authLimiter, validate(registerSchema), controller.register);
  router.post('/login', authLimiter, validate(loginSchema), controller.login);
  router.post('/verify-email', authLimiter, validate(verifyEmailSchema), controller.verifyEmail);
  router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', authLimiter, validate(resetPasswordSchema), controller.resetPassword);

  // Protected routes
  router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.post('/logout-all', authenticate, controller.logoutAll);

  return router;
}
