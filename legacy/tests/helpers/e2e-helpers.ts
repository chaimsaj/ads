import jwt from 'jsonwebtoken';
import request from 'supertest';
import type { Application } from 'express';

import { mockObjectId } from './objectid-helper';

const TEST_ACCESS_SECRET = 'test-access-secret-that-is-at-least-thirty-two-characters-long';

export interface TestUserPayload {
  sub: string;
  email: string;
  role: 'ADVERTISER' | 'USER';
  type: 'access';
}

export interface TestAdminPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'SUPER_ADMIN';
  type: 'admin_access';
  permissions?: string[];
}

export function generateTestAccessToken(
  payload: Partial<TestUserPayload> = {},
  expiresIn = '1h',
): string {
  const defaultPayload: TestUserPayload = {
    sub: mockObjectId(1),
    email: 'test@example.com',
    role: 'ADVERTISER',
    type: 'access',
  };

  return jwt.sign({ ...defaultPayload, ...payload }, TEST_ACCESS_SECRET, { expiresIn });
}

export function generateTestAdminToken(
  payload: Partial<TestAdminPayload> = {},
  expiresIn = '1h',
): string {
  const defaultPayload: TestAdminPayload = {
    sub: mockObjectId(1),
    email: 'admin@example.com',
    role: 'ADMIN',
    type: 'admin_access',
    permissions: ['users.read', 'users.write', 'campaigns.read', 'campaigns.write'],
  };

  return jwt.sign({ ...defaultPayload, ...payload }, TEST_ACCESS_SECRET, { expiresIn });
}

export async function getCsrfToken(app: Application): Promise<string> {
  const response = await request(app).get('/health');

  const cookies = response.headers['set-cookie'] as string[] | undefined;
  if (!cookies) {
    throw new Error('No cookies returned from /health');
  }

  const csrfCookie = cookies.find((c) => c.startsWith('csrf_token='));
  if (!csrfCookie) {
    throw new Error('CSRF token cookie not found');
  }

  const match = csrfCookie.match(/csrf_token=([^;]+)/);
  if (!match) {
    throw new Error('Could not parse CSRF token from cookie');
  }

  return match[1];
}

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export function authRequest(
  app: Application,
  method: HttpMethod,
  path: string,
  accessToken?: string,
  csrfToken?: string,
): request.Test {
  let req = request(app)[method](path);

  if (accessToken) {
    req = req.set('Cookie', `access_token=${accessToken}`);
  }

  if (csrfToken) {
    req = req
      .set('Cookie', `csrf_token=${csrfToken}`)
      .set('X-Csrf-Token', csrfToken);
  }

  return req;
}

export function adminAuthRequest(
  app: Application,
  method: HttpMethod,
  path: string,
  accessToken?: string,
  csrfToken?: string,
): request.Test {
  let req = request(app)[method](path);

  if (accessToken) {
    req = req.set('Cookie', `admin_access_token=${accessToken}`);
  }

  if (csrfToken) {
    req = req
      .set('Cookie', `csrf_token=${csrfToken}`)
      .set('X-Csrf-Token', csrfToken);
  }

  return req;
}

export async function setupAuthenticatedRequest(
  app: Application,
  method: HttpMethod,
  path: string,
  tokenPayload?: Partial<TestUserPayload>,
): Promise<request.Test> {
  const csrfToken = await getCsrfToken(app);
  const accessToken = generateTestAccessToken(tokenPayload);

  let req = request(app)[method](path)
    .set('Cookie', [`access_token=${accessToken}`, `csrf_token=${csrfToken}`])
    .set('X-Csrf-Token', csrfToken);

  return req;
}

export async function setupAdminRequest(
  app: Application,
  method: HttpMethod,
  path: string,
  tokenPayload?: Partial<TestAdminPayload>,
): Promise<request.Test> {
  const csrfToken = await getCsrfToken(app);
  const accessToken = generateTestAdminToken(tokenPayload);

  let req = request(app)[method](path)
    .set('Cookie', [`admin_access_token=${accessToken}`, `csrf_token=${csrfToken}`])
    .set('X-Csrf-Token', csrfToken);

  return req;
}
