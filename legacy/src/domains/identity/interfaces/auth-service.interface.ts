import type { Request, Response } from 'express';

import type {
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../types/auth.types';

export interface IAuthService {
  register(data: RegisterRequest): Promise<AuthResponse>;
  login(data: LoginRequest, req: Request, res: Response): Promise<AuthResponse>;
  verifyEmail(data: VerifyEmailRequest): Promise<void>;
  forgotPassword(data: ForgotPasswordRequest): Promise<void>;
  resetPassword(data: ResetPasswordRequest): Promise<void>;
  changePassword(userId: string, data: ChangePasswordRequest): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<AuthResponse>;
  logout(req: Request, res: Response): Promise<void>;
  logoutAll(userId: string, res: Response): Promise<void>;
}
