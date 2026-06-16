import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { mockObjectId } from '../../../../../tests/helpers/objectid-helper';
import { EmailAdminController } from '../email-admin.controller';
import type { EmailAdminService } from '../../services/email-admin.service';

// Mock the response helper module
vi.mock('../../../../infrastructure/http/response.helper', () => ({
  success: vi.fn(),
}));

import { success } from '../../../../infrastructure/http/response.helper';

describe('EmailAdminController', () => {
  let controller: EmailAdminController;
  let mockAdminService: Partial<EmailAdminService>;
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  const mockStats = {
    totalSent: 1000,
    totalFailed: 50,
    lastHourSent: 25,
    recentEmails: [
      { id: mockObjectId(1), to: 'user1@example.com', subject: 'Welcome', status: 'sent' },
      { id: mockObjectId(2), to: 'user2@example.com', subject: 'Verification', status: 'sent' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAdminService = {
      getStats: vi.fn().mockReturnValue(mockStats),
      sendBulk: vi.fn(),
    };

    mockReq = {
      body: {},
    } as unknown as Request;

    mockRes = {} as Response;

    mockNext = vi.fn();

    controller = new EmailAdminController(mockAdminService as EmailAdminService);
  });

  describe('stats', () => {
    it('should call adminService.getStats', async () => {
      await controller.stats(mockReq, mockRes, mockNext);

      expect(mockAdminService.getStats).toHaveBeenCalled();
    });

    it('should call success helper on success', async () => {
      await controller.stats(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(mockRes, mockStats);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch stats');
      vi.mocked(mockAdminService.getStats!).mockImplementation(() => {
        throw error;
      });

      await controller.stats(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('recent', () => {
    it('should call adminService.getStats and return recentEmails', async () => {
      await controller.recent(mockReq, mockRes, mockNext);

      expect(mockAdminService.getStats).toHaveBeenCalled();
      expect(success).toHaveBeenCalledWith(mockRes, mockStats.recentEmails);
    });

    it('should call next with error on failure', async () => {
      const error = new Error('Failed to fetch recent emails');
      vi.mocked(mockAdminService.getStats!).mockImplementation(() => {
        throw error;
      });

      await controller.recent(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('sendBulk', () => {
    const bulkData = {
      template: 'marketing',
      recipients: ['user1@example.com', 'user2@example.com'],
      subject: 'Special Offer',
    };

    it('should call adminService.sendBulk with request body', async () => {
      mockReq.body = bulkData;
      vi.mocked(mockAdminService.sendBulk!).mockResolvedValue({ sent: 2, failed: 0 });

      await controller.sendBulk(mockReq, mockRes, mockNext);

      expect(mockAdminService.sendBulk).toHaveBeenCalledWith(bulkData);
    });

    it('should call success helper with correct message on success', async () => {
      mockReq.body = bulkData;
      const result = { sent: 2, failed: 0 };
      vi.mocked(mockAdminService.sendBulk!).mockResolvedValue(result);

      await controller.sendBulk(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        result,
        'Bulk email completed: 2 sent, 0 failed',
      );
    });

    it('should show correct counts when some emails fail', async () => {
      mockReq.body = bulkData;
      const result = { sent: 8, failed: 2 };
      vi.mocked(mockAdminService.sendBulk!).mockResolvedValue(result);

      await controller.sendBulk(mockReq, mockRes, mockNext);

      expect(success).toHaveBeenCalledWith(
        mockRes,
        result,
        'Bulk email completed: 8 sent, 2 failed',
      );
    });

    it('should call next with error on failure', async () => {
      mockReq.body = bulkData;
      const error = new Error('Failed to send bulk emails');
      vi.mocked(mockAdminService.sendBulk!).mockRejectedValue(error);

      await controller.sendBulk(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
