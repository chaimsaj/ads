import type { Request, Response, NextFunction } from 'express';

import { success, created, noContent } from '../../../infrastructure/http/response.helper';
import type { IAuthService } from '../interfaces/auth-service.interface';

export class AuthController {
  constructor(private readonly authService: IAuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      created(res, result, 'Registration successful. Please verify your email.');
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body, req, res);
      success(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.verifyEmail(req.body);
      success(res, null, 'Email verified successfully');
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.forgotPassword(req.body);
      success(res, null, 'If the email exists, a reset link has been sent.');
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body);
      success(res, null, 'Password reset successful');
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.changePassword(req.user!.sub, req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.refreshToken(req, res);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout(req, res);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logoutAll(req.user!.sub, res);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };
}
