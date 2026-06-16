import { vi } from 'vitest';

// Set test environment variables before anything else
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/myngly_ads_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-that-is-at-least-thirty-two-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-at-least-thirty-two-characters-long';
process.env.CORS_ORIGINS = 'http://localhost:5173,http://localhost:5174';
process.env.APP_URL = 'http://localhost:5173';
process.env.ADMIN_URL = 'http://localhost:5174';

// Mock Prisma client
vi.mock('../src/infrastructure/database/prisma.client', () => ({
  prisma: {
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn(),
  },
}));
