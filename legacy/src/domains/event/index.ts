import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAuthenticate } from '../identity/middleware/authenticate.middleware';

import { EventController } from './controllers/event.controller';
import { EventRepository } from './repositories/event.repository';
import { createEventRoutes } from './routes/event.routes';
import { EventService } from './services/event.service';

export function buildEventDomain(tokenService: ITokenService) {
  const eventRepo = new EventRepository(prisma);
  const eventService = new EventService(eventRepo);
  const eventController = new EventController(eventService);

  const authenticate = createAuthenticate(tokenService);
  const eventRoutes = createEventRoutes(eventController, authenticate);

  return { eventRoutes };
}
