import type { Request, Response } from 'express';

import type {
  AdminAuthResponse,
  AdminLoginRequest,
  ChangePasswordRequest,
  TwoFactorSetupResponse,
} from '../types/auth.types';

export interface IAdminAuthService {
  login(data: AdminLoginRequest, req: Request, res: Response): Promise<AdminAuthResponse>;
  refreshToken(req: Request, res: Response): Promise<AdminAuthResponse>;
  logout(req: Request, res: Response): Promise<void>;
  changePassword(adminId: string, data: ChangePasswordRequest): Promise<void>;
  getProfile(adminId: string): Promise<AdminAuthResponse['user']>;
  setupTwoFactor(adminId: string): Promise<TwoFactorSetupResponse>;
  enableTwoFactor(adminId: string, code: string): Promise<void>;
  disableTwoFactor(adminId: string, code: string): Promise<void>;
}
