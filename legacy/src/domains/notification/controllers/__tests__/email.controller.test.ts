import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { EmailController } from '../email.controller';
import type { EmailTemplateAccountService } from '../../services/email-template-account.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('EmailController', () => {
  let controller: EmailController;
  let mockTemplateService: Partial<EmailTemplateAccountService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTemplateService = {
      sendVerificationEmail: vi.fn(),
      sendPasswordResetEmail: vi.fn(),
    };

    mockReq = {
      body: {},
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new EmailController(mockTemplateService as EmailTemplateAccountService);
  });

  describe('sendVerification', () => {
    const verificationData = {
      email: 'test@example.com',
      code: '123456',
      name: 'Test User',
    };

    it('should call templateService.sendVerificationEmail with correct parameters', async () => {
      mockReq.body = verificationData;
      vi.mocked(mockTemplateService.sendVerificationEmail!).mockResolvedValue({ sent: true });

      await controller.sendVerification(mockReq, mockRes, mockNext);

      expect(mockTemplateService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'Test User',
      );
    });

    it('should call success helper on success', async () => {
      mockReq.body = verificationData;
      const result = { sent: true, messageId: 'msg_123' };
      vi.mocked(mockTemplateService.sendVerificationEmail!).mockResolvedValue(result);

      await controller.sendVerification(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, result);
    });

    it('should call next with error on failure', async () => {
      mockReq.body = verificationData;
      const error = new Error('Failed to send email');
      vi.mocked(mockTemplateService.sendVerificationEmail!).mockRejectedValue(error);

      await controller.sendVerification(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle missing name', async () => {
      mockReq.body = { email: 'test@example.com', code: '123456' };
      vi.mocked(mockTemplateService.sendVerificationEmail!).mockResolvedValue({ sent: true });

      await controller.sendVerification(mockReq, mockRes, mockNext);

      expect(mockTemplateService.sendVerificationEmail).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        undefined,
      );
    });
  });

  describe('sendPasswordReset', () => {
    const resetData = {
      email: 'test@example.com',
      resetUrl: 'https://app.example.com/reset?token=abc123',
      name: 'Test User',
    };

    it('should call templateService.sendPasswordResetEmail with correct parameters', async () => {
      mockReq.body = resetData;
      vi.mocked(mockTemplateService.sendPasswordResetEmail!).mockResolvedValue({ sent: true });

      await controller.sendPasswordReset(mockReq, mockRes, mockNext);

      expect(mockTemplateService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'https://app.example.com/reset?token=abc123',
        'Test User',
      );
    });

    it('should call success helper on success', async () => {
      mockReq.body = resetData;
      const result = { sent: true, messageId: 'msg_456' };
      vi.mocked(mockTemplateService.sendPasswordResetEmail!).mockResolvedValue(result);

      await controller.sendPasswordReset(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, result);
    });

    it('should call next with error on failure', async () => {
      mockReq.body = resetData;
      const error = new Error('Failed to send reset email');
      vi.mocked(mockTemplateService.sendPasswordResetEmail!).mockRejectedValue(error);

      await controller.sendPasswordReset(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle missing name', async () => {
      mockReq.body = { email: 'test@example.com', resetUrl: 'https://example.com/reset' };
      vi.mocked(mockTemplateService.sendPasswordResetEmail!).mockResolvedValue({ sent: true });

      await controller.sendPasswordReset(mockReq, mockRes, mockNext);

      expect(mockTemplateService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com',
        'https://example.com/reset',
        undefined,
      );
    });
  });
});
