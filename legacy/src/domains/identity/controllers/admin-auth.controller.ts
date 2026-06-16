import type { Request, Response, NextFunction } from 'express';

import { success, noContent } from '../../../infrastructure/http/response.helper';
import type { IAdminAuthService } from '../interfaces/admin-auth-service.interface';

export class AdminAuthController {
  constructor(private readonly adminAuthService: IAdminAuthService) {}

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminAuthService.login(req.body, req, res);
      success(res, result, result.requiresTwoFactor ? 'Two-factor code required' : 'Login successful');
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminAuthService.refreshToken(req, res);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminAuthService.logout(req, res);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminAuthService.getProfile(req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminAuthService.changePassword(req.user!.sub, req.body);
      noContent(res);
    } catch (err) {
      next(err);
    }
  };

  setupTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminAuthService.setupTwoFactor(req.user!.sub);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  enableTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminAuthService.enableTwoFactor(req.user!.sub, req.body.code);
      success(res, null, 'Two-factor authentication enabled');
    } catch (err) {
      next(err);
    }
  };

  disableTwoFactor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.adminAuthService.disableTwoFactor(req.user!.sub, req.body.code);
      success(res, null, 'Two-factor authentication disabled');
    } catch (err) {
      next(err);
    }
  };
}
