import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { EventController } from '../controllers/event.controller';

export function createEventRoutes(
  controller: EventController,
  authenticate: RequestHandler,
): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/search', controller.search);

  return router;
}
