import { PrismaClient } from '@prisma/client';

import { createLogger } from '../logging/logger';

const logger = createLogger('database');

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
      ...(process.env.NODE_ENV === 'development'
        ? [{ level: 'query' as const, emit: 'event' as const }]
        : []),
    ],
  });

  client.$on('error', (e) => {
    logger.error('Prisma error', { message: e.message, target: e.target });
  });

  client.$on('warn', (e) => {
    logger.warn('Prisma warning', { message: e.message, target: e.target });
  });

  return client;
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
