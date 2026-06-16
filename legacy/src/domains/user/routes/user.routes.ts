import { Router } from 'express';
import type { RequestHandler } from 'express';

import { validate } from '../../../infrastructure/http/validation.middleware';
import type { UserController } from '../controllers/user.controller';
import { updateProfileSchema, changePasswordSchema, notificationSettingsSchema } from '../validators/user.validator';

export function createUserRoutes(
  controller: UserController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  // Search
  router.get('/search', controller.search);

  // Profile
  router.get('/profile', controller.profile);
  router.put('/profile', validate(updateProfileSchema), controller.updateProfile);
  router.post('/profile/avatar', controller.updateAvatar);

  // Password
  router.put('/password', validate(changePasswordSchema), controller.changePassword);

  // Account
  router.delete('/account', controller.deleteAccount);

  // Notification settings
  router.get('/notifications/settings', controller.notificationSettings);
  router.put('/notifications/settings', validate(notificationSettingsSchema), controller.updateNotificationSettings);

  return router;
}
