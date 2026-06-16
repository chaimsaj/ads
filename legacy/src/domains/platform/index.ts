import { prisma } from '../../infrastructure/database/prisma.client';
import type { ITokenService } from '../identity/interfaces/token-service.interface';
import { createAuthenticate } from '../identity/middleware/authenticate.middleware';

import { PlatformController } from './controllers/platform.controller';
import { AdFormatRepository } from './repositories/ad-format.repository';
import { BoostTypeRepository } from './repositories/boost-type.repository';
import { createPlatformRoutes } from './routes/platform.routes';
import { AdFormatService } from './services/ad-format.service';
import { BoostTypeService } from './services/boost-type.service';

export function buildPlatformDomain(tokenService: ITokenService) {
  // Repositories
  const adFormatRepo = new AdFormatRepository(prisma);
  const boostTypeRepo = new BoostTypeRepository(prisma);

  // Services
  const adFormatService = new AdFormatService(adFormatRepo);
  const boostTypeService = new BoostTypeService(boostTypeRepo);

  // Controllers
  const platformController = new PlatformController(adFormatService, boostTypeService);

  // Middleware
  const authenticate = createAuthenticate(tokenService);

  // Routes
  const platformRoutes = createPlatformRoutes(platformController, authenticate);

  return { platformRoutes };
}
