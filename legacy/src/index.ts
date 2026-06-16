import { getEnv } from './config/environment';
import { createLogger } from './infrastructure/logging/logger';
import { createApp } from './app';

const logger = createLogger('bootstrap');

function bootstrap(): void {
  const env = getEnv();
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info(`Myngly Ads API running on port ${env.PORT}`, {
      environment: env.NODE_ENV,
      port: env.PORT,
    });
  });
}

bootstrap();
