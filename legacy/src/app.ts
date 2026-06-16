import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { getEnv } from './config/environment';
import { createCorsOptions } from './infrastructure/middleware/cors.middleware';
import { csrfProtection } from './infrastructure/middleware/csrf.middleware';
import { requestId } from './infrastructure/http/request-id.middleware';
import { requestLogger } from './infrastructure/logging/request-logger.middleware';
import { errorHandler } from './infrastructure/http/error.handler';
import { notFoundHandler } from './infrastructure/http/not-found.handler';
import { createRoutes } from './routes';

export function createApp(): express.Application {
  const app = express();
  const env = getEnv();

  // Trust proxy (required for App Engine / load balancer — enables secure cookies over HTTPS)
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', true);
  }

  // Security headers
  app.use(helmet());

  // CORS
  app.use(cors(createCorsOptions(env.CORS_ORIGINS)));

  // Request ID correlation
  app.use(requestId);

  // Cookie parsing
  app.use(cookieParser());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // CSRF protection (after body/cookie parsing, before routes)
  app.use(csrfProtection);

  // Request logging
  app.use(requestLogger);

  // Routes
  app.use(createRoutes());

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
