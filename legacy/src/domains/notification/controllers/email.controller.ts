import type { Request, Response, NextFunction } from 'express';

import { success } from '../../../infrastructure/http/response.helper';
import type { EmailTemplateAccountService } from '../services/email-template-account.service';

export class EmailController {
  constructor(private readonly templateService: EmailTemplateAccountService) {}

  sendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, code, name } = req.body;
      const result = await this.templateService.sendVerificationEmail(email, code, name);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };

  sendPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, resetUrl, name } = req.body;
      const result = await this.templateService.sendPasswordResetEmail(email, resetUrl, name);
      success(res, result);
    } catch (err) {
      next(err);
    }
  };
}
